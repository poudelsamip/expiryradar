import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY to enable real auth.'
  );
}

// Only construct the client when configured — createClient throws on an empty/invalid URL.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

// Required on web so the OAuth popup closes itself; a no-op on native.
WebBrowser.maybeCompleteAuthSession();

// Opens the Google consent screen in a browser and exchanges the resulting
// auth code for a Supabase session. Requires the Google provider to be
// enabled in the Supabase dashboard (Authentication > Providers).
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error: new Error(
        'Google sign-in needs Supabase to be configured first. Fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      ),
    };
  }

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

// Used to sign a user in locally when Supabase isn't configured yet.
export function createLocalUser(email: string, name?: string): User {
  const now = new Date().toISOString();
  return {
    id: `local-${email}`,
    app_metadata: {},
    user_metadata: name ? { full_name: name } : {},
    aud: 'authenticated',
    created_at: now,
    email,
  };
}
