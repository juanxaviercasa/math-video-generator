export type VideoAspectRatio = '16:9' | '1:1' | '9:16';
export type VideoQuality = 'low' | 'medium' | 'high';

export interface VideoFormatProfile {
  aspectRatio: VideoAspectRatio;
  quality: VideoQuality;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  safeMargin: number;
  panelWidth: number;
  panelHeight: number;
  contentWidth: number;
  contentHeight: number;
  orientation: 'landscape' | 'square' | 'portrait';
}

const dimensions: Record<VideoQuality, Record<VideoAspectRatio, { width: number; height: number }>> = {
  low: {
    '16:9': { width: 854, height: 480 },
    '1:1': { width: 480, height: 480 },
    '9:16': { width: 480, height: 854 },
  },
  medium: {
    '16:9': { width: 1280, height: 720 },
    '1:1': { width: 720, height: 720 },
    '9:16': { width: 720, height: 1280 },
  },
  high: {
    '16:9': { width: 3840, height: 2160 },
    '1:1': { width: 2160, height: 2160 },
    '9:16': { width: 2160, height: 3840 },
  },
};

const cameraFrames: Record<VideoAspectRatio, { frameWidth: number; frameHeight: number }> = {
  '16:9': { frameWidth: 14, frameHeight: 8 },
  '1:1': { frameWidth: 10, frameHeight: 10 },
  '9:16': { frameWidth: 8, frameHeight: 14.22 },
};

export const getVideoFormatProfile = (
  aspectRatio: VideoAspectRatio = '16:9',
  quality: VideoQuality = 'medium',
): VideoFormatProfile => {
  const { width, height } = dimensions[quality][aspectRatio];
  const { frameWidth, frameHeight } = cameraFrames[aspectRatio];
  const safeMargin = Math.round(Math.min(frameWidth, frameHeight) * 0.08 * 100) / 100;
  const panelWidth = Math.round((frameWidth - safeMargin * 2) * 100) / 100;
  const panelHeight = Math.round((frameHeight - safeMargin * 2) * 100) / 100;

  return {
    aspectRatio,
    quality,
    width,
    height,
    frameWidth,
    frameHeight,
    safeMargin,
    panelWidth,
    panelHeight,
    contentWidth: Math.round((panelWidth - 0.8) * 100) / 100,
    contentHeight: Math.round((panelHeight - 1.0) * 100) / 100,
    orientation: aspectRatio === '16:9' ? 'landscape' : aspectRatio === '1:1' ? 'square' : 'portrait',
  };
};

export const videoFormatProfiles = {
  '16:9': { label: 'Horizontal 16:9', social: 'YouTube, Facebook, presentaciones' },
  '1:1': { label: 'Cuadrado 1:1', social: 'Instagram, publicaciones sociales' },
  '9:16': { label: 'Vertical 9:16', social: 'Reels, Stories, Shorts, TikTok' },
} as const;
