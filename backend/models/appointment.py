from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'), nullable=False)
    appointment_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Enum('scheduled', 'confirmed', 'completed', 'cancelled', name='appointment_status'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    consultation_type = db.Column(db.Enum('in-person', 'video', 'phone', name='consultation_type'), nullable=False)
    cancellation_reason = db.Column(db.Text)
    follow_up_required = db.Column(db.Boolean, default=False)

    def __init__(self, patient_id, professional_id, appointment_type, start_time, end_time,
                 consultation_type, notes=None):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.professional_id = professional_id
        self.appointment_type = appointment_type
        self.status = 'scheduled'
        self.start_time = start_time
        self.end_time = end_time
        self.consultation_type = consultation_type
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'professional_id': str(self.professional_id),
            'appointment_type': self.appointment_type,
            'status': self.status,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'notes': self.notes,
            'consultation_type': self.consultation_type,
            'cancellation_reason': self.cancellation_reason,
            'follow_up_required': self.follow_up_required,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def cancel(self, reason):
        """Cancel the appointment with a reason"""
        self.status = 'cancelled'
        self.cancellation_reason = reason
        self.updated_at = datetime.utcnow()

    def confirm(self):
        """Confirm the appointment"""
        self.status = 'confirmed'
        self.updated_at = datetime.utcnow()

    def complete(self, follow_up_required=False):
        """Mark the appointment as completed"""
        self.status = 'completed'
        self.follow_up_required = follow_up_required
        self.updated_at = datetime.utcnow()
