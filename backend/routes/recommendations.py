from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime

from models import db, User, HealthRecord, RiskPrediction, Recommendation

recommendations_bp = Blueprint('recommendations', __name__)
logger = logging.getLogger(__name__)

def generate_recommendations(risk_factors, health_data):
    """Generate detailed personalized health recommendations based on risk factors and health data."""
    recommendations = []
    
    # Cardiovascular recommendations
    cv_risk = risk_factors.get('cardiovascular', 0)
    if cv_risk > 70:
        recommendations.append({
            'category': 'cardiovascular',
            'priority': 'high',
            'title': 'Critical Cardiovascular Assessment Required',
            'description': 'Your cardiovascular risk is at a critical level. Immediate medical attention is recommended.',
            'actions': [
                'Schedule an urgent appointment with a cardiologist',
                'Begin daily blood pressure monitoring',
                'Start a heart-healthy Mediterranean diet',
                'Reduce sodium intake to less than 2000mg daily',
                'Consider stress reduction techniques'
            ]
        })
    elif cv_risk > 50:
        recommendations.append({
            'category': 'cardiovascular',
            'priority': 'high',
            'title': 'Cardiovascular Health Action Plan',
            'description': 'Your cardiovascular risk is elevated. Take proactive steps to improve heart health.',
            'actions': [
                'Schedule a cardiovascular checkup within 2 weeks',
                'Monitor blood pressure twice daily',
                'Begin a structured walking program (start with 15 minutes daily)',
                'Reduce saturated fat intake',
                'Consider meditation or yoga for stress management'
            ]
        })
    elif cv_risk > 30:
        recommendations.append({
            'category': 'cardiovascular',
            'priority': 'medium',
            'title': 'Heart Health Improvement Plan',
            'description': 'Take steps to improve your cardiovascular health and prevent future issues.',
            'actions': [
                'Schedule a routine cardiovascular screening',
                'Exercise 30 minutes daily (moderate intensity)',
                'Implement DASH diet principles',
                'Monitor blood pressure weekly',
                'Practice deep breathing exercises'
            ]
        })

    # Diabetes recommendations
    diabetes_risk = risk_factors.get('diabetes', 0)
    if diabetes_risk > 60:
        recommendations.append({
            'category': 'diabetes',
            'priority': 'high',
            'title': 'Urgent Diabetes Risk Management',
            'description': 'Your diabetes risk factors are significantly elevated. Immediate action is required.',
            'actions': [
                'Schedule comprehensive diabetes screening',
                'Begin blood glucose monitoring',
                'Consult with an endocrinologist',
                'Start a low-glycemic diet plan',
                'Track daily carbohydrate intake',
                'Implement portion control measures'
            ]
        })
    elif diabetes_risk > 40:
        recommendations.append({
            'category': 'diabetes',
            'priority': 'medium',
            'title': 'Diabetes Prevention Program',
            'description': 'Take proactive steps to prevent diabetes development.',
            'actions': [
                'Schedule A1C blood test',
                'Implement portion control',
                'Replace refined carbs with whole grains',
                'Add 30 minutes of daily physical activity',
                'Monitor weight weekly'
            ]
        })

    # Mental health recommendations
    mental_health_risk = risk_factors.get('mental_health', 0)
    sleep_hours = float(health_data.get('sleepDuration', 7))
    
    if mental_health_risk > 50:
        recommendations.append({
            'category': 'mental_health',
            'priority': 'high',
            'title': 'Mental Health Support Plan',
            'description': 'Your mental well-being indicators suggest the need for professional support.',
            'actions': [
                'Schedule consultation with mental health professional',
                'Begin daily mindfulness practice',
                'Establish regular sleep schedule',
                'Create a stress management plan',
                'Consider joining support groups'
            ]
        })
    elif mental_health_risk > 30 or sleep_hours < 6:
        recommendations.append({
            'category': 'mental_health',
            'priority': 'medium',
            'title': 'Mental Wellness Enhancement',
            'description': 'Enhance your mental well-being with these targeted actions.',
            'actions': [
                'Practice daily meditation (10 minutes)',
                'Maintain sleep hygiene routine',
                'Engage in regular physical activity',
                'Limit screen time before bed',
                'Consider journaling for stress relief'
            ]
        })

    # Lifestyle recommendations
    lifestyle_risk = risk_factors.get('lifestyle', 0)
    exercise_freq = int(health_data.get('exerciseFrequency', 2))
    
    if lifestyle_risk > 40:
        recommendations.append({
            'category': 'lifestyle',
            'priority': 'high',
            'title': 'Lifestyle Transformation Plan',
            'description': 'Significant lifestyle changes are recommended to improve your health.',
            'actions': [
                'Create a structured exercise schedule',
                'Develop healthy meal planning routine',
                'Implement regular sleep schedule',
                'Take regular breaks during work',
                'Find an exercise buddy or join fitness classes',
                'Set up regular health check-ins'
            ]
        })
    elif lifestyle_risk > 20 or exercise_freq < 3:
        recommendations.append({
            'category': 'lifestyle',
            'priority': 'medium',
            'title': 'Healthy Lifestyle Integration',
            'description': 'Incorporate these healthy habits into your daily routine.',
            'actions': [
                'Start with 10-minute exercise sessions',
                'Take walking breaks during work',
                'Prepare healthy snacks in advance',
                'Create a bedtime routine',
                'Stay hydrated throughout the day'
            ]
        })

    # Weight management recommendations if needed
    height_m = float(health_data.get('height', 170)) / 100
    weight_kg = float(health_data.get('weight', 70))
    bmi = weight_kg / (height_m * height_m)
    
    if bmi >= 30:
        recommendations.append({
            'category': 'weight',
            'priority': 'high',
            'title': 'Weight Management Program',
            'description': 'A structured weight management plan is recommended for your health.',
            'actions': [
                'Consult with a registered dietitian',
                'Start food diary tracking',
                'Begin portion control practice',
                'Schedule regular weigh-ins',
                'Join a weight management support group',
                'Create a realistic weight loss timeline'
            ]
        })
    elif bmi >= 25:
        recommendations.append({
            'category': 'weight',
            'priority': 'medium',
            'title': 'Weight Optimization Plan',
            'description': 'Take steps to achieve and maintain a healthy weight.',
            'actions': [
                'Monitor daily caloric intake',
                'Implement portion control strategies',
                'Increase daily physical activity',
                'Choose whole foods over processed options',
                'Track weekly measurements'
            ]
        })

    return recommendations

@recommendations_bp.route('', methods=['GET'])
@jwt_required()
def get_recommendations():
    """Get personalized health recommendations."""
    try:
        user_id = get_jwt_identity()
        
        # Get latest health record and prediction
        latest_record = HealthRecord.query.filter_by(user_id=user_id)\
            .order_by(HealthRecord.created_at.desc())\
            .first()
            
        if not latest_record:
            return jsonify({"message": "No health records found"}), 404
            
        latest_prediction = RiskPrediction.query.filter_by(user_id=user_id)\
            .order_by(RiskPrediction.created_at.desc())\
            .first()
            
        if not latest_prediction:
            return jsonify({"message": "No risk predictions found"}), 404
            
        # Generate recommendations
        recommendations_data = generate_recommendations(
            latest_prediction.risk_factors,
            latest_record.health_data
        )
        
        # Save recommendations
        saved_recommendations = []
        for rec_data in recommendations_data:
            recommendation = Recommendation(
                user_id=user_id,
                health_record_id=latest_record.id,
                category=rec_data['category'],
                priority=rec_data['priority'],
                title=rec_data['title'],
                description=rec_data['description'],
                actions=rec_data['actions']
            )
            db.session.add(recommendation)
            saved_recommendations.append(recommendation)
            
        db.session.commit()
        
        return jsonify({
            "recommendations": [{
                "id": rec.id,
                "category": rec.category,
                "priority": rec.priority,
                "title": rec.title,
                "description": rec.description,
                "actions": rec.actions,
                "status": rec.status,
                "created_at": rec.created_at.isoformat()
            } for rec in saved_recommendations]
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to generate recommendations"}), 500

@recommendations_bp.route('/history', methods=['GET'])
@jwt_required()
def get_recommendation_history():
    """Get user's recommendation history."""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        recommendations = Recommendation.query.filter_by(user_id=user_id)\
            .order_by(Recommendation.created_at.desc())\
            .paginate(page=page, per_page=per_page)
            
        return jsonify({
            "total": recommendations.total,
            "pages": recommendations.pages,
            "current_page": recommendations.page,
            "per_page": recommendations.per_page,
            "recommendations": [{
                "id": rec.id,
                "category": rec.category,
                "priority": rec.priority,
                "title": rec.title,
                "description": rec.description,
                "actions": rec.actions,
                "status": rec.status,
                "created_at": rec.created_at.isoformat()
            } for rec in recommendations.items]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching recommendation history: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch recommendation history"}), 500

@recommendations_bp.route('/<int:recommendation_id>/status', methods=['PUT'])
@jwt_required()
def update_recommendation_status(recommendation_id):
    """Update the status of a recommendation."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({"error": "Status not provided"}), 400
            
        new_status = data['status']
        if new_status not in ['pending', 'in_progress', 'completed', 'dismissed']:
            return jsonify({"error": "Invalid status"}), 400
            
        recommendation = Recommendation.query.filter_by(
            id=recommendation_id,
            user_id=user_id
        ).first()
        
        if not recommendation:
            return jsonify({"error": "Recommendation not found"}), 404
            
        recommendation.status = new_status
        db.session.commit()
        
        return jsonify({
            "message": "Status updated successfully",
            "recommendation": {
                "id": recommendation.id,
                "status": recommendation.status,
                "updated_at": recommendation.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating recommendation status: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to update recommendation status"}), 500
