# Pathway

Mobile app (Expo + React Native) for exploring careers, pay/outlook data and learning roadmaps.

## Stack

- Expo SDK 52 / React Native 0.76 / TypeScript (strict)
- React Navigation (native-stack)
- Zustand (state management)
- @expo/vector-icons (icons)

## Architecture

Feature-based, layered so temporary designs/APIs can be swapped without rewriting logic:

```
src/
  app/            navigation, config (env-driven API base URL)
  shared/         design tokens, reusable components, api client, domain enums
  features/
    onboarding/   2-step onboarding: store, validation, temporary interest→slug map, screens
    careers/      catalogue, detail, pathway: store, repository, api, mappers, screens
    dashboard/    authenticated Home, active/saved pathways, five-tab navigation
```

Data flow: UI → Zustand store → repository → API client → API.
The store is created via `createCareersStore(repository)` so tests inject mocks.

## Temporary integrations (replace later)

- API base URL: `EXPO_PUBLIC_API_BASE_URL` env var (default: temporary Render backend).
- `src/features/onboarding/data/interestFieldMap.ts` — static interest→slug map.
  Replace with the backend's fields endpoint when it ships.
- Onboarding select options (qualification / years / internships) are display-only static lists.

## Dashboard

- The authenticated Home screen requests `/api/v1/me/active-pathway` and
  `/api/v1/me/pathways` through the authenticated API client. Only a successful
  active-pathway response with null/missing `career` and `pathway` selects the
  new-user hero; request failures remain retryable errors. Career bookmarks
  are stored locally per signed-in user using SecureStore. The Saved tab
  combines those bookmarks with server pathways, and Home counts unique career
  IDs from both sources.
- Dashboard query data is cached per signed-in user for 30 seconds. Returning
  to Home refreshes stale data in the background without replacing an already
  rendered active or empty hero state.
- The active pathway's `progress.nextStepId` opens its learning-step screen;
  if it is missing or does not identify a returned step, Continue opens the
  pathway details instead. Opening a step does not modify progress. Users
  explicitly mark steps complete/not started, and explicitly activate another
  saved pathway.
- XP, streak, goals, projects, activity, trophies, and completed-lane totals do
  not currently have dashboard endpoints. Development uses deterministic
  fixtures for those sections; set `EXPO_PUBLIC_DASHBOARD_FIXTURE=existing` to
  preview the populated reference state. Production displays unavailable values
  instead of treating missing or failed data as zero.
- The backend currently exposes no definition or metric for completed lanes.
  Lane totals therefore remain a development-only fixture value and must not be
  inferred from pathway steps.
- Opportunities has no backend flow yet. The tab directs users back to career
  discovery rather than presenting fabricated listings.

## Authentication

- Access tokens stay in memory; the rotating refresh token is stored with
  `expo-secure-store`. Startup rotates the saved token and validates the user
  with `/api/v1/auth/me`. Protected API calls use `requiresAuth: true`; a `401`
  triggers one serialized refresh and a single request retry.
- Google Sign-In uses `@react-native-google-signin/google-signin` on Android and
  exchanges the returned ID token through `POST /api/v1/auth/google`. The Web
  Client ID is configurable with `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; it is a
  public client identifier, not a secret.
- In Google Cloud Console, create/verify an Android OAuth client for
  `com.akidisamuel.pathway` and register the SHA-1 fingerprint for each signing
  certificate used (debug and release). The Web Client ID and Android package
  name in app config do not verify that console-side setup.
- Native Google Sign-In and SecureStore require a rebuilt native app; Expo Go
  does not include the Google Sign-In native module. After changing either native
  dependency or its config plugin, rebuild and verify on a device. iOS Google
  Sign-In is not configured until an iOS client ID and URL scheme are supplied.
- Mobile password reset uses `POST /api/v1/auth/password-reset/mobile/request`
  followed by `POST /api/v1/auth/password-reset/mobile/confirm`. The six-digit
  OTP is held only in in-memory auth flow state until confirmation; it is not
  placed in navigation parameters or persisted.

## Commands

```bash
npm install          # install dependencies
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # jest (mocked repository — no network needed)
npm start            # expo start
```

Quality order before CI: install → lint → typecheck → test → build (EAS).

## Sentry

Sentry error monitoring is initialized from `EXPO_PUBLIC_SENTRY_DSN`. Add the
project DSN to the ignored `.env` file for local development and to the
appropriate Expo environment for EAS builds. The DSN is a public client value;
do not put `SENTRY_AUTH_TOKEN` in the app or commit it.

The Expo plugin is configured for the `rise-academy-1t/pathway` project and
uploads release source maps during native builds when `SENTRY_AUTH_TOKEN` is
available. Keep that token in `.env.local` for local builds or as an EAS
environment secret. Native builds are required to test Sentry on-device; Expo
Go does not include this native SDK.
