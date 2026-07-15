import { useEffect } from 'react';
import { supabase, isMissingConfig } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../lib/queryClient';

export function useAuthListener() {
  const { setSession, setLoading, setError, clear } = useAuthStore();

  useEffect(() => {
    if (isMissingConfig) {
      setError('Missing Supabase credentials. Check your .env file.');
      setLoading(false);
      return;
    }

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (data.session) setSession(data.session);
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        setError(msg);
        setTimeout(initSession, 5000);
        return;
      }
      setLoading(false);
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clear();
        queryClient.clear();
        // Re-create an anonymous session so the app doesn't hang on a blank loading screen
        initSession();
        return;
      }
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, setError, clear]);
}
