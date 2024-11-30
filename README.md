# Health AI Risk Prediction System

A comprehensive web application for personalized health risk assessment and monitoring, integrating advanced machine learning techniques with a user-friendly interface.


## Features

- User Authentication (Register/Login)
- Health Risk Assessment
- Personalized Health Predictions
- Health Data Tracking
- Interactive Dashboard
- Secure API Integration
- Real-time Health Monitoring
- Custom Health Recommendations


## Recent Improvements

### Error Handling

- Comprehensive error boundary implementation
- User-friendly error messages
- Detailed error information in development mode
- Graceful fallback UI for runtime errors


### Offline Support

- Service Worker implementation for offline functionality
- Intelligent caching strategies for static assets
- Offline fallback page
- Network-first strategy for API calls
- Cache-first strategy for static resources


### Performance Optimizations

- React component memoization
- Efficient routing configuration
- Optimized build process
- Smart caching strategies


### Security Enhancements

- Rate limiting implementation
- Input sanitization
- Token-based authentication
- Secure data handling


## Tech Stack

### Frontend

- React.js
- Tailwind CSS for styling
- Axios for API requests
- React Router for navigation
- JWT for authentication


### Backend

- Flask
- SQLAlchemy ORM
- JWT Authentication
- SQLite Database
- NumPy for calculations


## Prerequisites

- Python 3.8+ (3.12 recommended)
- Node.js 16+ and npm
- Git
- Windows OS (for current setup)


## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd ../frontend
   npm install
   ```

3. Start the development servers:
   ```bash
   # Backend
   cd backend
   python app.py

   # Frontend
   cd ../frontend
   npm start
   ```

4. Build for production:
   ```bash
   cd frontend
   npm run build
   ```


## Testing

- Run frontend tests: `npm test`
- Run backend tests: `python -m pytest`
- Test offline functionality using Chrome DevTools
- Test error handling by triggering various error conditions


## Running the Application

### 1. Start Backend Server

```bash
# Make sure you're in the backend directory and virtual environment is activated
cd backend
python app.py
```
The backend server will start at `http://localhost:5000`


### 2. Start Frontend Development Server

```bash
# In a new terminal, navigate to frontend directory
cd frontend
npm start
```
The frontend will start at `http://localhost:3000`


## Accessing the Application

1. Open your web browser and go to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Default test account:
   - Email: jams9226@gmail.com
   - Password: SJAM9226


## Common Issues and Solutions

### Backend Issues

1. **Port 5000 Already in Use**

   ```bash
   # Kill the process using port 5000
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

2. **Database Errors**

   ```bash
   # If you encounter database issues, delete the existing database and restart:
   # Remove health_ai.db from backend directory
   # Restart the backend server - it will create a new database
   ```

3. **Module Not Found Errors**

   ```bash
   # Make sure you're in your virtual environment
   # Reinstall requirements:
   pip install -r requirements.txt
   ```


### Frontend Issues

1. **Node Modules Issues**

   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```

2. **CORS Errors**

   - Ensure backend is running on port 5000
   - Check that frontend is making requests to `http://localhost:5000`
   - Verify CORS configuration in backend/app.py

3. **Authentication Errors**

   - Clear browser local storage
   - Try registering a new account
   - Check browser console for specific error messages


## Development Notes

- Backend API endpoints are prefixed with `/api`
- Authentication uses JWT tokens
- Frontend stores auth token in localStorage
- Database is SQLite by default
- CORS is configured for localhost development


## Security Notes

- Never commit sensitive information like API keys
- Default SECRET_KEY is for development only
- Change all secret keys in production
- Use environment variables for sensitive data


## Contributing

1. Create a new branch for features
2. Follow existing code style
3. Update documentation as needed
4. Test thoroughly before submitting PR


## License

[Your License Here]
