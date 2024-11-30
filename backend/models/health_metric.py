from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import numpy as np

class HealthMetric(db.Model):
    __tablename__ = 'health_metrics'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    
    # Metric details
    metric_type = db.Column(
        db.Enum(
            'blood_glucose', 'blood_pressure', 'heart_rate', 'temperature',
            'weight', 'bmi', 'body_fat', 'sleep', 'steps', 'exercise',
            'calories', 'oxygen_saturation', 'respiratory_rate', 'stress_level',
            'mood', 'pain_level', 'custom',
            name='metric_types'
        ),
        nullable=False
    )
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    
    # Measurement context
    measured_at = db.Column(db.DateTime, nullable=False)
    measurement_method = db.Column(
        db.Enum(
            'manual', 'device', 'wearable', 'app', 'professional',
            'lab', 'calculated', 'other',
            name='measurement_methods'
        ),
        nullable=False
    )
    device_id = db.Column(db.String(100))  # ID of the measuring device
    device_type = db.Column(db.String(100))  # Type/model of the device
    
    # Additional data
    metadata = db.Column(JSONB)  # Additional measurement-specific data
    notes = db.Column(db.Text)
    tags = db.Column(db.ARRAY(db.String))
    
    # Data quality
    accuracy = db.Column(db.Float)  # Accuracy percentage if available
    is_abnormal = db.Column(db.Boolean, default=False)
    validation_status = db.Column(
        db.Enum('pending', 'validated', 'rejected', name='validation_status'),
        default='pending'
    )
    
    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    validated_by = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'))
    validated_at = db.Column(db.DateTime)

    def __init__(self, patient_id, metric_type, value, unit, measured_at,
                 measurement_method, created_by, device_id=None, device_type=None,
                 metadata=None, notes=None, tags=None, accuracy=None):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.metric_type = metric_type
        self.value = value
        self.unit = unit
        self.measured_at = measured_at
        self.measurement_method = measurement_method
        self.created_by = created_by
        self.device_id = device_id
        self.device_type = device_type
        self.metadata = metadata or {}
        self.notes = notes
        self.tags = tags or []
        self.accuracy = accuracy
        
        # Check if value is abnormal based on metric type
        self.check_abnormal_value()

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'metric_type': self.metric_type,
            'value': self.value,
            'unit': self.unit,
            'measured_at': self.measured_at.isoformat(),
            'measurement_method': self.measurement_method,
            'device_id': self.device_id,
            'device_type': self.device_type,
            'metadata': self.metadata,
            'notes': self.notes,
            'tags': self.tags,
            'accuracy': self.accuracy,
            'is_abnormal': self.is_abnormal,
            'validation_status': self.validation_status,
            'created_at': self.created_at.isoformat(),
            'created_by': str(self.created_by),
            'validated_by': str(self.validated_by) if self.validated_by else None,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None
        }

    def validate(self, professional_id):
        """Validate the health metric measurement"""
        self.validation_status = 'validated'
        self.validated_by = professional_id
        self.validated_at = datetime.utcnow()

    def reject(self, professional_id, reason):
        """Reject the health metric measurement"""
        self.validation_status = 'rejected'
        self.validated_by = professional_id
        self.validated_at = datetime.utcnow()
        self.notes = f"Rejected: {reason}"

    def check_abnormal_value(self):
        """Check if the measured value is abnormal based on metric type"""
        # Define normal ranges for different metrics
        normal_ranges = {
            'blood_glucose': (70, 140),  # mg/dL
            'blood_pressure': {
                'systolic': (90, 140),   # mmHg
                'diastolic': (60, 90)    # mmHg
            },
            'heart_rate': (60, 100),     # bpm
            'temperature': (36.1, 37.2),  # °C
            'oxygen_saturation': (95, 100),  # %
            'respiratory_rate': (12, 20), # breaths per minute
            'bmi': (18.5, 24.9),         # kg/m²
            'body_fat': {
                'male': (10, 20),        # %
                'female': (18, 28)       # %
            }
        }

        if self.metric_type in normal_ranges:
            range_value = normal_ranges[self.metric_type]
            
            if isinstance(range_value, tuple):
                self.is_abnormal = not (range_value[0] <= self.value <= range_value[1])
            elif isinstance(range_value, dict):
                if self.metric_type == 'blood_pressure':
                    if isinstance(self.value, dict):
                        systolic = self.value.get('systolic')
                        diastolic = self.value.get('diastolic')
                        if systolic and diastolic:
                            self.is_abnormal = not (
                                range_value['systolic'][0] <= systolic <= range_value['systolic'][1] and
                                range_value['diastolic'][0] <= diastolic <= range_value['diastolic'][1]
                            )
                elif self.metric_type == 'body_fat':
                    if 'gender' in self.metadata:
                        gender = self.metadata['gender'].lower()
                        if gender in ['male', 'female']:
                            self.is_abnormal = not (
                                range_value[gender][0] <= self.value <= range_value[gender][1]
                            )

class HealthMetricGoal(db.Model):
    """Track health metric goals and progress"""
    __tablename__ = 'health_metric_goals'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    metric_type = db.Column(
        db.Enum(
            'blood_glucose', 'blood_pressure', 'heart_rate', 'weight',
            'bmi', 'body_fat', 'steps', 'exercise', 'calories',
            name='goal_metric_types'
        ),
        nullable=False
    )
    
    # Goal details
    target_value = db.Column(db.Float, nullable=False)
    target_unit = db.Column(db.String(20), nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    
    # Progress tracking
    start_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, nullable=False)
    progress_percentage = db.Column(db.Float)
    
    # Goal metadata
    description = db.Column(db.Text)
    frequency = db.Column(
        db.Enum('daily', 'weekly', 'monthly', name='goal_frequency'),
        nullable=False
    )
    priority = db.Column(
        db.Enum('low', 'medium', 'high', name='goal_priority'),
        default='medium'
    )
    
    # Status
    status = db.Column(
        db.Enum('active', 'completed', 'missed', 'cancelled', name='goal_status'),
        default='active'
    )
    completed_at = db.Column(db.DateTime)
    
    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def __init__(self, patient_id, metric_type, target_value, target_unit,
                 target_date, start_value, frequency, created_by,
                 description=None, priority='medium'):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.metric_type = metric_type
        self.target_value = target_value
        self.target_unit = target_unit
        self.target_date = target_date
        self.start_value = start_value
        self.current_value = start_value
        self.frequency = frequency
        self.created_by = created_by
        self.description = description
        self.priority = priority
        
        # Calculate initial progress
        self.update_progress()

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'metric_type': self.metric_type,
            'target_value': self.target_value,
            'target_unit': self.target_unit,
            'target_date': self.target_date.isoformat(),
            'start_value': self.start_value,
            'current_value': self.current_value,
            'progress_percentage': self.progress_percentage,
            'description': self.description,
            'frequency': self.frequency,
            'priority': self.priority,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'created_by': str(self.created_by),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def update_progress(self, new_value=None):
        """Update progress based on new value"""
        if new_value is not None:
            self.current_value = new_value
        
        # Calculate progress percentage
        if self.target_value != self.start_value:
            self.progress_percentage = (
                (self.current_value - self.start_value) /
                (self.target_value - self.start_value)
            ) * 100
            
            # Check if goal is completed
            if self.progress_percentage >= 100:
                self.complete()

    def complete(self):
        """Mark goal as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        self.progress_percentage = 100

    def cancel(self):
        """Cancel the goal"""
        self.status = 'cancelled'
        self.completed_at = datetime.utcnow()

    def mark_missed(self):
        """Mark goal as missed"""
        self.status = 'missed'
        self.completed_at = datetime.utcnow()
