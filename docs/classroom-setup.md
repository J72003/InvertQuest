# Fieldnotes — Classroom Setup Guide for Teachers

## Overview

Fieldnotes connects students in the field with a shared classroom database. As a teacher, you:
- Create the classroom and share the join code with students
- Create sampling sites (GPS-pinned locations along your stream)
- Leave feedback comments on student specimens
- Pin notable finds so they float to the top of the class feed
- Monitor stream health scores (FBI grade, EPT richness) per site

---

## Step 1: Create Your Account

1. Download the Fieldnotes app and tap **Create Account**.
2. Enter your name, email, and a password.
3. On the next screen, select **Teacher**.
4. Tap **Create Classroom** and give your class a name (e.g. "AP Env. Sci. Period 3 — Spring 2026") and optional description.
5. A six-character **join code** is generated (e.g. `AB3K9P`). Write it on the board or share it however you like.

---

## Step 2: Share the Join Code

Students open Fieldnotes, create their own account, choose **Student**, then enter the join code. That's it — they immediately appear in your class feed.

The code is case-insensitive. A student who has joined your classroom can't join again (it silently no-ops).

---

## Step 3: Create Sampling Sites

Before heading to the stream, create your sites in the app.

1. Go to the **Sites** tab.
2. Tap **+ New Site**.
3. Drop a pin on the map (or enter coordinates manually) and give the site a name (e.g. "Upstream control", "Below road culvert").
4. Add an optional description (substrate type, shade, notes).
5. Tap **Save**.

When a student saves a specimen within **100 metres** of a named site, the app automatically links the specimen to that site. This powers the per-site FBI calculation. Students can also manually select a site from the form.

> **Tip:** You can create sites in the classroom before your field day. Students don't need to be present for site creation.

---

## Step 4: Field Day

Students:
1. Open Fieldnotes → tap **New Specimen** (the large button).
2. Photograph the invertebrate.
3. Review the AI suggestion, confirm or override the taxon identification, fill in size/habitat/behaviors.
4. Tap **Save Specimen**.

The specimen appears in the class feed within seconds (when connectivity is available). If a student is offline, specimens queue locally and sync when they reconnect.

---

## Step 5: Reviewing Student Work

### Leaving Feedback

1. Open the **Class Feed** tab and tap any specimen card.
2. Scroll to the **Feedback** section at the bottom.
3. Tap the comment box and type your feedback.
4. Tap **Post**.

Students receive a push notification and will see your comment the next time they view that specimen. A red dot appears on their Collection tab until they read it.

### Pinning Notable Finds

On any specimen card in the feed, tap the **☆ Pin** button (teacher-only). Pinned specimens float to the top of the feed with a gold ribbon.

---

## Understanding the FBI Score

The **Family Biotic Index (FBI)** is computed live for each site:

```
FBI = average tolerance value across all identified specimens at the site
```

Tolerance values (0–10, from Hilsenhoff 1988) are assigned per family:
- Lower score = more pollution-sensitive community = cleaner water
- Higher score = more tolerant community = degraded water quality

| Grade | FBI    | Interpretation       |
|-------|--------|----------------------|
| A     | ≤ 3.75 | Excellent water quality |
| B     | ≤ 5.00 | Good water quality   |
| C     | ≤ 6.50 | Fair — some impairment |
| D     | > 6.50 | Poor — significant impairment |

**EPT Richness** counts the number of distinct Ephemeroptera (mayfly), Plecoptera (stonefly), and Trichoptera (caddisfly) taxa found at the site. Higher is better.

Only specimens with a confirmed taxon identification count toward FBI. Specimens marked "Other / Not sure" are excluded.

---

## Classroom Management Tips

- **Multiple classrooms:** You can create more than one classroom (e.g. different class periods). Each classroom has its own feed, sites, and FBI scores.
- **Site naming convention:** Name sites so students can tell them apart in the field ("Bridge pool", "Riffle below bridge", "Reference reach 200m upstream").
- **Pre-identifying taxa:** Use the **Guide** tab to walk through the 13 taxa with students before the field day. The ecological notes give context for why each organism matters as a bioindicator.
- **Offline-first:** Fieldnotes works without connectivity. Tell students to open the app before leaving for the field — the map tiles and taxa guide are cached.

---

## Frequently Asked Questions

**Can students add comments?**  
No. Only teachers can post comments on specimens. This keeps the feedback loop intentional: students document, teachers assess.

**What if a student picks the wrong taxon?**  
Students own their specimens and can edit them. The AI identification is advisory; it never overwrites the student's selection. Encourage students to treat the AI as a first guess and exercise their own judgment.

**Can I export the data?**  
Not yet in the app — but your Supabase project dashboard allows CSV export of any table. The `site_health_metrics` view is a good starting point for a class report.

**What does "Models disagree" mean in the AI banner?**  
The app runs two models in parallel (Roboflow YOLOv8 + Claude vision). If they identify different taxa, the banner flags it. This is a teaching moment — both models can be wrong, and the student's field observation is the most valuable data.
