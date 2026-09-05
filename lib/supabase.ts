import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY before starting the app.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Required on web so the OAuth popup closes itself; a no-op on native.
WebBrowser.maybeCompleteAuthSession();

// Opens the Google consent screen in a browser and exchanges the resulting
// auth code for a Supabase session. Requires the Google provider to be
// enabled in the Supabase dashboard (Authentication > Providers).
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) return { error };
  if (!data.url) return { error: new Error('Could not start Google sign-in.') };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    // User cancelled or dismissed the browser — not an error to surface.
    return { error: null };
  }

  const code = Linking.parse(result.url).queryParams?.code;
  if (typeof code !== 'string') {
    return { error: new Error('Google sign-in did not return a valid code.') };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: exchangeError ?? null };
}
