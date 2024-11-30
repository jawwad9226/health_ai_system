export type FilterOperator =
  | 'equals'
  | 'not equals'
  | 'contains'
  | 'starts with'
  | 'ends with'
  | 'greater than'
  | 'less than'
  | 'between'
  | 'after'
  | 'before';

export type FilterFieldType = 'string' | 'number' | 'date' | 'boolean';

export interface FilterField {
  name: string;
  label: string;
  type: FilterFieldType;
  operators: FilterOperator[];
}

export interface FilterConfig {
  fields: FilterField[];
  storageKey: string;
}

export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | Date;
}

export interface SavedFilter {
  id: string;
  name: string;
  description: string;
  values: FilterValue[];
  createdAt: string;
  updatedAt: string;
}

// Operator configurations for different field types
export const FILTER_OPERATORS: Record<FilterFieldType, FilterOperator[]> = {
  string: ['equals', 'not equals', 'contains', 'starts with', 'ends with'],
  number: ['equals', 'not equals', 'greater than', 'less than', 'between'],
  date: ['equals', 'not equals', 'after', 'before', 'between'],
  boolean: ['equals', 'not equals'],
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  'equals': 'Equals',
  'not equals': 'Not Equals',
  'contains': 'Contains',
  'starts with': 'Starts With',
  'ends with': 'Ends With',
  'greater than': 'Greater Than',
  'less than': 'Less Than',
  'between': 'Between',
  'after': 'After',
  'before': 'Before',
};
