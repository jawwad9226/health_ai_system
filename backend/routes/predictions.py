from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime, timedelta
import numpy as np

from models import db, User, HealthRecord, RiskPrediction

predictions_bp = Blueprint('predictions', __name__)
logger = logging.getLogger(__name__)

def calculate_risk_factors(health_data):
    """Calculate risk factors for different health categories with enhanced precision."""
    risk_factors = {
        'cardiovascular': 0,
        'diabetes': 0,
        'mental_health': 0,
        'lifestyle': 0
    }
    
    try:
        # Cardiovascular Risk - Enhanced with more factors
        systolic = float(health_data.get('bloodPressureSystolic', 120))
        diastolic = float(health_data.get('bloodPressureDiastolic', 80))
        heart_rate = float(health_data.get('heartRate', 70))
        
        # Blood pressure risk
        if systolic >= 140 or diastolic >= 90:
            risk_factors['cardiovascular'] += 30
        elif systolic >= 130 or diastolic >= 85:
            risk_factors['cardiovascular'] += 20

        # Heart rate risk
        if heart_rate > 100:
            risk_factors['cardiovascular'] += 15
        elif heart_rate > 90:
            risk_factors['cardiovascular'] += 10

        # Process symptoms
        symptoms = health_data.get('symptoms', [])
        for symptom in symptoms:
            if symptom in ['chest_pain', 'difficulty_breathing']:
                risk_factors['cardiovascular'] += 20
            if symptom in ['fatigue', 'dizziness']:
                risk_factors['cardiovascular'] += 10

        # Cap the risk at 100
        risk_factors['cardiovascular'] = min(100, risk_factors['cardiovascular'])
        
    except Exception as e:
        logger.error(f"Error calculating risk factors: {str(e)}")
        return None
        
    return risk_factors

@predictions_bp.route('', methods=['POST'])
@jwt_required()
def create_prediction():
    """Create a new health prediction."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Calculate risk factors
        risk_factors = calculate_risk_factors(data)
        if not risk_factors:
            return jsonify({"error": "Error calculating risk factors"}), 500
            
        # Create prediction record
        prediction = RiskPrediction(
            user_id=user_id,
            prediction_data=data,
            risk_factors=risk_factors,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(prediction)
        db.session.commit()
        
        return jsonify({
            "message": "Prediction created successfully",
            "prediction_id": prediction.id,
            "risk_factors": risk_factors,
            "recommendations": [
                "Consider consulting a healthcare provider for a thorough evaluation",
                "Monitor your blood pressure regularly",
                "Maintain a healthy diet and exercise routine",
                "Get adequate rest and manage stress levels"
            ]
        }), 201
        
    except Exception as e:
        logger.error(f"Error in create_prediction: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to create prediction"}), 500

@predictions_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_prediction():
    """Get user's latest risk prediction."""
    try:
        user_id = get_jwt_identity()
        
        # Get latest health record
        latest_record = HealthRecord.query.filter_by(user_id=user_id)\
            .order_by(HealthRecord.created_at.desc())\
            .first()
            
        if not latest_record:
            return jsonify({"message": "No health records found"}), 404
            
        # Calculate risk factors
        risk_factors = calculate_risk_factors(latest_record.health_data)
        
        # Calculate overall risk score (weighted average)
        weights = {
            'cardiovascular': 0.35,
            'diabetes': 0.25,
            'mental_health': 0.20,
            'lifestyle': 0.20
        }
        
        overall_risk = sum(risk_factors[k] * weights[k] for k in weights)
        
        # Save prediction
        prediction = RiskPrediction(
            user_id=user_id,
            health_record_id=latest_record.id,
            risk_score=overall_risk,
            risk_factors=risk_factors
        )
        
        db.session.add(prediction)
        db.session.commit()
        
        return jsonify({
            "overall_risk": round(overall_risk, 2),
            "risk_factors": risk_factors,
            "created_at": prediction.created_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to generate prediction"}), 500

@predictions_bp.route('/history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    """Get user's risk prediction history."""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        predictions = RiskPrediction.query\
            .filter(RiskPrediction.user_id == user_id,
                   RiskPrediction.created_at >= cutoff_date)\
            .order_by(RiskPrediction.created_at.desc())\
            .all()
            
        return jsonify({
            "predictions": [{
                "overall_risk": round(pred.risk_score, 2),
                "risk_factors": pred.risk_factors,
                "created_at": pred.created_at.isoformat()
            } for pred in predictions]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching prediction history: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch prediction history"}), 500
