# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
npm run lint       # Run ESLint via expo lint
```

There is no test suite configured.

## Architecture

**Lion** ("Like It Or Not?") is a React Native voting app built with Expo SDK 54 and file-based routing via `expo-router`.

### Routing

`app/_layout.tsx` defines the root Stack navigator. The auth/onboarding screen is `app/index.tsx` (a 5-step wizard: landing → email → credentials → welcome → category). After login, the app navigates to `/(tabs)`.

`app/(tabs)/` contains the main tab navigator with three tabs:
- `index.tsx` — VoteScreen: shows posts one at a time, user votes yes/no/neutral, then sees results
- `upload.tsx` — UploadScreen: image picker + form to submit a new post
- `explore.tsx` — ProfileScreen: user info, voting stats, and history (rendered as sub-views within the same screen component)

`app/my-posts.tsx` and `app/post-stats.tsx` are stack screens accessible from the profile and hamburger menu.

### API Layer

All API calls live in `services/api.ts`, which exports grouped service objects against `https://lion-api.laravel.cloud/api` (a Laravel backend):

- `authService` — register, login, logout, getUser, saveToken
- `categoryService` — getAll
- `postService` — getAll (optional `category_id`), getMyPosts, create (FormData)
- `voteService` — vote (postId, `'yes' | 'no' | 'neutral'`)
- `profileService` — getStats, getHistory

Auth tokens are stored with `expo-secure-store` on native and `localStorage` on web. The axios request interceptor reads the token and attaches it as `Authorization: Bearer <token>`.

**FormData uploads**: The request interceptor intentionally omits `Content-Type` for FormData so React Native can auto-set the multipart boundary. On web, images are fetched as blobs; on native, they use the `{ uri, name, type }` shape that RN patches into FormData.

Post images are served from `constants/api.ts` `STORAGE_URL` (`https://lion-api.laravel.cloud/storage`). The `getImageUrl` helper in vote/my-posts screens strips a duplicate `/storage` segment if the path already contains it.

### Components & Styling

All screens use `StyleSheet.create` — there is no Tailwind/NativeWind. The design language is high-contrast black (`#1C1C1E`) on white with thick borders.

`components/hamburger-menu.tsx` is a global dropdown present in every screen header, providing navigation to Profile, Upload, My Posts, and Voting Home.

`constants/theme.ts` exports `Colors` (light/dark) and `Fonts` (platform-specific system font stacks).

`hooks/use-color-scheme.ts` has a web override at `use-color-scheme.web.ts` — the `.web.ts` suffix is the Expo platform-specific file convention used throughout.

Animations use `react-native-reanimated` (`FadeIn`, `FadeOut`, `SlideInRight`, `SlideOutLeft`). The React Compiler (`experiments.reactCompiler: true`) is enabled in `app.json`.

### Key Behaviors

- `useFocusEffect` (not `useEffect`) is used to reload data when navigating back to a screen.
- The `@ ` path alias maps to the project root (configured in `tsconfig.json`).
- Typed routes are enabled (`experiments.typedRoutes: true`), so route strings are type-checked.
