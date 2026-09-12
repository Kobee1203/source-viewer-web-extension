import type { BrowserContext, Locator, Page } from 'playwright';
import type { ScreenshotFixtures } from '../screenshots/types';

export interface OverlayOptions {
  title: string;
  description: string;
  icon?: string;
  durationMs?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface VideoSession {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  videoDir: string;
  close: () => Promise<string | null>;
}

export interface VideoContext {
  page: Page;
  extensionId: string;
  fixtures: ScreenshotFixtures;
  showOverlay: (options: OverlayOptions) => Promise<void>;
  hideOverlay: () => Promise<void>;
  smoothMoveTo: (selectorOrLocator: string | Locator, durationMs?: number) => Promise<Point>;
  smoothClick: (selectorOrLocator: string | Locator) => Promise<void>;
  smoothType: (selectorOrLocator: string | Locator, text: string, delayMs?: number) => Promise<void>;
  smoothSelectOption: (selectorOrLocator: string | Locator, targetValue: string) => Promise<void>;
  sleep: (ms: number) => Promise<void>;
}

export interface VideoScenario {
  id: string;
  name: string;
  run: (ctx: VideoContext) => Promise<void>;
}
