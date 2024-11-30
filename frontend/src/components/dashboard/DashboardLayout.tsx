import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  width?: 'full' | 'half' | 'third';
}

interface DashboardLayoutProps {
  widgets: DashboardWidget[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ widgets }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const getWidgetWidth = (widget: DashboardWidget) => {
    if (isMobile) return '100%';
    if (isTablet && widget.width === 'third') return '50%';
    
    switch (widget.width) {
      case 'full':
        return '100%';
      case 'half':
        return '50%';
      case 'third':
        return '33.33%';
      default:
        return '100%';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        width: '100%',
      }}
    >
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{
            width: getWidgetWidth(widget),
            display: 'flex',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2, sm: 3 },
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease-in-out',
              },
            }}
          >
            {widget.component}
          </Paper>
        </motion.div>
      ))}
    </Box>
  );
};

export default DashboardLayout;
