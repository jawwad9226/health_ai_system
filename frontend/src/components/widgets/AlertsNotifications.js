import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Notifications,
  Error,
  Info,
  Close,
  ArrowForward,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const AlertsNotifications = ({ alerts }) => {
  const theme = useTheme();

  const getAlertIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <Error sx={{ color: theme.palette.error.main }} />;
      case 'success':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      default:
        return <Info sx={{ color: theme.palette.info.main }} />;
    }
  };

  const getAlertColor = (type) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return theme.palette.warning;
      case 'error':
        return theme.palette.error;
      case 'success':
        return theme.palette.success;
      default:
        return theme.palette.info;
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={200}
      >
        <Box textAlign="center">
          <Notifications sx={{ fontSize: 48, color: theme.palette.grey[300] }} />
          <Typography variant="subtitle1" color="textSecondary">
            No new notifications
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <List>
      {alerts.map((alert, index) => {
        const alertColor = getAlertColor(alert.type);

        return (
          <React.Fragment key={alert.id}>
            <ListItem
              sx={{
                borderRadius: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                ...(alert.unread && {
                  bgcolor: alertColor.light + '20',
                }),
              }}
            >
              <ListItemIcon>{getAlertIcon(alert.type)}</ListItemIcon>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1">{alert.title}</Typography>
                    {alert.unread && (
                      <Chip
                        label="New"
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: alertColor.main,
                          color: alertColor.contrastText,
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {alert.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <Box>
                  {alert.actionable && (
                    <IconButton
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => {/* Handle action */}}
                    >
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {/* Handle dismiss */}}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            {index < alerts.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default AlertsNotifications;
