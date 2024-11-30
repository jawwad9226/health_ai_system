import tensorflow as tf
import numpy as np
from typing import Dict, Any
import os
from config import Config

class HealthRiskModel:
    def __init__(self):
        self.models = {}
        self.load_models()
        
    def load_models(self):
        """Load all TensorFlow models."""
        model_path = Config.MODEL_PATH
        risk_types = ['cardiovascular', 'diabetes', 'respiratory', 'cancer', 'mental_health']
        
        for risk_type in risk_types:
            model_file = os.path.join(model_path, f'{risk_type}_model')
            try:
                self.models[risk_type] = tf.keras.models.load_model(model_file)
            except:
                # If model doesn't exist, create a simple neural network
                self.models[risk_type] = self._create_default_model(risk_type)
                
    def _create_default_model(self, risk_type: str) -> tf.keras.Model:
        """Create a default neural network model for risk prediction."""
        input_dim = self._get_input_dim(risk_type)
        
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_dim=input_dim),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _get_input_dim(self, risk_type: str) -> int:
        """Get input dimensions for each risk type model."""
        base_features = 8  # Common features for all models
        additional_features = {
            'cardiovascular': 3,  # cholesterol_hdl, cholesterol_ldl, triglycerides
            'diabetes': 2,        # blood_glucose, hba1c
            'respiratory': 2,     # fev1, fvc
            'cancer': 4,         # family_history, previous_cancer, tumor_markers, etc.
            'mental_health': 3    # stress_level, anxiety_score, depression_score
        }
        return base_features + additional_features.get(risk_type, 0)
    
    def predict(self, processed_data: Dict[str, np.ndarray]) -> Dict[str, float]:
        """Generate predictions for all risk types."""
        predictions = {}
        
        for risk_type, data in processed_data.items():
            if risk_type in self.models:
                # Reshape data for model input
                model_input = np.array([data])
                # Get prediction
                prediction = self.models[risk_type].predict(model_input)[0][0]
                predictions[f'{risk_type}_risk'] = float(prediction)
                
        return predictions
    
    def save_models(self):
        """Save all models to disk."""
        model_path = Config.MODEL_PATH
        os.makedirs(model_path, exist_ok=True)
        
        for risk_type, model in self.models.items():
            model_file = os.path.join(model_path, f'{risk_type}_model')
            model.save(model_file)

# Initialize global model instance
health_risk_model = HealthRiskModel()
