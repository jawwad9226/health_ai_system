from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from utils.decorators import admin_required
from utils.pagination import paginate

api = Namespace('users', description='User operations')

# Models
user_model = api.model('User', {
    'id': fields.String(description='User ID'),
    'email': fields.String(required=True, description='User email'),
    'first_name': fields.String(required=True, description='First name'),
    'last_name': fields.String(required=True, description='Last name'),
    'user_type': fields.String(required=True, description='User type'),
    'is_active': fields.Boolean(description='Account status'),
    'created_at': fields.DateTime(description='Account creation date'),
    'last_login': fields.DateTime(description='Last login date')
})

user_update_model = api.model('UserUpdate', {
    'email': fields.String(description='User email'),
    'first_name': fields.String(description='First name'),
    'last_name': fields.String(description='Last name'),
    'is_active': fields.Boolean(description='Account status')
})

@api.route('')
class UserList(Resource):
    @jwt_required()
    @admin_required
    @api.marshal_list_with(user_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'search': 'Search term',
            'user_type': 'Filter by user type'
        }
    )
    def get(self):
        """Get list of users (admin only)"""
        # Get query parameters
        search = request.args.get('search', '')
        user_type = request.args.get('user_type', '')
        
        # Build query
        query = User.query
        
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.first_name.ilike(f'%{search}%')) |
                (User.last_name.ilike(f'%{search}%'))
            )
        
        if user_type:
            query = query.filter(User.user_type == user_type)
        
        # Return paginated results
        return paginate(query)

@api.route('/<string:user_id>')
class UserDetail(Resource):
    @jwt_required()
    @api.marshal_with(user_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'User not found'
    })
    def get(self, user_id):
        """Get user details"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        # Users can only view their own profile unless they're admin
        if current_user_id != user_id and not current_user.is_admin:
            api.abort(403, 'Permission denied')
        
        return user

    @jwt_required()
    @api.expect(user_update_model)
    @api.marshal_with(user_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'User not found'
    })
    def put(self, user_id):
        """Update user details"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        # Users can only update their own profile unless they're admin
        if current_user_id != user_id and not current_user.is_admin:
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        # Update fields
        if 'email' in data:
            user.email = data['email']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'is_active' in data and current_user.is_admin:
            user.is_active = data['is_active']
        
        try:
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating user: {str(e)}')

    @jwt_required()
    @admin_required
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'User not found'
    })
    def delete(self, user_id):
        """Delete user (admin only)"""
        user = User.query.get_or_404(user_id)
        
        try:
            db.session.delete(user)
            db.session.commit()
            return {'message': 'User deleted successfully'}
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error deleting user: {str(e)}')

@api.route('/me')
class CurrentUser(Resource):
    @jwt_required()
    @api.marshal_with(user_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized'
    })
    def get(self):
        """Get current user's profile"""
        current_user_id = get_jwt_identity()
        return User.query.get_or_404(current_user_id)

@api.route('/me/password')
class PasswordUpdate(Resource):
    @jwt_required()
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            400: 'Validation error'
        }
    )
    def put(self):
        """Update current user's password"""
        data = request.get_json()
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        # Validate input
        if not data.get('current_password'):
            api.abort(400, 'Current password is required')
        if not data.get('new_password'):
            api.abort(400, 'New password is required')
        if not check_password_hash(user.password_hash, data['current_password']):
            api.abort(400, 'Current password is incorrect')
        if not validate_password(data['new_password']):
            api.abort(400, 'Invalid new password format')
        
        # Update password
        try:
            user.set_password(data['new_password'])
            db.session.commit()
            return {'message': 'Password updated successfully'}
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating password: {str(e)}')
