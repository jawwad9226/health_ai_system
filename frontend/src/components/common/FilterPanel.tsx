import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  Fab,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FilterBuilder, FilterCondition } from './FilterBuilder';
import { useFilters } from '../../hooks/useFilters';
import { FilterConfig, FilterField } from '../../types/filter';
import { formatFilterDescription } from '../../utils/filterUtils';

interface FilterPanelProps {
  config: FilterConfig;
  onFilterChange: (conditions: FilterCondition[]) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  config,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [currentConditions, setCurrentConditions] = useState<FilterCondition[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    savedFilters,
    activeFilter,
    saveFilter,
    loadFilter,
    deleteFilter,
    applyFilter,
    clearFilter,
  } = useFilters({
    storageKey: config.storageKey,
    onFilterApply: onFilterChange,
  });

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      conditions: currentConditions,
    };

    saveFilter(newFilter);
    setSaveDialogOpen(false);
    setFilterName('');
  };

  const handleApplyFilter = (conditions: FilterCondition[]) => {
    setCurrentConditions(conditions);
    applyFilter(conditions);
  };

  const fieldLabels = config.fields.reduce((acc, field) => {
    acc[field.name] = field.label;
    return acc;
  }, {} as Record<string, string>);

  const FilterContent = () => (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
      <Box sx={{ flex: 2, minWidth: isMobile ? 'auto' : '300px' }}>
        <FilterBuilder
          fields={config.fields}
          conditions={currentConditions}
          onChange={handleApplyFilter}
        />
      </Box>
      {savedFilters.length > 0 && (
        <Box sx={{ 
          flex: 1,
          minWidth: isMobile ? 'auto' : '200px',
          mt: isMobile ? 2 : 0 
        }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Saved Filters
          </Typography>
          {savedFilters.map((filter) => (
            <Box
              key={filter.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{filter.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => loadFilter(filter)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => deleteFilter(filter.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ 
        mb: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 1
      }}>
        <Button
          startIcon={<FilterListIcon />}
          variant="outlined"
          onClick={() => setIsOpen(true)}
          fullWidth={isMobile}
          sx={{ mb: isMobile ? 1 : 0 }}
        >
          {activeFilter ? activeFilter.name : 'Configure Filters'}
        </Button>
        
        {currentConditions.length > 0 && (
          <Box sx={{ 
            display: 'flex',
            gap: 1,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              startIcon={<SaveIcon />}
              onClick={() => setSaveDialogOpen(true)}
              fullWidth={isMobile}
            >
              Save Filter
            </Button>
            <Button
              color="secondary"
              onClick={() => {
                clearFilter();
                setCurrentConditions([]);
              }}
              fullWidth={isMobile}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          PaperProps={{
            sx: {
              height: '90vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 2,
            },
          }}
        >
          <DialogTitle>Configure Filters</DialogTitle>
          <DialogContent>
            <FilterContent />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogActions>
        </Drawer>
      ) : (
        <Dialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Configure Filters</DialogTitle>
          <DialogContent>
            <FilterContent />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Save Filter</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Filter Name"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
