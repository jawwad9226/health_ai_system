# Health AI System Database Schema

## Core Entities

### Users
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('patient', 'professional', 'admin') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    profile_image_url VARCHAR(255)
);
```

### Professionals
```sql
CREATE TABLE professionals (
    professional_id UUID PRIMARY KEY REFERENCES users(user_id),
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    qualification TEXT,
    years_of_experience INTEGER,
    department VARCHAR(100),
    available_for_emergency BOOLEAN DEFAULT false,
    consultation_fee DECIMAL(10,2),
    rating DECIMAL(3,2)
);
```

### Patients
```sql
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY REFERENCES users(user_id),
    blood_type VARCHAR(5),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_id VARCHAR(50),
    primary_physician_id UUID REFERENCES professionals(professional_id),
    medical_conditions TEXT[]
);
```

### Appointments
```sql
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    professional_id UUID REFERENCES professionals(professional_id),
    appointment_type VARCHAR(50) NOT NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consultation_type ENUM('in-person', 'video', 'phone') NOT NULL,
    cancellation_reason TEXT,
    follow_up_required BOOLEAN DEFAULT false
);
```

## Health Monitoring

### VitalSigns
```sql
CREATE TABLE vital_signs (
    vital_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    recorded_at TIMESTAMP NOT NULL,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    recorded_by UUID REFERENCES users(user_id),
    notes TEXT
);
```

### Medications
```sql
CREATE TABLE medications (
    medication_id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    dosage_form VARCHAR(50),
    manufacturer VARCHAR(100),
    active_ingredients TEXT[]
);
```

### Prescriptions
```sql
CREATE TABLE prescriptions (
    prescription_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    professional_id UUID REFERENCES professionals(professional_id),
    medication_id UUID REFERENCES medications(medication_id),
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    instructions TEXT,
    status ENUM('active', 'completed', 'cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Medical Records

### MedicalRecords
```sql
CREATE TABLE medical_records (
    record_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    record_type VARCHAR(50) NOT NULL,
    record_date TIMESTAMP NOT NULL,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_confidential BOOLEAN DEFAULT false
);
```

### Documents
```sql
CREATE TABLE documents (
    document_id UUID PRIMARY KEY,
    record_id UUID REFERENCES medical_records(record_id),
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);
```

## Emergency System

### EmergencyAlerts
```sql
CREATE TABLE emergency_alerts (
    alert_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    alert_type VARCHAR(50) NOT NULL,
    status ENUM('active', 'responded', 'resolved', 'false_alarm') NOT NULL,
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    responded_by UUID REFERENCES professionals(professional_id),
    notes TEXT
);
```

## Analytics & Monitoring

### HealthMetrics
```sql
CREATE TABLE health_metrics (
    metric_id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(patient_id),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50),
    notes TEXT
);
```

### Notifications
```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    action_url VARCHAR(255),
    priority ENUM('low', 'medium', 'high') NOT NULL
);
```

## Indexes and Constraints

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Appointments
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(start_time);

-- Vital Signs
CREATE INDEX idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX idx_vital_signs_date ON vital_signs(recorded_at);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- Medical Records
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);

-- Emergency Alerts
CREATE INDEX idx_emergency_alerts_patient ON emergency_alerts(patient_id);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);

-- Health Metrics
CREATE INDEX idx_health_metrics_patient ON health_metrics(patient_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
```

## Security Considerations

1. All sensitive data columns (e.g., insurance_id, license_number) should be encrypted at rest
2. Implement row-level security policies for data access control
3. Use parameterized queries to prevent SQL injection
4. Regular backup and point-in-time recovery capabilities
5. Audit logging for sensitive data access and modifications

## Data Migration Strategy

1. Create migration scripts for schema updates
2. Version control for database schema
3. Implement rollback procedures
4. Data validation checks during migration
5. Maintain backward compatibility during updates
