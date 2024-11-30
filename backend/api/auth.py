from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import check_password_hash
from models.user import User
from utils.decorators import admin_required
from utils.validators import validate_email, validate_password

api = Namespace('auth', description='Authentication operations')

# Models
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

register_model = api.model('Register', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'first_name': fields.String(required=True, description='First name'),
    'last_name': fields.String(required=True, description='Last name'),
    'user_type': fields.String(required=True, description='User type (patient/professional/admin)')
})

tokens_model = api.model('Tokens', {
    'access_token': fields.String(description='Access token'),
    'refresh_token': fields.String(description='Refresh token')
})

@api.route('/login')
class Login(Resource):
    @api.expect(login_model)
    @api.marshal_with(tokens_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Invalid credentials',
        422: 'Validation error'
    })
    def post(self):
        """User login endpoint"""
        data = request.get_json()
        
        # Validate input
        if not validate_email(data.get('email')):
            api.abort(422, 'Invalid email format')
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.password_hash, data['password']):
            api.abort(401, 'Invalid email or password')
        
        # Generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token
        }

@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    @api.marshal_with(tokens_model)
    @api.doc(responses={
        201: 'User created',
        400: 'Validation error',
        409: 'User already exists'
    })
    def post(self):
        """User registration endpoint"""
        data = request.get_json()
        
        # Validate input
        if not validate_email(data.get('email')):
            api.abort(422, 'Invalid email format')
        if not validate_password(data.get('password')):
            api.abort(422, 'Invalid password format')
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            api.abort(409, 'User already exists')
        
        # Create user
        try:
            user = User(
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                user_type=data['user_type']
            )
            user.set_password(data['password'])
            db.session.add(user)
            db.session.commit()
            
            # Generate tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token
            }, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating user: {str(e)}')

@api.route('/refresh')
class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    @api.marshal_with(tokens_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Invalid token'
    })
    def post(self):
        """Refresh access token"""
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        refresh_token = create_refresh_token(identity=current_user)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token
        }

@api.route('/logout')
class Logout(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Successfully logged out',
        401: 'Invalid token'
    })
    def post(self):
        """User logout endpoint"""
        # In a stateless JWT setup, client should discard tokens
        # For additional security, we could blacklist the token
        return {'message': 'Successfully logged out'}
