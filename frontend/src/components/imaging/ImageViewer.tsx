import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Slider,
  Typography,
  Stack,
  Button,
  Tooltip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  Contrast,
  Brightness6,
  RotateLeft,
  RotateRight,
  Save,
  Fullscreen,
} from '@mui/icons-material';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';

interface ImageViewerProps {
  imageUrl: string;
  metadata?: {
    patientId: string;
    studyDate: string;
    modality: string;
    bodyPart: string;
  };
  onSave?: (imageData: string) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, metadata, onSave }) => {
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  const handleZoom = (delta: number) => {
    setZoom(Math.max(0.1, Math.min(5, zoom + delta)));
  };

  const handleRotate = (delta: number) => {
    setRotation((prev) => (prev + delta) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setBrightness(0);
    setContrast(0);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = () => {
    if (stageRef.current && onSave) {
      const dataUrl = stageRef.current.toDataURL();
      onSave(dataUrl);
    }
  };

  const handleFullscreen = () => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    }
  };

  const filters = [
    Konva.Filters.Brighten,
    Konva.Filters.Contrast,
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {/* Image Controls */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => handleZoom(0.1)}>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={() => handleZoom(-0.1)}>
            <ZoomOut />
          </IconButton>
          <IconButton onClick={() => handleRotate(-90)}>
            <RotateLeft />
          </IconButton>
          <IconButton onClick={() => handleRotate(90)}>
            <RotateRight />
          </IconButton>
          <IconButton onClick={handleReset}>
            <Refresh />
          </IconButton>
          <IconButton onClick={handleFullscreen}>
            <Fullscreen />
          </IconButton>
          <IconButton onClick={handleSave}>
            <Save />
          </IconButton>
        </Stack>
      </Box>

      {/* Image Adjustments */}
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Brightness</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Brightness6 />
          <Slider
            value={brightness}
            min={-1}
            max={1}
            step={0.1}
            onChange={(_, value) => setBrightness(value as number)}
          />
        </Stack>

        <Typography gutterBottom>Contrast</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Contrast />
          <Slider
            value={contrast}
            min={-1}
            max={1}
            step={0.1}
            onChange={(_, value) => setContrast(value as number)}
          />
        </Stack>
      </Box>

      {/* Image Display */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Stage
          ref={stageRef}
          width={800}
          height={600}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (isDragging) {
              setPosition({
                x: position.x + e.evt.movementX,
                y: position.y + e.evt.movementY,
              });
            }
          }}
        >
          <Layer>
            {image && (
              <KonvaImage
                ref={imageRef}
                image={image}
                x={position.x}
                y={position.y}
                scaleX={zoom}
                scaleY={zoom}
                rotation={rotation}
                filters={filters}
                brightness={brightness}
                contrast={contrast}
                draggable
              />
            )}
          </Layer>
        </Stage>
      </Box>

      {/* Metadata Display */}
      {metadata && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Image Information
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Patient ID
              </Typography>
              <Typography>{metadata.patientId}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Study Date
              </Typography>
              <Typography>{metadata.studyDate}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Modality
              </Typography>
              <Typography>{metadata.modality}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Body Part
              </Typography>
              <Typography>{metadata.bodyPart}</Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default ImageViewer;
