from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.appointment import Appointment
from models.professional import Professional
from models.patient import Patient
from utils.decorators import professional_required
from utils.pagination import paginate
from datetime import datetime, timedelta

api = Namespace('appointments', description='Appointment operations')

# Models
appointment_model = api.model('Appointment', {
    'id': fields.String(description='Appointment ID'),
    'patient_id': fields.String(required=True, description='Patient ID'),
    'professional_id': fields.String(required=True, description='Professional ID'),
    'appointment_type': fields.String(required=True, description='Type of appointment'),
    'scheduled_time': fields.DateTime(required=True, description='Scheduled time'),
    'duration': fields.Integer(required=True, description='Duration in minutes'),
    'status': fields.String(description='Appointment status'),
    'consultation_method': fields.String(required=True, description='In-person/Video/Phone'),
    'reason': fields.String(description='Reason for appointment'),
    'notes': fields.String(description='Additional notes'),
    'symptoms': fields.List(fields.String, description='Patient symptoms'),
    'priority': fields.String(description='Appointment priority'),
    'follow_up': fields.Boolean(description='Follow-up appointment'),
    'previous_appointment_id': fields.String(description='Previous appointment ID'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp')
})

appointment_create_model = api.clone('AppointmentCreate', appointment_model)
appointment_update_model = api.clone('AppointmentUpdate', appointment_model)

@api.route('')
class AppointmentList(Resource):
    @jwt_required()
    @api.marshal_list_with(appointment_model)
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
            'professional_id': 'Filter by professional',
            'patient_id': 'Filter by patient'
        }
    )
    def get(self):
        """Get list of appointments"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Build base query
        query = Appointment.query
        
        # Apply filters based on user type
        if current_user.user_type == 'patient':
            query = query.filter(Appointment.patient_id == Patient.query.filter_by(user_id=current_user_id).first().id)
        elif current_user.user_type == 'professional':
            query = query.filter(Appointment.professional_id == Professional.query.filter_by(user_id=current_user_id).first().id)
        
        # Apply additional filters
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        professional_id = request.args.get('professional_id')
        patient_id = request.args.get('patient_id')
        
        if status:
            query = query.filter(Appointment.status == status)
        if start_date:
            query = query.filter(Appointment.scheduled_time >= start_date)
        if end_date:
            query = query.filter(Appointment.scheduled_time <= end_date)
        if professional_id and current_user.user_type == 'admin':
            query = query.filter(Appointment.professional_id == professional_id)
        if patient_id and current_user.user_type in ['professional', 'admin']:
            query = query.filter(Appointment.patient_id == patient_id)
        
        return paginate(query.order_by(Appointment.scheduled_time))

    @jwt_required()
    @api.expect(appointment_create_model)
    @api.marshal_with(appointment_model)
    @api.doc(responses={
        201: 'Appointment created',
        400: 'Validation error',
        404: 'Patient or Professional not found',
        409: 'Schedule conflict'
    })
    def post(self):
        """Create new appointment"""
        data = request.get_json()
        
        # Verify patient and professional
        patient = Patient.query.get_or_404(data['patient_id'])
        professional = Professional.query.get_or_404(data['professional_id'])
        
        # Check for schedule conflicts
        scheduled_time = datetime.fromisoformat(data['scheduled_time'])
        end_time = scheduled_time + timedelta(minutes=data['duration'])
        
        conflicts = Appointment.query.filter(
            Appointment.professional_id == data['professional_id'],
            Appointment.status != 'cancelled',
            Appointment.scheduled_time < end_time,
            (Appointment.scheduled_time + timedelta(minutes=Appointment.duration)) > scheduled_time
        ).first()
        
        if conflicts:
            api.abort(409, 'Schedule conflict with existing appointment')
        
        try:
            appointment = Appointment(
                patient_id=data['patient_id'],
                professional_id=data['professional_id'],
                appointment_type=data['appointment_type'],
                scheduled_time=scheduled_time,
                duration=data['duration'],
                consultation_method=data['consultation_method'],
                reason=data.get('reason'),
                notes=data.get('notes'),
                symptoms=data.get('symptoms', []),
                priority=data.get('priority', 'normal'),
                follow_up=data.get('follow_up', False),
                previous_appointment_id=data.get('previous_appointment_id')
            )
            
            db.session.add(appointment)
            db.session.commit()
            
            # Send notifications
            notify_appointment_created(appointment)
            
            return appointment, 201
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error creating appointment: {str(e)}')

@api.route('/<string:appointment_id>')
class AppointmentDetail(Resource):
    @jwt_required()
    @api.marshal_with(appointment_model)
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Appointment not found'
    })
    def get(self, appointment_id):
        """Get appointment details"""
        current_user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check access rights
        if not has_appointment_access(current_user_id, appointment):
            api.abort(403, 'Permission denied')
        
        return appointment

    @jwt_required()
    @api.expect(appointment_update_model)
    @api.marshal_with(appointment_model)
    @api.doc(responses={
        200: 'Success',
        400: 'Validation error',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Appointment not found',
        409: 'Schedule conflict'
    })
    def put(self, appointment_id):
        """Update appointment details"""
        current_user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check access rights
        if not has_appointment_access(current_user_id, appointment):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        
        # Check for schedule conflicts if time is being updated
        if 'scheduled_time' in data or 'duration' in data:
            scheduled_time = datetime.fromisoformat(data.get('scheduled_time', appointment.scheduled_time.isoformat()))
            duration = data.get('duration', appointment.duration)
            end_time = scheduled_time + timedelta(minutes=duration)
            
            conflicts = Appointment.query.filter(
                Appointment.id != appointment_id,
                Appointment.professional_id == appointment.professional_id,
                Appointment.status != 'cancelled',
                Appointment.scheduled_time < end_time,
                (Appointment.scheduled_time + timedelta(minutes=Appointment.duration)) > scheduled_time
            ).first()
            
            if conflicts:
                api.abort(409, 'Schedule conflict with existing appointment')
        
        try:
            # Update fields
            for field in ['scheduled_time', 'duration', 'status', 'consultation_method',
                         'reason', 'notes', 'symptoms', 'priority']:
                if field in data:
                    setattr(appointment, field, data[field])
            
            db.session.commit()
            
            # Send notifications
            notify_appointment_updated(appointment)
            
            return appointment
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error updating appointment: {str(e)}')

    @jwt_required()
    @api.doc(responses={
        200: 'Success',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Appointment not found'
    })
    def delete(self, appointment_id):
        """Cancel appointment"""
        current_user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check access rights
        if not has_appointment_access(current_user_id, appointment):
            api.abort(403, 'Permission denied')
        
        try:
            appointment.status = 'cancelled'
            db.session.commit()
            
            # Send notifications
            notify_appointment_cancelled(appointment)
            
            return {'message': 'Appointment cancelled successfully'}
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error cancelling appointment: {str(e)}')

@api.route('/<string:appointment_id>/reschedule')
class AppointmentReschedule(Resource):
    @jwt_required()
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Appointment not found',
            409: 'Schedule conflict'
        }
    )
    def post(self, appointment_id):
        """Reschedule appointment"""
        current_user_id = get_jwt_identity()
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check access rights
        if not has_appointment_access(current_user_id, appointment):
            api.abort(403, 'Permission denied')
        
        data = request.get_json()
        new_time = datetime.fromisoformat(data['scheduled_time'])
        
        # Check for schedule conflicts
        end_time = new_time + timedelta(minutes=appointment.duration)
        conflicts = Appointment.query.filter(
            Appointment.id != appointment_id,
            Appointment.professional_id == appointment.professional_id,
            Appointment.status != 'cancelled',
            Appointment.scheduled_time < end_time,
            (Appointment.scheduled_time + timedelta(minutes=Appointment.duration)) > new_time
        ).first()
        
        if conflicts:
            api.abort(409, 'Schedule conflict with existing appointment')
        
        try:
            appointment.scheduled_time = new_time
            appointment.status = 'rescheduled'
            db.session.commit()
            
            # Send notifications
            notify_appointment_rescheduled(appointment)
            
            return {'message': 'Appointment rescheduled successfully'}
            
        except Exception as e:
            db.session.rollback()
            api.abort(400, f'Error rescheduling appointment: {str(e)}')

def has_appointment_access(user_id, appointment):
    """Check if user has access to appointment"""
    user = User.query.get(user_id)
    
    if user.user_type == 'admin':
        return True
    
    if user.user_type == 'patient':
        patient = Patient.query.filter_by(user_id=user_id).first()
        return str(appointment.patient_id) == str(patient.id)
    
    if user.user_type == 'professional':
        professional = Professional.query.filter_by(user_id=user_id).first()
        return str(appointment.professional_id) == str(professional.id)
    
    return False

def notify_appointment_created(appointment):
    """Send notifications for new appointment"""
    # Implementation for sending notifications
    pass

def notify_appointment_updated(appointment):
    """Send notifications for updated appointment"""
    # Implementation for sending notifications
    pass

def notify_appointment_cancelled(appointment):
    """Send notifications for cancelled appointment"""
    # Implementation for sending notifications
    pass

def notify_appointment_rescheduled(appointment):
    """Send notifications for rescheduled appointment"""
    # Implementation for sending notifications
    pass
