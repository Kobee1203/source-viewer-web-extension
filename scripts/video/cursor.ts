import type { Locator, Page } from 'playwright';
import { TIMINGS } from './config';
import type { Point } from './types';

const CURSOR_ID = '__demo_virtual_cursor__';
const RIPPLE_ID = '__demo_virtual_ripple__';

export const EXTENSION_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAHhlWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAAEsAAAAAQAAASwAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABCgAwAEAAAAAQAAABAAAAAAYTk17gAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAmVJREFUKBVlUl1IVEEUnjMz997dtWu7WiFhpISxFPQH5UMQFrYJhYqFPQgKSaQP9hYUSY9lD9HbhvaD9pBQUD342EMRRpKxrj9F5R9E1G4rum3uz51773TG21LU4c7wne98c+bOOQdKQ2WESEIAl2dQBP8zGOEAngBASqKwOlw86WG5xv0mqYohYwuXcw+DVSD5nPosQTALAZdxKYSXhSPlEmL19JZozLnea5dtdPceoJVVmEZ+XmSxMUgv25f6aCbN+2/gLzDD0J0t1UZLG7l6MR9p1jp7tFC5LV1XN9j2sNvYilewJ8PQ0U3HX8nMDy6lBM0gqYR1tLHkcENuYZbs3lcfrskK8fLDHEy84cdPUcPnppJE01FM8WZMB4zzxVmLMt7Webv+4OnY86hf3G2tpx1dxLHp/EfJNZShmErdcNq72LsJcayJvH5xRKzKp8Nnz3XPz83tnIzX5lbsqZgVaXTeT6IMOKdYTS4KFuO0NJhLr9hEAmW5bLa55WRsekZjzEmv+NYHCWN+UVCFMk0zsGd/MPrArAkH7o/4p75Ff9p3hoYGBgf7sm5gOll+73Goetu6/ofBHbtMs5RjpfAB2CtY+MSunHfP9FxoaKo90Y61fhuf9Y88coduWckExZ5iowDUIpm0qKiEQxE6PkqvXYaBm2MVm6mU7OsXa3lJarpd1+DbsAlWM2t9CJRAJo2Of2uVMxMnmkYKeUglyNJ36TigaZJSvS6ijz4T03F8CZhq+LDVBTUwhqFw0bzBUl4hT4CCrqNEzY8K6IY3XEh59keNvuHDzQthXZXSU/8N/sHoevYL/VsBJXbque4AAAAASUVORK5CYII=';

export async function injectVirtualCursor(page: Page): Promise<void> {
  await page.evaluate(
    ({ cursorId, rippleId }) => {
      if (document.getElementById(cursorId)) return;

      const cursor = document.createElement('div');
      cursor.id = cursorId;
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 22px;
        height: 22px;
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(640px, 360px);
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4));
      `;

      // Modern cursor arrow SVG
      cursor.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z" fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `;

      const ripple = document.createElement('div');
      ripple.id = rippleId;
      ripple.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.35);
        border: 2px solid rgba(255, 255, 255, 0.8);
        pointer-events: none;
        z-index: 2147483646;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        transition: transform 0.35s ease-out, opacity 0.35s ease-out;
      `;

      document.body.appendChild(cursor);
      document.body.appendChild(ripple);
    },
    { cursorId: CURSOR_ID, rippleId: RIPPLE_ID },
  );
}

export async function smoothMoveTo(
  page: Page,
  selectorOrLocator: string | Locator,
  durationMs: number = TIMINGS.cursorSpeedMs,
): Promise<Point> {
  await injectVirtualCursor(page);

  const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator).first() : selectorOrLocator;
  await locator.waitFor({ state: 'visible', timeout: 8000 });

  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Unable to get bounding box for locator');
  }

  const targetX = Math.round(box.x + box.width / 2);
  const targetY = Math.round(box.y + box.height / 2);

  await page.evaluate(
    ({ id, x, y, duration }) => {
      const cursor = document.getElementById(id);
      if (!cursor) return;
      cursor.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    },
    { id: CURSOR_ID, x: targetX, y: targetY, duration: durationMs },
  );

  await page.waitForTimeout(durationMs + 60);
  return { x: targetX, y: targetY };
}

export async function smoothClick(page: Page, selectorOrLocator: string | Locator): Promise<void> {
  const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator).first() : selectorOrLocator;
  const point = await smoothMoveTo(page, locator);

  // Trigger ripple click effect
  await page.evaluate(
    ({ rippleId, x, y }) => {
      const ripple = document.getElementById(rippleId);
      if (!ripple) return;
      ripple.style.transition = 'none';
      ripple.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      ripple.style.opacity = '1';

      void ripple.offsetHeight;

      ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      ripple.style.transform = `translate(${x}px, ${y}px) scale(1.6)`;
      ripple.style.opacity = '0';
    },
    { rippleId: RIPPLE_ID, x: point.x, y: point.y },
  );

  await page.waitForTimeout(TIMINGS.clickPauseMs);
  await locator.click();
  await page.waitForTimeout(TIMINGS.clickPauseMs);
}

export async function smoothType(
  page: Page,
  selectorOrLocator: string | Locator,
  text: string,
  delayMs: number = TIMINGS.typingSpeedMs,
): Promise<void> {
  await smoothClick(page, selectorOrLocator);
  await page.keyboard.type(text, { delay: delayMs });
  await page.waitForTimeout(TIMINGS.clickPauseMs);
}

/**
 * Visually opens a dropdown menu for a <select> element, smoothly moves cursor to the
 * chosen option, clicks it with ripple, and dispatches the change event.
 */
export async function smoothSelectOption(
  page: Page,
  selectorOrLocator: string | Locator,
  targetValue: string,
): Promise<void> {
  const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator).first() : selectorOrLocator;
  await locator.waitFor({ state: 'visible', timeout: 8000 });

  // 1. Move cursor to the select and trigger click
  const point = await smoothMoveTo(page, locator);

  // Click effect on the select
  await page.evaluate(
    ({ rippleId, x, y }) => {
      const ripple = document.getElementById(rippleId);
      if (!ripple) return;
      ripple.style.transition = 'none';
      ripple.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      ripple.style.opacity = '1';
      void ripple.offsetHeight;
      ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      ripple.style.transform = `translate(${x}px, ${y}px) scale(1.4)`;
      ripple.style.opacity = '0';
    },
    { rippleId: RIPPLE_ID, x: point.x, y: point.y },
  );

  // 2. Render realistic native-style macOS dropdown popup list right below the <select>
  const popupCreated = await locator.evaluate((selectEl, targetVal) => {
    if (!(selectEl instanceof HTMLSelectElement)) return false;

    const oldPopup = document.getElementById('__virtual_dropdown_menu__');
    if (oldPopup) oldPopup.remove();

    const rect = selectEl.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.id = '__virtual_dropdown_menu__';

    // Calculate best position (below or above)
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 260;
    const topPos = openUpwards ? Math.max(10, rect.top - 280) : rect.bottom + 4;

    popup.style.cssText = `
      position: fixed;
      top: ${topPos}px;
      left: ${Math.max(10, rect.left)}px;
      min-width: ${Math.max(220, rect.width)}px;
      max-width: 340px;
      max-height: 320px;
      overflow-y: auto;
      background: rgba(246, 246, 246, 0.98);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 0, 0, 0.16);
      border-radius: 6px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.12);
      z-index: 2147483640;
      padding: 3px 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
      font-size: 13px;
      color: #1d1d1f;
      animation: __v_fade_in 0.15s ease-out;
    `;

    Array.from(selectEl.options).forEach((opt) => {
      const item = document.createElement('div');
      item.className = '__v_option';
      item.textContent = opt.text;
      const isSelected = opt.value === selectEl.value;
      item.style.cssText = `
        position: relative;
        padding: 3px 10px 3px 26px;
        margin: 1px 3px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
        line-height: 1.4;
        transition: background 0.1s, color 0.1s;
        background: ${isSelected ? '#3880ff' : 'transparent'};
        color: ${isSelected ? '#ffffff' : '#1d1d1f'};
      `;

      if (isSelected) {
        item.classList.add('__v_active');
        const chk = document.createElement('span');
        chk.className = '__v_check';
        chk.textContent = '✓';
        chk.style.cssText = 'position: absolute; left: 8px; font-weight: bold;';
        item.prepend(chk);
      }

      if (opt.value === targetVal || opt.text === targetVal) {
        item.id = '__v_target_option__';
      }

      popup.appendChild(item);
    });

    document.body.appendChild(popup);

    const target = document.getElementById('__v_target_option__');
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
    return true;
  }, targetValue);

  if (!popupCreated) {
    await locator.selectOption(targetValue);
    return;
  }

  // 3. Pause so viewer clearly sees the opened dropdown list
  await page.waitForTimeout(500);

  // 4. Smoothly move cursor to the chosen target option in the popup
  const targetOptionLocator = page.locator('#__v_target_option__');
  if (await targetOptionLocator.isVisible()) {
    const optPoint = await smoothMoveTo(page, targetOptionLocator, 400);

    // Highlight chosen option in macOS blue with checkmark
    await page.evaluate(() => {
      const prevActive = document.querySelectorAll('.__v_option.__v_active');
      prevActive.forEach((el) => {
        (el as HTMLElement).style.background = 'transparent';
        (el as HTMLElement).style.color = '#1d1d1f';
        const chk = el.querySelector('.__v_check');
        if (chk) chk.remove();
      });

      const target = document.getElementById('__v_target_option__');
      if (target) {
        target.style.background = '#3880ff';
        target.style.color = '#ffffff';
        if (!target.querySelector('.__v_check')) {
          const chk = document.createElement('span');
          chk.className = '__v_check';
          chk.textContent = '✓';
          chk.style.cssText = 'position: absolute; left: 8px; font-weight: bold;';
          target.prepend(chk);
        }
      }
    });

    await page.waitForTimeout(400);

    // Click effect on option
    await page.evaluate(
      ({ rippleId, x, y }) => {
        const ripple = document.getElementById(rippleId);
        if (!ripple) return;
        ripple.style.transition = 'none';
        ripple.style.transform = `translate(${x}px, ${y}px) scale(0)`;
        ripple.style.opacity = '1';
        void ripple.offsetHeight;
        ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        ripple.style.transform = `translate(${x}px, ${y}px) scale(1.4)`;
        ripple.style.opacity = '0';
      },
      { rippleId: RIPPLE_ID, x: optPoint.x, y: optPoint.y },
    );
  }

  // 5. Apply selection to the real <select> and remove the popup
  await locator.evaluate((selectEl, targetVal) => {
    if (selectEl instanceof HTMLSelectElement) {
      selectEl.value = targetVal;
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const popup = document.getElementById('__virtual_dropdown_menu__');
    if (popup) popup.remove();
  }, targetValue);

  await page.waitForTimeout(TIMINGS.clickPauseMs);
}

/**
 * Injects and displays a realistic macOS Chrome browser context menu at (x, y),
 * highlighting the Source Viewer entry with the actual extension icon.
 */
export async function showRealisticContextMenu(page: Page, x: number, y: number): Promise<Locator> {
  await injectVirtualCursor(page);

  await page.evaluate(
    ({ posX, posY, iconData }) => {
      (window as unknown as { __name?: unknown }).__name =
        (window as unknown as { __name?: unknown }).__name || ((target: unknown) => target);

      const oldMenu = document.getElementById('__virtual_context_menu__');
      if (oldMenu) oldMenu.remove();

      const menu = document.createElement('div');
      menu.id = '__virtual_context_menu__';
      menu.style.cssText = `
        position: fixed;
        top: ${posY}px;
        left: ${posX}px;
        width: 250px;
        background: rgba(246, 246, 246, 0.94);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 10px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.10);
        padding: 4px 0;
        z-index: 2147483640;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
        font-size: 13px;
        color: #1d1d1f;
        user-select: none;
      `;

      const menuItems: Array<{
        label?: string;
        enabled?: boolean;
        isTarget?: boolean;
        separator?: boolean;
        icon?: string;
      }> = [
        { label: 'Back', enabled: false },
        { label: 'Forward', enabled: false },
        { label: 'Reload', enabled: true },
        { separator: true },
        { label: 'Save As...', enabled: true },
        { label: 'Print...', enabled: true },
        { label: 'Search this tab with Google Lens', enabled: true },
        { label: 'Open in Reading Mode', enabled: true },
        { separator: true },
        { label: 'View source with Source Viewer', enabled: true, isTarget: true },
        { separator: true },
        { label: 'View Page Source', enabled: true },
        { label: 'Inspect', enabled: true },
      ];

      for (const item of menuItems) {
        if (item.separator) {
          const sep = document.createElement('div');
          sep.style.cssText = 'height: 1px; background: rgba(0, 0, 0, 0.08); margin: 4px 0;';
          menu.appendChild(sep);
        } else {
          const el = document.createElement('div');
          el.className = '__cm_item';
          el.style.cssText = `
            margin: 1px 4px;
            padding: 4px 8px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: ${item.enabled ? '#1d1d1f' : '#8e8e93'};
            cursor: ${item.enabled ? 'pointer' : 'default'};
            transition: background 0.12s, color 0.12s;
            font-weight: 400;
            line-height: 1.3;
          `;
          if (item.isTarget) {
            el.id = '__context_menu_target_item__';
            el.innerHTML =
              '<img src="' +
              iconData +
              '" width="16" height="16" style="vertical-align: middle; border-radius: 2px; flex-shrink: 0;" /><span>' +
              (item.label || '') +
              '</span>';
          } else if (item.icon) {
            el.innerHTML =
              '<span style="font-size: 13px; width: 16px; text-align: center; flex-shrink: 0;">' +
              item.icon +
              '</span><span>' +
              (item.label || '') +
              '</span>';
          } else {
            el.textContent = item.label || '';
          }
          menu.appendChild(el);
        }
      }

      document.body.appendChild(menu);
    },
    { posX: x, posY: y, iconData: EXTENSION_ICON_BASE64 },
  );

  return page.locator('#__context_menu_target_item__');
}

export async function hideRealisticContextMenu(page: Page): Promise<void> {
  await page.evaluate(() => {
    const menu = document.getElementById('__virtual_context_menu__');
    if (menu) menu.remove();
  });
}
