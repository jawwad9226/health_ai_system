import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateDate,
  validateHealthMetric,
  validateForm
} from '../../utils/validation';

describe('Form Validation Utils', () => {
  describe('Email Validation', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('rejects incorrect email formats', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongP@ss123')).toBe(true);
      expect(validatePassword('Complex1ty!')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('password')).toBe(false);
    });

    it('enforces minimum length', () => {
      expect(validatePassword('Sh0rt!')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    it('validates correct phone formats', () => {
      expect(validatePhone('123-456-7890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
      expect(validatePhone('1234567890')).toBe(true);
    });

    it('rejects incorrect phone formats', () => {
      expect(validatePhone('123-456')).toBe(false);
      expect(validatePhone('abc-def-ghij')).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('validates correct date formats', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('01/15/2024')).toBe(true);
    });

    it('rejects incorrect date formats', () => {
      expect(validateDate('2024/13/45')).toBe(false);
      expect(validateDate('invalid-date')).toBe(false);
    });

    it('handles future and past dates appropriately', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 100);

      expect(validateDate(futureDate.toISOString().split('T')[0])).toBe(true);
      expect(validateDate(pastDate.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('Health Metric Validation', () => {
    it('validates blood pressure readings', () => {
      expect(validateHealthMetric('bloodPressure', '120/80')).toBe(true);
      expect(validateHealthMetric('bloodPressure', '200/110')).toBe(false);
    });

    it('validates heart rate readings', () => {
      expect(validateHealthMetric('heartRate', '75')).toBe(true);
      expect(validateHealthMetric('heartRate', '200')).toBe(false);
    });

    it('validates temperature readings', () => {
      expect(validateHealthMetric('temperature', '98.6')).toBe(true);
      expect(validateHealthMetric('temperature', '105')).toBe(false);
    });

    it('validates glucose levels', () => {
      expect(validateHealthMetric('glucose', '100')).toBe(true);
      expect(validateHealthMetric('glucose', '500')).toBe(false);
    });
  });

  describe('Form Validation', () => {
    const mockForm = {
      email: 'test@example.com',
      password: 'StrongP@ss123',
      phone: '123-456-7890',
      dateOfBirth: '1990-01-01',
      healthMetrics: {
        bloodPressure: '120/80',
        heartRate: '75',
        temperature: '98.6',
        glucose: '100'
      }
    };

    it('validates complete forms', () => {
      const { isValid, errors } = validateForm(mockForm);
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    it('identifies multiple validation errors', () => {
      const invalidForm = {
        ...mockForm,
        email: 'invalid-email',
        password: 'weak',
        healthMetrics: {
          ...mockForm.healthMetrics,
          bloodPressure: '200/110'
        }
      };

      const { isValid, errors } = validateForm(invalidForm);
      expect(isValid).toBe(false);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('handles missing required fields', () => {
      const incompleteForm = {
        email: 'test@example.com'
      };

      const { isValid, errors } = validateForm(incompleteForm);
      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('password');
      expect(errors).toHaveProperty('phone');
    });
  });
});
