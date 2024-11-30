"""Initialize database and test ML functionality."""

import os
import sys
from datetime import datetime

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.database import db, init_db
from app.models import User, Patient, MedicalHistory
from app.ml.predictions import train_disease_risk_model, predict_disease_risk

def create_test_data():
    """Create test users and patients."""
    # Create a doctor
    doctor = User(
        email='doctor@example.com',
        username='doctor',
        password='password123',
        first_name='John',
        last_name='Doe',
        is_doctor=True
    )
    db.add(doctor)
    
    # Create test patients
    patients_data = [
        {
            'email': 'patient1@example.com',
            'username': 'patient1',
            'password': 'password123',
            'first_name': 'Alice',
            'last_name': 'Smith',
            'date_of_birth': '1980-01-01',
            'gender': 'female',
            'height': 165,
            'weight': 65,
            'conditions': ['diabetes']
        },
        {
            'email': 'patient2@example.com',
            'username': 'patient2',
            'password': 'password123',
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'date_of_birth': '1975-06-15',
            'gender': 'male',
            'height': 180,
            'weight': 85,
            'conditions': ['heart_disease']
        }
    ]
    
    for data in patients_data:
        # Create user
        user = User(
            email=data['email'],
            username=data['username'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        db.add(user)
        db.flush()  # Get user ID
        
        # Create patient
        patient = Patient(
            user_id=user.id,
            date_of_birth=data['date_of_birth'],
            gender=data['gender'],
            height=data['height'],
            weight=data['weight']
        )
        db.add(patient)
        db.flush()  # Get patient ID
        
        # Add medical history
        for condition in data['conditions']:
            history = MedicalHistory(
                patient_id=patient.id,
                condition=condition,
                diagnosis_date=datetime.now().date(),
                status='active',
                notes=f'Test {condition} condition'
            )
            db.add(history)
    
    db.commit()
    return "Test data created successfully!"

def test_ml_functionality():
    """Test ML prediction functionality."""
    # Get all patients
    patients = Patient.query.all()
    
    # Prepare training data
    training_data = []
    for patient in patients:
        patient_data = patient.to_dict()
        patient_data['medical_history'] = [
            history.to_dict() for history in patient.medical_history
        ]
        training_data.append(patient_data)
    
    # Define conditions to predict
    conditions = ['diabetes', 'heart_disease']
    
    # Train model
    print("\nTraining model...")
    model, metadata = train_disease_risk_model(training_data, conditions)
    print("[SUCCESS] Model trained successfully")
    print(f"Model info: {metadata}")
    
    # Test prediction
    test_patient = {
        'date_of_birth': '1990-01-01',
        'gender': 'male',
        'height': 175,
        'weight': 75,
        'medical_history': [],
        'vital_signs': [
            {
                'blood_pressure': [125, 82],
                'heart_rate': 72,
                'temperature': 36.6,
                'recorded_at': datetime.now().isoformat()
            }
        ]
    }
    
    print("\nMaking predictions...")
    predictions = predict_disease_risk(test_patient, conditions)
    print("[SUCCESS] Predictions generated successfully")
    print("\nPredictions:")
    for pred in predictions:
        print(f"\nCondition: {pred['condition']}")
        print(f"Risk Score: {pred['risk_score']:.2f}")
        print(f"Risk Level: {pred['risk_level']}")
        print("Contributing Factors:")
        for factor in pred['contributing_factors']:
            print(f"- {factor['factor']}: {factor['contribution']:.2f}")
        print("Recommendations:")
        for rec in pred['recommendations']:
            print(f"- {rec}")

def main():
    """Initialize database and run tests."""
    print("Creating Flask app...")
    app = create_app()
    
    with app.app_context():
        print("\nInitializing database...")
        init_db()
        print("[SUCCESS] Database initialized")
        
        print("\nCreating test data...")
        result = create_test_data()
        print(f"[SUCCESS] {result}")
        
        print("\nTesting ML functionality...")
        test_ml_functionality()
        print("\n[SUCCESS] ML functionality tested successfully!")

if __name__ == '__main__':
    main()
