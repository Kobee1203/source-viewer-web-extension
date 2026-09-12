import path from 'node:path';

export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

export const OUTPUT_VIDEO_DIR = path.resolve('store/video');
export const RAW_VIDEO_DIR = path.resolve('store/video/raw');

export const MOCK_URLS = {
  html: 'https://developer.example.com/index.html',
  json: 'https://raw.githubusercontent.com/Kobee1203/source-viewer/main/package.json',
  font: 'https://fonts.gstatic.com/s/inter/v13/Inter-Regular.ttf',
} as const;

export const TIMINGS = {
  introMs: 2000,
  scenePauseMs: 1200,
  clickPauseMs: 400,
  cursorSpeedMs: 600,
  typingSpeedMs: 70,
} as const;
