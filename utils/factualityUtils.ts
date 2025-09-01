import { t } from '@/lib/i18n';

/**
 * Utility functions for factuality calculations and badge info
 */

export interface FactCheckBadgeInfo {
  text: string;
  type: 'truth' | 'misleading' | 'needs-context';
}

/**
 * Calculate factuality badge information based on a factuality score
 * @param factuality - The factuality score (0-1)
 * @returns Badge info object or null if no valid score
 */
export const getFactCheckBadgeInfo = (
  factuality?: number | null,
): FactCheckBadgeInfo | null => {
  const score = factuality;

  if (score === undefined || score === null) {
    return null;
  }

  let badgeText = '';
  let badgeType: 'truth' | 'misleading' | 'needs-context';

  if (score >= 0.75) {
    badgeText = `${Math.round(score * 100)}% ${t('common.truth')}`;
    badgeType = 'truth';
  } else if (score >= 0.5) {
    badgeText = `${Math.round(score * 100)}% ${t('common.truth')}`;
    badgeType = 'needs-context';
  } else {
    badgeText = `${Math.round((1 - score) * 100)}% ${t('common.falsehood')}`;
    badgeType = 'misleading';
  }

  return { text: badgeText, type: badgeType };
};
