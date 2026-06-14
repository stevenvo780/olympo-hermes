import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setStore } from '@/redux/ui';
import { setConfig } from '@/redux/config';
import { applyPalette } from '@/utils/theme';
import { defaultPalette } from '@/utils/defaultPalette';
import api from '@/utils/axios';
import { Store } from '@/types';

export const useStoreConfig = (storeId: string | null) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAndApplyConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!storeId) {
          applyPalette(defaultPalette);
          setLoading(false);
          return;
        }

        const response = await api.get(`/store/${storeId}`);
        const store = response.data as Store;
        
        dispatch(setStore(store));

        if (store.configuration) {
          dispatch(setConfig(store.configuration));
        }
        
        if (store.configuration && store.configuration.palette) {
          applyPalette(store.configuration.palette);
        } else {
          applyPalette(defaultPalette);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        applyPalette(defaultPalette);
      } finally {
        setLoading(false);
      }
    };

    fetchAndApplyConfig();
  }, [storeId, dispatch]);

  return { loading, error };
};

