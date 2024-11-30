import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  Chip,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  FilterList,
  ViewModule,
  ViewList,
  Sort,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ImageViewer from './ImageViewer';

interface MedicalImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  patientId: string;
  studyDate: string;
  modality: string;
  bodyPart: string;
  tags: string[];
}

interface ImageGalleryProps {
  images: MedicalImage[];
  onImageSelect?: (image: MedicalImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onImageSelect }) => {
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string[]>([]);

  const handleImageClick = (image: MedicalImage) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch = 
      image.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.modality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.bodyPart.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModality = selectedModality.length === 0 || selectedModality.includes(image.modality);
    const matchesBodyPart = selectedBodyPart.length === 0 || selectedBodyPart.includes(image.bodyPart);

    return matchesSearch && matchesModality && matchesBodyPart;
  });

  const modalityOptions = Array.from(new Set(images.map(img => img.modality)));
  const bodyPartOptions = Array.from(new Set(images.map(img => img.bodyPart)));

  return (
    <Box>
      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <IconButton
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
                </IconButton>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {modalityOptions.map((modality) => (
                    <Chip
                      key={modality}
                      label={modality}
                      onClick={() => {
                        if (selectedModality.includes(modality)) {
                          setSelectedModality(selectedModality.filter(m => m !== modality));
                        } else {
                          setSelectedModality([...selectedModality, modality]);
                        }
                      }}
                      color={selectedModality.includes(modality) ? 'primary' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Image Grid */}
      <Grid container spacing={2}>
        {filteredImages.map((image) => (
          <Grid
            key={image.id}
            item
            xs={12}
            sm={viewMode === 'grid' ? 6 : 12}
            md={viewMode === 'grid' ? 4 : 12}
            lg={viewMode === 'grid' ? 3 : 12}
          >
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    transition: 'all 0.3s',
                  },
                }}
                onClick={() => handleImageClick(image)}
              >
                <CardMedia
                  component="img"
                  height={viewMode === 'grid' ? 200 : 150}
                  image={image.thumbnailUrl}
                  alt={`Medical image ${image.id}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Patient ID: {image.patientId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {image.studyDate}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip label={image.modality} size="small" />
                    <Chip label={image.bodyPart} size="small" />
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    {image.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagClick(tag);
                        }}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Image Viewer Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
      >
        {selectedImage && (
          <ImageViewer
            imageUrl={selectedImage.url}
            metadata={{
              patientId: selectedImage.patientId,
              studyDate: selectedImage.studyDate,
              modality: selectedImage.modality,
              bodyPart: selectedImage.bodyPart,
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default ImageGallery;
