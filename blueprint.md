# RunAds Project Blueprint

## 1. Project Overview
**RunAds** is a peer-to-peer advertising network where website owners can exchange traffic. Users register their websites, categorize them, and embed a script that displays a discreet popup (similar to a chat widget). This popup displays ads for other member websites in the same category.

**Key Mechanism:**
- Website Owner A embeds the script.
- Visitor on Site A sees an ad for Site B (same category).
- If Visitor clicks the ad, Owner A earns credits (balance).
- The script is domain-locked for security.

## 2. Technical Architecture
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Vercel / Firebase Hosting (compatible with Next.js)

## 3. Implementation Plan

### Phase 1: Setup & Infrastructure
- [x] Initialize project with Firebase SDKs.
- [x] Configure `blueprint.md`.
- [x] Setup Authentication (Login/Register).

### Phase 2: User Dashboard
- [x] Create Dashboard Layout.
- [x] "Add Website" functionality (Domain, Category).
- [x] "My Websites" list.
- [x] Script Generator (Unique ID per site).
- [x] Website Details page with Embed Code.
- [x] Cashout Page (Lightning/Bitrefill).

### Phase 3: Ad Engine (The Script)
- [x] Develop the Embeddable Widget (Client-side JS at `/api/script`).
- [x] Create API `/api/ad-serve`:
    - Validates request Origin/Referer against registered domain.
    - Fetches a random ad (website) from the same category.
    - Returns ad content.
- [x] Create API `/api/click`:
    - Records the click.
    - Updates user balance (Credit transfer).
    - Redirects to target URL.

### Phase 4: Analytics & UI Polish
- [x] Landing Page: Modern, high-converting design.
- [x] Dashboard: Show views/clicks and current balance.
- [ ] Advanced Analytics (Charts/Graphs) - *Planned for future update*.
- [x] Responsiveness check.
