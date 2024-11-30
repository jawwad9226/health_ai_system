from datetime import datetime
from __init__ import db

class RiskPrediction(db.Model):
    __tablename__ = 'risk_predictions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    health_record_id = db.Column(db.Integer, db.ForeignKey('health_records.id'), nullable=True)  
    prediction_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Risk Scores (0-100)
    cardiovascular_risk = db.Column(db.Float, nullable=False)
    diabetes_risk = db.Column(db.Float, nullable=False)
    respiratory_risk = db.Column(db.Float, nullable=False)
    cancer_risk = db.Column(db.Float, nullable=False)
    
    # Analysis Details
    risk_factors = db.Column(db.JSON, nullable=False)  # List of identified risk factors
    recommendations = db.Column(db.JSON, nullable=False)  # List of recommendations
    confidence_score = db.Column(db.Float, nullable=False)  # Overall confidence in prediction (0-100)
    
    # Metadata
    model_version = db.Column(db.String(20), nullable=False)  # Version of the prediction model used
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id, cardiovascular_risk, diabetes_risk, respiratory_risk, 
                 cancer_risk, risk_factors, recommendations, confidence_score, 
                 model_version, health_record_id=None):
        self.user_id = user_id
        self.health_record_id = health_record_id
        self.cardiovascular_risk = cardiovascular_risk
        self.diabetes_risk = diabetes_risk
        self.respiratory_risk = respiratory_risk
        self.cancer_risk = cancer_risk
        self.risk_factors = risk_factors
        self.recommendations = recommendations
        self.confidence_score = confidence_score
        self.model_version = model_version

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'health_record_id': self.health_record_id,
            'prediction_date': self.prediction_date.isoformat(),
            'risk_scores': {
                'cardiovascular': self.cardiovascular_risk,
                'diabetes': self.diabetes_risk,
                'respiratory': self.respiratory_risk,
                'cancer': self.cancer_risk
            },
            'risk_factors': self.risk_factors,
            'recommendations': self.recommendations,
            'confidence_score': self.confidence_score,
            'model_version': self.model_version,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
