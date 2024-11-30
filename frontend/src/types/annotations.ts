export interface Point {
  x: number;
  y: number;
}

export interface AnnotationMetadata {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  studyId?: string;
  patientId?: string;
}

export interface AnnotationShape {
  id: string;
  tool: 'pen' | 'line' | 'circle' | 'rectangle';
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface Annotation {
  id: string;
  imageId: string;
  version: number;
  annotations: AnnotationShape[];
  layers?: any[];
  measurements?: any[];
  labels?: string[];
  metadata: AnnotationMetadata;
}

export interface MeasurementData {
  type: 'distance' | 'area' | 'angle';
  value: number;
  unit: string;
  points: number[];
}

export interface AnnotationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  annotations: AnnotationShape[];
}
