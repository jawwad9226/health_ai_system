import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Slider,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Popover,
  Typography,
  Stack,
} from '@mui/material';
import {
  Create,
  Timeline,
  RadioButtonUnchecked,
  Square,
  Label,
  FormatColorFill,
  LineWeight,
  Layers,
  AddLocation,
  ViewInAr,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { Stage, Layer, Text } from 'react-konva';
import ImageAnnotation from './ImageAnnotation';

interface MeasurementData {
  type: 'distance' | 'area' | 'angle';
  value: number;
  unit: string;
  points: number[];
}

interface AnnotationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  annotations: any[];
}

interface AdvancedAnnotationProps {
  imageUrl: string;
  onSave: (data: any) => void;
  initialData?: any;
  calibrationFactor?: number;
}

const AdvancedAnnotation: React.FC<AdvancedAnnotationProps> = ({
  imageUrl,
  onSave,
  initialData,
  calibrationFactor = 1,
}) => {
  const [layers, setLayers] = useState<AnnotationLayer[]>([
    { id: '1', name: 'Layer 1', visible: true, locked: false, annotations: [] },
  ]);
  const [activeLayer, setActiveLayer] = useState('1');
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [color, setColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'area' | 'angle' | null>(null);
  const [labels, setLabels] = useState<Array<{ id: string; text: string; position: { x: number; y: number } }>>([]);
  
  const stageRef = useRef<any>(null);
  const measurementPointsRef = useRef<number[]>([]);

  const handleColorChange = (color: any) => {
    setColor(color.hex);
  };

  const handleStrokeWidthChange = (event: Event, newValue: number | number[]) => {
    setStrokeWidth(newValue as number);
  };

  const handleLayerVisibility = (layerId: string) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const handleLayerLock = (layerId: string) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const addLayer = () => {
    const newLayer: AnnotationLayer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      annotations: [],
    };
    setLayers([...layers, newLayer]);
    setActiveLayer(newLayer.id);
  };

  const handleMeasurementClick = useCallback((e: any) => {
    if (!measurementMode) return;

    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    measurementPointsRef.current.push(point.x, point.y);

    if (measurementMode === 'distance' && measurementPointsRef.current.length === 4) {
      const [x1, y1, x2, y2] = measurementPointsRef.current;
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * calibrationFactor;
      
      setMeasurements([...measurements, {
        type: 'distance',
        value: distance,
        unit: 'mm',
        points: [...measurementPointsRef.current],
      }]);
      measurementPointsRef.current = [];
    } else if (measurementMode === 'area' && measurementPointsRef.current.length === 8) {
      // Calculate polygon area
      const points = measurementPointsRef.current;
      let area = 0;
      for (let i = 0; i < points.length; i += 2) {
        const j = (i + 2) % points.length;
        area += points[i] * points[j + 1];
        area -= points[i + 1] * points[j];
      }
      area = Math.abs(area / 2) * Math.pow(calibrationFactor, 2);

      setMeasurements([...measurements, {
        type: 'area',
        value: area,
        unit: 'mm²',
        points: [...measurementPointsRef.current],
      }]);
      measurementPointsRef.current = [];
    } else if (measurementMode === 'angle' && measurementPointsRef.current.length === 6) {
      // Calculate angle between three points
      const [x1, y1, x2, y2, x3, y3] = measurementPointsRef.current;
      const angle = calculateAngle(x1, y1, x2, y2, x3, y3);

      setMeasurements([...measurements, {
        type: 'angle',
        value: angle,
        unit: '°',
        points: [...measurementPointsRef.current],
      }]);
      measurementPointsRef.current = [];
    }
  }, [measurementMode, measurements, calibrationFactor]);

  const calculateAngle = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    const angle1 = Math.atan2(y1 - y2, x1 - x2);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    let angle = Math.abs(angle1 - angle2) * 180 / Math.PI;
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  const addLabel = (e: any) => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    const newLabel = {
      id: Date.now().toString(),
      text: 'New Label',
      position: { x: point.x, y: point.y },
    };
    setLabels([...labels, newLabel]);
  };

  const updateLabel = (id: string, newText: string) => {
    setLabels(labels.map(label =>
      label.id === id ? { ...label, text: newText } : label
    ));
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Color">
            <IconButton onClick={(e) => setColorPickerAnchor(e.currentTarget)}>
              <FormatColorFill />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stroke Width">
            <Box sx={{ width: 100 }}>
              <Slider
                value={strokeWidth}
                onChange={handleStrokeWidthChange}
                min={1}
                max={10}
                aria-label="Stroke Width"
              />
            </Box>
          </Tooltip>
          <Tooltip title="Add Measurement">
            <IconButton
              onClick={() => setMeasurementMode(mode => 
                mode === 'distance' ? null : 'distance'
              )}
              color={measurementMode === 'distance' ? 'primary' : 'default'}
            >
              <Timeline />
            </IconButton>
          </Tooltip>
          <Tooltip title="Area Measurement">
            <IconButton
              onClick={() => setMeasurementMode(mode => 
                mode === 'area' ? null : 'area'
              )}
              color={measurementMode === 'area' ? 'primary' : 'default'}
            >
              <ViewInAr />
            </IconButton>
          </Tooltip>
          <Tooltip title="Angle Measurement">
            <IconButton
              onClick={() => setMeasurementMode(mode => 
                mode === 'angle' ? null : 'angle'
              )}
              color={measurementMode === 'angle' ? 'primary' : 'default'}
            >
              <RadioButtonUnchecked />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Label">
            <IconButton onClick={addLabel}>
              <Label />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ width: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Layers
          </Typography>
          <Stack spacing={1}>
            {layers.map(layer => (
              <Box
                key={layer.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: activeLayer === layer.id ? 'action.selected' : 'transparent',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleLayerVisibility(layer.id)}
                >
                  <Layers color={layer.visible ? 'primary' : 'disabled'} />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ flex: 1, mx: 1 }}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  {layer.name}
                </Typography>
              </Box>
            ))}
            <IconButton onClick={addLayer}>
              <AddLocation />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ flex: 1 }}>
          <ImageAnnotation
            imageUrl={imageUrl}
            initialAnnotations={initialData?.annotations}
            onSave={onSave}
            color={color}
            strokeWidth={strokeWidth}
          />
          <Stage
            ref={stageRef}
            width={800}
            height={600}
            onClick={handleMeasurementClick}
          >
            <Layer>
              {measurements.map((measurement, i) => (
                <React.Fragment key={i}>
                  {/* Render measurement visualizations */}
                </React.Fragment>
              ))}
              {labels.map(label => (
                <Text
                  key={label.id}
                  x={label.position.x}
                  y={label.position.y}
                  text={label.text}
                  fontSize={16}
                  fill={color}
                  draggable
                />
              ))}
            </Layer>
          </Stage>
        </Box>
      </Box>

      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <SketchPicker
          color={color}
          onChange={handleColorChange}
        />
      </Popover>
    </Paper>
  );
};

export default AdvancedAnnotation;
