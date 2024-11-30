import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()

def create_app(config_class=None):
    app = Flask(__name__)
    
    # Load configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///health_ai.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
    
    # Initialize CORS with specific settings
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.health_data import health_data_bp
    from routes.predictions import predictions_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(health_data_bp, url_prefix='/api')
    app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
    
    @app.route('/api/health-check')
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "Health AI Risk Prediction System is running"
        }), 200
    
    @app.errorhandler(500)
    def handle_500_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(error)
        }), 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
