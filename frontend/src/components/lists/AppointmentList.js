import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  Event,
  VideoCam,
  Phone,
  PersonPin,
  Edit,
  Cancel,
} from '@mui/icons-material';
import { format } from 'date-fns';

const AppointmentList = ({ appointments }) => {
  const theme = useTheme();

  const getAppointmentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <VideoCam />;
      case 'phone':
        return <Phone />;
      default:
        return <PersonPin />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return theme.palette.success;
      case 'pending':
        return theme.palette.warning;
      case 'cancelled':
        return theme.palette.error;
      default:
        return theme.palette.info;
    }
  };

  if (!appointments || appointments.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={200}
      >
        <Typography variant="subtitle1" color="textSecondary">
          No upcoming appointments
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {appointments.map((appointment) => {
        const statusColor = getStatusColor(appointment.status);
        const appointmentDate = new Date(appointment.scheduled_time);

        return (
          <ListItem
            key={appointment.id}
            sx={{
              mb: 1,
              borderRadius: 1,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <Event />
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1">
                    {appointment.appointment_type}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      ml: 1,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {getAppointmentIcon(appointment.consultation_method)}
                  </Box>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {format(appointmentDate, 'PPP')} at{' '}
                    {format(appointmentDate, 'p')}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 0.5 }}
                  >
                    {appointment.professional_name} • {appointment.duration} mins
                  </Typography>
                </Box>
              }
            />

            <ListItemSecondaryAction>
              <Box>
                <Chip
                  label={appointment.status}
                  size="small"
                  sx={{
                    bgcolor: statusColor.light,
                    color: statusColor.dark,
                    mb: 1,
                  }}
                />
                <Box>
                  <IconButton
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => {/* Handle edit */}}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {/* Handle cancel */}}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
};

export default AppointmentList;
