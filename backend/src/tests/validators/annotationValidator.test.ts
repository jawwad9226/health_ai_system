import { validateAnnotationSchema } from '../../validators/annotationValidator';

describe('Annotation Validator', () => {
  // Valid annotation data
  const validAnnotation = {
    imageId: 'test-image-123',
    annotations: [
      { 
        type: 'rectangle', 
        coordinates: { x: 10, y: 20, width: 50, height: 30 } 
      }
    ],
    layers: [{ name: 'Layer 1' }],
    measurements: [{ type: 'distance', value: 10.5 }],
    labels: ['medical', 'diagnosis'],
    metadata: {
      studyId: 'study-001',
      patientId: 'patient-123'
    }
  };

  // Test cases for validation
  describe('Validation Scenarios', () => {
    test('should validate a complete, valid annotation', () => {
      const result = validateAnnotationSchema(validAnnotation);
      expect(result.valid).toBe(true);
    });

    test('should reject annotation without imageId', () => {
      const invalidAnnotation = { ...validAnnotation };
      delete invalidAnnotation.imageId;

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('');
    });

    test('should reject annotation without annotations', () => {
      const invalidAnnotation = { ...validAnnotation };
      delete invalidAnnotation.annotations;

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject empty annotations array', () => {
      const invalidAnnotation = { 
        ...validAnnotation, 
        annotations: [] 
      };

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject imageId that is too long', () => {
      const invalidAnnotation = { 
        ...validAnnotation, 
        imageId: 'a'.repeat(256) 
      };

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  // Metadata validation tests
  describe('Metadata Validation', () => {
    test('should allow optional metadata', () => {
      const annotationWithoutMetadata = { 
        ...validAnnotation,
        metadata: undefined 
      };

      const result = validateAnnotationSchema(annotationWithoutMetadata);
      expect(result.valid).toBe(true);
    });

    test('should reject metadata with overly long studyId', () => {
      const invalidAnnotation = { 
        ...validAnnotation, 
        metadata: { 
          studyId: 'a'.repeat(101),
          patientId: 'patient-123' 
        } 
      };

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  // Additional data type tests
  describe('Data Type Validation', () => {
    test('should reject non-object annotations', () => {
      const invalidAnnotation = { 
        ...validAnnotation, 
        annotations: ['not an object'] 
      };

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
    });

    test('should allow empty optional arrays', () => {
      const annotationWithEmptyArrays = { 
        ...validAnnotation, 
        layers: [],
        measurements: [],
        labels: [] 
      };

      const result = validateAnnotationSchema(annotationWithEmptyArrays);
      expect(result.valid).toBe(true);
    });
  });

  // Security and edge case tests
  describe('Security and Edge Cases', () => {
    test('should reject additional unexpected properties', () => {
      const invalidAnnotation = { 
        ...validAnnotation, 
        unexpectedProperty: 'malicious data' 
      };

      const result = validateAnnotationSchema(invalidAnnotation);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle nested object annotations', () => {
      const complexAnnotation = {
        ...validAnnotation,
        annotations: [{ 
          type: 'complex',
          details: {
            nested: {
              value: 'deep nested data'
            }
          }
        }]
      };

      const result = validateAnnotationSchema(complexAnnotation);
      expect(result.valid).toBe(true);
    });
  });
});
