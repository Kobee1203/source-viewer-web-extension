import { isRestricted } from '@/utils/restricted';

/**
 * Builds the `view-source:` URL to hand off to the browser's native viewer.
 *
 * Appends `useNativeViewer=true` (unless the URL is already restricted, in which
 * case the background script would send it to the native viewer anyway) so that
 * the background script's `view-source:` interception doesn't loop it back to us.
 */
export function nativeViewerUrl(target: URL): string {
  const url = new URL(target.toString());
  if (!isRestricted(url)) {
    url.searchParams.set('useNativeViewer', 'true');
  }
  return 'view-source:' + url.toString();
}
