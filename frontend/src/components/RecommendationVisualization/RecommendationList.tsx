import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  FitnessCenter,
  LocalHospital,
  Restaurant,
  Favorite,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { Recommendation } from '../../types';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onStatusUpdate?: (id: number, status: string) => void;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  onStatusUpdate,
}) => {
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  const handleExpand = (id: number) => {
    setExpandedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'exercise':
        return <FitnessCenter />;
      case 'medical':
        return <LocalHospital />;
      case 'nutrition':
        return <Restaurant />;
      default:
        return <Favorite />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'dismissed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Personalized Health Recommendations
      </Typography>
      <List>
        {recommendations.map((recommendation) => (
          <React.Fragment key={recommendation.id}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={recommendation.priority}
                    color={getPriorityColor(recommendation.priority) as any}
                    size="small"
                  />
                  <IconButton
                    onClick={() => handleExpand(recommendation.id)}
                    edge="end"
                  >
                    {expandedItems.includes(recommendation.id) ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>{getCategoryIcon(recommendation.category)}</ListItemIcon>
              <ListItemText
                primary={recommendation.title}
                secondary={
                  <Chip
                    label={recommendation.status}
                    color={getStatusColor(recommendation.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                }
              />
            </ListItem>
            <Collapse
              in={expandedItems.includes(recommendation.id)}
              timeout="auto"
              unmountOnExit
            >
              <Box sx={{ pl: 9, pr: 2, pb: 2 }}>
                <Typography variant="body2" paragraph>
                  {recommendation.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Recommended Actions:
                </Typography>
                <List dense>
                  {recommendation.actions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>•</ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
                {onStatusUpdate && recommendation.status !== 'completed' && recommendation.status !== 'dismissed' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <IconButton
                      color="success"
                      onClick={() =>
                        onStatusUpdate(recommendation.id, 'completed')
                      }
                      size="small"
                    >
                      <CheckCircle />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() =>
                        onStatusUpdate(recommendation.id, 'dismissed')
                      }
                      size="small"
                    >
                      <Cancel />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Collapse>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RecommendationList;
