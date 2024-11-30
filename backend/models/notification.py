from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Notification details
    notification_type = db.Column(
        db.Enum(
            'appointment', 'medication', 'health_alert', 'lab_result',
            'message', 'system', 'reminder', 'goal', 'document',
            'prescription', 'billing', 'other',
            name='notification_types'
        ),
        nullable=False
    )
    priority = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='notification_priority'),
        nullable=False,
        default='medium'
    )
    
    # Content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    action_url = db.Column(db.String(500))  # Deep link to relevant content
    image_url = db.Column(db.String(500))  # URL for notification image
    
    # Additional data
    metadata = db.Column(JSONB)  # Additional context-specific data
    category = db.Column(db.String(50))  # For grouping similar notifications
    tags = db.Column(db.ARRAY(db.String))
    
    # Delivery channels
    channels = db.Column(
        db.ARRAY(
            db.Enum(
                'in_app', 'email', 'sms', 'push', 'whatsapp',
                name='delivery_channels'
            )
        ),
        nullable=False
    )
    
    # Status tracking
    status = db.Column(
        db.Enum(
            'pending', 'sent', 'delivered', 'read', 'failed', 'expired',
            name='notification_status'
        ),
        nullable=False,
        default='pending'
    )
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    
    # Scheduling
    scheduled_for = db.Column(db.DateTime)  # For scheduled notifications
    expires_at = db.Column(db.DateTime)  # When notification should expire
    
    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    # Relationships
    delivery_attempts = db.relationship('NotificationDelivery', backref='notification', lazy=True)

    def __init__(self, recipient_id, notification_type, title, message,
                 channels, priority='medium', action_url=None, image_url=None,
                 metadata=None, category=None, tags=None, scheduled_for=None,
                 expires_at=None, created_by=None):
        self.id = uuid.uuid4()
        self.recipient_id = recipient_id
        self.notification_type = notification_type
        self.title = title
        self.message = message
        self.channels = channels
        self.priority = priority
        self.action_url = action_url
        self.image_url = image_url
        self.metadata = metadata or {}
        self.category = category
        self.tags = tags or []
        self.scheduled_for = scheduled_for
        self.expires_at = expires_at
        self.created_by = created_by

    def to_dict(self):
        return {
            'id': str(self.id),
            'recipient_id': str(self.recipient_id),
            'notification_type': self.notification_type,
            'priority': self.priority,
            'title': self.title,
            'message': self.message,
            'action_url': self.action_url,
            'image_url': self.image_url,
            'metadata': self.metadata,
            'category': self.category,
            'tags': self.tags,
            'channels': self.channels,
            'status': self.status,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat(),
            'created_by': str(self.created_by) if self.created_by else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }

    def mark_sent(self):
        """Mark notification as sent"""
        self.status = 'sent'
        self.sent_at = datetime.utcnow()

    def mark_delivered(self):
        """Mark notification as delivered"""
        self.status = 'delivered'
        self.delivered_at = datetime.utcnow()

    def mark_read(self):
        """Mark notification as read"""
        self.status = 'read'
        self.is_read = True
        self.read_at = datetime.utcnow()

    def mark_failed(self):
        """Mark notification as failed"""
        self.status = 'failed'

    def is_expired(self):
        """Check if notification has expired"""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False

    def should_send(self):
        """Check if notification should be sent now"""
        now = datetime.utcnow()
        if self.scheduled_for:
            return now >= self.scheduled_for
        return True

class NotificationDelivery(db.Model):
    """Track individual delivery attempts for each notification channel"""
    __tablename__ = 'notification_deliveries'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = db.Column(UUID(as_uuid=True), db.ForeignKey('notifications.id'), nullable=False)
    channel = db.Column(
        db.Enum('in_app', 'email', 'sms', 'push', 'whatsapp', name='delivery_channels'),
        nullable=False
    )
    
    # Delivery status
    status = db.Column(
        db.Enum('pending', 'sent', 'delivered', 'failed', name='delivery_status'),
        nullable=False,
        default='pending'
    )
    attempt_count = db.Column(db.Integer, default=0)
    last_attempt = db.Column(db.DateTime)
    
    # Response tracking
    provider_response = db.Column(JSONB)  # Response from delivery provider
    error_message = db.Column(db.Text)
    
    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)

    def __init__(self, notification_id, channel):
        self.id = uuid.uuid4()
        self.notification_id = notification_id
        self.channel = channel

    def to_dict(self):
        return {
            'id': str(self.id),
            'notification_id': str(self.notification_id),
            'channel': self.channel,
            'status': self.status,
            'attempt_count': self.attempt_count,
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None,
            'provider_response': self.provider_response,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }

    def record_attempt(self, success, provider_response=None, error_message=None):
        """Record a delivery attempt"""
        self.attempt_count += 1
        self.last_attempt = datetime.utcnow()
        self.provider_response = provider_response
        
        if success:
            self.status = 'sent'
            self.sent_at = self.last_attempt
        else:
            self.status = 'failed'
            self.error_message = error_message

    def mark_delivered(self):
        """Mark delivery as successful"""
        self.status = 'delivered'
        self.delivered_at = datetime.utcnow()

class NotificationTemplate(db.Model):
    """Store predefined notification templates"""
    __tablename__ = 'notification_templates'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    
    # Template content
    title_template = db.Column(db.String(200), nullable=False)
    message_template = db.Column(db.Text, nullable=False)
    
    # Default settings
    notification_type = db.Column(
        db.Enum(
            'appointment', 'medication', 'health_alert', 'lab_result',
            'message', 'system', 'reminder', 'goal', 'document',
            'prescription', 'billing', 'other',
            name='template_types'
        ),
        nullable=False
    )
    default_priority = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='template_priority'),
        default='medium'
    )
    default_channels = db.Column(db.ARRAY(db.String), nullable=False)
    
    # Template metadata
    variables = db.Column(db.ARRAY(db.String))  # Required variables for template
    category = db.Column(db.String(50))
    tags = db.Column(db.ARRAY(db.String))
    
    # Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def __init__(self, name, title_template, message_template, notification_type,
                 default_channels, created_by, description=None,
                 default_priority='medium', variables=None, category=None,
                 tags=None):
        self.id = uuid.uuid4()
        self.name = name
        self.title_template = title_template
        self.message_template = message_template
        self.notification_type = notification_type
        self.default_channels = default_channels
        self.created_by = created_by
        self.description = description
        self.default_priority = default_priority
        self.variables = variables or []
        self.category = category
        self.tags = tags or []

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'title_template': self.title_template,
            'message_template': self.message_template,
            'notification_type': self.notification_type,
            'default_priority': self.default_priority,
            'default_channels': self.default_channels,
            'variables': self.variables,
            'category': self.category,
            'tags': self.tags,
            'created_at': self.created_at.isoformat(),
            'created_by': str(self.created_by),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }

    def create_notification(self, recipient_id, template_data, channels=None,
                          priority=None, scheduled_for=None, expires_at=None,
                          created_by=None):
        """Create a notification using this template"""
        try:
            title = self.title_template.format(**template_data)
            message = self.message_template.format(**template_data)
        except KeyError as e:
            raise ValueError(f"Missing required template variable: {str(e)}")

        return Notification(
            recipient_id=recipient_id,
            notification_type=self.notification_type,
            title=title,
            message=message,
            channels=channels or self.default_channels,
            priority=priority or self.default_priority,
            category=self.category,
            tags=self.tags,
            scheduled_for=scheduled_for,
            expires_at=expires_at,
            created_by=created_by
        )
