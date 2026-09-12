import type { BrowserContext, Page } from 'playwright';

export interface ScenarioContext {
  page: Page;
  extensionId: string;
  locale: string;
  screenshotsDir: string;
}

export interface ScreenshotScenario {
  id: string;
  name: string;
  run: (ctx: ScenarioContext) => Promise<void>;
}

export interface ScreenshotFixtures {
  json: string;
  html: string;
  font: Buffer;
}

export interface BrowserSession {
  context: BrowserContext;
  extensionId: string;
  page: Page;
  close: () => Promise<void>;
}
