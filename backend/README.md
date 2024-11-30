# Health AI System Backend

Flask-based backend for the Health AI System with ML integration.

## Features

- RESTful API endpoints
- JWT authentication
- SQLAlchemy ORM
- Database migrations with Alembic
- ML model integration
- Health data processing
- Risk prediction algorithms
- Recommendation engine

## Tech Stack

- Python 3.12
- Flask 3.0
- SQLAlchemy
- JWT Authentication
- PostgreSQL/SQLite
- Scikit-learn
- Pytest
- Black & Flake8

## Project Structure

```
backend/
├── alembic/           # Database migrations
├── models/            # Database models
│   ├── user.py
│   ├── health_record.py
│   ├── prediction.py
│   └── recommendation.py
├── routes/            # API routes
│   ├── auth.py
│   ├── health.py
│   ├── prediction.py
│   └── recommendation.py
├── services/          # Business logic
│   ├── auth.py
│   ├── health.py
│   └── ml.py
├── tests/            # Test files
├── app.py           # Application entry
└── config.py        # Configuration
```

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. Initialize database:
```bash
python init_db.py
```

5. Run migrations:
```bash
flask db upgrade
```

## Development

### Running the Server

Development server:
```bash
python run.py
```

Production server:
```bash
gunicorn app:app
```

### Code Style

Format code:
```bash
black .
```

Lint code:
```bash
flake8
```

Type checking:
```bash
mypy .
```

### Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=app tests/
```

### Database Migrations

Create migration:
```bash
flask db migrate -m "Migration message"
```

Apply migrations:
```bash
flask db upgrade
```

Revert migrations:
```bash
flask db downgrade
```

## API Documentation

### Authentication

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/profile` - Get user profile

### Health Records

- POST `/api/health/record` - Create health record
- GET `/api/health/records` - Get user's health records
- GET `/api/health/record/{id}` - Get specific health record

### Predictions

- POST `/api/prediction/analyze` - Get health risk prediction
- GET `/api/prediction/history` - Get prediction history

### Recommendations

- GET `/api/recommendations` - Get health recommendations
- PUT `/api/recommendation/{id}` - Update recommendation status

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

## Learn More

- [Project Documentation](../README.md)
- [Frontend Documentation](../frontend/README.md)
- [Flask Documentation](https://flask.palletsprojects.com/)
