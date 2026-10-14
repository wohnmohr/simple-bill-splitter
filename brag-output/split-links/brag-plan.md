# Brag Plan: SplitBiller split links

## What shipped
One end-to-end encrypted link per split. Friends pay by UPI and tap "I’ve paid"; the organiser can mark anyone "Received". Each person counts once, whoever marks first, and every screen updates live.

## Angle
The group-chat question after every dinner: "Who's paid?" The link answers it for everyone. The video is the real flow, using the product's own copy.

## Format
Landscape 1920x1080, 30fps, 30s. Same look, fonts, music bed and SFX as `../brag.mp4` so the two read as a series.

## Storyboard
1. **Hook (0–3.5s):** "Who’s paid?" with the brand underline under "paid?". Sub: "No more scrolling the group chat to check."
2. **A scene for every split (3.5–9.5s):** "14 split types. Dinner, rent, Wi-Fi, trips, turf, gifts, shagun and more." Eight real app screens, one per scene type, pop in on the half-beat and pan across: 🍽️ Dinner / outing (receipt), 🔑 Flat rent (ledger), 💡 Electricity (meter), 📺 Subscription (profiles), 🧳 Trip (boarding pass), 🏏 Turf / sports (scoreboard), 🎁 Group gift (jar), 💌 Shagun / wedding (envelope). Screens are captured from the app at phone size with sample splits (`composition/assets/templates/`).
3. **Share one link with the group (9.5–14.4s):** the split card ("Dinner tonight · Bill from Priya · ₹3,000 ÷ 5", "No payments yet. Be the first."). The organiser taps "Share link" → "Link copied". Note: "End-to-end encrypted · updates live for everyone with the link".
4. **Friends pay by UPI and tap “I’ve paid” (14.4–19.4s):** Rahul and Aisha land on the beat; balance due counts ₹3,000 → ₹1,800. Note: "Updates live for everyone".
5. **Or mark it “Received” yourself (19.4–24s):** under "Got paid? Add who paid you", the organiser types Dev and taps "Received ✓"; balance → ₹1,200. Someone types "rahul": "rahul is already marked paid", button disabled, Rahul's row pulses. Badge on the beat: "Counted once, whoever marks first".
6. **Outro (24–30s):** "One link. Everyone knows who’s paid." Pills: 14 split types · End-to-end encrypted · Updates live · No sign-up. Logo + "Pay your share of a split by UPI."

## Audio
`happy-beats-business-moves-vol-1` bed at 0.4, 1s fade-in, 2s fade-out. Beat grid every 0.5s from 3.02s; the steps and outro sit 6s (12 beats) after the hook + templates beat, so the outro title lands on 24.02s. SFX under the bed: a soft click as each template screen pops in, tap clicks on Share/Received, a card slide per payment row, soft key clicks while typing, a bong on the "counted once" badge and the logo, a bell on the outro title. Bass and mids from the track (re-extracted for 30s into `composition/assets/audio-data.js`) breathe the background glows.

## Data note
Names and amounts are illustrative (Priya, Rahul, Aisha, Dev; ₹3,000 split 5 ways). On-screen UI strings are verbatim from the app. No user data.

## Rebuild
`cd composition && npx --yes hyperframes@0.8.137 check && npx --yes hyperframes@0.8.137 render -q delivery -o ../brag.mp4 .`
