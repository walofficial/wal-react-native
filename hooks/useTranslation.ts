import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { appLocaleAtom } from './useAppLocalization';
import { t as baseT } from '@/lib/i18n';

export function useTranslation() {
    const [appLocale] = useAtom(appLocaleAtom);

    const t = useCallback((key: string, options?: any) => {
        return baseT(key, options);
    }, [appLocale]);

    return { t };
}

export default useTranslation;

