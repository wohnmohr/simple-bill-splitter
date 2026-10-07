# Hyperframes Composition Brief: SplitBiller

## Objective
Create a short launch-style brag video for SplitBiller.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22s

## Source Material
- Project root: repo root
- Primary files read: `components/Landing/LandingPage.tsx`, `app/globals.css`, `tailwind.config.ts`, `components/Settlements/SettlementList.tsx`, `README.md`, `package.json`
- Product name: SplitBiller
- Tagline / strongest claim: "Split bills in ₹, settle with UPI"
- Key UI moment to recreate: the settle-up card (Goa trip, Rohan → Priya ₹6,215, Aisha → Priya ₹2,940, "Pay ₹6,215 with UPI", "2 payments settle it")
- Copy that must appear verbatim:
  - Split bills in ₹, settle with UPI
  - Free forever · No sign-up · Takes ~30 seconds
  - Add people involved in the expense
  - Enter each expense and who paid
  - Instantly see who owes whom and how much
  - A Splitwise alternative without the login.

## Creative Direction
- Tone preset: app-store
- Creative direction: quiet, confident product film with a small wink at the group-chat question
- Angle / hook / outro: see `brag-plan.md`
- Avoid: generic SaaS language, abstract filler, redesigning the brand

## Visual Identity
- Background #f7f6f3, text #1c1826, accent #53307b, soft #ece3f5, line #e7e3ea, positive #11754c
- Display font Fraunces, body font Outfit (bundled locally as woff2 in `assets/fonts/`)

## Storyboard
Use `brag-plan.md` as the contract: Hook 0–3.5s, Add people 3.5–8.5s, Enter expenses 8.5–13.5s, Settle up 13.5–18s, Outro 18–22s.

## Audio
- Role: warm bed with sparse motion-matched accents
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`, low bed, fade-in 1s, fade-out final 2s
- Music cue guidance: bundled preset; beat grid 0.5s from 3.02s; strong cues 16.02s and 18.02s are beat-locked
- Audio-reactive treatment: subtle; bass drives background glow, mids drive a faint settle-card lift (data extracted with hyperframes-creative `extract-audio-data.py`, compacted to `assets/audio-data.js`)
- SFX: soft clicks for chips, card slide for expense rows, click for the UPI press, bell for the settle badge and the logo
- Exact SFX files, timestamps and volumes were chosen after the animation was written.

## Hyperframes Instructions
Built from the hyperframes-core, hyperframes-animation, hyperframes-creative and hyperframes-cli guidance. Gate: `npx hyperframes check`. Keep creation and rendering local.
