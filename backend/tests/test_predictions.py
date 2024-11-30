"""Test suite for ML predictions functionality."""

import os
import sys
import pytest
import json
from datetime import datetime, timedelta

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.database import db, init_db
from app.models import User, Patient, MedicalHistory
from app.ml.predictions import train_disease_risk_model, predict_disease_risk

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app()
    app.config['TESTING'] = True
    
    # Create tables
    init_db()
    
    yield app
    
    # Clean up
    db.remove()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_headers():
    """Create authentication headers for testing."""
    return {'Authorization': 'Bearer test-token'}

def test_train_and_predict():
    """Test the complete ML pipeline: training and prediction."""
    
    # Create sample training data
    training_data = [
        {
            'user_id': 1,
            'date_of_birth': '1980-01-01',
            'gender': 'male',
            'height': 175,
            'weight': 75,
            'medical_history': [
                {
                    'condition': 'diabetes',
                    'diagnosis_date': '2020-01-01',
                    'status': 'active'
                }
            ],
            'vital_signs': [
                {
                    'blood_pressure': [120, 80],
                    'heart_rate': 72,
                    'temperature': 36.6,
                    'recorded_at': datetime.now().isoformat()
                }
            ]
        },
        {
            'user_id': 2,
            'date_of_birth': '1990-01-01',
            'gender': 'female',
            'height': 165,
            'weight': 65,
            'medical_history': [],
            'vital_signs': [
                {
                    'blood_pressure': [110, 70],
                    'heart_rate': 68,
                    'temperature': 36.5,
                    'recorded_at': datetime.now().isoformat()
                }
            ]
        }
    ]
    
    conditions = ['diabetes', 'heart_disease']
    
    # Train the model
    try:
        model, metadata = train_disease_risk_model(training_data, conditions)
        print("✓ Model training successful")
        print(f"Model info: {json.dumps(metadata, indent=2)}")
    except Exception as e:
        pytest.fail(f"Model training failed: {str(e)}")
    
    # Test prediction
    test_patient = {
        'user_id': 3,
        'date_of_birth': '1985-01-01',
        'gender': 'male',
        'height': 180,
        'weight': 80,
        'medical_history': [],
        'vital_signs': [
            {
                'blood_pressure': [130, 85],
                'heart_rate': 75,
                'temperature': 36.7,
                'recorded_at': datetime.now().isoformat()
            }
        ]
    }
    
    try:
        predictions = predict_disease_risk(test_patient, conditions)
        print("\n✓ Prediction successful")
        print(f"Predictions: {json.dumps(predictions, indent=2)}")
        
        # Verify prediction structure
        assert isinstance(predictions, list)
        for pred in predictions:
            assert 'condition' in pred
            assert 'risk_score' in pred
            assert 'risk_level' in pred
            assert 'contributing_factors' in pred
            assert 'recommendations' in pred
        
        print("\n✓ Prediction structure verified")
        
    except Exception as e:
        pytest.fail(f"Prediction failed: {str(e)}")

if __name__ == '__main__':
    print("Running ML prediction tests...")
    test_train_and_predict()
    print("\nAll tests completed successfully!")
