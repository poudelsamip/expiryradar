# AI Agent Prompt: Expo React Native App Scaffold
---

## Prompt

You are setting up a new React Native mobile app using Expo. Follow these exact specifications:

### Tech Stack
- **Framework:** Expo SDK (latest stable, managed workflow)
- **Language:** TypeScript (strict mode enabled)
- **Navigation:** Expo Router (file-based routing, using the `app/` directory)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand
- **Backend:** Supabase (auth, database, storage)
- **Forms & Validation:** React Hook Form + Zod
- **Package Manager:** npm

### Setup Steps

1. **Initialize the project**
   - Create a new Expo app with the TypeScript template: `npx create-expo-app@latest . --template`
   - Confirm `app.json`/`app.config.ts`, `tsconfig.json`, and `package.json` are correctly configured.

2. **Install and configure NativeWind**
   - Install `nativewind`, `tailwindcss`, and required babel/metro config.
   - Set up `tailwind.config.js` with content paths covering the `app/` and `components/` directories.
   - Add global CSS import and Tailwind types for TS support.

3. **Set up Expo Router**
   - Configure `app/_layout.tsx` as the root layout.
   - Create a basic folder structure:
     - `app/(auth)/login.tsx`
     - `app/(auth)/signup.tsx`
     - `app/(tabs)/_layout.tsx`
     - `app/(tabs)/index.tsx` (home screen)
     - `app/(tabs)/profile.tsx`
   - Add a simple tab bar with 2 tabs (Home, Profile).

4. **Install and configure Zustand**
   - Create a `store/` directory.
   - Add an example store (`store/useAuthStore.ts`) that holds `user`, `session`, and `isLoading` state, with actions for `setUser`, `setSession`, `signOut`.

5. **Set up Supabase**
   - Install `@supabase/supabase-js` and `react-native-url-polyfill`.
   - Create `lib/supabase.ts` initializing the client using environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
   - Add a `.env.example` file listing required env vars.
   - Wire up a basic email/password auth flow (sign up, log in, log out) connected to the Zustand auth store.
   - Add an auth state listener that syncs Supabase session changes into the store on app load.

6. **Forms**
   - Install `react-hook-form`, `zod`, `@hookform/resolvers`.
   - Build the login and signup forms using React Hook Form + Zod schema validation, styled with NativeWind.

7. **Project structure conventions**
   ```
   app/                 # Expo Router screens
   components/          # Reusable UI components
   store/               # Zustand stores
   lib/                 # Supabase client, API helpers, utils
   hooks/               # Custom hooks
   types/               # Shared TypeScript types
   constants/           # App-wide constants (colors, config)
   ```

8. **Developer experience**
   - Add ESLint + Prettier config consistent with Expo's default TS rules.
   - Add path aliases (`@/components`, `@/lib`, `@/store`) in `tsconfig.json` and `babel.config.js`.
   - Ensure the app runs cleanly with `npx expo start` with no TypeScript or lint errors.

### Deliverable
A working Expo app that:
- Boots with no errors on iOS/Android/web simulators
- Has functioning tab navigation
- Has a login/signup flow wired to Supabase auth (even if Supabase project isn't yet created, code should be ready to connect via env vars)
- Uses NativeWind classes for all styling
- Has one working Zustand store wired into the UI

Ask me for my Supabase project URL and anon key if you need to test the connection; otherwise stub it via `.env.example`.