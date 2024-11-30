from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class EmergencyAlert(db.Model):
    __tablename__ = 'emergency_alerts'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    
    # Alert details
    alert_type = db.Column(
        db.Enum(
            'medical', 'fall', 'medication', 'mental_health', 'cardiac',
            'respiratory', 'injury', 'other',
            name='emergency_types'
        ),
        nullable=False
    )
    severity = db.Column(
        db.Enum('low', 'medium', 'high', 'critical', name='alert_severity'),
        nullable=False,
        default='high'
    )
    status = db.Column(
        db.Enum(
            'active', 'responded', 'resolved', 'cancelled', 'false_alarm',
            name='alert_status'
        ),
        nullable=False,
        default='active'
    )
    
    # Location information
    location_latitude = db.Column(db.Numeric(10, 8))
    location_longitude = db.Column(db.Numeric(11, 8))
    location_accuracy = db.Column(db.Float)  # in meters
    location_address = db.Column(db.String(255))
    indoor_location = db.Column(db.String(100))  # e.g., "Room 302", "Third Floor"
    
    # Alert details
    description = db.Column(db.Text, nullable=False)
    vital_signs = db.Column(JSONB)  # Current vital signs if available
    symptoms = db.Column(db.ARRAY(db.String))
    medical_conditions = db.Column(db.ARRAY(db.String))  # Relevant conditions
    current_medications = db.Column(JSONB)  # Current medications
    
    # Response tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    response_time = db.Column(db.Interval)  # Time taken to respond
    responded_by = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'))
    resolution_notes = db.Column(db.Text)
    
    # Follow-up
    follow_up_required = db.Column(db.Boolean, default=False)
    follow_up_date = db.Column(db.DateTime)
    follow_up_notes = db.Column(db.Text)
    
    # Relationships
    responses = db.relationship('EmergencyResponse', backref='alert', lazy=True)
    notifications = db.relationship('EmergencyNotification', backref='alert', lazy=True)

    def __init__(self, patient_id, alert_type, description, severity='high',
                 location_latitude=None, location_longitude=None,
                 location_accuracy=None, location_address=None,
                 indoor_location=None, vital_signs=None, symptoms=None,
                 medical_conditions=None, current_medications=None):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.alert_type = alert_type
        self.description = description
        self.severity = severity
        self.location_latitude = location_latitude
        self.location_longitude = location_longitude
        self.location_accuracy = location_accuracy
        self.location_address = location_address
        self.indoor_location = indoor_location
        self.vital_signs = vital_signs
        self.symptoms = symptoms or []
        self.medical_conditions = medical_conditions or []
        self.current_medications = current_medications

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'alert_type': self.alert_type,
            'severity': self.severity,
            'status': self.status,
            'location': {
                'latitude': float(self.location_latitude) if self.location_latitude else None,
                'longitude': float(self.location_longitude) if self.location_longitude else None,
                'accuracy': self.location_accuracy,
                'address': self.location_address,
                'indoor_location': self.indoor_location
            },
            'description': self.description,
            'vital_signs': self.vital_signs,
            'symptoms': self.symptoms,
            'medical_conditions': self.medical_conditions,
            'current_medications': self.current_medications,
            'created_at': self.created_at.isoformat(),
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'response_time': str(self.response_time) if self.response_time else None,
            'responded_by': str(self.responded_by) if self.responded_by else None,
            'resolution_notes': self.resolution_notes,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'follow_up_notes': self.follow_up_notes
        }

    def respond(self, professional_id):
        """Mark alert as responded"""
        self.status = 'responded'
        self.responded_at = datetime.utcnow()
        self.responded_by = professional_id
        self.response_time = self.responded_at - self.created_at

    def resolve(self, notes=None, follow_up_required=False, follow_up_date=None,
               follow_up_notes=None):
        """Mark alert as resolved"""
        self.status = 'resolved'
        self.resolved_at = datetime.utcnow()
        self.resolution_notes = notes
        self.follow_up_required = follow_up_required
        self.follow_up_date = follow_up_date
        self.follow_up_notes = follow_up_notes

    def cancel(self, reason):
        """Cancel the alert"""
        self.status = 'cancelled'
        self.resolution_notes = reason
        self.resolved_at = datetime.utcnow()

    def mark_false_alarm(self, reason):
        """Mark alert as false alarm"""
        self.status = 'false_alarm'
        self.resolution_notes = reason
        self.resolved_at = datetime.utcnow()

class EmergencyResponse(db.Model):
    """Track individual responses to emergency alerts"""
    __tablename__ = 'emergency_responses'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = db.Column(UUID(as_uuid=True), db.ForeignKey('emergency_alerts.id'), nullable=False)
    responder_id = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'), nullable=False)
    response_type = db.Column(
        db.Enum('initial', 'follow_up', 'consultation', 'handover', name='response_types'),
        nullable=False
    )
    action_taken = db.Column(db.Text, nullable=False)
    response_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    location_latitude = db.Column(db.Numeric(10, 8))
    location_longitude = db.Column(db.Numeric(11, 8))
    notes = db.Column(db.Text)

    def __init__(self, alert_id, responder_id, response_type, action_taken,
                 location_latitude=None, location_longitude=None, notes=None):
        self.id = uuid.uuid4()
        self.alert_id = alert_id
        self.responder_id = responder_id
        self.response_type = response_type
        self.action_taken = action_taken
        self.location_latitude = location_latitude
        self.location_longitude = location_longitude
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'alert_id': str(self.alert_id),
            'responder_id': str(self.responder_id),
            'response_type': self.response_type,
            'action_taken': self.action_taken,
            'response_time': self.response_time.isoformat(),
            'location': {
                'latitude': float(self.location_latitude) if self.location_latitude else None,
                'longitude': float(self.location_longitude) if self.location_longitude else None
            },
            'notes': self.notes
        }

class EmergencyNotification(db.Model):
    """Track notifications sent for emergency alerts"""
    __tablename__ = 'emergency_notifications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = db.Column(UUID(as_uuid=True), db.ForeignKey('emergency_alerts.id'), nullable=False)
    recipient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(
        db.Enum('sms', 'email', 'push', 'call', name='notification_types'),
        nullable=False
    )
    sent_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)
    status = db.Column(
        db.Enum('sent', 'delivered', 'failed', 'read', name='notification_status'),
        nullable=False,
        default='sent'
    )
    error_message = db.Column(db.Text)

    def __init__(self, alert_id, recipient_id, notification_type):
        self.id = uuid.uuid4()
        self.alert_id = alert_id
        self.recipient_id = recipient_id
        self.notification_type = notification_type

    def to_dict(self):
        return {
            'id': str(self.id),
            'alert_id': str(self.alert_id),
            'recipient_id': str(self.recipient_id),
            'notification_type': self.notification_type,
            'sent_at': self.sent_at.isoformat(),
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'status': self.status,
            'error_message': self.error_message
        }

    def mark_delivered(self):
        """Mark notification as delivered"""
        self.delivered_at = datetime.utcnow()
        self.status = 'delivered'

    def mark_read(self):
        """Mark notification as read"""
        self.read_at = datetime.utcnow()
        self.status = 'read'

    def mark_failed(self, error_message):
        """Mark notification as failed"""
        self.status = 'failed'
        self.error_message = error_message
