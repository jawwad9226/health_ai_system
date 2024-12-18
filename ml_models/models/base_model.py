from abc import ABC, abstractmethod
import joblib

class BaseModel(ABC):
    def __init__(self):
        self.model = None
        
    @abstractmethod
    def train(self, X, y):
        pass
        
    @abstractmethod
    def predict(self, X):
        pass
        
    def save_model(self, path):
        \
\\Save
the
model
to
disk\\\
        joblib.dump(self.model, path)
        
    def load_model(self, path):
        \\\Load
the
model
from
disk\\\
        self.model = joblib.load(path)
