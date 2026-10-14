# Brag Plan: SplitBiller, what's new

## What shipped
Shared groups that everyone edits from their own phone, end-to-end encrypted. Joining suggests a made-up name, so nobody has to give their real one. Each group can pick one of 9 themes. Together with who-owes-whom, UPI settling, split links and the free tools, this is the homepage video.

## Angle
"Split bills, privately." Privacy is the thread through every new feature: the server can't read the group, and you don't have to give it your name. The video is the real app, recorded from the feature clips, with the product's own copy.

## Format
Landscape 1920x1080, 30fps, 42s. It uses the same look, fonts, music bed and SFX as `../brag.mp4` and `../split-links/brag.mp4`, so the three read as a series.

The homepage serves a 720p web encode (`public/promo/splitbiller-promo.mp4`, about 2 MB) with a poster taken at 15.5s.

## Storyboard
The label sits on the left and the real app runs in a phone frame on the right. Scenes 4–6 carry a "New" badge.

| # | Scene | Time | On screen | Clip (media start) |
|---|-------|------|-----------|--------------------|
| 1 | Hook | 0–3.6s | "Split bills, privately." The brand underline draws under "privately." Sub: "Settle by UPI. No signup. End-to-end encrypted." | — |
| 2 | Who owes whom | 3.5–8.1s | "Who owes whom, in seconds" | `settle.mp4` (0.6s): balances, then the settle-up list |
| 3 | UPI | 8–12.6s | "Pay by UPI in one tap" | `upi.mp4` (1s): pay → "Did the payment go through?" → mark paid |
| 4 | Shared groups (new) | 12.5–19.1s | "Shared groups, end-to-end encrypted". Two phones, captioned "Your phone" and "Ben’s phone". | `sync.mp4` (3.6s): Ben opens the link, says who he is, adds an expense, and it lands on your phone |
| 5 | Anonymous join (new) | 19–24.6s | "Join without giving your name" | `join.mp4` (0.6s): shuffle made-up names, join, see the group |
| 6 | Themes (new) | 24.5–29.1s | "Give every group its own look" | `themes.mp4` (0.7s): theme picker → Midnight |
| 7 | Split links | 29–34.1s | "Collect money with one link" | `split-link.mp4` (4.7s): payments come in and the balance drops |
| 8 | Tools | 34–37.1s | "And 22 free calculators" with 12 tool pills popping in | — |
| 9 | Outro | 37–42s | "Split bills, privately." Chips: No signup · End-to-end encrypted · UPI ready · Free forever. Then the logo and "splitbiller.com". | — |

## Audio
- **Music:** the `happy-beats-business-moves-vol-1` bed at 0.4, with a 1s fade-in and a 2.5s fade-out.
- **Beat grid:** every 0.5s. Scene entrances land on beats (x.02 / x.52).
- **SFX** (under the bed):
  - a card slide per scene;
  - a bong on each "New" badge;
  - clicks as the tool pills arrive;
  - a bell on the outro title;
  - a bong on the logo.
- **Background glows:** bass and mids are re-extracted for 42s into `composition/assets/audio-data.js` and make the glows breathe.

## Data note
Names and amounts are illustrative: Asha, Ben, Chen, Dev, a Goa trip, and the made-up name "Mikoox". On-screen UI is the real app, recorded by `scripts/feature-clips/clips.mjs`. No user data appears.

## Rebuild
1. Re-record the clips if the UI changed (`node scripts/feature-clips/clips.mjs`), then copy the ones used into `composition/assets/clips/`.
2. Check and render:
   `cd composition && npx --yes hyperframes@0.8.137 check && npx --yes hyperframes@0.8.137 render -q delivery -o ../brag.mp4 .`
3. Web encode and poster for the homepage, from the repo root:
   ```
   ffmpeg -i brag-output/whats-new/brag.mp4 -vf scale=1280:720:flags=lanczos -c:v libx264 -profile:v high -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/promo/splitbiller-promo.mp4
   ffmpeg -ss 15.5 -i brag-output/whats-new/brag.mp4 -frames:v 1 -vf scale=1280:720:flags=lanczos -q:v 4 public/promo/splitbiller-promo-poster.jpg
   ```

The 1080p master (`brag.mp4`) isn't committed because it can be rebuilt from the composition.
