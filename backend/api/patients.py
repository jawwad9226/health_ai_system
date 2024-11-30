from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.patient import Patient
from models.vital_sign import VitalSign
from models.medical_record import MedicalRecord
from models.prescription import Prescription
from models.appointment import Appointment
from utils.decorators import patient_required, professional_required
from utils.pagination import paginate
from datetime import datetime

api = Namespace('patients', description='Patient operations')

# Models
address_model = api.model('Address', {
    'street': fields.String(description='Street address'),
    'city': fields.String(description='City'),
    'state': fields.String(description='State'),
    'postal_code': fields.String(description='Postal code'),
    'country': fields.String(description='Country')
})

emergency_contact_model = api.model('EmergencyContact', {
    'name': fields.String(required=True, description='Contact name'),
    'relationship': fields.String(required=True, description='Relationship to patient'),
    'phone': fields.String(required=True, description='Contact phone number'),
    'email': fields.String(description='Contact email'),
    'is_primary': fields.Boolean(description='Primary contact flag')
})

insurance_model = api.model('Insurance', {
    'provider': fields.String(required=True, description='Insurance provider'),
    'policy_number': fields.String(required=True, description='Policy number'),
    'group_number': fields.String(description='Group number'),
    'expiration_date': fields.Date(description='Policy expiration date'),
    'coverage_type': fields.String(description='Type of coverage')
})

patient_model = api.model('Patient', {
    'id': fields.String(description='Patient ID'),
    'user_id': fields.String(description='Associated user ID'),
    'date_of_birth': fields.Date(required=True, description='Date of birth'),
    'gender': fields.String(required=True, description='Gender'),
    'blood_type': fields.String(description='Blood type'),
    'height': fields.Float(description='Height in cm'),
    'weight': fields.Float(description='Weight in kg'),
    'allergies': fields.List(fields.String, description='List of allergies'),
    'chronic_conditions': fields.List(fields.String, description='Chronic conditions'),
    'current_medications': fields.List(fields.String, description='Current medications'),
    'address': fields.Nested(address_model),
    'emergency_contacts': fields.List(fields.Nested(emergency_contact_model)),
    'insurance': fields.Nested(insurance_model),
    'preferred_language': fields.String(description='Preferred language'),
    'created_at': fields.DateTime(description='Account creation date'),
    'updated_at': fields.DateTime(description='Last update date')
})

patient_create_model = api.clone('PatientCreate', patient_model, {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'first_name': fields.String(required=True, description='First name'),
    'last_name': fields.String(required=True, description='Last name')
})

@api.route('')
class PatientList(Resource):
    @jwt_required()
    @professional_required
    @api.marshal_list_with(patient_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'search': 'Search term',
            'sort': 'Sort field',
            'order': 'Sort order (asc/desc)'
        }
    )
    def get(self):
        """Get list of patients (professionals only)"""
        search = request.args.get('search', '')
        sort = request.args.get('sort', 'created_at')
        order = request.args.get('order', 'desc')
        
        query = Patient.query
        
        if search:
            query = query.join(User).filter(
                (User.first_name.ilike(f'%{search}%')) |
                (User.last_name.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
        
        # Apply sorting
        if hasattr(Patient, sort):
            sort_field = getattr(Patient, sort)
            if order == 'desc':
                sort_field = sort_field.desc()
            query = query.order_by(sort_field)
        
        return paginate(query)

    @api.expect(patient_create_model)
    @api.marshal_with(patient_model)
    @api.doc(responses={
        201: 'Patient created',
        400: 'Validation error',
        409: 'Email already exists'
    })
    def post(self):
        """Create new patient"""
        data = request.get_json()
        
        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            api.abort(409, 'Email already exists')
        
        try:
            # Create user account
            user = User(
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                user_type='patient'
            )
            user.set_password(data['password'])
            db.session.add(user)
            
            # Create patient profile
            patient = Patient(
                user_id=user.id,
                date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
                gender=data['gender'],
                blood_type=data.get('blood_type'),
                height=data.get('height'),
                weight=data.get('weight'),
                allergies=data.get('allergies', []),
                chronic_conditions=data.get('chronic_conditions', []),
                current_medications=data.get('current_medications', []),
                address=data.get('address'),
                emergency_contacts=data.get('emergency_contacts', []),
                insurance=data.get('insurance'),
                preferred_language=data.get('preferred_language')
            )
            db.session.add(patient)
            db.session.commit()
            
            return patient, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating patient: {str(e)}')

@api.route('/<string:patient_id>')
class PatientDetail(Resource):
    @jwt_required()
    @api.marshal_with(patient_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def get(self, patient_id):
        """Get patient details"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type in ['professional', 'admin']):
            api.abort(403, 'Permission denied')
        
        return patient

    @jwt_required()
    @api.expect(patient_model)
    @api.marshal_with(patient_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def put(self, patient_id):
        """Update patient details"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type == 'admin'):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            # Update fields
            for field in ['blood_type', 'height', 'weight', 'allergies',
                         'chronic_conditions', 'current_medications', 'address',
                         'emergency_contacts', 'insurance', 'preferred_language']:
                if field in data:
                    setattr(patient, field, data[field])
            
            db.session.commit()
            return patient
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating patient: {str(e)}')

@api.route('/<string:patient_id>/vital-signs')
class PatientVitalSigns(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def get(self, patient_id):
        """Get patient's vital signs"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type in ['professional', 'admin']):
            api.abort(403, 'Permission denied')
        
        # Get query parameters for filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        vital_type = request.args.get('type')
        
        query = VitalSign.query.filter_by(patient_id=patient_id)
        
        if start_date:
            query = query.filter(VitalSign.measured_at >= start_date)
        if end_date:
            query = query.filter(VitalSign.measured_at <= end_date)
        if vital_type:
            query = query.filter(VitalSign.vital_type == vital_type)
        
        return paginate(query.order_by(VitalSign.measured_at.desc()))

@api.route('/<string:patient_id>/medical-records')
class PatientMedicalRecords(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def get(self, patient_id):
        """Get patient's medical records"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type in ['professional', 'admin']):
            api.abort(403, 'Permission denied')
        
        query = MedicalRecord.query.filter_by(patient_id=patient_id)
        return paginate(query.order_by(MedicalRecord.record_date.desc()))

@api.route('/<string:patient_id>/prescriptions')
class PatientPrescriptions(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def get(self, patient_id):
        """Get patient's prescriptions"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type in ['professional', 'admin']):
            api.abort(403, 'Permission denied')
        
        # Get active/all prescriptions
        active_only = request.args.get('active', 'true').lower() == 'true'
        query = Prescription.query.filter_by(patient_id=patient_id)
        
        if active_only:
            query = query.filter_by(status='active')
        
        return paginate(query.order_by(Prescription.prescribed_at.desc()))

@api.route('/<string:patient_id>/appointments')
class PatientAppointments(Resource):
    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Patient not found'
    })
    def get(self, patient_id):
        """Get patient's appointments"""
        current_user_id = get_jwt_identity()
        patient = Patient.query.get_or_404(patient_id)
        
        # Check access rights
        if not (current_user_id == str(patient.user_id) or 
                current_user.user_type in ['professional', 'admin']):
            api.abort(403, 'Permission denied')
        
        # Get upcoming/past appointments
        upcoming = request.args.get('upcoming', 'true').lower() == 'true'
        query = Appointment.query.filter_by(patient_id=patient_id)
        
        if upcoming:
            query = query.filter(Appointment.scheduled_time >= datetime.utcnow())
        else:
            query = query.filter(Appointment.scheduled_time < datetime.utcnow())
        
        return paginate(query.order_by(Appointment.scheduled_time))
