import type { VideoScenario } from '../types';
import { openHtmlSourceScenario } from './01-open-html-source';
import { lineWrapScenario } from './02-line-wrap';
import { referenceSidebarScenario } from './03-reference-sidebar';
import { themeSwitchingScenario } from './04-theme-switching';
import { fontSizeScenario } from './05-font-size';
import { targetedSearchScenario } from './06-targeted-search';
import { copyFeaturesScenario } from './07-copy-features';
import { downloadAndPreviewScenario } from './08-download-and-preview';
import { fontViewerPreviewScenario } from './09-font-viewer-preview';
import { optionsPageScenario } from './10-options-page';

export const videoScenarios: VideoScenario[] = [
  openHtmlSourceScenario,
  lineWrapScenario,
  referenceSidebarScenario,
  themeSwitchingScenario,
  fontSizeScenario,
  targetedSearchScenario,
  copyFeaturesScenario,
  downloadAndPreviewScenario,
  fontViewerPreviewScenario,
  optionsPageScenario,
];
