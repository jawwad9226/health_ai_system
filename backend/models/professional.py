from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Professional(db.Model):
    __tablename__ = 'professionals'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    qualification = db.Column(db.Text)
    years_of_experience = db.Column(db.Integer)
    department = db.Column(db.String(100))
    available_for_emergency = db.Column(db.Boolean, default=False)
    consultation_fee = db.Column(db.Numeric(10, 2))
    rating = db.Column(db.Numeric(3, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='professional', lazy=True)
    prescriptions = db.relationship('Prescription', backref='professional', lazy=True)
    emergency_responses = db.relationship('EmergencyAlert', backref='responder', lazy=True)

    def __init__(self, user_id, specialty, license_number, qualification=None, 
                 years_of_experience=None, department=None, consultation_fee=None):
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.specialty = specialty
        self.license_number = license_number
        self.qualification = qualification
        self.years_of_experience = years_of_experience
        self.department = department
        self.consultation_fee = consultation_fee

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'specialty': self.specialty,
            'license_number': self.license_number,
            'qualification': self.qualification,
            'years_of_experience': self.years_of_experience,
            'department': self.department,
            'available_for_emergency': self.available_for_emergency,
            'consultation_fee': float(self.consultation_fee) if self.consultation_fee else None,
            'rating': float(self.rating) if self.rating else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
