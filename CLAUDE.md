# Expiry Radar — Build Spec & Claude Code Prompt
 
This document has two parts:
1. **Full detailed spec** — for your own reference, and so Claude Code has complete context.
2. **The actual prompt** — copy the section at the bottom into Claude Code to start the build.
---
 
## Part 1: Full Spec
 
### 1. What the app is
 
Expiry Radar is a mobile app that helps people track anything with a deadline — expiration, renewal, warranty, or return window — and reminds them before it's too late.
 
It is **not** a calendar, task manager, document manager, finance app, or inventory system. It does one job: track things that expire, and remind people proactively so nothing is missed.
 
### 2. Tech stack (recommended default)
 
Assuming no existing preference, this stack fits a solo/small-team build well and keeps local + cloud sync simple:
 
- **Frontend:** React Native with Expo (single codebase for iOS + Android)
- **Navigation:** Expo Router (file-based routing)
- **Backend / DB:** Supabase (Postgres + Auth + Storage for attachments)
- **Local-first cache:** local SQLite (via Expo SQLite) synced to Supabase, so the app works offline and syncs when online
- **Notifications:** Expo Notifications (local scheduled notifications; no need for a push server for MVP since reminders are scheduled on-device)
- **State management:** Zustand or React Context (keep it simple, avoid Redux)
*(If you already have a preferred stack, tell Claude Code that instead — the data model and feature list below are stack-agnostic.)*
 
### 3. Data model
 
```
User {
  id
  email
  created_at
}
 
Item {
  id
  user_id
  name                // e.g. "Passport", "Milk", "Headphones"
  category            // enum, see Section 4
  key_date            // the date that matters: expiry / use-by / return deadline / renewal
  status              // computed, not stored: expired | critical | soon | upcoming | later
  notes               // optional free text
  quantity            // optional, only shown for Food category
  created_at
  updated_at
  archived_at         // nullable — soft delete
}
 
Reminder {
  id
  item_id
  offset_days         // e.g. 30, 7, 1 (days before key_date)
  notification_id     // reference to the scheduled local notification, for cancel/reschedule
}
 
Attachment {
  id
  item_id
  file_url            // stored in Supabase Storage
  file_type           // image | pdf
  created_at
}
```
 
**Status is always computed at read-time** from `key_date` vs. today — never stored, to avoid stale data:
- `expired`: key_date has passed
- `critical`: within 3 days
- `soon`: within 7 days
- `upcoming`: within 30 days
- `later`: more than 30 days out
**Important implementation detail:** whenever `key_date` on an Item is edited, all existing scheduled notifications tied to its Reminders must be cancelled and rescheduled against the new date. This must not be an afterthought — a stale notification firing on the wrong date breaks user trust.
 
### 4. Categories (flat, final list for v1)
 
| Category | Examples | Notes |
|---|---|---|
| Documents | Passport, visa, license, ID, certificates | |
| Food | Perishables, pantry, fridge/freezer items | Only category that uses the optional `quantity` field |
| Returns & refunds | Purchase return windows | key_date = return deadline |
| Warranties | Electronics, appliances, vehicles, furniture | |
| Subscriptions | Streaming, software, cloud storage, memberships | |
| Insurance | Vehicle, health, travel, home | |
| Finance | Debit/credit cards, gift cards | key_date = card/balance expiry |
| Vehicle | Registration, emissions check, service due dates | |
| Other | Catch-all | |
 
**Explicitly excluded:** money lending/borrowing between people. This was considered and deliberately cut — it's a different domain (social debt tracking) than expiry tracking, and doesn't belong in this app's scope even in a later version unless there's strong evidence of demand.
 
Each category maps to:
- a default icon
- an optional "smart template" that prefills a sensible default reminder schedule (e.g. Documents → remind 90/30/7 days before; Food → remind 1 day before; Returns → remind 3 days and 1 day before)
### 5. Screens
 
1. **Home / Dashboard**
   - Top stat row: count of expired, count expiring this week, total tracked
   - Section: "Expiring soon" (Documents, Warranties, Subscriptions, Insurance, Finance, Vehicle — sorted by urgency)
   - Section: "Food" (separate, own preview with a "View all" link if more than ~3 items)
   - Section: "Returns & refunds"
   - Section: "Upcoming" (everything further out, lower visual weight)
   - Floating "+" button to add an item
2. **Add / Edit item**
   - Step 1: pick a category (grid of icons)
   - Step 2: name, key date (with smart template prefilling reminder offsets based on category), optional notes, optional attachment, optional quantity (Food only)
   - Save
3. **Item list (all items)**
   - Filterable by category and by status
   - Searchable by name
4. **Item detail**
   - Shows all fields, countdown, reminder schedule, attachments
   - Actions: Edit, Archive/Delete, Mark as used/returned/renewed (label changes per category)
5. **Settings**
   - Notification defaults
   - Account / sign out
   - Data export (see Section 7)
### 6. Notifications — reliability requirements
 
This is the core value proposition of the app, so it needs explicit handling, not an afterthought:
- Reminders are scheduled as **local device notifications** at add/edit time (not server-dependent), so they still fire even if the app hasn't been opened in weeks.
- Editing or deleting an item must cancel and reschedule/remove its notifications.
- Handle OS-level background restrictions gracefully (Android battery optimization, iOS notification permissions) — prompt the user to enable notifications on first launch and explain why.
- If notification permission is denied, show a persistent (non-nagging) banner on Home reminding the user reminders won't fire.
### 7. Data export & deletion
 
Given the app stores personal documents (passport photos, insurance docs), include from day one or as an immediate fast-follow:
- Export all items + attachments as a downloadable file
- Full account deletion that removes all data from Supabase, not just a soft delete
### 8. MVP scope
 
**In scope for v1:**
- Auth (email/password or magic link via Supabase)
- Guest mode: allow adding a small number of items locally before requiring signup (don't force signup before first use)
- All 9 categories including Food and Returns & refunds
- Add / edit / delete / archive items
- Local notifications with the reliability behavior in Section 6
- Home dashboard as described in Section 5
- Search and filter
- Basic settings + data export
**Out of scope for v1 (do not build yet):**
- Money lending/borrowing (permanently cut, not deferred)
- Family/shared items
- Custom user-defined categories
- Tags
- Barcode scanning / OCR
- Recurring auto-renewal automation
- Renewal history log
- Calendar view
- Subscription payment amount tracking
- Push notifications from a server (local notifications are sufficient for v1)
### 9. Design principles to follow throughout the build
 
1. Adding an item should take under a minute.
2. The user should always know at a glance what needs attention right now.
3. The app should be proactive — reminders come to the user, not the other way around.
4. Keep the data model simple: one Item schema with a category field, not a separate table per category.
5. Every feature must serve "don't forget important deadlines" — resist scope creep.
---
 
## Part 2: The Prompt for Claude Code
 
Copy everything below this line into Claude Code to start the build.
 
```
I'm building a mobile app called "Expiry Radar" — an app that tracks anything with a deadline (expiration, renewal, warranty, return window) and proactively reminds the user before it's too late. It is explicitly NOT a calendar, task manager, document manager, finance app, or inventory system.
 
Tech stack:
- React Native with Expo (Expo Router for navigation)
- Supabase for backend (Postgres, Auth, Storage)
- Local SQLite cache synced with Supabase for offline support
- Expo Notifications for local, on-device scheduled reminders (no server push needed for v1)
- Zustand for state management
 
Please start by:
1. Scaffolding a new Expo project with Expo Router, TypeScript, and the folder structure for screens, components, and Supabase client setup.
2. Setting up the Supabase schema for these tables: User, Item, Reminder, Attachment (I'll paste the full field list below).
3. Building the Home dashboard screen first, since it's the core of the app.
 
Data model:
 
Item {
  id, user_id, name, category (enum), key_date, notes (optional),
  quantity (optional, Food only), created_at, updated_at, archived_at (nullable)
}
status is NOT stored — compute it at read time from key_date vs today:
  expired (past due), critical (within 3 days), soon (within 7 days),
  upcoming (within 30 days), later (more than 30 days out)
 
Reminder {
  id, item_id, offset_days (e.g. 30, 7, 1), notification_id (for cancel/reschedule)
}
 
Attachment {
  id, item_id, file_url, file_type (image | pdf), created_at
}
 
Categories (flat list, each with a default icon and default reminder offsets):
- Documents (passport, visa, license, ID, certificates) — default reminders: 90/30/7 days
- Food (perishables, pantry, fridge/freezer items; only category using the optional quantity field) — default reminder: 1 day
- Returns & refunds (purchase return windows) — default reminders: 3/1 days
- Warranties (electronics, appliances, vehicles, furniture) — default reminders: 30/7 days
- Subscriptions (streaming, software, memberships) — default reminders: 7/1 days
- Insurance (vehicle, health, travel, home) — default reminders: 30/7 days
- Finance (debit/credit cards, gift cards) — default reminders: 30/7 days
- Vehicle (registration, emissions check, service due) — default reminders: 30/7 days
- Other (catch-all) — default reminder: 7 days
 
Do NOT include any money lending/borrowing feature — this was deliberately scoped out.
 
Home dashboard should group items by action needed, not just raw urgency:
1. "Expiring soon" — Documents, Warranties, Subscriptions, Insurance, Finance, Vehicle, sorted by soonest first
2. "Food" — separate section, shows a few items with a "View all" link if there are more
3. "Returns & refunds" — separate section
4. "Upcoming" — lower-priority items further out
 
Critical reliability requirement: reminders must be scheduled as local device notifications so they fire even if the app hasn't been opened in weeks. Whenever an item's key_date is edited, cancel and reschedule its existing notifications — never leave a stale notification scheduled against an old date.
 
Other screens needed: Add/Edit item (category picker → form with smart-template-prefilled reminders → save), Item list (filterable by category/status, searchable), Item detail (with category-appropriate action button: Renew / Mark returned / Mark used, etc.), Settings (notification defaults, account, data export).
 
Allow a guest mode: let users add a few items locally before requiring signup, don't force account creation before first use.
 
 
```