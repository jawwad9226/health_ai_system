import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import {
  Analytics,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Finding {
  id: string;
  description: string;
  severity: 'critical' | 'warning' | 'normal' | 'info';
  confidence: number;
  location?: string;
  recommendations?: string[];
}

interface ImageAnalysisProps {
  imageId: string;
  onAnalyze: (imageId: string) => Promise<Finding[]>;
}

const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ imageId, onAnalyze }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await onAnalyze(imageId);
      setFindings(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'normal':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'normal':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Image Analysis
        </Typography>
        <Button
          variant="contained"
          startIcon={<Analytics />}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}
          >
            <CircularProgress />
          </motion.div>
        ) : findings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <List>
              {findings.map((finding, index) => (
                <React.Fragment key={finding.id}>
                  {index > 0 && <Divider />}
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getSeverityIcon(finding.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {finding.description}
                          </Typography>
                          <Chip
                            label={`${Math.round(finding.confidence * 100)}% confidence`}
                            size="small"
                            color={getSeverityColor(finding.severity)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {finding.location && (
                            <Typography variant="body2" color="text.secondary">
                              Location: {finding.location}
                            </Typography>
                          )}
                          {finding.recommendations && finding.recommendations.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Recommendations:
                              </Typography>
                              <List dense>
                                {finding.recommendations.map((rec, idx) => (
                                  <ListItem key={idx}>
                                    <ListItemText
                                      primary={rec}
                                      primaryTypographyProps={{
                                        variant: 'body2',
                                        color: 'text.secondary',
                                      }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </motion.div>
        ) : !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Typography color="text.secondary" align="center">
              Click "Analyze Image" to start AI-powered image analysis
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
};

export default ImageAnalysis;
