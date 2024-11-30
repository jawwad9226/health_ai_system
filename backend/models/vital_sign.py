from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class VitalSign(db.Model):
    __tablename__ = 'vital_signs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    recorded_at = db.Column(db.DateTime, nullable=False)
    heart_rate = db.Column(db.Integer)  # BPM
    blood_pressure_systolic = db.Column(db.Integer)  # mmHg
    blood_pressure_diastolic = db.Column(db.Integer)  # mmHg
    temperature = db.Column(db.Numeric(4, 1))  # Celsius
    respiratory_rate = db.Column(db.Integer)  # breaths per minute
    oxygen_saturation = db.Column(db.Integer)  # percentage
    recorded_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source = db.Column(db.String(50))  # e.g., 'manual', 'device', 'wearable'
    is_abnormal = db.Column(db.Boolean, default=False)

    def __init__(self, patient_id, recorded_at, recorded_by=None, source='manual', **kwargs):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.recorded_at = recorded_at
        self.recorded_by = recorded_by
        self.source = source
        
        # Set vital signs from kwargs
        self.heart_rate = kwargs.get('heart_rate')
        self.blood_pressure_systolic = kwargs.get('blood_pressure_systolic')
        self.blood_pressure_diastolic = kwargs.get('blood_pressure_diastolic')
        self.temperature = kwargs.get('temperature')
        self.respiratory_rate = kwargs.get('respiratory_rate')
        self.oxygen_saturation = kwargs.get('oxygen_saturation')
        self.notes = kwargs.get('notes')
        
        # Check for abnormal values
        self._check_abnormal_values()

    def _check_abnormal_values(self):
        """Check if any vital signs are outside normal ranges"""
        is_abnormal = False
        
        if self.heart_rate:
            is_abnormal |= not (60 <= self.heart_rate <= 100)
        
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            is_abnormal |= not (90 <= self.blood_pressure_systolic <= 140)
            is_abnormal |= not (60 <= self.blood_pressure_diastolic <= 90)
        
        if self.temperature:
            is_abnormal |= not (36.1 <= float(self.temperature) <= 37.2)
        
        if self.respiratory_rate:
            is_abnormal |= not (12 <= self.respiratory_rate <= 20)
        
        if self.oxygen_saturation:
            is_abnormal |= self.oxygen_saturation < 95
        
        self.is_abnormal = is_abnormal

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'recorded_at': self.recorded_at.isoformat(),
            'heart_rate': self.heart_rate,
            'blood_pressure': f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}" 
                if self.blood_pressure_systolic and self.blood_pressure_diastolic else None,
            'temperature': float(self.temperature) if self.temperature else None,
            'respiratory_rate': self.respiratory_rate,
            'oxygen_saturation': self.oxygen_saturation,
            'recorded_by': str(self.recorded_by) if self.recorded_by else None,
            'notes': self.notes,
            'source': self.source,
            'is_abnormal': self.is_abnormal,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    @property
    def blood_pressure(self):
        """Return blood pressure as a formatted string"""
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}"
        return None
