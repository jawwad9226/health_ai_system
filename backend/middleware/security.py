from functools import wraps
from flask import request, jsonify, current_app
import redis
import bleach
import json
from datetime import datetime, timedelta
import jwt
import logging
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

class RateLimitExceeded(Exception):
    """Custom exception for rate limit exceeded."""
    pass

class SecurityError(Exception):
    """Base class for security-related exceptions."""
    pass

class TokenError(SecurityError):
    """Custom exception for token-related errors."""
    pass

# Initialize Redis with error handling
def get_redis_client() -> Optional[redis.Redis]:
    try:
        return redis.Redis(
            host=current_app.config.get('REDIS_HOST', 'localhost'),
            port=current_app.config.get('REDIS_PORT', 6379),
            db=0,
            decode_responses=True,
            socket_timeout=2
        )
    except redis.RedisError as e:
        logger.error(f"Redis connection error: {str(e)}")
        return None

def rate_limit(requests_per_minute: int = 60, by_ip: bool = True):
    """Enhanced rate limiting decorator with IP and user-based limiting."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            redis_client = get_redis_client()
            if not redis_client:
                logger.warning("Redis unavailable, skipping rate limiting")
                return f(*args, **kwargs)

            try:
                # Get identifier (IP or user ID)
                identifier = request.remote_addr if by_ip else get_jwt_identity()
                key = f'rate_limit:{identifier}'
                
                pipe = redis_client.pipeline()
                pipe.get(key)
                pipe.ttl(key)
                current, ttl = pipe.execute()
                
                if current is None:
                    redis_client.setex(key, 60, 1)
                elif int(current) >= requests_per_minute:
                    raise RateLimitExceeded(
                        f"Rate limit exceeded. Try again in {ttl} seconds"
                    )
                else:
                    redis_client.incr(key)
                
                return f(*args, **kwargs)
                
            except RateLimitExceeded as e:
                logger.warning(f"Rate limit exceeded: {str(e)}")
                return jsonify({
                    'error': 'Too many requests',
                    'retry_after': ttl,
                    'message': str(e)
                }), 429
            except redis.RedisError as e:
                logger.error(f"Redis error in rate limiting: {str(e)}")
                return f(*args, **kwargs)
                
        return wrapped
    return decorator

def sanitize_input(data: Any) -> Any:
    """Enhanced input sanitization with type preservation."""
    try:
        if isinstance(data, dict):
            return {k: sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [sanitize_input(i) for i in data]
        elif isinstance(data, str):
            # Configure bleach with allowed tags and attributes
            allowed_tags = ['b', 'i', 'u', 'p', 'span', 'br']
            allowed_attrs = {
                '*': ['class', 'style'],
                'a': ['href', 'rel', 'target']
            }
            return bleach.clean(
                data,
                tags=allowed_tags,
                attributes=allowed_attrs,
                strip=True
            )
        return data
    except Exception as e:
        logger.error(f"Error in input sanitization: {str(e)}")
        return data

def validate_json(f):
    """Enhanced JSON validation decorator."""
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not request.is_json:
            return jsonify({
                'error': 'Invalid Content-Type',
                'message': 'Content-Type must be application/json'
            }), 400
            
        try:
            data = request.get_json()
            if data is None:
                raise ValueError("Empty JSON body")
                
            # Sanitize input data
            sanitized_data = sanitize_input(data)
            # Replace request data with sanitized version
            request._cached_json = (sanitized_data, request._cached_json[1])
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return jsonify({
                'error': 'Invalid JSON',
                'message': 'Failed to decode JSON body'
            }), 400
        except ValueError as e:
            return jsonify({
                'error': 'Invalid Request',
                'message': str(e)
            }), 400
            
        return f(*args, **kwargs)
    return wrapped

def refresh_token_required(f):
    """Enhanced token refresh decorator with better error handling."""
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                raise TokenError('Missing or invalid authorization header')
                
            token = auth_header.split(' ')[1]
            try:
                # Decode token with proper error handling
                payload = jwt.decode(
                    token,
                    current_app.config['JWT_SECRET_KEY'],
                    algorithms=['HS256']
                )
                
                exp_datetime = datetime.fromtimestamp(payload['exp'])
                
                # If token expires in less than 5 minutes, refresh it
                if exp_datetime - datetime.utcnow() < timedelta(minutes=5):
                    new_token = create_refresh_token(payload['sub'])
                    response = f(*args, **kwargs)
                    
                    if isinstance(response, tuple):
                        response_data = response[0].get_json()
                        response_data['new_token'] = new_token
                        return jsonify(response_data), response[1]
                    
                    if isinstance(response, dict):
                        response['new_token'] = new_token
                    return response
                    
            except jwt.ExpiredSignatureError:
                raise TokenError('Token has expired')
            except jwt.InvalidTokenError as e:
                raise TokenError(f'Invalid token: {str(e)}')
                
            return f(*args, **kwargs)
            
        except TokenError as e:
            logger.error(f"Token error: {str(e)}")
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
        except Exception as e:
            logger.error(f"Unexpected error in token refresh: {str(e)}")
            return jsonify({
                'error': 'Internal server error',
                'message': 'An unexpected error occurred'
            }), 500
            
    return wrapped

def create_refresh_token(user_id: str) -> str:
    """Create a new refresh token."""
    try:
        exp_time = datetime.utcnow() + timedelta(days=30)
        return jwt.encode(
            {
                'sub': user_id,
                'exp': exp_time,
                'type': 'refresh'
            },
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    except Exception as e:
        logger.error(f"Error creating refresh token: {str(e)}")
        raise TokenError('Failed to create refresh token')
