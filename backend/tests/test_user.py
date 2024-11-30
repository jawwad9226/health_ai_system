import pytest
from app.models.user import User
from app import create_app, db

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

def test_new_user():
    """
    GIVEN a User model
    WHEN a new User is created
    THEN check the email, hashed_password, and role fields are defined correctly
    """
    user = User(
        email='test@test.com',
        password='testpassword123',
        first_name='Test',
        last_name='User',
        role='patient'
    )
    assert user.email == 'test@test.com'
    assert user.password != 'testpassword123'
    assert user.role == 'patient'
    assert user.first_name == 'Test'
    assert user.last_name == 'User'
