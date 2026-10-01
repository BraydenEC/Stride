# stride-app (placeholder name)

Return-to-running rehab companion. See `HANDOFF.md` for scope, decisions and build order.

```
mobile/     Expo app (React Native, Expo Router, dev builds only; Expo Go won't work)
supabase/   Database migrations (Postgres + RLS)
web/        Next.js on Vercel (AI proxy, landing page). Added in Phase 6.
```

## Mobile setup

```sh
cd mobile
npm install
cp .env.example .env.local      # fill in Supabase URL + publishable key
npm run ios                     # dev build on a plugged-in iPhone (needs Xcode)
npm run android                 # dev build on a plugged-in Android phone (needs Android Studio)
npm start                       # Metro only, once a dev build is installed
```

- **JS changes** hot-reload. **Native changes** (new native module, permission, config plugin,
  anything in `app.config.ts`) need a rebuild: re-run `npm run ios` / `npm run android`.
- Never edit `ios/` or `android/`. They're generated from `app.config.ts` (Continuous Native Generation) and git-ignored.
- `APP_VARIANT=development` (set by the npm scripts) builds "Stride (Dev)" with a `.dev` bundle ID,
  so dev and production installs can coexist.
- Rename the app in one place: the constants at the top of `mobile/app.config.ts`.

## Secrets

- `mobile/.env.local` holds only client-safe `EXPO_PUBLIC_*` values (these ship in the app bundle).
- Server secrets (Anthropic key, Supabase service role, Resend key) never go in `mobile/`.
  They live in Vercel / Supabase dashboard settings and EAS secrets.
