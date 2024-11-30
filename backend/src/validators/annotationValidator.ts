import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

// Define interfaces for annotation data structures
export interface AnnotationCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface AnnotationItem {
  type: string;
  coordinates: AnnotationCoordinates;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

export interface Measurement {
  type: string;
  value: number;
  unit: string;
  coordinates: AnnotationCoordinates[];
}

export interface Label {
  id: string;
  text: string;
  confidence?: number;
  coordinates?: AnnotationCoordinates;
}

export interface AnnotationData {
  imageId: string;
  annotations: AnnotationItem[];
  layers: Layer[];
  measurements: Measurement[];
  labels: Label[];
  metadata?: Record<string, unknown>;
}

// Create Ajv instance with strict mode and custom formats
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
});

// Add formats like uri, email, etc.
addFormats(ajv);

// Define the JSON schema for coordinates
const coordinatesSchema: JSONSchemaType<AnnotationCoordinates> = {
  type: 'object',
  properties: {
    x: { type: 'number' },
    y: { type: 'number' },
    width: { type: 'number', nullable: true },
    height: { type: 'number', nullable: true }
  },
  required: ['x', 'y'],
  additionalProperties: false
};

// Define the JSON schema for annotation items
const annotationItemSchema: JSONSchemaType<AnnotationItem> = {
  type: 'object',
  properties: {
    type: { type: 'string', minLength: 1 },
    coordinates: coordinatesSchema
  },
  required: ['type', 'coordinates'],
  additionalProperties: false
};

// Define the JSON schema for layers
const layerSchema: JSONSchemaType<Layer> = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    visible: { type: 'boolean' },
    opacity: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['id', 'name', 'visible', 'opacity'],
  additionalProperties: false
};

// Define the JSON schema for measurements
const measurementSchema: JSONSchemaType<Measurement> = {
  type: 'object',
  properties: {
    type: { type: 'string', minLength: 1 },
    value: { type: 'number' },
    unit: { type: 'string', minLength: 1 },
    coordinates: { 
      type: 'array', 
      items: coordinatesSchema,
      minItems: 1
    }
  },
  required: ['type', 'value', 'unit', 'coordinates'],
  additionalProperties: false
};

// Define the JSON schema for labels
const labelSchema: JSONSchemaType<Label> = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    text: { type: 'string', minLength: 1 },
    confidence: { type: 'number', nullable: true, minimum: 0, maximum: 1 },
    coordinates: { ...coordinatesSchema, nullable: true }
  },
  required: ['id', 'text'],
  additionalProperties: false
};

// Define the complete annotation data schema
const annotationSchema: JSONSchemaType<AnnotationData> = {
  type: 'object',
  properties: {
    imageId: { type: 'string', minLength: 1, maxLength: 100 },
    annotations: { 
      type: 'array', 
      items: annotationItemSchema,
      minItems: 1
    },
    layers: { 
      type: 'array', 
      items: layerSchema,
      default: []
    },
    measurements: { 
      type: 'array', 
      items: measurementSchema,
      default: []
    },
    labels: { 
      type: 'array', 
      items: labelSchema,
      default: []
    },
    metadata: {
      type: 'object',
      nullable: true,
      additionalProperties: true
    }
  },
  required: ['imageId', 'annotations'],
  additionalProperties: false
};

// Compile the schema
const validateSchema = ajv.compile(annotationSchema);

// Define validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Export validation function
export const validateAnnotationSchema = (data: unknown): ValidationResult => {
  const valid = validateSchema(data);
  const errors = validateSchema.errors?.map(err => 
    `${err.instancePath} ${err.message}`
  ) || [];
  
  return {
    valid,
    errors
  };
};
