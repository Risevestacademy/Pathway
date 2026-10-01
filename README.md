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
```

Data flow: UI → Zustand store → repository → API client → API.
The store is created via `createCareersStore(repository)` so tests inject mocks.

## Temporary integrations (replace later)

- API base URL: `EXPO_PUBLIC_API_BASE_URL` env var (default: temporary Render backend).
- `src/features/onboarding/data/interestFieldMap.ts` — static interest→slug map.
  Replace with the backend's fields endpoint when it ships.
- Onboarding select options (qualification / years / internships) are display-only static lists.

## Commands

```bash
npm install          # install dependencies
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # jest (mocked repository — no network needed)
npm start            # expo start
```

Quality order before CI: install → lint → typecheck → test → build (EAS).
