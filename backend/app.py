from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from models import db
from routes.auth import auth_bp
from routes.health_data import health_data_bp
from routes.predictions import predictions_bp
from routes.recommendations import recommendations_bp

def create_app():
    app = Flask(__name__)
    
    # Configure app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///health_ai.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['DEBUG'] = True
    app.config['SQLALCHEMY_ECHO'] = True  # Log all SQL queries
    app.config['PROPAGATE_EXCEPTIONS'] = True  # Show detailed error messages
    
    # Initialize extensions
    jwt = JWTManager(app)
    db.init_app(app)
    
    # Configure CORS
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Range", "X-Content-Range"],
                 "max_age": 3600
             }
         })
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(health_data_bp, url_prefix='/api/health-records')
    app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    @app.after_request
    def after_request(response):
        if request.method == 'OPTIONS':
            response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:3000')
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '3600'
        else:
            # For non-OPTIONS requests, we still need to set CORS headers
            response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', 'http://localhost:3000')
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
