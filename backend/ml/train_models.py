import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBRegressor
import joblib
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelTrainer:
    def __init__(self, data_path, models_dir='models'):
        """Initialize model trainer"""
        self.data_path = data_path
        self.models_dir = models_dir
        self.scaler = StandardScaler()
        
        # Create models directory if it doesn't exist
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)

    def train_risk_assessment_model(self):
        """Train risk assessment model"""
        logger.info("Training risk assessment model...")
        
        try:
            # Load and preprocess data
            data = pd.read_csv(f"{self.data_path}/risk_assessment_data.csv")
            X = data.drop('risk_level', axis=1)
            y = data['risk_level']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Define model and parameters
            model = RandomForestClassifier(random_state=42)
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, 30, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            # Perform grid search
            grid_search = GridSearchCV(
                model, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1
            )
            grid_search.fit(X_train_scaled, y_train)
            
            # Get best model
            best_model = grid_search.best_estimator_
            
            # Evaluate model
            y_pred = best_model.predict(X_test_scaled)
            logger.info("\nClassification Report:")
            logger.info(classification_report(y_test, y_pred))
            
            # Save model and scaler
            model_path = f"{self.models_dir}/risk_assessment.joblib"
            scaler_path = f"{self.models_dir}/risk_assessment_scaler.joblib"
            joblib.dump(best_model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info(f"Risk assessment model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Error training risk assessment model: {str(e)}")
            raise

    def train_health_prediction_model(self):
        """Train health prediction model"""
        logger.info("Training health prediction model...")
        
        try:
            # Load and preprocess data
            data = pd.read_csv(f"{self.data_path}/health_prediction_data.csv")
            
            # Prepare features and targets for different prediction types
            prediction_types = ['vital_signs', 'lab_results']
            
            for pred_type in prediction_types:
                logger.info(f"Training model for {pred_type}...")
                
                X = data.drop([f'{pred_type}_target'], axis=1)
                y = data[f'{pred_type}_target']
                
                # Split data
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                
                # Scale features
                X_train_scaled = self.scaler.fit_transform(X_train)
                X_test_scaled = self.scaler.transform(X_test)
                
                # Train model
                model = XGBRegressor(
                    objective='reg:squarederror',
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=6
                )
                model.fit(
                    X_train_scaled, y_train,
                    eval_set=[(X_test_scaled, y_test)],
                    early_stopping_rounds=10,
                    verbose=False
                )
                
                # Save model and scaler
                model_path = f"{self.models_dir}/health_prediction_{pred_type}.joblib"
                scaler_path = f"{self.models_dir}/health_prediction_{pred_type}_scaler.joblib"
                joblib.dump(model, model_path)
                joblib.dump(self.scaler, scaler_path)
                
                logger.info(f"Health prediction model for {pred_type} saved to {model_path}")
                
        except Exception as e:
            logger.error(f"Error training health prediction model: {str(e)}")
            raise

    def train_anomaly_detection_model(self):
        """Train anomaly detection model"""
        logger.info("Training anomaly detection model...")
        
        try:
            # Load and preprocess data
            data = pd.read_csv(f"{self.data_path}/anomaly_detection_data.csv")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(data)
            
            # Train isolation forest model
            model = IsolationForest(
                n_estimators=100,
                contamination=0.1,
                random_state=42
            )
            model.fit(X_scaled)
            
            # Save model and scaler
            model_path = f"{self.models_dir}/anomaly_detection.joblib"
            scaler_path = f"{self.models_dir}/anomaly_detection_scaler.joblib"
            joblib.dump(model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info(f"Anomaly detection model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Error training anomaly detection model: {str(e)}")
            raise

    def train_all_models(self):
        """Train all models"""
        try:
            self.train_risk_assessment_model()
            self.train_health_prediction_model()
            self.train_anomaly_detection_model()
            logger.info("All models trained successfully!")
            
        except Exception as e:
            logger.error(f"Error training models: {str(e)}")
            raise

if __name__ == "__main__":
    # Initialize trainer
    trainer = ModelTrainer(
        data_path="data/training",
        models_dir="models"
    )
    
    # Train all models
    trainer.train_all_models()
