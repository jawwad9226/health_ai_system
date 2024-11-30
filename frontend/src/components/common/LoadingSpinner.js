import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', size = 40 }) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      minHeight={200}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': {
              opacity: 0.6,
            },
            '50%': {
              opacity: 1,
            },
            '100%': {
              opacity: 0.6,
            },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
