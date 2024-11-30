from flask import Flask
from flask_restx import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app)
    jwt = JWTManager(app)
    api = Api(
        app,
        version='1.0',
        title='Health AI System API',
        description='A comprehensive healthcare management API',
        doc='/api/docs'
    )

    # Import and register namespaces
    from .auth import api as auth_ns
    from .users import api as users_ns
    from .patients import api as patients_ns
    from .professionals import api as professionals_ns
    from .appointments import api as appointments_ns
    from .medical_records import api as records_ns
    from .prescriptions import api as prescriptions_ns
    from .medications import api as medications_ns
    from .vital_signs import api as vitals_ns
    from .health_metrics import api as metrics_ns
    from .documents import api as documents_ns
    from .notifications import api as notifications_ns
    from .emergency import api as emergency_ns

    # Add namespaces to API
    api.add_namespace(auth_ns, path='/api/auth')
    api.add_namespace(users_ns, path='/api/users')
    api.add_namespace(patients_ns, path='/api/patients')
    api.add_namespace(professionals_ns, path='/api/professionals')
    api.add_namespace(appointments_ns, path='/api/appointments')
    api.add_namespace(records_ns, path='/api/medical-records')
    api.add_namespace(prescriptions_ns, path='/api/prescriptions')
    api.add_namespace(medications_ns, path='/api/medications')
    api.add_namespace(vitals_ns, path='/api/vital-signs')
    api.add_namespace(metrics_ns, path='/api/health-metrics')
    api.add_namespace(documents_ns, path='/api/documents')
    api.add_namespace(notifications_ns, path='/api/notifications')
    api.add_namespace(emergency_ns, path='/api/emergency')

    return app
