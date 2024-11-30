import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import DescriptionIcon from '@mui/icons-material/Description';
import { exportData } from '../../utils/exportUtils';

interface ExportButtonProps {
  data: any[];
  filterDescription?: string;
  title?: string;
  fileName?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filterDescription,
  title,
  fileName,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const exportOptions = [
    { format: 'csv', icon: <TableViewIcon />, label: 'Export as CSV' },
    { format: 'excel', icon: <DescriptionIcon />, label: 'Export as Excel' },
    { format: 'pdf', icon: <PictureAsPdfIcon />, label: 'Export as PDF' },
  ];

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    try {
      await exportData(data, format, {
        filterDescription,
        title,
        fileName,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
      setAnchorEl(null);
    }
  };

  if (isMobile) {
    return (
      <SpeedDial
        ariaLabel="Export Options"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onOpen={(e) => setAnchorEl(e.currentTarget)}
        FabProps={{
          disabled: exporting || !data.length,
        }}
      >
        {exportOptions.map((option) => (
          <SpeedDialAction
            key={option.format}
            icon={option.icon}
            tooltipTitle={option.label}
            onClick={() => handleExport(option.format as 'csv' | 'excel' | 'pdf')}
          />
        ))}
      </SpeedDial>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={exporting || !data.length}
        sx={{ minWidth: 100 }}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {exportOptions.map((option) => (
          <MenuItem 
            key={option.format}
            onClick={() => handleExport(option.format as 'csv' | 'excel' | 'pdf')}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ExportButton;
