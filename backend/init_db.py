from app import create_app
from models import db, User, HealthRecord, RiskPrediction, Recommendation
from datetime import datetime

app = create_app()

def init_db():
    """Initialize the database by creating all tables."""
    with app.app_context():
        # Drop all tables
        db.drop_all()
        
        # Create all tables
        db.create_all()
        
        # Create test user
        test_user = User(
            email='test@example.com',
            password='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY.5IMwMa7.yQXO',  # Password: test123
            name='Test User',
            age=30,
            gender='Male',
            medical_history={'conditions': [], 'medications': []}
        )
        
        db.session.add(test_user)
        db.session.commit()
        
        # Create test health record
        health_record = HealthRecord(
            user_id=test_user.id,
            health_data={
                'blood_pressure': '120/80',
                'heart_rate': 75,
                'temperature': 98.6,
                'weight': 70,
                'height': 175
            },
            notes='Regular checkup'
        )
        
        db.session.add(health_record)
        db.session.commit()
        
        # Create test prediction
        prediction = RiskPrediction(
            user_id=test_user.id,
            health_record_id=health_record.id,
            risk_score=0.2,
            risk_factors={
                'lifestyle': 'moderate',
                'family_history': 'low',
                'current_conditions': 'low'
            }
        )
        
        db.session.add(prediction)
        
        # Create test recommendation
        recommendation = Recommendation(
            user_id=test_user.id,
            health_record_id=health_record.id,
            category='lifestyle',
            priority='medium',
            title='Increase Physical Activity',
            description='Try to get at least 30 minutes of moderate exercise daily',
            actions=['Walk for 30 minutes', 'Take the stairs', 'Do stretching exercises'],
            status='pending'
        )
        
        db.session.add(recommendation)
        db.session.commit()

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("Database initialization completed!")
