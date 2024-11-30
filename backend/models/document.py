from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID
import uuid
import mimetypes
import os

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = db.Column(UUID(as_uuid=True), db.ForeignKey('medical_records.id'), nullable=False)
    
    # Document metadata
    document_type = db.Column(
        db.Enum(
            'lab_report', 'imaging', 'prescription', 'consent_form',
            'referral', 'discharge_summary', 'clinical_note', 'insurance',
            'vaccination_record', 'other',
            name='document_types'
        ),
        nullable=False
    )
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # File details
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    mime_type = db.Column(db.String(100), nullable=False)
    file_extension = db.Column(db.String(10))
    checksum = db.Column(db.String(64))  # SHA-256 hash of file
    
    # Version control
    version = db.Column(db.Integer, default=1)
    previous_version_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'))
    
    # Access control
    is_archived = db.Column(db.Boolean, default=False)
    is_confidential = db.Column(db.Boolean, default=False)
    access_level = db.Column(
        db.Enum('public', 'restricted', 'confidential', name='doc_access_levels'),
        default='public'
    )
    
    # Tracking
    uploaded_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    modified_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    archived_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    archived_at = db.Column(db.DateTime)
    
    # Tags and categories
    tags = db.Column(db.ARRAY(db.String))
    category = db.Column(db.String(100))

    def __init__(self, record_id, document_type, title, file_name, file_path,
                 file_size, uploaded_by, description=None, checksum=None,
                 is_confidential=False, tags=None, category=None):
        self.id = uuid.uuid4()
        self.record_id = record_id
        self.document_type = document_type
        self.title = title
        self.description = description
        self.file_name = file_name
        self.file_path = file_path
        self.file_size = file_size
        self.uploaded_by = uploaded_by
        self.checksum = checksum
        self.is_confidential = is_confidential
        self.access_level = 'confidential' if is_confidential else 'public'
        self.tags = tags or []
        self.category = category
        
        # Set mime type and extension
        self.file_extension = os.path.splitext(file_name)[1].lower()
        self.mime_type = mimetypes.guess_type(file_name)[0] or 'application/octet-stream'

    def to_dict(self):
        return {
            'id': str(self.id),
            'record_id': str(self.record_id),
            'document_type': self.document_type,
            'title': self.title,
            'description': self.description,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'file_extension': self.file_extension,
            'version': self.version,
            'previous_version_id': str(self.previous_version_id) if self.previous_version_id else None,
            'is_archived': self.is_archived,
            'is_confidential': self.is_confidential,
            'access_level': self.access_level,
            'tags': self.tags,
            'category': self.category,
            'uploaded_by': str(self.uploaded_by),
            'uploaded_at': self.uploaded_at.isoformat(),
            'modified_by': str(self.modified_by) if self.modified_by else None,
            'modified_at': self.modified_at.isoformat() if self.modified_at else None,
            'archived_by': str(self.archived_by) if self.archived_by else None,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None
        }

    def archive(self, archived_by):
        """Archive the document"""
        self.is_archived = True
        self.archived_by = archived_by
        self.archived_at = datetime.utcnow()

    def unarchive(self):
        """Unarchive the document"""
        self.is_archived = False
        self.archived_by = None
        self.archived_at = None

    def create_new_version(self, file_name, file_path, file_size, uploaded_by, checksum=None):
        """Create a new version of the document"""
        new_doc = Document(
            record_id=self.record_id,
            document_type=self.document_type,
            title=self.title,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            uploaded_by=uploaded_by,
            description=self.description,
            checksum=checksum,
            is_confidential=self.is_confidential,
            tags=self.tags,
            category=self.category
        )
        new_doc.version = self.version + 1
        new_doc.previous_version_id = self.id
        return new_doc

    @property
    def file_size_formatted(self):
        """Return human-readable file size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024
        return f"{self.file_size:.1f} TB"

    @property
    def is_image(self):
        """Check if document is an image"""
        return self.mime_type and self.mime_type.startswith('image/')

    @property
    def is_pdf(self):
        """Check if document is a PDF"""
        return self.mime_type == 'application/pdf'

class DocumentShare(db.Model):
    """Track document sharing with users or departments"""
    __tablename__ = 'document_shares'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=False)
    shared_with = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    shared_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    access_level = db.Column(
        db.Enum('view', 'download', 'edit', name='share_access_levels'),
        default='view'
    )
    notes = db.Column(db.Text)

    def __init__(self, document_id, shared_with, shared_by, access_level='view',
                 expires_at=None, notes=None):
        self.id = uuid.uuid4()
        self.document_id = document_id
        self.shared_with = shared_with
        self.shared_by = shared_by
        self.access_level = access_level
        self.expires_at = expires_at
        self.notes = notes

    def to_dict(self):
        return {
            'id': str(self.id),
            'document_id': str(self.document_id),
            'shared_with': str(self.shared_with),
            'shared_by': str(self.shared_by),
            'shared_at': self.shared_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'access_level': self.access_level,
            'notes': self.notes
        }

    @property
    def is_expired(self):
        """Check if share has expired"""
        return self.expires_at and datetime.utcnow() > self.expires_at
