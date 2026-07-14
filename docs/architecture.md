# Fieldnotes — Architecture Notes

## Dual-AI Identification Pipeline

When a student captures a photo, two models run in parallel via `Promise.allSettled`:

```
Device                     Roboflow                  Supabase Edge Function
  |                           |                               |
  |── compress to 1600px ────▶|                               |
  |   JPEG 0.85               |── YOLOv8 inference ──────────▶|
  |                           |◀─ bbox + class + confidence ──|
  |                           |                               |
  |────────────────────────── POST /identify-specimen ───────▶|
  |                                                           |── Claude Haiku vision ──▶ Anthropic API
  |                                                           |◀─ JSON { class_index, confidence, reasoning }
  |◀────────────────────────── { roboflow, claude } ─────────|
  |
  |── render bbox overlay on photo
  |── show suggestion banner
  |── pre-select taxon tile if confidence > 0.70
```

**Why two models?**
- Roboflow gives bounding boxes (useful for the overlay and for future training data collection).
- Claude provides natural-language reasoning ("large flat body clinging to rock surface — consistent with Psephenus") that becomes a teaching moment in the collapsed AI Predictions section of SpecimenDetail.
- The student's final taxon selection is ground truth. `ai_predictions` is stored as JSONB alongside but never overwrites `taxon_id`.

**Security:** The Anthropic API key lives in Supabase Edge Function secrets and is never sent to the client. Roboflow's key is client-side (low risk: inference-only, no billing surprise exposure at educational scale).

**Fallback:** `Promise.allSettled` — if either model fails, the app continues with whatever result is available. A `null` in `ai_predictions.roboflow` or `ai_predictions.claude` is expected and handled in the UI.

---

## Family Biotic Index (FBI)

The FBI is a weighted pollution tolerance index defined by Hilsenhoff (1988):

```
FBI = Σ(nᵢ × tᵢ) / N
```

Where:
- `nᵢ` = number of individuals of taxon *i*
- `tᵢ` = tolerance value of taxon *i* (0 = intolerant, 10 = very tolerant)
- `N` = total number of individuals in the sample

Since each row in `specimens` represents one individual with one tolerance value, this simplifies to the arithmetic mean tolerance across all identified specimens at a site:

```sql
ROUND(SUM(t.tolerance) / COUNT(sp.id), 2)
```

Specimens with `taxon_id IS NULL` (student selected "Other / Not sure") are excluded from the calculation.

**Grade thresholds** (Hilsenhoff 1988):

| Grade | FBI Range | Water Quality |
|-------|-----------|---------------|
| A     | 0 – 3.75  | Excellent     |
| B     | 3.76 – 5.00 | Good        |
| C     | 5.01 – 6.50 | Fair        |
| D     | 6.51 – 10.0 | Poor        |

**EPT Richness** (also computed in `site_health_metrics` view) counts the number of *distinct taxa* from orders Ephemeroptera (mayflies), Plecoptera (stoneflies), and Trichoptera (caddisflies). Higher EPT richness signals cleaner water; these orders are the most pollution-sensitive.

> Note: Plecoptera (stoneflies) are included in the EPT count formula even though none of the 13 training taxa belong to that order. This future-proofs the view for dataset expansion.

---

## Offline Queue

The offline queue uses `@react-native-async-storage/async-storage` as a durable local store, managed by a Zustand slice (`offlineQueueStore.ts`).

**Flow:**

1. Student taps "Save Specimen" with no connectivity.
2. `useOfflineQueueStore.add()` persists the specimen record (including local image URI) to AsyncStorage under key `fieldnotes_offline_queue`.
3. A banner on the Home screen shows the pending count.
4. On app foreground or when `@react-native-community/netinfo` reports connectivity restored, `drainQueue()` is called.
5. For each queued item: upload image to Supabase Storage, insert the specimen row, then `remove()` from the queue.
6. If upload fails, the item stays in the queue and the drain retries on the next connectivity event.

**Invariants:**
- The queue is keyed by `queueId` (timestamp + random suffix) so concurrent drains don't double-submit.
- `isDraining` flag prevents re-entrant drain calls.
- Local image URIs (from `expo-image-manipulator`) are app-scoped and survive restarts on both platforms.

---

## RLS Design

Every table has Row Level Security enabled. Key design decisions:

- **`classroom_members`** has no INSERT policy — the only way to join is via the `join_classroom_by_code(p_code)` SECURITY DEFINER function. This prevents students from inserting arbitrary memberships.
- **`comments`** INSERT is restricted to teachers in the specimen's classroom. Students can only read.
- **`specimens`** are visible to all members of the same classroom, enabling the class feed, but only the owner can update or delete.
- Helper functions `is_classroom_member()`, `is_classroom_teacher()`, and `is_teacher_for_specimen()` are declared `STABLE SECURITY DEFINER` to avoid RLS recursion and ensure consistent evaluation.

---

## Navigation Structure

```
RootNavigator (Stack)
├── Auth (Stack) — shown when session is null
│   ├── Login
│   └── Register
├── Onboarding (Stack) — shown when profile has no role or no classroom
│   ├── RoleSelect
│   ├── JoinClassroom  (students)
│   └── CreateClassroom (teachers)
└── App (Stack) — shown when fully onboarded
    ├── MainTabs (BottomTab)
    │   ├── Home (Capture button)
    │   ├── Collection
    │   ├── Feed
    │   ├── Sites
    │   └── Guide
    ├── Camera (fullScreenModal)
    ├── Details (modal) — AI results + specimen form
    └── SpecimenDetail (push)
```

The gate logic in `RootNavigator` checks:
1. `session` (Supabase auth) — if null, Auth stack
2. `profile.role` + classroom membership — if incomplete, Onboarding stack
3. Otherwise, App stack
