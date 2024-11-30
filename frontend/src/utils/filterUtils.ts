import { FilterCondition } from '../components/common/FilterBuilder';

type DataItem = Record<string, any>;

const compareValues = (
  value: any,
  condition: FilterCondition,
  fieldType: string
): boolean => {
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(value) === String(conditionValue);
    
    case 'not equals':
      return String(value) !== String(conditionValue);
    
    case 'contains':
      return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
    
    case 'starts with':
      return String(value).toLowerCase().startsWith(String(conditionValue).toLowerCase());
    
    case 'ends with':
      return String(value).toLowerCase().endsWith(String(conditionValue).toLowerCase());
    
    case 'greater than':
      if (fieldType === 'date') {
        return new Date(value) > new Date(conditionValue);
      }
      return Number(value) > Number(conditionValue);
    
    case 'less than':
      if (fieldType === 'date') {
        return new Date(value) < new Date(conditionValue);
      }
      return Number(value) < Number(conditionValue);
    
    case 'between':
      if (typeof conditionValue === 'string' && conditionValue.includes(',')) {
        const [min, max] = conditionValue.split(',').map(v => v.trim());
        if (fieldType === 'date') {
          const date = new Date(value);
          return date >= new Date(min) && date <= new Date(max);
        }
        return Number(value) >= Number(min) && Number(value) <= Number(max);
      }
      return false;
    
    case 'after':
      if (fieldType === 'date') {
        return new Date(value) > new Date(conditionValue);
      }
      return false;
    
    case 'before':
      if (fieldType === 'date') {
        return new Date(value) < new Date(conditionValue);
      }
      return false;
    
    default:
      return false;
  }
};

export const applyFilters = (
  data: DataItem[],
  conditions: FilterCondition[],
  fieldTypes: Record<string, string>
): DataItem[] => {
  if (!conditions.length) return data;

  return data.filter(item => {
    return conditions.every(condition => {
      const value = item[condition.field];
      if (value === undefined || value === null) return false;
      
      return compareValues(
        value,
        condition,
        fieldTypes[condition.field] || 'string'
      );
    });
  });
};

export const extractNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return acc;
    return acc[part];
  }, obj);
};

export const formatFilterDescription = (
  conditions: FilterCondition[],
  fieldLabels: Record<string, string>
): string => {
  return conditions
    .map(condition => {
      const fieldLabel = fieldLabels[condition.field] || condition.field;
      return `${fieldLabel} ${condition.operator} ${condition.value}`;
    })
    .join(' AND ');
};
