from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.vital_sign import VitalSign
from models.patient import Patient
from utils.decorators import professional_required
from utils.pagination import paginate
from datetime import datetime

api = Namespace('vital-signs', description='Vital signs operations')

# Models
vital_sign_model = api.model('VitalSign', {
    'id': fields.String(description='Vital sign ID'),
    'patient_id': fields.String(required=True, description='Patient ID'),
    'measurement_type': fields.String(required=True, description='Type of measurement'),
    'value': fields.Float(required=True, description='Measurement value'),
    'unit': fields.String(required=True, description='Measurement unit'),
    'measurement_time': fields.DateTime(required=True, description='Time of measurement'),
    'source': fields.String(description='Source of measurement'),
    'device_id': fields.String(description='Measuring device ID'),
    'notes': fields.String(description='Additional notes'),
    'is_abnormal': fields.Boolean(description='Abnormal flag'),
    'severity': fields.String(description='Severity if abnormal'),
    'created_by': fields.String(description='Creator ID'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp')
})

@api.route('')
class VitalSignList(Resource):
    @jwt_required()
    @api.marshal_list_with(vital_sign_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'patient_id': 'Filter by patient',
            'measurement_type': 'Filter by measurement type',
            'start_date': 'Filter by start date',
            'end_date': 'Filter by end date',
            'is_abnormal': 'Filter abnormal readings'
        }
    )
    def get(self):
        """Get list of vital signs"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Build base query
        query = VitalSign.query
        
        # Apply filters based on user type
        if current_user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=current_user_id).first()
            query = query.filter(VitalSign.patient_id == patient.id)
        
        # Apply additional filters
        patient_id = request.args.get('patient_id')
        measurement_type = request.args.get('measurement_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        is_abnormal = request.args.get('is_abnormal')
        
        if patient_id and current_user.user_type in ['professional', 'admin']:
            query = query.filter(VitalSign.patient_id == patient_id)
        if measurement_type:
            query = query.filter(VitalSign.measurement_type == measurement_type)
        if start_date:
            query = query.filter(VitalSign.measurement_time >= start_date)
        if end_date:
            query = query.filter(VitalSign.measurement_time <= end_date)
        if is_abnormal is not None:
            query = query.filter(VitalSign.is_abnormal == (is_abnormal.lower() == 'true'))
        
        return paginate(query.order_by(VitalSign.measurement_time.desc()))

    @jwt_required()
    @api.expect(vital_sign_model)
    @api.marshal_with(vital_sign_model)
    @api.doc(responses={
        201: 'Vital sign recorded',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def post(self):
        """Record new vital sign measurement"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Verify patient exists
        patient = Patient.query.get_or_404(data['patient_id'])
        
        # Check if current user has permission to record vitals for this patient
        if not has_vital_sign_access(current_user_id, patient.id):
            api.abort(403, 'Permission denied')
        
        try:
            vital_sign = VitalSign(
                patient_id=data['patient_id'],
                measurement_type=data['measurement_type'],
                value=data['value'],
                unit=data['unit'],
                measurement_time=datetime.fromisoformat(data['measurement_time']),
                source=data.get('source', 'manual'),
                device_id=data.get('device_id'),
                notes=data.get('notes'),
                is_abnormal=data.get('is_abnormal', False),
                severity=data.get('severity'),
                created_by=current_user_id
            )
            
            db.session.add(vital_sign)
            db.session.commit()
            
            # Check for abnormal values and trigger alerts if necessary
            if vital_sign.is_abnormal:
                trigger_vital_sign_alert(vital_sign)
            
            return vital_sign, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error recording vital sign: {str(e)}')

@api.route('/<string:vital_sign_id>')
class VitalSignDetail(Resource):
    @jwt_required()
    @api.marshal_with(vital_sign_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Vital sign not found'
    })
    def get(self, vital_sign_id):
        """Get vital sign details"""
        current_user_id = get_jwt_identity()
        vital_sign = VitalSign.query.get_or_404(vital_sign_id)
        
        # Check access rights
        if not has_vital_sign_access(current_user_id, vital_sign.patient_id):
            api.abort(403, 'Permission denied')
        
        return vital_sign

    @jwt_required()
    @api.expect(vital_sign_model)
    @api.marshal_with(vital_sign_model)
    @api.doc(responses={
        200: 'Success',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Vital sign not found'
    })
    def put(self, vital_sign_id):
        """Update vital sign record"""
        current_user_id = get_jwt_identity()
        vital_sign = VitalSign.query.get_or_404(vital_sign_id)
        
        # Check access rights
        if not has_vital_sign_access(current_user_id, vital_sign.patient_id):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            # Update fields
            for field in ['value', 'unit', 'measurement_time', 'notes',
                         'is_abnormal', 'severity']:
                if field in data:
                    setattr(vital_sign, field, data[field])
            
            db.session.commit()
            
            # Check for abnormal values and trigger alerts if necessary
            if vital_sign.is_abnormal:
                trigger_vital_sign_alert(vital_sign)
            
            return vital_sign
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating vital sign: {str(e)}')

@api.route('/types')
class VitalSignTypes(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized'
    })
    def get(self):
        """Get list of vital sign types and their normal ranges"""
        vital_sign_types = {
            'blood_pressure': {
                'name': 'Blood Pressure',
                'units': 'mmHg',
                'normal_range': {
                    'systolic': {'min': 90, 'max': 120},
                    'diastolic': {'min': 60, 'max': 80}
                }
            },
            'heart_rate': {
                'name': 'Heart Rate',
                'units': 'bpm',
                'normal_range': {'min': 60, 'max': 100}
            },
            'temperature': {
                'name': 'Body Temperature',
                'units': '°C',
                'normal_range': {'min': 36.1, 'max': 37.2}
            },
            'respiratory_rate': {
                'name': 'Respiratory Rate',
                'units': 'breaths/min',
                'normal_range': {'min': 12, 'max': 20}
            },
            'oxygen_saturation': {
                'name': 'Oxygen Saturation',
                'units': '%',
                'normal_range': {'min': 95, 'max': 100}
            },
            'blood_glucose': {
                'name': 'Blood Glucose',
                'units': 'mg/dL',
                'normal_range': {
                    'fasting': {'min': 70, 'max': 100},
                    'post_meal': {'min': 70, 'max': 140}
                }
            }
        }
        return vital_sign_types

@api.route('/stats/<string:patient_id>')
class VitalSignStats(Resource):
    @jwt_required()
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Patient not found'
        },
        params={
            'measurement_type': 'Type of measurement',
            'start_date': 'Start date for statistics',
            'end_date': 'End date for statistics'
        }
    )
    def get(self, patient_id):
        """Get vital sign statistics for a patient"""
        current_user_id = get_jwt_identity()
        
        # Check access rights
        if not has_vital_sign_access(current_user_id, patient_id):
            api.abort(403, 'Permission denied')
        
        measurement_type = request.args.get('measurement_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = VitalSign.query.filter_by(patient_id=patient_id)
        
        if measurement_type:
            query = query.filter_by(measurement_type=measurement_type)
        if start_date:
            query = query.filter(VitalSign.measurement_time >= start_date)
        if end_date:
            query = query.filter(VitalSign.measurement_time <= end_date)
        
        measurements = query.all()
        
        if not measurements:
            return {
                'message': 'No vital sign measurements found for the specified criteria'
            }
        
        # Calculate statistics
        values = [m.value for m in measurements]
        stats = {
            'count': len(values),
            'average': sum(values) / len(values),
            'min': min(values),
            'max': max(values),
            'latest': measurements[0].value,
            'latest_time': measurements[0].measurement_time.isoformat(),
            'abnormal_count': len([m for m in measurements if m.is_abnormal])
        }
        
        return stats

def has_vital_sign_access(user_id, patient_id):
    """Check if user has access to vital signs"""
    user = User.query.get(user_id)
    
    if user.user_type == 'admin':
        return True
    
    if user.user_type == 'patient':
        patient = Patient.query.filter_by(user_id=user_id).first()
        return str(patient.id) == str(patient_id)
    
    if user.user_type == 'professional':
        # Professionals can access vitals of their patients
        # This could be enhanced with more sophisticated access control
        return True
    
    return False

def trigger_vital_sign_alert(vital_sign):
    """Trigger alerts for abnormal vital signs"""
    # Implementation for alert system
    pass
