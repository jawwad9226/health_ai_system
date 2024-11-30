from datetime import datetime
from __init__ import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

class Medication(db.Model):
    __tablename__ = 'medications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    generic_name = db.Column(db.String(200))
    description = db.Column(db.Text)
    dosage_form = db.Column(db.String(50))  # tablet, capsule, liquid, etc.
    strength = db.Column(db.String(50))  # e.g., "500mg", "50mcg"
    manufacturer = db.Column(db.String(100))
    active_ingredients = db.Column(ARRAY(db.String))
    therapeutic_class = db.Column(db.String(100))
    pregnancy_category = db.Column(db.String(1))  # A, B, C, D, X
    storage_instructions = db.Column(db.Text)
    side_effects = db.Column(ARRAY(db.String))
    contraindications = db.Column(ARRAY(db.String))
    interactions = db.Column(ARRAY(db.String))
    requires_prescription = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    prescriptions = db.relationship('Prescription', backref='medication', lazy=True)

    def __init__(self, name, dosage_form, strength, manufacturer=None, generic_name=None,
                 description=None, active_ingredients=None, therapeutic_class=None,
                 pregnancy_category=None, requires_prescription=True):
        self.id = uuid.uuid4()
        self.name = name
        self.generic_name = generic_name
        self.description = description
        self.dosage_form = dosage_form
        self.strength = strength
        self.manufacturer = manufacturer
        self.active_ingredients = active_ingredients or []
        self.therapeutic_class = therapeutic_class
        self.pregnancy_category = pregnancy_category
        self.requires_prescription = requires_prescription
        self.side_effects = []
        self.contraindications = []
        self.interactions = []

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'generic_name': self.generic_name,
            'description': self.description,
            'dosage_form': self.dosage_form,
            'strength': self.strength,
            'manufacturer': self.manufacturer,
            'active_ingredients': self.active_ingredients,
            'therapeutic_class': self.therapeutic_class,
            'pregnancy_category': self.pregnancy_category,
            'storage_instructions': self.storage_instructions,
            'side_effects': self.side_effects,
            'contraindications': self.contraindications,
            'interactions': self.interactions,
            'requires_prescription': self.requires_prescription,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def add_side_effect(self, effect):
        """Add a side effect if it doesn't exist"""
        if effect not in self.side_effects:
            self.side_effects = self.side_effects + [effect]

    def add_contraindication(self, contraindication):
        """Add a contraindication if it doesn't exist"""
        if contraindication not in self.contraindications:
            self.contraindications = self.contraindications + [contraindication]

    def add_interaction(self, interaction):
        """Add a medication interaction if it doesn't exist"""
        if interaction not in self.interactions:
            self.interactions = self.interactions + [interaction]

    def remove_side_effect(self, effect):
        """Remove a side effect if it exists"""
        if effect in self.side_effects:
            self.side_effects.remove(effect)

    def remove_contraindication(self, contraindication):
        """Remove a contraindication if it exists"""
        if contraindication in self.contraindications:
            self.contraindications.remove(contraindication)

    def remove_interaction(self, interaction):
        """Remove a medication interaction if it exists"""
        if interaction in self.interactions:
            self.interactions.remove(interaction)

    @property
    def full_name(self):
        """Return full medication name including strength"""
        return f"{self.name} {self.strength}"

class MedicationCategory(db.Model):
    """Classification and categorization of medications"""
    __tablename__ = 'medication_categories'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parent_id = db.Column(UUID(as_uuid=True), db.ForeignKey('medication_categories.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential relationship for hierarchical categories
    subcategories = db.relationship(
        'MedicationCategory',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic'
    )

    def __init__(self, name, description=None, parent_id=None):
        self.id = uuid.uuid4()
        self.name = name
        self.description = description
        self.parent_id = parent_id

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'parent_id': str(self.parent_id) if self.parent_id else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
