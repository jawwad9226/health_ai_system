import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'

def test_health_endpoints():
    """Test the health record endpoints"""
    print("\nTesting Health Record Endpoints...")
    
    # Test data
    test_health_data = {
        "age": 35,
        "gender": "male",
        "bloodPressureSystolic": 130,
        "bloodPressureDiastolic": 85,
        "heartRate": 75,
        "weight": 80,
        "height": 175,
        "exerciseFrequency": 3,
        "sleepDuration": 7,
        "medicalConditions": {
            "diabetes": False,
            "hypertension": False,
            "asthma": False
        },
        "notes": "Test health record"
    }

    # 1. Register a test user
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"Register Response: {response.status_code}")
        print(f"Register Response Body: {response.text}")
        assert response.status_code in [201, 400], "Registration failed"
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return

    # 2. Login to get token
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login Response: {response.status_code}")
        print(f"Login Response Body: {response.text}")
        assert response.status_code == 200, "Login failed"
        token = response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
    except Exception as e:
        print(f"Login error: {str(e)}")
        return

    # 3. Create health record
    try:
        response = requests.post(
            f"{BASE_URL}/health-records",
            headers=headers,
            json=test_health_data
        )
        print(f"Create Health Record Response: {response.status_code}")
        print(f"Create Health Record Response Body: {response.text}")
        assert response.status_code == 201, "Failed to create health record"
    except Exception as e:
        print(f"Health record creation error: {str(e)}")
        return

    # 4. Get latest health record
    try:
        response = requests.get(
            f"{BASE_URL}/health-records/latest",
            headers=headers
        )
        print(f"Get Latest Health Record Response: {response.status_code}")
        print("Latest health record data:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Get health record error: {str(e)}")
        return

    # 5. Get risk predictions
    try:
        response = requests.get(
            f"{BASE_URL}/predictions/latest",
            headers=headers
        )
        print(f"Get Risk Predictions Response: {response.status_code}")
        print("Risk prediction data:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Risk prediction error: {str(e)}")
        return

    # 6. Get recommendations
    try:
        response = requests.get(
            f"{BASE_URL}/recommendations",
            headers=headers
        )
        print(f"Get Recommendations Response: {response.status_code}")
        print("Recommendations data:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Recommendations error: {str(e)}")
        return

    print("\nAll tests completed successfully!")

if __name__ == "__main__":
    # Wait for servers to start
    time.sleep(5)
    test_health_endpoints()
