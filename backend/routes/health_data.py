from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime, timedelta

from models import db, User, HealthRecord

health_data_bp = Blueprint('health_data', __name__)
logger = logging.getLogger(__name__)

@health_data_bp.route('', methods=['POST'])
@jwt_required()
def create_health_record():
    """Create a new health record."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        new_record = HealthRecord(
            user_id=user_id,
            age=data.get('age'),
            gender=data.get('gender'),
            health_data=data.get('health_data', {}),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_record)
        db.session.commit()
        
        return jsonify({
            "message": "Health record created successfully",
            "record_id": new_record.id,
            "record": {
                "id": new_record.id,
                "age": new_record.age,
                "gender": new_record.gender,
                "health_data": new_record.health_data,
                "notes": new_record.notes,
                "created_at": new_record.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating health record: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": "Failed to create health record"}), 500

@health_data_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_health_record():
    """Get user's latest health record."""
    try:
        user_id = get_jwt_identity()
        
        # First verify the user exists
        user = User.query.get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({"error": "User not found"}), 404
            
        latest_record = HealthRecord.query.filter_by(user_id=user_id).order_by(HealthRecord.created_at.desc()).first()
        
        if not latest_record:
            return jsonify({
                "message": "No health records found",
                "user_id": user_id
            }), 404
            
        return jsonify({
            "id": latest_record.id,
            "age": latest_record.age,
            "gender": latest_record.gender,
            "health_data": latest_record.health_data,
            "notes": latest_record.notes,
            "created_at": latest_record.created_at.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching latest health record: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch latest health record"}), 500

@health_data_bp.route('/history', methods=['GET'])
@jwt_required()
def get_health_record_history():
    """Get user's health record history."""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        records = HealthRecord.query.filter_by(user_id=user_id)\
            .order_by(HealthRecord.created_at.desc())\
            .paginate(page=page, per_page=per_page)
            
        return jsonify({
            "total": records.total,
            "pages": records.pages,
            "current_page": records.page,
            "per_page": records.per_page,
            "records": [{
                "id": record.id,
                "age": record.age,
                "gender": record.gender,
                "health_data": record.health_data,
                "notes": record.notes,
                "created_at": record.created_at.isoformat()
            } for record in records.items]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching health record history: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch health record history"}), 500

@health_data_bp.route('/api/health-records/history', methods=['GET'])
@jwt_required()
def get_health_history():
    """Get historical health records for the current user."""
    try:
        current_user_id = get_jwt_identity()
        
        # Fetch last 30 days of records
        thirty_days_ago = datetime.now() - timedelta(days=30)
        records = HealthRecord.query.filter(
            HealthRecord.user_id == current_user_id,
            HealthRecord.created_at >= thirty_days_ago
        ).order_by(HealthRecord.created_at.asc()).all()
        
        if not records:
            return jsonify([]), 200
            
        return jsonify([{
            'id': record.id,
            'date': record.created_at.isoformat(),
            'blood_pressure': record.blood_pressure,
            'heart_rate': record.heart_rate,
            'bmi': record.bmi,
            'risk_scores': record.risk_scores if record.risk_scores else {}
        } for record in records]), 200
        
    except Exception as e:
        logger.error(f"Error fetching health history: {str(e)}")
        return jsonify({'error': 'Failed to fetch health history'}), 500
