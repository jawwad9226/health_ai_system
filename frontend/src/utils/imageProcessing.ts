import { Annotation } from '../components/imaging/ImageAnnotation';

export interface ProcessedImage {
  id: string;
  url: string;
  metadata: {
    timestamp: string;
    dimensions: {
      width: number;
      height: number;
    };
    format: string;
    size: number;
    annotations?: Annotation[];
  };
  analysis?: {
    findings: Array<{
      id: string;
      type: string;
      confidence: number;
      location: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      description: string;
    }>;
    quality: {
      score: number;
      issues?: string[];
    };
  };
}

export const processImage = async (
  file: File,
  options: {
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<ProcessedImage> => {
  const { compress = true, maxWidth = 2048, maxHeight = 2048, quality = 0.8 } = options;

  // Create image URL
  const imageUrl = URL.createObjectURL(file);

  // Load image for processing
  const image = await loadImage(imageUrl);
  let processedImage = image;

  if (compress) {
    processedImage = await compressImage(image, {
      maxWidth,
      maxHeight,
      quality,
    });
  }

  // Get processed image data
  const { width, height } = processedImage;
  const format = file.type;
  const size = file.size;

  // Create processed image object
  const processed: ProcessedImage = {
    id: generateId(),
    url: compress ? processedImage.src : imageUrl,
    metadata: {
      timestamp: new Date().toISOString(),
      dimensions: { width, height },
      format,
      size,
    },
  };

  return processed;
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const compressImage = async (
  image: HTMLImageElement,
  options: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
  }
): Promise<HTMLImageElement> => {
  const { maxWidth, maxHeight, quality } = options;

  // Calculate new dimensions while maintaining aspect ratio
  let { width, height } = image;
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  // Create canvas for compression
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw image on canvas with new dimensions
  ctx.drawImage(image, 0, 0, width, height);

  // Convert to compressed data URL
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  // Create new image from compressed data
  return loadImage(dataUrl);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const extractImageMetadata = async (file: File): Promise<{
  dimensions: { width: number; height: number };
  format: string;
  size: number;
}> => {
  const url = URL.createObjectURL(file);
  const image = await loadImage(url);
  URL.revokeObjectURL(url);

  return {
    dimensions: {
      width: image.width,
      height: image.height,
    },
    format: file.type,
    size: file.size,
  };
};

export const downloadImage = (imageUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
