from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    professional_id = db.Column(UUID(as_uuid=True), db.ForeignKey('professionals.id'), nullable=False)
    medication_id = db.Column(UUID(as_uuid=True), db.ForeignKey('medications.id'), nullable=False)
    
    # Prescription details
    dosage = db.Column(db.String(50), nullable=False)  # e.g., "1 tablet"
    frequency = db.Column(db.String(50), nullable=False)  # e.g., "twice daily"
    duration = db.Column(db.String(50))  # e.g., "7 days", "1 month"
    route = db.Column(db.String(50))  # e.g., "oral", "topical", "injection"
    timing = db.Column(db.String(100))  # e.g., "before meals", "at bedtime"
    
    # Dates
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    last_filled_date = db.Column(db.Date)
    next_refill_date = db.Column(db.Date)
    
    # Additional information
    instructions = db.Column(db.Text)
    reason = db.Column(db.String(200))
    refills_allowed = db.Column(db.Integer, default=0)
    refills_remaining = db.Column(db.Integer, default=0)
    quantity = db.Column(db.Integer)  # Total quantity prescribed
    
    # Status tracking
    status = db.Column(
        db.Enum('active', 'completed', 'cancelled', 'on_hold', name='prescription_status'),
        nullable=False,
        default='active'
    )
    
    # Timestamps and tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime)
    cancelled_reason = db.Column(db.Text)
    cancelled_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))

    # Relationships
    refills = db.relationship('PrescriptionRefill', backref='prescription', lazy=True)
    adherence_records = db.relationship('MedicationAdherence', backref='prescription', lazy=True)

    def __init__(self, patient_id, professional_id, medication_id, dosage, frequency,
                 start_date, duration=None, route=None, timing=None, instructions=None,
                 reason=None, refills_allowed=0, quantity=None):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.professional_id = professional_id
        self.medication_id = medication_id
        self.dosage = dosage
        self.frequency = frequency
        self.duration = duration
        self.route = route
        self.timing = timing
        self.start_date = start_date
        self.instructions = instructions
        self.reason = reason
        self.refills_allowed = refills_allowed
        self.refills_remaining = refills_allowed
        self.quantity = quantity
        self.status = 'active'

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'professional_id': str(self.professional_id),
            'medication_id': str(self.medication_id),
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'route': self.route,
            'timing': self.timing,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'last_filled_date': self.last_filled_date.isoformat() if self.last_filled_date else None,
            'next_refill_date': self.next_refill_date.isoformat() if self.next_refill_date else None,
            'instructions': self.instructions,
            'reason': self.reason,
            'refills_allowed': self.refills_allowed,
            'refills_remaining': self.refills_remaining,
            'quantity': self.quantity,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancelled_reason': self.cancelled_reason,
            'cancelled_by': str(self.cancelled_by) if self.cancelled_by else None
        }

    def cancel(self, reason, cancelled_by):
        """Cancel the prescription"""
        self.status = 'cancelled'
        self.cancelled_at = datetime.utcnow()
        self.cancelled_reason = reason
        self.cancelled_by = cancelled_by

    def put_on_hold(self):
        """Put the prescription on hold"""
        self.status = 'on_hold'

    def reactivate(self):
        """Reactivate a prescription that was on hold"""
        if self.status == 'on_hold':
            self.status = 'active'

    def complete(self):
        """Mark the prescription as completed"""
        self.status = 'completed'

    def process_refill(self):
        """Process a prescription refill"""
        if self.refills_remaining > 0:
            self.refills_remaining -= 1
            self.last_filled_date = datetime.utcnow().date()
            return True
        return False

class PrescriptionRefill(db.Model):
    """Track prescription refills"""
    __tablename__ = 'prescription_refills'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = db.Column(UUID(as_uuid=True), db.ForeignKey('prescriptions.id'), nullable=False)
    filled_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    filled_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    quantity = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, prescription_id, quantity, filled_by=None, notes=None):
        self.id = uuid.uuid4()
        self.prescription_id = prescription_id
        self.quantity = quantity
        self.filled_by = filled_by
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'prescription_id': str(self.prescription_id),
            'filled_date': self.filled_date.isoformat(),
            'filled_by': str(self.filled_by) if self.filled_by else None,
            'quantity': self.quantity,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }

class MedicationAdherence(db.Model):
    """Track medication adherence"""
    __tablename__ = 'medication_adherence'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = db.Column(UUID(as_uuid=True), db.ForeignKey('prescriptions.id'), nullable=False)
    taken_at = db.Column(db.DateTime, nullable=False)
    dosage_taken = db.Column(db.String(50), nullable=False)
    status = db.Column(
        db.Enum('taken', 'missed', 'delayed', 'partial', name='adherence_status'),
        nullable=False
    )
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, prescription_id, taken_at, dosage_taken, status, notes=None):
        self.id = uuid.uuid4()
        self.prescription_id = prescription_id
        self.taken_at = taken_at
        self.dosage_taken = dosage_taken
        self.status = status
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'prescription_id': str(self.prescription_id),
            'taken_at': self.taken_at.isoformat(),
            'dosage_taken': self.dosage_taken,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
