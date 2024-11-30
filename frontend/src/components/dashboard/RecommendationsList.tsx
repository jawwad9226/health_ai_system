import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline,
  RadioButtonUnchecked,
  PlayCircleOutline,
  CancelOutlined,
} from '@mui/icons-material';
import { Recommendation } from '../../types';
import { useRecommendation } from '../../context/RecommendationContext';

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ recommendations }) => {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { updateRecommendationStatus } = useRecommendation();

  const handleExpandClick = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutline color="success" />;
      case 'in_progress':
        return <PlayCircleOutline color="info" />;
      case 'dismissed':
        return <CancelOutlined color="error" />;
      default:
        return <RadioButtonUnchecked color="action" />;
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await updateRecommendationStatus(id, newStatus);
    } catch (error) {
      console.error('Failed to update recommendation status:', error);
    }
  };

  if (!recommendations.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommendations
        </Typography>
        <Typography color="text.secondary">
          No recommendations available at this time.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recommendations
      </Typography>
      <List>
        {recommendations.map((recommendation) => (
          <React.Fragment key={recommendation.id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:last-child': { mb: 0 },
              }}
            >
              <ListItemIcon>
                {getStatusIcon(recommendation.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {recommendation.title}
                    </Typography>
                    <Chip
                      label={recommendation.priority}
                      size="small"
                      color={getPriorityColor(recommendation.priority) as any}
                    />
                    <Chip
                      label={recommendation.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {recommendation.description}
                    </Typography>
                    <IconButton
                      onClick={() => handleExpandClick(recommendation.id)}
                      sx={{
                        transform: expandedId === recommendation.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: '0.3s',
                      }}
                      size="small"
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                }
              />
            </ListItem>
            <Collapse in={expandedId === recommendation.id}>
              <Box sx={{ pl: 9, pr: 2, pb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Actions:
                </Typography>
                <List dense>
                  {recommendation.actions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {recommendation.status !== 'completed' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleStatusUpdate(recommendation.id, 'completed')}
                    >
                      Mark as Complete
                    </Button>
                  )}
                  {recommendation.status === 'pending' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => handleStatusUpdate(recommendation.id, 'in_progress')}
                    >
                      Start Working
                    </Button>
                  )}
                  {recommendation.status !== 'dismissed' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleStatusUpdate(recommendation.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                  )}
                </Box>
              </Box>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RecommendationsList;
