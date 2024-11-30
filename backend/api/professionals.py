from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.professional import Professional
from models.appointment import Appointment
from models.patient import Patient
from utils.decorators import professional_required, admin_required
from utils.pagination import paginate
from datetime import datetime, timedelta

api = Namespace('professionals', description='Healthcare professional operations')

# Models
specialty_model = api.model('Specialty', {
    'name': fields.String(required=True, description='Specialty name'),
    'certification': fields.String(description='Certification details'),
    'certification_date': fields.Date(description='Date of certification')
})

license_model = api.model('License', {
    'number': fields.String(required=True, description='License number'),
    'type': fields.String(required=True, description='License type'),
    'issuing_authority': fields.String(required=True, description='Issuing authority'),
    'issue_date': fields.Date(required=True, description='Issue date'),
    'expiry_date': fields.Date(required=True, description='Expiry date'),
    'status': fields.String(required=True, description='License status')
})

availability_model = api.model('Availability', {
    'day_of_week': fields.Integer(required=True, description='Day of week (0-6)'),
    'start_time': fields.String(required=True, description='Start time (HH:MM)'),
    'end_time': fields.String(required=True, description='End time (HH:MM)'),
    'is_available': fields.Boolean(description='Availability status')
})

professional_model = api.model('Professional', {
    'id': fields.String(description='Professional ID'),
    'user_id': fields.String(description='Associated user ID'),
    'title': fields.String(required=True, description='Professional title (Dr., Prof., etc.)'),
    'specialties': fields.List(fields.Nested(specialty_model)),
    'licenses': fields.List(fields.Nested(license_model)),
    'practice_location': fields.String(description='Primary practice location'),
    'consultation_fee': fields.Float(description='Consultation fee'),
    'years_of_experience': fields.Integer(description='Years of experience'),
    'education': fields.List(fields.String, description='Educational background'),
    'languages': fields.List(fields.String, description='Languages spoken'),
    'availability': fields.List(fields.Nested(availability_model)),
    'is_accepting_patients': fields.Boolean(description='Accepting new patients'),
    'rating': fields.Float(description='Average rating'),
    'total_consultations': fields.Integer(description='Total consultations'),
    'created_at': fields.DateTime(description='Account creation date'),
    'updated_at': fields.DateTime(description='Last update date')
})

professional_create_model = api.clone('ProfessionalCreate', professional_model, {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'first_name': fields.String(required=True, description='First name'),
    'last_name': fields.String(required=True, description='Last name')
})

@api.route('')
class ProfessionalList(Resource):
    @jwt_required()
    @api.marshal_list_with(professional_model)
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'search': 'Search term',
            'specialty': 'Filter by specialty',
            'language': 'Filter by language',
            'accepting_patients': 'Filter by accepting patients status'
        }
    )
    def get(self):
        """Get list of healthcare professionals"""
        search = request.args.get('search', '')
        specialty = request.args.get('specialty', '')
        language = request.args.get('language', '')
        accepting_patients = request.args.get('accepting_patients')
        
        query = Professional.query
        
        if search:
            query = query.join(User).filter(
                (User.first_name.ilike(f'%{search}%')) |
                (User.last_name.ilike(f'%{search}%'))
            )
        
        if specialty:
            query = query.filter(Professional.specialties.any(name=specialty))
        
        if language:
            query = query.filter(Professional.languages.contains([language]))
        
        if accepting_patients is not None:
            query = query.filter(Professional.is_accepting_patients == (accepting_patients.lower() == 'true'))
        
        return paginate(query.order_by(Professional.rating.desc()))

    @api.expect(professional_create_model)
    @api.marshal_with(professional_model)
    @api.doc(responses={
        201: 'Professional created',
        400: 'Validation error',
        409: 'Email already exists'
    })
    def post(self):
        """Create new healthcare professional"""
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
                user_type='professional'
            )
            user.set_password(data['password'])
            db.session.add(user)
            
            # Create professional profile
            professional = Professional(
                user_id=user.id,
                title=data['title'],
                specialties=data.get('specialties', []),
                licenses=data.get('licenses', []),
                practice_location=data.get('practice_location'),
                consultation_fee=data.get('consultation_fee'),
                years_of_experience=data.get('years_of_experience'),
                education=data.get('education', []),
                languages=data.get('languages', []),
                availability=data.get('availability', []),
                is_accepting_patients=data.get('is_accepting_patients', True)
            )
            db.session.add(professional)
            db.session.commit()
            
            return professional, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating professional: {str(e)}')

@api.route('/<string:professional_id>')
class ProfessionalDetail(Resource):
    @jwt_required()
    @api.marshal_with(professional_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        404: 'Professional not found'
    })
    def get(self, professional_id):
        """Get professional details"""
        return Professional.query.get_or_404(professional_id)

    @jwt_required()
    @professional_required
    @api.expect(professional_model)
    @api.marshal_with(professional_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Professional not found'
    })
    def put(self, professional_id):
        """Update professional details"""
        current_user_id = get_jwt_identity()
        professional = Professional.query.get_or_404(professional_id)
        
        # Check if current user is the professional
        if str(professional.user_id) != current_user_id:
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            # Update fields
            for field in ['title', 'specialties', 'licenses', 'practice_location',
                         'consultation_fee', 'years_of_experience', 'education',
                         'languages', 'availability', 'is_accepting_patients']:
                if field in data:
                    setattr(professional, field, data[field])
            
            db.session.commit()
            return professional
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating professional: {str(e)}')

@api.route('/<string:professional_id>/schedule')
class ProfessionalSchedule(Resource):
    @jwt_required()
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            404: 'Professional not found'
        },
        params={
            'start_date': 'Start date (YYYY-MM-DD)',
            'end_date': 'End date (YYYY-MM-DD)'
        }
    )
    def get(self, professional_id):
        """Get professional's schedule"""
        professional = Professional.query.get_or_404(professional_id)
        
        # Get date range from query parameters
        start_date = request.args.get('start_date', datetime.utcnow().date().isoformat())
        end_date = request.args.get('end_date', (datetime.utcnow() + timedelta(days=30)).date().isoformat())
        
        # Get appointments within date range
        appointments = Appointment.query.filter(
            Appointment.professional_id == professional_id,
            Appointment.scheduled_time.between(start_date, end_date)
        ).order_by(Appointment.scheduled_time).all()
        
        # Combine availability and appointments
        schedule = []
        current_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        while current_date <= end:
            day_schedule = {
                'date': current_date.isoformat(),
                'availability': next(
                    (a for a in professional.availability if a['day_of_week'] == current_date.weekday()),
                    {'is_available': False}
                ),
                'appointments': [
                    a.to_dict() for a in appointments
                    if a.scheduled_time.date() == current_date
                ]
            }
            schedule.append(day_schedule)
            current_date += timedelta(days=1)
        
        return {'schedule': schedule}

@api.route('/<string:professional_id>/patients')
class ProfessionalPatients(Resource):
    @jwt_required()
    @professional_required
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Professional not found'
        },
        params={
            'page': 'Page number',
            'per_page': 'Items per page',
            'search': 'Search term'
        }
    )
    def get(self, professional_id):
        """Get professional's patients"""
        current_user_id = get_jwt_identity()
        professional = Professional.query.get_or_404(professional_id)
        
        # Check if current user is the professional
        if str(professional.user_id) != current_user_id:
            api.abort(403, 'Permission denied')
        
        # Get unique patients from appointments
        patient_ids = db.session.query(Appointment.patient_id).filter(
            Appointment.professional_id == professional_id
        ).distinct().all()
        
        patient_ids = [p[0] for p in patient_ids]
        
        # Get patients with search
        search = request.args.get('search', '')
        query = Patient.query.filter(Patient.id.in_(patient_ids))
        
        if search:
            query = query.join(User).filter(
                (User.first_name.ilike(f'%{search}%')) |
                (User.last_name.ilike(f'%{search}%'))
            )
        
        return paginate(query)

@api.route('/<string:professional_id>/availability')
class ProfessionalAvailability(Resource):
    @jwt_required()
    @professional_required
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Professional not found'
    })
    def put(self, professional_id):
        """Update professional's availability"""
        current_user_id = get_jwt_identity()
        professional = Professional.query.get_or_404(professional_id)
        
        # Check if current user is the professional
        if str(professional.user_id) != current_user_id:
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        try:
            professional.availability = data['availability']
            db.session.commit()
            return {'message': 'Availability updated successfully'}
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating availability: {str(e)}')
