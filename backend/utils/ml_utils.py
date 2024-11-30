import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta

def load_model(model_name):
    """Load ML model from file"""
    try:
        model_path = f'models/{model_name}.joblib'
        return joblib.load(model_path)
    except Exception as e:
        raise Exception(f'Error loading model {model_name}: {str(e)}')

def preprocess_data(data, model_type):
    """Preprocess data for ML models"""
    if model_type == 'risk_assessment':
        return preprocess_risk_assessment_data(data)
    elif model_type == 'health_prediction':
        return preprocess_prediction_data(data)
    elif model_type == 'anomaly_detection':
        return preprocess_anomaly_detection_data(data)
    else:
        raise ValueError(f'Unknown model type: {model_type}')

def preprocess_risk_assessment_data(data):
    """Preprocess data for risk assessment model"""
    # Extract relevant features
    features = {
        'age': calculate_age(data['patient_info']['date_of_birth']),
        'gender': encode_gender(data['patient_info']['gender']),
        'bmi': calculate_bmi(data['patient_info']['height'], data['patient_info']['weight'])
    }
    
    # Process vital signs
    vital_signs = process_vital_signs(data['vital_signs'])
    features.update(vital_signs)
    
    # Process medical records
    medical_features = process_medical_records(data['medical_records'])
    features.update(medical_features)
    
    # Convert to DataFrame and handle missing values
    df = pd.DataFrame([features])
    df = handle_missing_values(df)
    
    # Scale features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(df)
    
    return scaled_features

def preprocess_prediction_data(data):
    """Preprocess data for health prediction model"""
    # Create time series features
    time_series = create_time_series_features(data)
    
    # Handle missing values and interpolate
    time_series = handle_missing_values(time_series, method='interpolate')
    
    # Scale features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(time_series)
    
    return scaled_features

def preprocess_anomaly_detection_data(data):
    """Preprocess data for anomaly detection model"""
    # Extract recent measurements
    recent_data = extract_recent_measurements(data)
    
    # Calculate statistical features
    statistical_features = calculate_statistical_features(recent_data)
    
    # Scale features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(statistical_features)
    
    return scaled_features

def calculate_age(date_of_birth):
    """Calculate age from date of birth"""
    dob = datetime.strptime(date_of_birth, '%Y-%m-%d')
    today = datetime.today()
    age = today.year - dob.year
    if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
        age -= 1
    return age

def encode_gender(gender):
    """Encode gender as numeric value"""
    gender_map = {'male': 0, 'female': 1, 'other': 2}
    return gender_map.get(gender.lower(), 2)

def calculate_bmi(height, weight):
    """Calculate BMI from height and weight"""
    height_m = height / 100  # Convert cm to m
    return weight / (height_m ** 2)

def process_vital_signs(vital_signs):
    """Process vital signs data"""
    vital_features = {}
    
    if not vital_signs:
        return vital_features
    
    # Calculate average values for each vital sign type
    vital_types = set(v['measurement_type'] for v in vital_signs)
    
    for vital_type in vital_types:
        type_readings = [v['value'] for v in vital_signs if v['measurement_type'] == vital_type]
        if type_readings:
            vital_features[f'{vital_type}_avg'] = np.mean(type_readings)
            vital_features[f'{vital_type}_std'] = np.std(type_readings)
            vital_features[f'{vital_type}_min'] = np.min(type_readings)
            vital_features[f'{vital_type}_max'] = np.max(type_readings)
    
    return vital_features

def process_medical_records(records):
    """Process medical records data"""
    features = {}
    
    if not records:
        return features
    
    # Extract diagnosis codes
    diagnosis_codes = []
    for record in records:
        if record.get('diagnosis'):
            diagnosis_codes.extend(record['diagnosis'].get('codes', []))
    
    # Count unique diagnoses
    features['diagnosis_count'] = len(set(diagnosis_codes))
    
    # Calculate recency of last record
    latest_record = max(records, key=lambda x: x['record_date'])
    features['days_since_last_record'] = (datetime.utcnow() - 
        datetime.strptime(latest_record['record_date'], '%Y-%m-%dT%H:%M:%S')).days
    
    return features

def create_time_series_features(data):
    """Create time series features from data"""
    # Implementation for time series feature creation
    pass

def extract_recent_measurements(data):
    """Extract recent measurements for anomaly detection"""
    # Implementation for recent measurement extraction
    pass

def calculate_statistical_features(data):
    """Calculate statistical features for data"""
    # Implementation for statistical feature calculation
    pass

def handle_missing_values(df, method='mean'):
    """Handle missing values in DataFrame"""
    if method == 'mean':
        return df.fillna(df.mean())
    elif method == 'interpolate':
        return df.interpolate(method='linear', limit_direction='both')
    else:
        raise ValueError(f'Unknown missing value handling method: {method}')
