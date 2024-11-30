from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Patient(db.Model):
    __tablename__ = 'patients'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    blood_type = db.Column(db.String(5))
    height = db.Column(db.Numeric(5, 2))
    weight = db.Column(db.Numeric(5, 2))
    emergency_contact_name = db.Column(db.String(200))
    emergency_contact_phone = db.Column(db.String(20))
    insurance_provider = db.Column(db.String(100))
    insurance_id = db.Column(db.String(50))
    primary_physician_id = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'))
    medical_conditions = db.Column(db.ARRAY(db.String))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='patient', lazy=True)
    vital_signs = db.relationship('VitalSign', backref='patient', lazy=True)
    prescriptions = db.relationship('Prescription', backref='patient', lazy=True)
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy=True)
    emergency_alerts = db.relationship('EmergencyAlert', backref='patient', lazy=True)
    health_metrics = db.relationship('HealthMetric', backref='patient', lazy=True)

    def __init__(self, user_id, blood_type=None, height=None, weight=None,
                 emergency_contact_name=None, emergency_contact_phone=None,
                 insurance_provider=None, insurance_id=None, primary_physician_id=None,
                 medical_conditions=None):
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.blood_type = blood_type
        self.height = height
        self.weight = weight
        self.emergency_contact_name = emergency_contact_name
        self.emergency_contact_phone = emergency_contact_phone
        self.insurance_provider = insurance_provider
        self.insurance_id = insurance_id
        self.primary_physician_id = primary_physician_id
        self.medical_conditions = medical_conditions or []

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'blood_type': self.blood_type,
            'height': float(self.height) if self.height else None,
            'weight': float(self.weight) if self.weight else None,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'insurance_provider': self.insurance_provider,
            'insurance_id': self.insurance_id,
            'primary_physician_id': str(self.primary_physician_id) if self.primary_physician_id else None,
            'medical_conditions': self.medical_conditions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    @property
    def bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            height_m = float(self.height) / 100  # Convert cm to m
            return float(self.weight) / (height_m * height_m)
        return None
