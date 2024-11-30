import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  SxProps,
  Theme,
} from '@mui/material';
import {
  Create,
  Timeline,
  RadioButtonUnchecked,
  Square,
  Delete,
  Undo,
  Redo,
  Save,
} from '@mui/icons-material';
import { Stage, Layer, Line, Circle, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import {
  Point,
  AnnotationShape,
  Annotation,
  AnnotationMetadata
} from '../../types/annotations';

type Tool = AnnotationShape['tool'];

interface ImageAnnotationProps {
  imageId: string;
  studyId?: string;
  patientId?: string;
  userId: string;
  imageUrl: string;
  initialAnnotations?: AnnotationShape[];
  onSave?: (annotation: Annotation) => void;
  readOnly?: boolean;
  containerStyle?: SxProps<Theme>;
}

const defaultContainerStyle: SxProps<Theme> = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  imageId,
  studyId,
  patientId,
  userId,
  imageUrl,
  initialAnnotations = [],
  onSave,
  readOnly = false,
  containerStyle,
}) => {
  const [annotations, setAnnotations] = useState<AnnotationShape[]>(initialAnnotations);
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<AnnotationShape[][]>([initialAnnotations]);
  const [historyStep, setHistoryStep] = useState(0);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      setStageSize({
        width: image.width,
        height: image.height
      });
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!selectedId || !transformerRef.current || !layerRef.current) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    const node = layerRef.current.findOne(`#${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readOnly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    const newAnnotation: AnnotationShape = {
      id: Date.now().toString(),
      tool: selectedTool,
      points: [pos.x, pos.y],
      color: '#ff0000',
      strokeWidth: 2,
    };

    setAnnotations([...annotations, newAnnotation]);
    addToHistory([...annotations, newAnnotation]);
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    handleMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || readOnly) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const lastAnnotation = annotations[annotations.length - 1];
    if (!lastAnnotation) return;

    const newPoints = [...lastAnnotation.points];
    
    if (selectedTool === 'pen') {
      newPoints.push(pos.x, pos.y);
    } else {
      // For shapes, we only update the end point
      newPoints[2] = pos.x;
      newPoints[3] = pos.y;
    }

    const updatedAnnotations = annotations.slice(0, -1);
    updatedAnnotations.push({
      ...lastAnnotation,
      points: newPoints,
    });

    setAnnotations(updatedAnnotations);
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    handleMouseMove(e as unknown as Konva.KonvaEventObject<MouseEvent>);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    handleMouseUp();
  };

  const addToHistory = (newAnnotations: AnnotationShape[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setAnnotations(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setAnnotations(history[historyStep + 1]);
    }
  };

  const handleSave = () => {
    if (onSave) {
      const metadata: AnnotationMetadata = {
        createdBy: userId,
        createdAt: new Date(),
        studyId,
        patientId
      };

      const annotationData: Annotation = {
        id: Date.now().toString(),
        imageId,
        version: 1,
        annotations,
        metadata
      };
      onSave(annotationData);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      const newAnnotations = annotations.filter(
        (annotation) => annotation.id !== selectedId
      );
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      setSelectedId(null);
    }
  };

  const tools = [
    { icon: <Create />, name: 'pen' as Tool, tooltip: 'Pen Tool' },
    { icon: <Timeline />, name: 'line' as Tool, tooltip: 'Line Tool' },
    { icon: <RadioButtonUnchecked />, name: 'circle' as Tool, tooltip: 'Circle Tool' },
    { icon: <Square />, name: 'rectangle' as Tool, tooltip: 'Rectangle Tool' },
  ] as const;

  return (
    <Box sx={{ ...defaultContainerStyle, ...containerStyle }}>
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Layer ref={layerRef}>
            {annotations.map((annotation, i) => {
              const commonProps = {
                key: i,
                id: annotation.id,
                stroke: annotation.color,
                strokeWidth: annotation.strokeWidth,
                onClick: () => !readOnly && setSelectedId(annotation.id),
              };

              switch (annotation.tool) {
                case 'pen':
                case 'line':
                  return (
                    <Line
                      {...commonProps}
                      points={annotation.points}
                      tension={annotation.tool === 'pen' ? 0.5 : 0}
                    />
                  );
                case 'circle': {
                  const [x, y] = annotation.points;
                  const radius = Math.sqrt(
                    Math.pow(annotation.points[2] - x, 2) +
                      Math.pow(annotation.points[3] - y, 2)
                  );
                  return (
                    <Circle {...commonProps} x={x} y={y} radius={radius || 0} />
                  );
                }
                case 'rectangle': {
                  const [x1, y1, x2, y2] = annotation.points;
                  return (
                    <Rect
                      {...commonProps}
                      x={Math.min(x1, x2)}
                      y={Math.min(y1, y2)}
                      width={Math.abs(x2 - x1)}
                      height={Math.abs(y2 - y1)}
                    />
                  );
                }
                default:
                  return null;
              }
            })}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>

        {!readOnly && (
          <>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <IconButton onClick={handleUndo} disabled={historyStep === 0}>
                <Undo />
              </IconButton>
              <IconButton
                onClick={handleRedo}
                disabled={historyStep === history.length - 1}
              >
                <Redo />
              </IconButton>
              <IconButton onClick={handleDelete} disabled={!selectedId}>
                <Delete />
              </IconButton>
              <IconButton onClick={handleSave}>
                <Save />
              </IconButton>
            </Box>

            <SpeedDial
              ariaLabel="Drawing Tools"
              sx={{ position: 'absolute', bottom: 16, right: 16 }}
              icon={<SpeedDialIcon />}
            >
              {tools.map((tool) => (
                <SpeedDialAction
                  key={tool.name}
                  icon={tool.icon}
                  tooltipTitle={tool.tooltip}
                  onClick={() => setSelectedTool(tool.name)}
                />
              ))}
            </SpeedDial>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ImageAnnotation;
