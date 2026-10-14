# Brag Plan: SplitBiller, what's new

## What shipped
Shared groups that everyone edits from their own phone, end-to-end encrypted. Joining suggests a made-up name, so nobody has to give their real one. Each group can pick one of 9 themes. Together with who-owes-whom, UPI settling, split links and the free tools, this is the homepage video.

## Angle
"Split bills, privately." Privacy is the thread through every new feature: the server can't read the group, and you don't have to give it your name. The video is the real app, recorded from the feature clips, with the product's own copy.

## Format
Landscape 1920x1080, 30fps, 42s. It uses the same look, fonts and SFX as `../brag.mp4` and `../split-links/brag.mp4`, so the three read as a series, with its own original track.

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
- **Music:** `composition/assets/music/splitbiller-groove.mp3`, an original track written in code (`music/compose.py`), so there's no licence to track.
  - 120 BPM house-pop in C major, IV–V–iii–vi with a V–I ending.
  - Instruments: four-on-the-floor kick, claps on 2 and 4, off-beat hats, a pumping sidechained bass and pad, and syncopated supersaw chord stabs.
  - A pluck arp with a dotted-8th delay plays under the "New" scenes.
  - Parts are mixed to fader levels against the kick, so the balance holds when a sound changes.
- **Arrangement:** follows the storyboard.
  - A filtered intro opens up, and a clap roll and riser lead into the drop at 4s as "Who owes whom" lands.
  - Crash at 12s for the "New" scenes.
  - One-beat break at 36s, and back in at 37s for the outro title.
  - A last hit on C at 40s rings out under the logo.
  - The track starts 20ms in, so its downbeats sit on the SFX grid (x.02 / x.52).
- **In the composition:** the music bed plays at 0.5, with a 0.3s fade-in and a 0.5s fade-out. The track ends on its own.
- **SFX** (under the bed):
  - a card slide per scene;
  - a bong on each "New" badge;
  - clicks as the tool pills arrive;
  - a bell on the outro title;
  - a bong on the logo.
- **Glows:** bass and mids from the track (`music/audio_data.py` → `composition/assets/audio-data.js`) make the background glows breathe.
- **Loudness:** the renderer mixes to about −23 LUFS. The final files are normalised to −16 LUFS with a −1.5 dBTP ceiling, the usual level for web and social video.

## Data note
Names and amounts are illustrative: Asha, Ben, Chen, Dev, a Goa trip, and the made-up name "Mikoox". On-screen UI is the real app, recorded by `scripts/feature-clips/clips.mjs`. No user data appears.

## Rebuild
1. If the UI changed, re-record the clips (`node scripts/feature-clips/clips.mjs`) and copy the ones used into `composition/assets/clips/`.
2. If the music changed, from this folder:
   ```
   python3 -I music/compose.py /tmp/groove.wav
   ffmpeg -i /tmp/groove.wav -af loudnorm=I=-15.9:TP=-1.5:LRA=11 -c:a libmp3lame -b:a 192k composition/assets/music/splitbiller-groove.mp3
   python3 -I music/audio_data.py composition/assets/music/splitbiller-groove.mp3 composition/assets/audio-data.js
   ```
3. Check and render, then bring the loudness up to −16 LUFS:
   ```
   cd composition && npx --yes hyperframes@0.8.137 check && npx --yes hyperframes@0.8.137 render -q delivery -o ../raw.mp4 . && cd ..
   ffmpeg -i raw.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart brag.mp4
   ```
4. Make the web encode and poster for the homepage, from the repo root:
   ```
   ffmpeg -i brag-output/whats-new/brag.mp4 -vf scale=1280:720:flags=lanczos -c:v libx264 -profile:v high -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart public/promo/splitbiller-promo.mp4
   ffmpeg -ss 15.5 -i brag-output/whats-new/brag.mp4 -frames:v 1 -vf scale=1280:720:flags=lanczos -q:v 4 public/promo/splitbiller-promo-poster.jpg
   ```

The 1080p master (`brag.mp4`) isn't committed because it can be rebuilt from the composition.
