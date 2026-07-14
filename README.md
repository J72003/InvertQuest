# Fieldnotes

A production-grade mobile field tool for high school and undergraduate biology students to photograph freshwater stream invertebrates, receive AI-assisted taxonomic identification, and contribute to classroom-level water quality assessments using established bioassessment science (EPA Rapid Bioassessment Protocol, Hilsenhoff Family Biotic Index).

---

## Account Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run **all files** in `migrations/` in order (e.g. `001_initial.sql`).
3. From **Project Settings → API**, copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. Roboflow

1. Upload your training images to [roboflow.com](https://roboflow.com) and train a YOLOv8 model with the 13 classes (class indices 0–12 as specified in `src/constants/taxa.ts`).
2. Deploy the model to Roboflow's hosted inference.
3. From the model page copy:
   - **Inference URL** → `EXPO_PUBLIC_ROBOFLOW_MODEL_URL`
   - **Private API Key** → `EXPO_PUBLIC_ROBOFLOW_API_KEY`

### 3. Anthropic (Claude Vision)

The Claude vision call is proxied through a **Supabase Edge Function** — the key never reaches the mobile client.

```bash
# Set the secret in your Supabase project
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Then deploy the function:

```bash
supabase functions deploy identify-specimen
```

See [Edge Function deployment](#edge-function) below.

### 4. Expo / EAS

1. Install the EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Run `eas init` inside the project directory to create a project and get a Project ID.
4. Set the `extra.eas.projectId` field in `app.json`.

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...
EXPO_PUBLIC_ROBOFLOW_MODEL_URL=https://detect.roboflow.com/your-model/1
EXPO_PUBLIC_ROBOFLOW_API_KEY=your-key
# Anthropic key goes to Supabase Secrets, not .env — see above
```

---

## Running Locally

```bash
cd fieldnotes
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). The app targets Expo SDK 56.

> **Note:** Camera and GPS require a physical device; the iOS simulator cannot use the camera. The rest of the app (auth, forms, collection, feed, guide) works in Expo Go on simulator.

---

## Deploying via EAS Build

```bash
# Development build (for Expo Dev Client — supports native modules)
eas build --profile development --platform all

# Preview build (internal distribution)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

Add an `eas.json` to configure build profiles:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

---

## Edge Function

The `identify-specimen` edge function lives at `supabase/functions/identify-specimen/index.ts`.

**Deploy:**
```bash
# From the project root
supabase functions deploy identify-specimen --project-ref YOUR_PROJECT_REF
```

**Environment secrets required** (set with `supabase secrets set`):
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL` *(auto-injected)*
- `SUPABASE_SERVICE_ROLE_KEY` *(auto-injected)*

**How to trigger a database webhook for push notifications (Checkpoint E):**
In the Supabase dashboard → Database → Webhooks, create a webhook on `INSERT` to the `comments` table pointing to `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-comment`.

---

## Project Structure

```
fieldnotes/
├── src/
│   ├── lib/           Supabase client, TanStack Query client
│   ├── store/         Zustand stores (auth, offline queue)
│   ├── types/         TypeScript types matching DB schema
│   ├── hooks/         useAuth, useClassroom, etc.
│   ├── screens/       auth/, onboarding/, main/, capture/, specimen/
│   ├── navigation/    Stack & tab navigators + type definitions
│   ├── components/    ui/ (Button, Input, TolerancePill), specimen/
│   └── constants/     taxa.ts (13 EPT species), colors.ts
├── migrations/        SQL migrations (run in Supabase SQL editor)
├── supabase/
│   └── functions/     Edge Functions (Deno)
├── docs/              Architecture notes, teacher setup guide
└── App.tsx            Root component, font loading, provider tree
```

---

## Development Checkpoints

| Checkpoint | Status | Contents |
|-----------|--------|----------|
| A | ✅ Done | Scaffold, migration, auth, onboarding |
| B | ⏳ Next | Camera → AI identification → Details form → Save |
| C | — | Collection, Feed, SpecimenDetail, teacher comments |
| D | — | Sites, FBI grades, maps |
| E | — | Offline queue, push notifications, EAS config |
