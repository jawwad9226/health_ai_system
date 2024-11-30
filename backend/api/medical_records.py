from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.medical_record import MedicalRecord, RelatedRecord
from models.patient import Patient
from models.document import Document
from utils.decorators import professional_required
from utils.pagination import paginate
from datetime import datetime

api = Namespace('medical-records', description='Medical record operations')

# Models
related_record_model = api.model('RelatedRecord', {
    'id': fields.String(description='Related record ID'),
    'record_id_1': fields.String(description='First record ID'),
    'record_id_2': fields.String(description='Second record ID'),
    'relationship_type': fields.String(description='Type of relationship'),
    'notes': fields.String(description='Relationship notes'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'created_by': fields.String(description='Creator ID')
})

medical_record_model = api.model('MedicalRecord', {
    'id': fields.String(description='Record ID'),
    'patient_id': fields.String(required=True, description='Patient ID'),
    'record_type': fields.String(required=True, description='Type of record'),
    'title': fields.String(required=True, description='Record title'),
    'description': fields.String(description='Record description'),
    'diagnosis': fields.Raw(description='Structured diagnosis data'),
    'symptoms': fields.List(fields.String, description='Symptoms'),
    'treatment_plan': fields.String(description='Treatment plan'),
    'icd_codes': fields.List(fields.String, description='ICD codes'),
    'procedure_codes': fields.List(fields.String, description='Procedure codes'),
    'lab_results': fields.Raw(description='Lab results data'),
    'vital_signs': fields.Raw(description='Vital signs data'),
    'record_date': fields.DateTime(required=True, description='Record date'),
    'facility': fields.String(description='Healthcare facility'),
    'department': fields.String(description='Department'),
    'provider_notes': fields.String(description='Provider notes'),
    'follow_up_required': fields.Boolean(description='Follow-up required'),
    'follow_up_date': fields.Date(description='Follow-up date'),
    'is_confidential': fields.Boolean(description='Confidentiality flag'),
    'access_level': fields.String(description='Access level'),
    'created_by': fields.String(description='Creator ID'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp'),
    'related_records': fields.List(fields.Nested(related_record_model))
})

@api.route('')
class MedicalRecordList(Resource):
    @jwt_required()
    @api.marshal_list_with(medical_record_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'patient_id': 'Filter by patient',
            'record_type': 'Filter by record type',
            'start_date': 'Filter by start date',
            'end_date': 'Filter by end date',
            'search': 'Search in title and description'
        }
    )
    def get(self):
        """Get list of medical records"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Build base query
        query = MedicalRecord.query
        
        # Apply filters based on user type
        if current_user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=current_user_id).first()
            query = query.filter(MedicalRecord.patient_id == patient.id)
        
        # Apply additional filters
        patient_id = request.args.get('patient_id')
        record_type = request.args.get('record_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        search = request.args.get('search')
        
        if patient_id and current_user.user_type in ['professional', 'admin']:
            query = query.filter(MedicalRecord.patient_id == patient_id)
        if record_type:
            query = query.filter(MedicalRecord.record_type == record_type)
        if start_date:
            query = query.filter(MedicalRecord.record_date >= start_date)
        if end_date:
            query = query.filter(MedicalRecord.record_date <= end_date)
        if search:
            query = query.filter(
                (MedicalRecord.title.ilike(f'%{search}%')) |
                (MedicalRecord.description.ilike(f'%{search}%'))
            )
        
        return paginate(query.order_by(MedicalRecord.record_date.desc()))

    @jwt_required()
    @professional_required
    @api.expect(medical_record_model)
    @api.marshal_with(medical_record_model)
    @api.doc(responses={
        201: 'Record created',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def post(self):
        """Create new medical record"""
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Verify patient exists
        patient = Patient.query.get_or_404(data['patient_id'])
        
        try:
            record = MedicalRecord(
                patient_id=data['patient_id'],
                record_type=data['record_type'],
                title=data['title'],
                description=data.get('description'),
                diagnosis=data.get('diagnosis'),
                symptoms=data.get('symptoms', []),
                treatment_plan=data.get('treatment_plan'),
                icd_codes=data.get('icd_codes', []),
                procedure_codes=data.get('procedure_codes', []),
                lab_results=data.get('lab_results'),
                vital_signs=data.get('vital_signs'),
                record_date=datetime.fromisoformat(data['record_date']),
                facility=data.get('facility'),
                department=data.get('department'),
                provider_notes=data.get('provider_notes'),
                follow_up_required=data.get('follow_up_required', False),
                follow_up_date=data.get('follow_up_date'),
                is_confidential=data.get('is_confidential', False),
                created_by=current_user_id
            )
            
            db.session.add(record)
            db.session.commit()
            
            return record, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating medical record: {str(e)}')

@api.route('/<string:record_id>')
class MedicalRecordDetail(Resource):
    @jwt_required()
    @api.marshal_with(medical_record_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Record not found'
    })
    def get(self, record_id):
        """Get medical record details"""
        current_user_id = get_jwt_identity()
        record = MedicalRecord.query.get_or_404(record_id)
        
        # Check access rights
        if not has_record_access(current_user_id, record):
            api.abort(403, 'Permission denied')
        
        return record

    @jwt_required()
    @professional_required
    @api.expect(medical_record_model)
    @api.marshal_with(medical_record_model)
    @api.doc(responses={
        200: 'Success',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Record not found'
    })
    def put(self, record_id):
        """Update medical record"""
        current_user_id = get_jwt_identity()
        record = MedicalRecord.query.get_or_404(record_id)
        
        # Check access rights
        if not has_record_access(current_user_id, record):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            # Update fields
            for field in ['title', 'description', 'diagnosis', 'symptoms',
                         'treatment_plan', 'icd_codes', 'procedure_codes',
                         'lab_results', 'vital_signs', 'facility', 'department',
                         'provider_notes', 'follow_up_required', 'follow_up_date',
                         'is_confidential']:
                if field in data:
                    setattr(record, field, data[field])
            
            db.session.commit()
            return record
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating medical record: {str(e)}')

@api.route('/<string:record_id>/documents')
class MedicalRecordDocuments(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Record not found'
    })
    def get(self, record_id):
        """Get documents attached to medical record"""
        current_user_id = get_jwt_identity()
        record = MedicalRecord.query.get_or_404(record_id)
        
        # Check access rights
        if not has_record_access(current_user_id, record):
            api.abort(403, 'Permission denied')
        
        documents = Document.query.filter_by(record_id=record_id).all()
        return {'documents': [doc.to_dict() for doc in documents]}

@api.route('/<string:record_id>/related')
class RelatedRecords(Resource):
    @jwt_required()
    @api.marshal_list_with(related_record_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Record not found'
    })
    def get(self, record_id):
        """Get related records"""
        current_user_id = get_jwt_identity()
        record = MedicalRecord.query.get_or_404(record_id)
        
        # Check access rights
        if not has_record_access(current_user_id, record):
            api.abort(403, 'Permission denied')
        
        related = RelatedRecord.query.filter(
            (RelatedRecord.record_id_1 == record_id) |
            (RelatedRecord.record_id_2 == record_id)
        ).all()
        
        return related

    @jwt_required()
    @professional_required
    @api.expect(related_record_model)
    @api.marshal_with(related_record_model)
    @api.doc(responses={
        201: 'Relationship created',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Record not found'
    })
    def post(self, record_id):
        """Create record relationship"""
        current_user_id = get_jwt_identity()
        record = MedicalRecord.query.get_or_404(record_id)
        
        data = request.get_json()
        
        try:
            related = RelatedRecord(
                record_id_1=record_id,
                record_id_2=data['record_id_2'],
                relationship_type=data['relationship_type'],
                notes=data.get('notes'),
                created_by=current_user_id
            )
            
            db.session.add(related)
            db.session.commit()
            
            return related, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating relationship: {str(e)}')

def has_record_access(user_id, record):
    """Check if user has access to medical record"""
    user = User.query.get(user_id)
    
    if user.user_type == 'admin':
        return True
    
    if user.user_type == 'patient':
        patient = Patient.query.filter_by(user_id=user_id).first()
        return str(record.patient_id) == str(patient.id)
    
    if user.user_type == 'professional':
        # Professionals can access records of their patients
        # This could be enhanced with more sophisticated access control
        return True
    
    return False
