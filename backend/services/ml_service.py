import numpy as np
from typing import Dict, Any
import os
from config import Config
from services.tf_model_service import health_risk_model

def load_models():
    """Load all trained ML models."""
    model_path = Config.MODEL_PATH
    models = {}
    
    try:
        # Load models for different risk types
        models['cardiovascular'] = joblib.load(os.path.join(model_path, 'cardiovascular_model.pkl'))
        models['diabetes'] = joblib.load(os.path.join(model_path, 'diabetes_model.pkl'))
        models['respiratory'] = joblib.load(os.path.join(model_path, 'respiratory_model.pkl'))
        models['cancer'] = joblib.load(os.path.join(model_path, 'cancer_model.pkl'))
        models['mental_health'] = joblib.load(os.path.join(model_path, 'mental_health_model.pkl'))
    except FileNotFoundError:
        # If models don't exist, return None
        return None
    
    return models

def preprocess_health_data(health_record) -> Dict[str, np.ndarray]:
    """Preprocess health data for different risk predictions."""
    processed_data = {}
    
    # Common features for all models
    base_features = np.array([
        health_record.age,
        1 if health_record.gender == 'male' else 0,
        health_record.bmi,
        health_record.blood_pressure_systolic,
        health_record.blood_pressure_diastolic,
        health_record.heart_rate,
        1 if health_record.smoking_status == 'current' else 0,
        1 if health_record.alcohol_consumption == 'frequent' else 0,
    ])
    
    # Cardiovascular risk features
    processed_data['cardiovascular'] = np.concatenate([
        base_features,
        [health_record.cholesterol_hdl,
         health_record.cholesterol_ldl,
         health_record.triglycerides]
    ])
    
    # Diabetes risk features
    processed_data['diabetes'] = np.concatenate([
        base_features,
        [health_record.blood_sugar,
         health_record.hba1c]
    ])
    
    # Respiratory risk features
    processed_data['respiratory'] = np.concatenate([
        base_features,
        [health_record.respiratory_rate,
         health_record.fvc]
    ])
    
    # Cancer risk features
    processed_data['cancer'] = np.concatenate([
        base_features,
        [health_record.family_history_cancer,
         health_record.previous_cancer,
         health_record.tumor_markers,
         health_record.genetic_risk_score]
    ])
    
    # Mental health risk features
    processed_data['mental_health'] = np.concatenate([
        base_features,
        [health_record.stress_level,
         health_record.anxiety_score,
         health_record.depression_score]
    ])
    
    return processed_data

def generate_risk_factors(health_record, predictions) -> list:
    """Generate list of risk factors based on health data and predictions."""
    risk_factors = []
    
    # Check vital signs
    if health_record.blood_pressure_systolic >= 140 or health_record.blood_pressure_diastolic >= 90:
        risk_factors.append("High blood pressure")
    
    if health_record.heart_rate > 100:
        risk_factors.append("Elevated heart rate")
    
    # Check BMI
    if health_record.bmi >= 30:
        risk_factors.append("Obesity")
    elif health_record.bmi >= 25:
        risk_factors.append("Overweight")
    
    # Check lifestyle factors
    if health_record.smoking_status == 'current':
        risk_factors.append("Current smoker")
    
    if health_record.alcohol_consumption == 'frequent':
        risk_factors.append("Frequent alcohol consumption")
    
    if health_record.physical_activity_level == 'sedentary':
        risk_factors.append("Sedentary lifestyle")
    
    # Check lab results
    if health_record.blood_sugar > 126:
        risk_factors.append("High blood sugar")
    
    if health_record.cholesterol_ldl > 130:
        risk_factors.append("High LDL cholesterol")
    
    if health_record.cholesterol_hdl < 40:
        risk_factors.append("Low HDL cholesterol")
    
    if health_record.triglycerides > 150:
        risk_factors.append("High triglycerides")
    
    return risk_factors

def generate_recommendations(risk_factors, predictions) -> list:
    """Generate personalized recommendations based on risk factors and predictions."""
    recommendations = []
    
    # General recommendations
    recommendations.append("Schedule regular check-ups with your healthcare provider")
    recommendations.append("Maintain a balanced diet rich in fruits, vegetables, and whole grains")
    
    # Risk-specific recommendations
    if "High blood pressure" in risk_factors:
        recommendations.extend([
            "Monitor blood pressure regularly",
            "Reduce sodium intake",
            "Consider the DASH diet"
        ])
    
    if "Obesity" in risk_factors or "Overweight" in risk_factors:
        recommendations.extend([
            "Aim for a healthy weight through diet and exercise",
            "Consult with a nutritionist for personalized meal planning",
            "Engage in regular physical activity"
        ])
    
    if "Current smoker" in risk_factors:
        recommendations.extend([
            "Consider smoking cessation programs",
            "Talk to your doctor about nicotine replacement therapy",
            "Join a support group for quitting smoking"
        ])
    
    if "Frequent alcohol consumption" in risk_factors:
        recommendations.extend([
            "Reduce alcohol intake",
            "Seek support for alcohol moderation",
            "Consider alcohol-free alternatives"
        ])
    
    if "Sedentary lifestyle" in risk_factors:
        recommendations.extend([
            "Aim for at least 150 minutes of moderate exercise per week",
            "Start with short walks and gradually increase activity",
            "Find physical activities you enjoy"
        ])
    
    # Add recommendations based on high risk predictions
    if predictions['cardiovascular_risk'] > 70:
        recommendations.extend([
            "Consult a cardiologist",
            "Monitor blood pressure daily",
            "Consider heart-healthy exercises"
        ])
    
    if predictions['diabetes_risk'] > 70:
        recommendations.extend([
            "Monitor blood sugar regularly",
            "Consult an endocrinologist",
            "Learn about diabetes management"
        ])
    
    return list(set(recommendations))  # Remove duplicates

def predict_health_risks(health_record) -> Dict[str, Any]:
    """Generate health risk predictions using TensorFlow models."""
    try:
        # Preprocess health data
        processed_data = preprocess_health_data(health_record)
        
        # Get predictions from TensorFlow models
        predictions = health_risk_model.predict(processed_data)
        
        # Generate risk factors and recommendations
        risk_factors = generate_risk_factors(health_record, predictions)
        recommendations = generate_recommendations(risk_factors, predictions)
        
        # Add additional information
        predictions.update({
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'model_version': '1.0.0',
            'confidence_score': 0.85  # This should be calculated based on model confidence
        })
        
        return predictions
        
    except Exception as e:
        raise Exception(f"Error in health risk prediction: {str(e)}")
