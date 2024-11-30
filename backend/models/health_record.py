from datetime import datetime
from __init__ import db

class HealthRecord(db.Model):
    __tablename__ = 'health_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    record_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Vital Signs
    blood_pressure_systolic = db.Column(db.Float, nullable=True)
    blood_pressure_diastolic = db.Column(db.Float, nullable=True)
    heart_rate = db.Column(db.Float, nullable=True)
    respiratory_rate = db.Column(db.Float, nullable=True)
    body_temperature = db.Column(db.Float, nullable=True)
    oxygen_saturation = db.Column(db.Float, nullable=True)
    
    # Body Measurements
    height = db.Column(db.Float, nullable=True)  # in cm
    weight = db.Column(db.Float, nullable=True)  # in kg
    bmi = db.Column(db.Float, nullable=True)
    waist_circumference = db.Column(db.Float, nullable=True)  # in cm
    
    # Lab Results
    blood_sugar = db.Column(db.Float, nullable=True)  # mg/dL
    cholesterol_total = db.Column(db.Float, nullable=True)  # mg/dL
    cholesterol_hdl = db.Column(db.Float, nullable=True)  # mg/dL
    cholesterol_ldl = db.Column(db.Float, nullable=True)  # mg/dL
    triglycerides = db.Column(db.Float, nullable=True)  # mg/dL
    hemoglobin = db.Column(db.Float, nullable=True)  # g/dL
    
    # Risk Assessment
    risk_score = db.Column(db.Float, nullable=True)
    confidence_score = db.Column(db.Float, nullable=True)
    risk_factors = db.Column(db.JSON, nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)

    def __init__(self, user_id, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'record_date': self.record_date.isoformat(),
            'vital_signs': {
                'blood_pressure': {
                    'systolic': self.blood_pressure_systolic,
                    'diastolic': self.blood_pressure_diastolic
                },
                'heart_rate': self.heart_rate,
                'respiratory_rate': self.respiratory_rate,
                'body_temperature': self.body_temperature,
                'oxygen_saturation': self.oxygen_saturation
            },
            'body_measurements': {
                'height': self.height,
                'weight': self.weight,
                'bmi': self.bmi,
                'waist_circumference': self.waist_circumference
            },
            'lab_results': {
                'blood_sugar': self.blood_sugar,
                'cholesterol': {
                    'total': self.cholesterol_total,
                    'hdl': self.cholesterol_hdl,
                    'ldl': self.cholesterol_ldl
                },
                'triglycerides': self.triglycerides,
                'hemoglobin': self.hemoglobin
            },
            'risk_assessment': {
                'risk_score': self.risk_score,
                'confidence_score': self.confidence_score,
                'risk_factors': self.risk_factors
            },
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
