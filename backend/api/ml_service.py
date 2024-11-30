from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.patient import Patient
from models.vital_sign import VitalSign
from models.medical_record import MedicalRecord
from utils.decorators import professional_required
from utils.ml_utils import load_model, preprocess_data
import numpy as np
from datetime import datetime, timedelta
import joblib
import pandas as pd

api = Namespace('ml-service', description='Machine Learning service operations')

# Models
risk_assessment_model = api.model('RiskAssessment', {
    'patient_id': fields.String(required=True, description='Patient ID'),
    'risk_level': fields.String(description='Overall risk level'),
    'risk_factors': fields.List(fields.String, description='Identified risk factors'),
    'recommendations': fields.List(fields.String, description='Health recommendations'),
    'confidence_score': fields.Float(description='Model confidence score'),
    'assessment_date': fields.DateTime(description='Assessment timestamp'),
    'next_assessment_date': fields.DateTime(description='Next assessment due date')
})

health_prediction_model = api.model('HealthPrediction', {
    'patient_id': fields.String(required=True, description='Patient ID'),
    'prediction_type': fields.String(required=True, description='Type of prediction'),
    'predicted_values': fields.Raw(description='Predicted health values'),
    'confidence_intervals': fields.Raw(description='Confidence intervals'),
    'prediction_horizon': fields.String(description='Time horizon for prediction'),
    'factors_considered': fields.List(fields.String, description='Factors considered in prediction')
})

anomaly_detection_model = api.model('AnomalyDetection', {
    'patient_id': fields.String(required=True, description='Patient ID'),
    'anomaly_type': fields.String(description='Type of anomaly detected'),
    'severity': fields.String(description='Severity level'),
    'detected_values': fields.Raw(description='Anomalous values detected'),
    'normal_range': fields.Raw(description='Expected normal range'),
    'detection_time': fields.DateTime(description='Time of detection'),
    'recommended_actions': fields.List(fields.String, description='Recommended actions')
})

@api.route('/risk-assessment')
class RiskAssessment(Resource):
    @jwt_required()
    @api.marshal_with(risk_assessment_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Patient not found'
        }
    )
    def post(self):
        """Perform health risk assessment"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        patient_id = data['patient_id']
        
        # Check access rights
        if not has_ml_service_access(current_user_id, patient_id):
            api.abort(403, 'Permission denied')
        
        try:
            # Load patient data
            patient_data = gather_patient_data(patient_id)
            
            # Load risk assessment model
            risk_model = load_model('risk_assessment')
            
            # Preprocess data
            processed_data = preprocess_data(patient_data, model_type='risk_assessment')
            
            # Generate risk assessment
            risk_assessment = generate_risk_assessment(risk_model, processed_data)
            
            return risk_assessment
            
        except Exception as e:
            api.abort(400, f'Error performing risk assessment: {str(e)}')

@api.route('/health-prediction')
class HealthPrediction(Resource):
    @jwt_required()
    @api.marshal_with(health_prediction_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Patient not found'
        }
    )
    def post(self):
        """Generate health predictions"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        patient_id = data['patient_id']
        prediction_type = data['prediction_type']
        
        # Check access rights
        if not has_ml_service_access(current_user_id, patient_id):
            api.abort(403, 'Permission denied')
        
        try:
            # Load patient data
            patient_data = gather_patient_data(patient_id)
            
            # Load prediction model
            prediction_model = load_model(f'health_prediction_{prediction_type}')
            
            # Preprocess data
            processed_data = preprocess_data(patient_data, model_type='health_prediction')
            
            # Generate predictions
            predictions = generate_health_predictions(prediction_model, processed_data, prediction_type)
            
            return predictions
            
        except Exception as e:
            api.abort(400, f'Error generating health predictions: {str(e)}')

@api.route('/anomaly-detection')
class AnomalyDetection(Resource):
    @jwt_required()
    @api.marshal_with(anomaly_detection_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Patient not found'
        }
    )
    def post(self):
        """Detect health anomalies"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        patient_id = data['patient_id']
        
        # Check access rights
        if not has_ml_service_access(current_user_id, patient_id):
            api.abort(403, 'Permission denied')
        
        try:
            # Load patient data
            patient_data = gather_patient_data(patient_id)
            
            # Load anomaly detection model
            anomaly_model = load_model('anomaly_detection')
            
            # Preprocess data
            processed_data = preprocess_data(patient_data, model_type='anomaly_detection')
            
            # Detect anomalies
            anomalies = detect_health_anomalies(anomaly_model, processed_data)
            
            return anomalies
            
        except Exception as e:
            api.abort(400, f'Error detecting anomalies: {str(e)}')

def gather_patient_data(patient_id):
    """Gather all relevant patient data for ML processing"""
    patient = Patient.query.get_or_404(patient_id)
    
    # Gather vital signs
    vital_signs = VitalSign.query.filter_by(patient_id=patient_id)\
        .order_by(VitalSign.measurement_time.desc())\
        .limit(100)\
        .all()
    
    # Gather medical records
    medical_records = MedicalRecord.query.filter_by(patient_id=patient_id)\
        .order_by(MedicalRecord.record_date.desc())\
        .all()
    
    # Transform data into ML-ready format
    data = {
        'patient_info': patient.to_dict(),
        'vital_signs': [v.to_dict() for v in vital_signs],
        'medical_records': [r.to_dict() for r in medical_records]
    }
    
    return data

def generate_risk_assessment(model, data):
    """Generate health risk assessment"""
    # Perform risk assessment using the model
    risk_scores = model.predict_proba(data)[0]
    risk_factors = identify_risk_factors(model, data)
    recommendations = generate_recommendations(risk_factors)
    
    assessment = {
        'patient_id': data['patient_info']['id'],
        'risk_level': determine_risk_level(risk_scores),
        'risk_factors': risk_factors,
        'recommendations': recommendations,
        'confidence_score': np.max(risk_scores),
        'assessment_date': datetime.utcnow(),
        'next_assessment_date': datetime.utcnow() + timedelta(days=30)
    }
    
    return assessment

def generate_health_predictions(model, data, prediction_type):
    """Generate health predictions"""
    # Generate predictions using the model
    predicted_values = model.predict(data)
    confidence = model.predict_proba(data)
    
    prediction = {
        'patient_id': data['patient_info']['id'],
        'prediction_type': prediction_type,
        'predicted_values': predicted_values.tolist(),
        'confidence_intervals': calculate_confidence_intervals(predicted_values, confidence),
        'prediction_horizon': '30 days',
        'factors_considered': list(data.columns)
    }
    
    return prediction

def detect_health_anomalies(model, data):
    """Detect health anomalies"""
    # Detect anomalies using the model
    anomaly_scores = model.predict(data)
    anomalies = identify_anomalies(data, anomaly_scores)
    
    result = {
        'patient_id': data['patient_info']['id'],
        'anomaly_type': anomalies['type'] if anomalies else None,
        'severity': determine_severity(anomaly_scores),
        'detected_values': anomalies['values'] if anomalies else None,
        'normal_range': get_normal_ranges(),
        'detection_time': datetime.utcnow(),
        'recommended_actions': generate_anomaly_recommendations(anomalies)
    }
    
    return result

def has_ml_service_access(user_id, patient_id):
    """Check if user has access to ML services"""
    user = User.query.get(user_id)
    
    if user.user_type == 'admin':
        return True
    
    if user.user_type == 'patient':
        patient = Patient.query.filter_by(user_id=user_id).first()
        return str(patient.id) == str(patient_id)
    
    if user.user_type == 'professional':
        # Professionals can access ML services for their patients
        return True
    
    return False

# Helper functions for ML operations
def identify_risk_factors(model, data):
    """Identify health risk factors"""
    # Implementation for risk factor identification
    pass

def generate_recommendations(risk_factors):
    """Generate health recommendations"""
    # Implementation for recommendation generation
    pass

def determine_risk_level(risk_scores):
    """Determine overall risk level"""
    # Implementation for risk level determination
    pass

def calculate_confidence_intervals(predictions, confidence):
    """Calculate confidence intervals for predictions"""
    # Implementation for confidence interval calculation
    pass

def identify_anomalies(data, anomaly_scores):
    """Identify specific health anomalies"""
    # Implementation for anomaly identification
    pass

def determine_severity(anomaly_scores):
    """Determine severity of anomalies"""
    # Implementation for severity determination
    pass

def get_normal_ranges():
    """Get normal ranges for health metrics"""
    # Implementation for normal range definition
    pass

def generate_anomaly_recommendations(anomalies):
    """Generate recommendations for detected anomalies"""
    # Implementation for anomaly recommendation generation
    pass
