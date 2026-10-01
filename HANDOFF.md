# Handoff: Return-to-Running Rehab App

You are picking up a project that was fully planned in a previous conversation. **No code exists yet.** This document is the source of truth for scope, decisions and build order. Read all of it before starting, then begin with **Phase 1** (section 9). Confirm with the user before moving from one phase to the next.

---

## 1. What we're building

A cross-platform mobile app (iOS + Android), somewhat like Strava, focused on **walking, jogging and running**. Its central feature is an **AI rehab coach** that helps people with lower-body injuries safely return to running through a structured, evidence-based progression.

The app name is not decided yet. Use a placeholder (e.g., `stride-app`) and keep it easy to rename.

### Product philosophy: SLC, not MVP
The user wants v1 built as an **SLC (Simple, Lovable, Complete)**, following Jason Cohen's essay "Your customers hate MVPs. Make a SLC instead":
- **Simple:** one job done well. v1 is a **return-to-running companion**, not a full Strava clone.
- **Lovable:** it builds confidence. Celebrate milestones ("first 5 continuous minutes since your injury"), explain *why* today's session looks the way it does, and polish the UI.
- **Complete:** a user can go from "cleared to walk" to "running 30 minutes continuously" using only this app. v1 has no half-built features.

**Out of v1 on purpose:** social features, suggested routes, the route builder, other sports, and payments.

---

## 2. Decisions already made (don't revisit unless the user raises them)

| Topic | Decision |
|---|---|
| Platforms | Cross-platform: React Native + Expo, one codebase |
| Injury scope | **All lower-body injuries that affect running**, organized into categories (section 5) |
| Clinical validation | The user's friend, a physical therapist, reviews the rules at set checkpoints (section 7) |
| Business model | **Free at launch, paid later.** Pricing model is undecided. Build so paid features can be switched on later without restructuring. |
| Payments | **RevenueCat** for in-app subscriptions when payments launch. **Stripe** added later for web checkout / US link-out and B2B sales to PT clinics. Not needed in v1. |
| AI role | **Rules decide, AI explains.** A deterministic engine sets the plan. The AI never changes it. |

---

## 3. Tech stack (the user's chosen stack)

**Mobile:** React Native, Expo (Expo Router, EAS Build, EAS Update), RevenueCat (later)
**Backend / web:** Supabase (database, auth, storage, used as the mobile backend), Next.js on Vercel (AI proxy endpoint, landing page, later a PT dashboard), Resend (auth and transactional email via Supabase custom SMTP), Stripe (later only)
**Dev tools the user has:** Claude Code, Codex, Cursor, Ghostty, Xcode, Superwhisper. **Android Studio is also needed** for the Android emulator and SDK.

**AI:** LLM API (Claude) called **only from the server** (a Next.js route on Vercel, or a Supabase Edge Function; pick the simpler one and tell the user why). The API key never ships in the app.

### Expo native modules
```
expo-dev-client expo-location expo-task-manager react-native-maps
expo-sensors expo-sqlite expo-notifications expo-build-properties
@kingstinct/react-native-healthkit            # iOS Apple Health
react-native-health-connect expo-health-connect  # Android Health Connect
```
Always install with `npx expo install` so versions match the SDK.

### Hard rules
- **Expo Go will not work.** Use a **development build** from day one (`npx expo run:ios --device`, `npx expo run:android --device`, or `eas build --profile development`).
- Use **Continuous Native Generation**: all native config lives in `app.json` / `app.config.ts` and its plugins. **Never hand-edit `ios/` or `android/`.**
- JS changes hot reload. Native changes (new module, permission, plugin) need a rebuild. Tell the user when a rebuild is required.

---

## 4. v1 features

### 4.1 Activity tracking
- Activity types: Walk, Walk/Run intervals (essential for rehab), Jog, Run
- Metrics: elapsed and moving time (auto-pause), distance, current, average and split pace (min/mi or km, user setting), splits per mile/km and per interval, elevation gain, cadence (steps/min from the pedometer), heart rate (from Apple Health / Health Connect when available), estimated calories (low priority)
- Map: live polyline of the route, green start marker, finish marker, `fitToCoordinates` on the summary. Optionally color by pace or walk vs. run segments.
- Post-session summary: map, stats, splits, then the pain/RPE check-in
- Edge cases: screen locked, GPS loss, battery, offline use, treadmill / no-GPS mode

### 4.2 Rehab inputs
- Pain 0–10: before, during, right after, and **next morning** (the key signal)
- Pain location via a tap on a body map
- RPE (perceived exertion) 1–10
- Optional: stiffness, swelling, sleep, confidence

### 4.3 AI coach
- Chat that knows the user's injury, phase, recent sessions, check-ins, and **the engine's decision for today** (passed as context / tool output)
- Explains decisions, encourages, answers form/cadence/warm-up/recovery questions
- **Cannot override the engine** or recommend progressing faster than the rules allow
- Per-user daily message cap (AI costs money even while the app is free)

### 4.4 Lovable layer
Milestones, phase-completion celebrations, a "then vs. now" progress view, and good permission explainer screens.

---

## 5. Rehab engine spec

### Shared framework
Phases: **Walk → Walk/Run intervals → Continuous run → Build volume → Return to normal training**
- Advance on **criteria, not calendar dates**
- Change **one variable at a time** (duration, then frequency, then intensity)
- The next-morning check-in decides **progress / hold / regress**
- Week-over-week load increases are capped. Treat the "10% rule" as a ceiling, not a target, and also watch acute vs. chronic load trends.
- Strength and mobility companion work (calf, hip, quad) is part of every plan

### Injury categories (each has its own rules)
| Category | Examples | Key rule |
|---|---|---|
| Tendon | Achilles, patellar, hamstring tendinopathy | Pain ≤3–5/10 acceptable if it settles by next morning (Silbernagel pain-monitoring model) |
| Bone stress | Tibia, metatarsal, femur stress reactions/fractures | **Must be pain-free**, no pain allowance, clinician clearance required. **High-risk sites (femoral neck, navicular) → refer to a doctor, not self-managed.** |
| Joint / overuse | Runner's knee (PFPS), IT band syndrome | Moderate pain allowance, emphasis on hip/quad strength |
| Muscle strain | Calf, hamstring, quad | Gradual speed/intensity limits, sprinting returns last |
| Ligament / sprain | Ankle sprain | Balance and stability tests are progression gates |
| Fascia | Plantar fasciitis | Morning pain is the main tracked signal |
| Post-surgical | ACL, meniscus, Achilles repair | **Locked unless the user confirms surgeon/PT clearance.** Supports later phases only. |
| Not sure | — | Cautious general track plus a "consider seeing a PT" prompt |

### Intake flow
1. Body area → injury (or "not sure")
2. **Red-flag screen** (can't bear weight, numbness/tingling, significant swelling, night pain, chest pain or dizziness) → stop and refer to a professional
3. Clearance questions (diagnosed? cleared to walk/run?)
4. Ability tests to set the starting phase (e.g., 30-min brisk walk pain-free? number of single-leg calf raises? single-leg squat? hop test for later phases)
5. Goal (casual jogging, a 5K, previous training level)

### Implementation requirements
- **Rules are data, not code:** store per-category thresholds, phase criteria and progression steps as readable config (JSON or a Supabase table) so the PT can review and edit them and rules can change without an app release.
- Engine is pure, deterministic, versioned and **heavily unit-tested** with scenario fixtures (e.g., "Achilles, pain 6/10 next morning → regress").
- Every decision records which rule produced it, so it can be traced and explained.

### Safety and legal positioning
- Positioned as a **general wellness and education tool, not medical advice or a PT replacement**. Disclaimers at onboarding and in the coach.
- Red flags always escalate to "stop and see a professional."
- Injury and pain data is sensitive health data: encrypt it, collect the minimum, write a clear privacy policy. Be aware of the FTC Health Breach Notification Rule and state laws such as Washington's My Health My Data Act. Staying "general wellness" helps avoid FDA medical-device territory.

---

## 6. Native feature setup

### 6.1 Background GPS (`expo-location` + `expo-task-manager`)
- `app.json`: iOS `UIBackgroundModes: ["location"]`, specific `NSLocation*UsageDescription` strings and `NSMotionUsageDescription`. Android permissions `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `ACTIVITY_RECOGNITION`, `POST_NOTIFICATIONS`. `expo-location` plugin with `isIosBackgroundLocationEnabled`, `isAndroidBackgroundLocationEnabled` and `isAndroidForegroundServiceEnabled` set to true.
- `TaskManager.defineTask` at **module top level**, imported at app entry.
- `startLocationUpdatesAsync` with `Accuracy.BestForNavigation`, `ActivityType.Fitness`, `distanceInterval ~5`, `pausesUpdatesAutomatically: false`, `showsBackgroundLocationIndicator: true`, and a `foregroundService` notification.
- **Write points to SQLite immediately** in the task. Sync to Supabase after the session.
- Filtering: drop points with accuracy worse than ~20–25 m and implied speed above ~12 m/s. Smooth before computing pace. Auto-pause below a speed threshold. Require a good GPS fix before Start.
- Permissions: ask for "While Using" first, with **custom explainer screens before every system prompt**.
- Verify on real devices whether expo-location requires the background (Always) permission for this flow on each platform, and request no more than necessary.
- Known issues: the Google Play background-location declaration (fitness is an accepted use), aggressive OEM battery killers (dontkillmyapp.com), iOS Low Power Mode. Fallback if expo-location proves unreliable: `react-native-background-geolocation` (Transistorsoft, paid license for Android release builds). Discuss with the user before switching.
- Testing: iOS Simulator *Features → Location → City Run*, Android Emulator *Extended Controls → Location → Routes/GPX*, plus real-device screen-lock walks.

### 6.2 Maps (`react-native-maps`)
- iOS uses Apple Maps (no key). Android uses Google Maps and needs a key restricted to the package name and SHA-1 (`androidGoogleMapsApiKey` in the plugin config). **Keys go in env/EAS secrets, not committed.**
- Wrap in an `<ActivityMap>` component so a later move to Mapbox (`@rnmapbox/maps`, for the v3 route builder) touches one file.

### 6.3 Apple Health (`@kingstinct/react-native-healthkit`)
- Config plugin with `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription`. HealthKit enabled on the App ID.
- Read: heart rate, resting HR/HRV (later), past workouts (for intake). Write: workout, distance, calories, and the **workout route**.
- Ask at a natural moment (after the first session), not on first launch. iOS hides read denials, so the UI must work with no health data.

### 6.4 Health Connect (`react-native-health-connect` + `expo-health-connect`)
- `minSdkVersion 26` via `expo-build-properties`. `android.permission.health.*` permissions for heart rate, exercise and distance.
- Check availability (built into Android 14+, otherwise a Play Store app). A Play Console health-permissions declaration is needed.

### 6.5 Other
- Cadence: `expo-sensors` Pedometer step deltas over a rolling 10–15 s window
- Notifications: `expo-notifications` for the next-morning check-in reminder (core to the rehab loop)
- Local storage: `expo-sqlite` for GPS points and unsynced sessions (offline-first)

---

## 7. PT review checkpoints
Remind the user when each one comes up:
1. **Before building the engine:** categories, pain thresholds, phase criteria, red-flag list
2. **After the engine works:** run 5–10 scenario fixtures past the PT
3. **Before beta:** try to make the AI coach give bad advice; review disclaimers and wording
4. **Ongoing:** real user feedback

Plan to credit the PT in-app ("Protocols reviewed by …, DPT") if they agree.

---

## 8. Monetization prep (free phase)
- Add a `plan` / `entitlement` field on each user in Supabase from day one. All features unlocked.
- Track feature usage (tracking vs. coach vs. rehab plans) to inform pricing later.
- Collect emails (Resend) for launch and pricing announcements.
- Planned "founding member" perk for early users when pricing launches.
- Pricing options to evaluate later: freemium (tracking free, coach/rehab paid), free rehab with paid performance plans, per-program purchase, B2B for PT clinics.
- Reason for this payments setup: Apple and Google require their own in-app purchase for digital features sold inside the app, so Stripe can't replace RevenueCat in-app. US link-out to web checkout is now allowed but the rules vary by region and change often; **check current store guidelines before enabling payments.** RevenueCat can integrate with Stripe so web purchases unlock the app.

---

## 9. Build order (SLC v1)

1. **Foundation:** Expo project, dev build running on a real iPhone and Android phone, Expo Router navigation, Supabase auth (Resend for email), env/secrets setup
2. **Tracking:** foreground GPS + live stats → background GPS + SQLite → session summary with map polyline and markers → history → cadence
3. **Health:** Apple Health / Health Connect write, then read
4. **Rehab engine:** *(PT checkpoint 1 first)* intake, categories, rules-as-data, progress/hold/regress, unit tests *(then PT checkpoint 2)*
5. **Check-ins:** pain/RPE/body map, next-morning notification
6. **AI coach:** server endpoint, engine-aware context, chat UI, usage cap, guardrails
7. **Lovable layer:** milestones, progress view, polish
8. **Beta:** TestFlight and Play internal testing with recovering runners *(PT checkpoint 3)*

**Later roadmap:** strength/mobility exercise library with videos, watch support, weekly reports, PT share link → post-rehab 5K/10K plans → saved and suggested routes ("a flat 2.5 km loop matching today's prescription") and the route builder (Mapbox) → other activities, social, PT clinic dashboard (Next.js), payments.

---

## 10. Accounts the user needs
- Apple Developer Program ($99/yr): HealthKit and background modes on device, TestFlight
- Google Play Console ($25 one-time)
- Google Cloud (Maps SDK for Android key)
- Supabase, Vercel, Resend, Anthropic API (RevenueCat and Stripe later)

---

## 11. How to work with this user
- Explain what you're doing and why as you go, especially native and build steps (when a rebuild is needed, what a permission is for).
- Confirm before moving to the next phase, and before any outward-facing action (store submissions, deploys, paid services).
- Keep secrets out of the repo.
- Prefer the simplest approach that is still complete, in keeping with SLC.

**Start now with Phase 1.**
