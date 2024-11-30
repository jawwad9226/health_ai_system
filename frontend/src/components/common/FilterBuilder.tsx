import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

export interface FilterCondition {
  field: string;
  operator: string;
  value: string | number;
}

export interface Filter {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

interface FilterBuilderProps {
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'select';
    options?: string[];
  }>;
  onApplyFilter: (conditions: FilterCondition[]) => void;
  onSaveFilter?: (filter: Filter) => void;
  savedFilters?: Filter[];
  onLoadFilter?: (filter: Filter) => void;
}

const operators = {
  string: ['equals', 'contains', 'starts with', 'ends with'],
  number: ['equals', 'greater than', 'less than', 'between'],
  date: ['equals', 'after', 'before', 'between'],
  select: ['equals', 'not equals'],
};

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  fields,
  onApplyFilter,
  onSaveFilter,
  savedFilters = [],
  onLoadFilter,
}) => {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: fields[0].name,
        operator: operators[fields[0].type][0],
        value: '',
      },
    ]);
  };

  const removeCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  const updateCondition = (
    index: number,
    field: keyof FilterCondition,
    value: string
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    };
    setConditions(newConditions);
  };

  const handleApplyFilter = () => {
    onApplyFilter(conditions);
  };

  const handleSaveFilter = () => {
    if (onSaveFilter && filterName) {
      onSaveFilter({
        id: Date.now().toString(),
        name: filterName,
        conditions,
      });
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadFilter = (filter: Filter) => {
    setConditions(filter.conditions);
    if (onLoadFilter) {
      onLoadFilter(filter);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FilterIcon />
        <Typography variant="h6">Advanced Filter</Typography>
      </Box>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Saved Filters
          </Typography>
          <Stack direction="row" spacing={1}>
            {savedFilters.map((filter) => (
              <Chip
                key={filter.id}
                label={filter.name}
                onClick={() => handleLoadFilter(filter)}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Filter Conditions */}
      {conditions.map((condition, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            alignItems: 'center',
          }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={condition.field}
              label="Field"
              onChange={(e) =>
                updateCondition(index, 'field', e.target.value as string)
              }
            >
              {fields.map((field) => (
                <MenuItem key={field.name} value={field.name}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Operator</InputLabel>
            <Select
              value={condition.operator}
              label="Operator"
              onChange={(e) =>
                updateCondition(index, 'operator', e.target.value as string)
              }
            >
              {operators[
                fields.find((f) => f.name === condition.field)?.type || 'string'
              ].map((op) => (
                <MenuItem key={op} value={op}>
                  {op}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Value"
            value={condition.value}
            onChange={(e) =>
              updateCondition(index, 'value', e.target.value)
            }
            sx={{ flexGrow: 1 }}
          />

          <Tooltip title="Remove condition">
            <IconButton
              size="small"
              onClick={() => removeCondition(index)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ))}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={addCondition}
        >
          Add Condition
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={handleApplyFilter}
          disabled={conditions.length === 0}
        >
          Apply Filter
        </Button>

        {onSaveFilter && (
          <>
            <Button
              startIcon={<SaveIcon />}
              variant="outlined"
              size="small"
              onClick={() => setShowSaveDialog(true)}
              disabled={conditions.length === 0}
            >
              Save Filter
            </Button>

            {showSaveDialog && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Filter Name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveFilter}
                  disabled={!filterName}
                >
                  Save
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default FilterBuilder;
