import type { ScreenshotScenario } from '../types';
import { viewerDarkJsonScenario } from './01-viewer-dark-json';
import { viewerHtmlSidebarScenario } from './02-viewer-html-sidebar';
import { viewerSearchPanelScenario } from './03-viewer-search-panel';
import { fontViewerGlyphsScenario } from './04-font-viewer-glyphs';
import { fontViewerPreviewScenario } from './05-font-viewer-preview';
import { settingsOptionsScenario } from './06-settings-options';

/**
 * Ordered list of all active screenshot scenarios.
 */
export const scenarios: ScreenshotScenario[] = [
  viewerDarkJsonScenario,
  viewerHtmlSidebarScenario,
  viewerSearchPanelScenario,
  fontViewerGlyphsScenario,
  fontViewerPreviewScenario,
  settingsOptionsScenario,
];
