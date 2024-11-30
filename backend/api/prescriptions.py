from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.prescription import Prescription, MedicationHistory
from models.patient import Patient
from models.professional import Professional
from utils.decorators import professional_required
from utils.pagination import paginate
from datetime import datetime, timedelta

api = Namespace('prescriptions', description='Prescription operations')

# Models
medication_history_model = api.model('MedicationHistory', {
    'id': fields.String(description='History ID'),
    'prescription_id': fields.String(description='Prescription ID'),
    'action_type': fields.String(description='Type of action'),
    'action_date': fields.DateTime(description='Date of action'),
    'notes': fields.String(description='Action notes'),
    'performed_by': fields.String(description='User who performed action')
})

prescription_model = api.model('Prescription', {
    'id': fields.String(description='Prescription ID'),
    'patient_id': fields.String(required=True, description='Patient ID'),
    'professional_id': fields.String(required=True, description='Professional ID'),
    'medication_name': fields.String(required=True, description='Medication name'),
    'dosage': fields.String(required=True, description='Dosage'),
    'frequency': fields.String(required=True, description='Frequency'),
    'duration': fields.Integer(description='Duration in days'),
    'start_date': fields.DateTime(required=True, description='Start date'),
    'end_date': fields.DateTime(description='End date'),
    'instructions': fields.String(description='Special instructions'),
    'reason': fields.String(description='Reason for prescription'),
    'status': fields.String(description='Prescription status'),
    'refills_allowed': fields.Integer(description='Number of refills allowed'),
    'refills_remaining': fields.Integer(description='Number of refills remaining'),
    'pharmacy_notes': fields.String(description='Notes for pharmacy'),
    'is_controlled_substance': fields.Boolean(description='Controlled substance flag'),
    'drug_allergies_checked': fields.Boolean(description='Drug allergies checked'),
    'interactions_checked': fields.Boolean(description='Drug interactions checked'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp'),
    'medication_history': fields.List(fields.Nested(medication_history_model))
})

@api.route('')
class PrescriptionList(Resource):
    @jwt_required()
    @api.marshal_list_with(prescription_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'status': 'Filter by status',
            'start_date': 'Filter by start date',
            'end_date': 'Filter by end date',
            'patient_id': 'Filter by patient',
            'professional_id': 'Filter by professional'
        }
    )
    def get(self):
        """Get list of prescriptions"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Build base query
        query = Prescription.query
        
        # Apply filters based on user type
        if current_user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=current_user_id).first()
            query = query.filter(Prescription.patient_id == patient.id)
        elif current_user.user_type == 'professional':
            professional = Professional.query.filter_by(user_id=current_user_id).first()
            query = query.filter(Prescription.professional_id == professional.id)
        
        # Apply additional filters
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        patient_id = request.args.get('patient_id')
        professional_id = request.args.get('professional_id')
        
        if status:
            query = query.filter(Prescription.status == status)
        if start_date:
            query = query.filter(Prescription.start_date >= start_date)
        if end_date:
            query = query.filter(Prescription.start_date <= end_date)
        if patient_id and current_user.user_type in ['professional', 'admin']:
            query = query.filter(Prescription.patient_id == patient_id)
        if professional_id and current_user.user_type == 'admin':
            query = query.filter(Prescription.professional_id == professional_id)
        
        return paginate(query.order_by(Prescription.created_at.desc()))

    @jwt_required()
    @professional_required
    @api.expect(prescription_model)
    @api.marshal_with(prescription_model)
    @api.doc(responses={
        201: 'Prescription created',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient or Professional not found'
    })
    def post(self):
        """Create new prescription"""
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Verify patient and professional
        patient = Patient.query.get_or_404(data['patient_id'])
        professional = Professional.query.get_or_404(data['professional_id'])
        
        try:
            prescription = Prescription(
                patient_id=data['patient_id'],
                professional_id=data['professional_id'],
                medication_name=data['medication_name'],
                dosage=data['dosage'],
                frequency=data['frequency'],
                duration=data.get('duration'),
                start_date=datetime.fromisoformat(data['start_date']),
                end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
                instructions=data.get('instructions'),
                reason=data.get('reason'),
                status='active',
                refills_allowed=data.get('refills_allowed', 0),
                refills_remaining=data.get('refills_allowed', 0),
                pharmacy_notes=data.get('pharmacy_notes'),
                is_controlled_substance=data.get('is_controlled_substance', False),
                drug_allergies_checked=data.get('drug_allergies_checked', False),
                interactions_checked=data.get('interactions_checked', False)
            )
            
            db.session.add(prescription)
            
            # Create initial medication history entry
            history = MedicationHistory(
                prescription_id=prescription.id,
                action_type='prescribed',
                action_date=datetime.utcnow(),
                notes='Initial prescription',
                performed_by=current_user_id
            )
            db.session.add(history)
            
            db.session.commit()
            
            return prescription, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating prescription: {str(e)}')

@api.route('/<string:prescription_id>')
class PrescriptionDetail(Resource):
    @jwt_required()
    @api.marshal_with(prescription_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Prescription not found'
    })
    def get(self, prescription_id):
        """Get prescription details"""
        current_user_id = get_jwt_identity()
        prescription = Prescription.query.get_or_404(prescription_id)
        
        # Check access rights
        if not has_prescription_access(current_user_id, prescription):
            api.abort(403, 'Permission denied')
        
        return prescription

    @jwt_required()
    @professional_required
    @api.expect(prescription_model)
    @api.marshal_with(prescription_model)
    @api.doc(responses={
        200: 'Success',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Prescription not found'
    })
    def put(self, prescription_id):
        """Update prescription details"""
        current_user_id = get_jwt_identity()
        prescription = Prescription.query.get_or_404(prescription_id)
        
        # Check access rights
        if not has_prescription_access(current_user_id, prescription):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            # Update fields
            for field in ['dosage', 'frequency', 'duration', 'end_date',
                         'instructions', 'reason', 'status', 'refills_allowed',
                         'refills_remaining', 'pharmacy_notes']:
                if field in data:
                    setattr(prescription, field, data[field])
            
            # Create medication history entry for update
            history = MedicationHistory(
                prescription_id=prescription.id,
                action_type='updated',
                action_date=datetime.utcnow(),
                notes='Prescription updated',
                performed_by=current_user_id
            )
            db.session.add(history)
            
            db.session.commit()
            return prescription
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating prescription: {str(e)}')

@api.route('/<string:prescription_id>/refill')
class PrescriptionRefill(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        400: 'No refills remaining',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Prescription not found'
    })
    def post(self, prescription_id):
        """Request prescription refill"""
        current_user_id = get_jwt_identity()
        prescription = Prescription.query.get_or_404(prescription_id)
        
        # Check access rights
        if not has_prescription_access(current_user_id, prescription):
            api.abort(403, 'Permission denied')
        
        if prescription.refills_remaining <= 0:
            api.abort(400, 'No refills remaining')
        
        try:
            prescription.refills_remaining -= 1
            
            # Create medication history entry for refill
            history = MedicationHistory(
                prescription_id=prescription.id,
                action_type='refilled',
                action_date=datetime.utcnow(),
                notes='Prescription refilled',
                performed_by=current_user_id
            )
            db.session.add(history)
            
            db.session.commit()
            return {'message': 'Prescription refilled successfully'}
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error processing refill: {str(e)}')

@api.route('/<string:prescription_id>/history')
class PrescriptionHistory(Resource):
    @jwt_required()
    @api.marshal_list_with(medication_history_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Prescription not found'
    })
    def get(self, prescription_id):
        """Get prescription history"""
        current_user_id = get_jwt_identity()
        prescription = Prescription.query.get_or_404(prescription_id)
        
        # Check access rights
        if not has_prescription_access(current_user_id, prescription):
            api.abort(403, 'Permission denied')
        
        history = MedicationHistory.query.filter_by(
            prescription_id=prescription_id
        ).order_by(MedicationHistory.action_date.desc()).all()
        
        return history

def has_prescription_access(user_id, prescription):
    """Check if user has access to prescription"""
    user = User.query.get(user_id)
    
    if user.user_type == 'admin':
        return True
    
    if user.user_type == 'patient':
        patient = Patient.query.filter_by(user_id=user_id).first()
        return str(prescription.patient_id) == str(patient.id)
    
    if user.user_type == 'professional':
        professional = Professional.query.filter_by(user_id=user_id).first()
        return str(prescription.professional_id) == str(professional.id)
    
    return False
