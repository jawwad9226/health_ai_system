from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('patients.id'), nullable=False)
    record_type = db.Column(
        db.Enum(
            'general', 'diagnosis', 'lab_result', 'imaging', 'procedure',
            'vaccination', 'allergy', 'surgery', 'consultation',
            name='record_types'
        ),
        nullable=False
    )
    
    # Record details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    diagnosis = db.Column(JSONB)  # Structured diagnosis data
    symptoms = db.Column(ARRAY(db.String))
    treatment_plan = db.Column(db.Text)
    
    # Clinical data
    icd_codes = db.Column(ARRAY(db.String))  # International Classification of Diseases codes
    procedure_codes = db.Column(ARRAY(db.String))  # CPT/HCPCS codes
    lab_results = db.Column(JSONB)  # Structured lab results
    vital_signs = db.Column(JSONB)  # Vital signs at time of record
    
    # Record metadata
    record_date = db.Column(db.DateTime, nullable=False)
    facility = db.Column(db.String(200))
    department = db.Column(db.String(100))
    provider_notes = db.Column(db.Text)
    follow_up_required = db.Column(db.Boolean, default=False)
    follow_up_date = db.Column(db.Date)
    
    # Access control
    is_confidential = db.Column(db.Boolean, default=False)
    access_level = db.Column(
        db.Enum('public', 'restricted', 'confidential', name='access_levels'),
        default='public'
    )
    
    # Tracking
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    updated_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = db.relationship('Document', backref='medical_record', lazy=True)
    related_records = db.relationship(
        'RelatedRecord',
        primaryjoin="or_(MedicalRecord.id==RelatedRecord.record_id_1, "
                   "MedicalRecord.id==RelatedRecord.record_id_2)",
        lazy=True
    )

    def __init__(self, patient_id, record_type, title, record_date, created_by,
                 description=None, diagnosis=None, symptoms=None, treatment_plan=None,
                 icd_codes=None, procedure_codes=None, lab_results=None,
                 vital_signs=None, facility=None, department=None,
                 provider_notes=None, is_confidential=False):
        self.id = uuid.uuid4()
        self.patient_id = patient_id
        self.record_type = record_type
        self.title = title
        self.record_date = record_date
        self.created_by = created_by
        self.description = description
        self.diagnosis = diagnosis
        self.symptoms = symptoms or []
        self.treatment_plan = treatment_plan
        self.icd_codes = icd_codes or []
        self.procedure_codes = procedure_codes or []
        self.lab_results = lab_results
        self.vital_signs = vital_signs
        self.facility = facility
        self.department = department
        self.provider_notes = provider_notes
        self.is_confidential = is_confidential
        self.access_level = 'confidential' if is_confidential else 'public'

    def to_dict(self):
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'record_type': self.record_type,
            'title': self.title,
            'description': self.description,
            'diagnosis': self.diagnosis,
            'symptoms': self.symptoms,
            'treatment_plan': self.treatment_plan,
            'icd_codes': self.icd_codes,
            'procedure_codes': self.procedure_codes,
            'lab_results': self.lab_results,
            'vital_signs': self.vital_signs,
            'record_date': self.record_date.isoformat(),
            'facility': self.facility,
            'department': self.department,
            'provider_notes': self.provider_notes,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'is_confidential': self.is_confidential,
            'access_level': self.access_level,
            'created_by': str(self.created_by),
            'updated_by': str(self.updated_by) if self.updated_by else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def add_follow_up(self, date):
        """Set follow-up date and mark as requiring follow-up"""
        self.follow_up_required = True
        self.follow_up_date = date

    def mark_confidential(self):
        """Mark record as confidential"""
        self.is_confidential = True
        self.access_level = 'confidential'

    def update_access_level(self, level):
        """Update record access level"""
        if level in ['public', 'restricted', 'confidential']:
            self.access_level = level
            self.is_confidential = (level == 'confidential')

class RelatedRecord(db.Model):
    """Track relationships between medical records"""
    __tablename__ = 'related_records'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id_1 = db.Column(UUID(as_uuid=True), db.ForeignKey('medical_records.id'), nullable=False)
    record_id_2 = db.Column(UUID(as_uuid=True), db.ForeignKey('medical_records.id'), nullable=False)
    relationship_type = db.Column(db.String(50), nullable=False)  # e.g., "follow-up", "referral", "related"
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)

    def __init__(self, record_id_1, record_id_2, relationship_type, created_by, notes=None):
        self.id = uuid.uuid4()
        self.record_id_1 = record_id_1
        self.record_id_2 = record_id_2
        self.relationship_type = relationship_type
        self.created_by = created_by
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'record_id_1': str(self.record_id_1),
            'record_id_2': str(self.record_id_2),
            'relationship_type': self.relationship_type,
            'notes': self.notes,
            'created_by': str(self.created_by),
            'created_at': self.created_at.isoformat()
        }
