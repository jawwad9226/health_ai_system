from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing required fields'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 409
        
        user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            name=data.get('name', ''),
            role=data.get('role', 'user')
        )
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'User registered successfully',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }), 201
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"[DEBUG] Login request data: {data}")
        
        if not data:
            print("[ERROR] No data provided in request")
            return jsonify({'message': 'No data provided'}), 400
            
        if not data.get('email') or not data.get('password'):
            print(f"[ERROR] Missing credentials - Email: {bool(data.get('email'))}, Password: {bool(data.get('password'))}")
            return jsonify({'message': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        print(f"[DEBUG] User lookup result for {data['email']}: {'Found' if user else 'Not found'}")
        
        if not user:
            print(f"[ERROR] No user found with email: {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401
            
        if not check_password_hash(user.password, data['password']):
            print(f"[ERROR] Invalid password for user: {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401
        
        try:
            access_token = create_access_token(identity=user.id)
            print(f"[DEBUG] Successfully created access token for user: {data['email']}")
        except Exception as token_error:
            print(f"[ERROR] Token creation failed: {str(token_error)}")
            return jsonify({'message': 'Error creating access token'}), 500
        
        response = jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': getattr(user, 'role', 'user')
            }
        })
        print(f"[DEBUG] Login successful for user: {data['email']}")
        return response, 200
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Login error: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'message': 'An error occurred during login. Please try again.'}), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }), 200
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return jsonify({'message': str(e)}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
