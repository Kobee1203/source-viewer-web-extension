import { directLocalStrategy } from '@/composables/source/strategies/directLocalStrategy';
import { fileObjectStrategy } from '@/composables/source/strategies/fileObjectStrategy';
import { inplaceLocalStrategy } from '@/composables/source/strategies/inplaceLocalStrategy';
import { remoteFetchStrategy } from '@/composables/source/strategies/remoteFetchStrategy';
import { sessionSnapshotStrategy } from '@/composables/source/strategies/sessionSnapshotStrategy';
import { SourceFetchError, type SourceFetchStrategy, type SourceTarget } from '@/composables/source/types';
import { t } from '@/utils/i18n';
import { isRestricted } from '@/utils/restricted';

/**
 * Pure functional resolver that maps a `SourceTarget` to its corresponding
 * acquisition strategy. Throws a `SourceFetchError` if the target is prohibited upfront
 * (e.g. restricted extension domain or explicitly disallowed file scheme).
 */
export function resolveFetchStrategy(target: SourceTarget): SourceFetchStrategy {
  if (target.kind === 'file') {
    return fileObjectStrategy;
  }

  if (target.kind === 'snapshot') {
    return sessionSnapshotStrategy;
  }

  if (target.kind === 'url') {
    if (isRestricted(target.url)) {
      throw new SourceFetchError('restricted', t('errorRestricted'), true);
    }

    if (target.url.protocol === 'file:') {
      if (target.fileAccessDisallowed) {
        throw new SourceFetchError('file-access-denied', t('fileSchemePermissionHelp'));
      }

      if (typeof window !== 'undefined' && window.self !== window.top) {
        return inplaceLocalStrategy;
      }

      return directLocalStrategy;
    }

    return remoteFetchStrategy;
  }

  throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
}
