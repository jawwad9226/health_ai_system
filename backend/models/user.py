from datetime import datetime
from __init__ import db, bcrypt
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.Enum('patient', 'professional', 'admin', name='user_types'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date)
    phone_number = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    profile_image_url = db.Column(db.String(255))
    
    # Relationships
    patient_profile = db.relationship('Patient', backref='user', uselist=False, lazy=True)
    professional_profile = db.relationship('Professional', backref='user', uselist=False, lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

    def __init__(self, email, password, user_type, first_name, last_name, date_of_birth=None, phone_number=None):
        self.id = uuid.uuid4()
        self.email = email
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        self.user_type = user_type
        self.first_name = first_name
        self.last_name = last_name
        self.date_of_birth = date_of_birth
        self.phone_number = phone_number

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'user_type': self.user_type,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'phone_number': self.phone_number,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active,
            'profile_image_url': self.profile_image_url
        }
