import pandas as pd import numpy as np from sklearn.preprocessing import StandardScaler class DataProcessor: def __init__(self): self.scaler = StandardScaler() def preprocess_data(self, data: pd.DataFrame): \
\\Preprocess
the
input
data
for
ML
model\\\ # Basic preprocessing steps data = data.copy() # Handle missing values data = data.fillna(0) # Normalize numerical columns numerical_cols = data.select_dtypes(include=['float64', 'int64']).columns if len(numerical_cols) > 0: data[numerical_cols] = self.scaler.fit_transform(data[numerical_cols]) return data
