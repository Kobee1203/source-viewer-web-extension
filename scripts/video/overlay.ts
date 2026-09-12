import type { Page } from 'playwright';
import type { OverlayOptions } from './types';

const OVERLAY_ID = '__demo_video_hud_overlay__';

export async function injectOverlay(page: Page): Promise<void> {
  await page.evaluate((id) => {
    if (document.getElementById(id)) return;

    const container = document.createElement('div');
    container.id = id;
    container.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
      pointer-events: none;
      z-index: 2147483630;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 22px;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.90);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #ffffff;
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 90vw;
    `;

    const iconEl = document.createElement('span');
    iconEl.id = `${id}_icon`;
    iconEl.style.cssText = `
      font-size: 20px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const textWrap = document.createElement('div');
    textWrap.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2px;
    `;

    const titleEl = document.createElement('div');
    titleEl.id = `${id}_title`;
    titleEl.style.cssText = `
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #f8fafc;
      white-space: nowrap;
    `;

    const descEl = document.createElement('div');
    descEl.id = `${id}_desc`;
    descEl.style.cssText = `
      font-size: 13px;
      font-weight: 400;
      color: #94a3b8;
      white-space: nowrap;
    `;

    textWrap.appendChild(titleEl);
    textWrap.appendChild(descEl);
    container.appendChild(iconEl);
    container.appendChild(textWrap);
    document.body.appendChild(container);
  }, OVERLAY_ID);
}

export async function showOverlay(page: Page, options: OverlayOptions): Promise<void> {
  await injectOverlay(page);
  await page.evaluate(
    ({ id, opts }) => {
      const container = document.getElementById(id);
      if (!container) return;

      const iconEl = document.getElementById(`${id}_icon`);
      const titleEl = document.getElementById(`${id}_title`);
      const descEl = document.getElementById(`${id}_desc`);

      if (iconEl) iconEl.textContent = opts.icon || '✨';
      if (titleEl) titleEl.textContent = opts.title;
      if (descEl) descEl.textContent = opts.description;

      container.style.opacity = '1';
      container.style.transform = 'translateX(-50%) translateY(0)';
    },
    { id: OVERLAY_ID, opts: options },
  );
}

export async function hideOverlay(page: Page): Promise<void> {
  await page.evaluate((id) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.style.opacity = '0';
    container.style.transform = 'translateX(-50%) translateY(16px)';
  }, OVERLAY_ID);
}
