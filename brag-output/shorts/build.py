"""
Builds the YouTube Shorts compositions (1080x1920) from the specs below,
reusing the promo video's fonts, logo, sound effects, music and the real
app clips from public/features.

  python3 -I brag-output/shorts/build.py      # writes brag-output/shorts/<slug>/
  cd brag-output/shorts/<slug> && npx --yes hyperframes@0.8.137 render -q delivery -o ../<slug>.mp4 .

Layout keeps words and the phone clear of the Shorts UI: the title and
channel row cover roughly the bottom 380px, the action buttons the right
140px. Every caption is burned in, because most Shorts are watched muted.
"""

import json
import shutil
import subprocess
import sys
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PROMO = HERE.parent / "whats-new" / "composition"
CLIPS = REPO / "public" / "features"
MUSIC_DROP = 3.98  # the promo track's first downbeat after the intro

PHONE_W = 560  # single-phone clips are 540x1052
WIDE_W = 980  # the two-phone sync clip is 1082x1052

SHORTS = [
    {
        "slug": "goa-trip",
        "hook": "4 friends. 1 Goa trip.<br>Who owes whom?",
        "steps": [
            {"clip": "create-group", "from": 0.5, "for": 4.0, "text": "Make a group in seconds"},
            {"clip": "expenses", "from": 1.0, "for": 5.0, "text": "Add expenses as they happen"},
            {"clip": "settle", "from": 0.6, "for": 4.0, "text": "See the fewest payments that settle it"},
            {"clip": "upi", "from": 1.0, "for": 4.5, "text": "Pay by UPI in one tap"},
        ],
    },
    {
        "slug": "private-groups",
        "hook": "Split bills without<br>giving away your data",
        "steps": [
            {"clip": "join", "from": 0.6, "for": 5.5, "text": "Join with a made-up name. No signup."},
            {"clip": "sync", "from": 3.6, "for": 7.5, "text": "Everyone adds expenses from their own phone", "wide": True},
            {"card": "lock", "for": 3.0, "text": "End-to-end encrypted. Our server can’t read a thing."},
        ],
    },
    {
        "slug": "one-link",
        "hook": "The friend who never pays back?<br>Send one link.",
        "steps": [
            {"clip": "split-link", "from": 0.3, "for": 5.0, "text": "Set the total and your UPI ID"},
            {"clip": "split-link", "from": 5.6, "for": 5.5, "text": "Friends pay by UPI. You see who’s paid."},
        ],
    },
]

HOOK, END = 3.0, 3.6
LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'

CSS = """
@font-face { font-family: "Outfit"; font-weight: 500; src: url("assets/fonts/outfit-latin-500-normal.woff2") format("woff2"); }
@font-face { font-family: "Outfit"; font-weight: 600; src: url("assets/fonts/outfit-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Outfit"; font-weight: 700; src: url("assets/fonts/outfit-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "Fraunces"; font-weight: 600; src: url("assets/fonts/fraunces-latin-600-normal.woff2") format("woff2"); }
:root { --paper: #f7f6f3; --ink: #1c1826; --muted: #6b6577; --brand: #53307b; --line: #e7e3ea; --positive: #11754c; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--paper); }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--paper);
  font-family: "Outfit", sans-serif; color: var(--ink); }
.display { font-family: "Fraunces", Georgia, serif; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance; }
.scene { position: absolute; inset: 0; }
.inner { position: absolute; inset: 0; }
#glowA { position: absolute; left: 180px; top: 520px; width: 1200px; height: 1200px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(83,48,123,0.18), rgba(83,48,123,0)); }
#glowB { position: absolute; left: -420px; top: -200px; width: 1100px; height: 1100px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(236,227,245,0.95), rgba(236,227,245,0)); }
#brand { position: absolute; left: 0; right: 0; top: 92px; display: flex; justify-content: center; align-items: center; gap: 14px;
  font-family: "Fraunces"; font-weight: 600; font-size: 40px; color: var(--ink); }
#brand img { height: 46px; }
.hook { position: absolute; left: 70px; right: 70px; top: 0; bottom: 380px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
.hook h1 { font-size: 104px; line-height: 1.04; }
.cap { position: absolute; left: 80px; right: 80px; top: 190px; height: 300px; display: flex; align-items: center; justify-content: center;
  text-align: center; font-size: 74px; line-height: 1.08; }
.phone { position: absolute; left: 50%; top: 520px; border-radius: 52px; overflow: hidden; border: 7px solid #fff; background: #fff;
  box-shadow: 0 40px 80px -26px rgba(28,24,38,0.45), 0 0 0 1px rgba(28,24,38,0.06); }
.phone video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.card { position: absolute; left: 140px; right: 140px; top: 640px; display: flex; flex-direction: column; align-items: center; gap: 40px; text-align: center; }
.card .ico { width: 220px; height: 220px; border-radius: 60px; background: var(--brand); color: #fff; display: grid; place-items: center;
  box-shadow: 0 40px 80px -30px rgba(83,48,123,0.7); }
.card .ico svg { width: 120px; height: 120px; }
.card p { font-size: 40px; font-weight: 500; color: var(--muted); line-height: 1.3; }
.end { position: absolute; left: 60px; right: 60px; top: 0; bottom: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.end img { height: 170px; }
.end h2 { margin-top: 40px; font-size: 108px; line-height: 1.02; }
.end h2 .u { color: var(--brand); }
.end .url { margin-top: 44px; font-size: 52px; font-weight: 700; color: var(--brand); }
.chips { margin-top: 40px; display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
.chip { display: inline-flex; align-items: center; gap: 10px; height: 68px; padding: 0 28px 0 22px; border-radius: 34px; background: #fff;
  border: 2px solid var(--line); font-size: 32px; font-weight: 600; }
.chip svg { width: 30px; height: 30px; color: var(--positive); }
"""


def phone_box(step):
    w = WIDE_W if step.get("wide") else PHONE_W
    src_w = 1082 if step.get("wide") else 540
    h = round(w * 1052 / src_w)
    return w, h


def build(spec):
    out = HERE / spec["slug"]
    if out.exists():
        shutil.rmtree(out)
    (out / "assets" / "clips").mkdir(parents=True)
    for d in ("fonts", "sfx"):
        shutil.copytree(PROMO / "assets" / d, out / "assets" / d)
    shutil.copy(PROMO / "assets" / "gsap.min.js", out / "assets")
    # The cropped mark (the promo logo has wide transparent margins).
    shutil.copy(HERE.parent / "youtube" / "logo-mark.png", out / "assets" / "logo.png")
    for name in {s["clip"] for s in spec["steps"] if "clip" in s}:
        shutil.copy(CLIPS / f"{name}.mp4", out / "assets" / "clips")

    # Timeline: hook, steps back to back, end card.
    t = HOOK
    scenes, anim, sfx = [], [], []
    for i, step in enumerate(spec["steps"], 1):
        start, end = t, t + step["for"]
        cap = f'<div class="cap display" id="cap{i}">{escape(step["text"])}</div>'
        if "clip" in step:
            w, h = phone_box(step)
            body = (
                f'<div class="phone" id="ph{i}" style="width:{w}px;height:{h}px;margin-left:-{w // 2}px">'
                f'<video id="v{i}" class="clip" src="assets/clips/{step["clip"]}.mp4" data-start="{start:.2f}" '
                f'data-duration="{step["for"]:.2f}" data-media-start="{step["from"]}" data-track-index="{20 + i}" muted playsinline></video></div>'
            )
            anim.append(f'tl.fromTo("#ph{i}", {{opacity: 0, y: 90, scale: 0.94}}, {{opacity: 1, y: 0, scale: 1, duration: 0.6, ease: E}}, {start + 0.02:.2f});')
        else:
            body = f'<div class="card" id="ph{i}"><div class="ico">{LOCK_SVG}</div><p>Encrypted on your phone. The key never reaches us.</p></div>'
            anim.append(f'tl.fromTo("#ph{i}", {{opacity: 0, scale: 0.8}}, {{opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)"}}, {start + 0.05:.2f});')
        scenes.append(
            f'<div class="scene clip" id="s{i}" data-start="{start:.2f}" data-duration="{step["for"]:.2f}" data-track-index="{i + 1}">'
            f'<div class="inner" id="in{i}">{cap}{body}</div></div>'
        )
        anim.append(f'tl.fromTo("#cap{i}", {{opacity: 0, y: 40}}, {{opacity: 1, y: 0, duration: 0.5, ease: E}}, {start + 0.02:.2f});')
        anim.append(f'tl.to("#in{i}", {{opacity: 0, y: -30, duration: 0.35, ease: "power2.in"}}, {end - 0.38:.2f});')
        sfx.append(f'<audio id="sfx{i}" data-start="{start + 0.02:.2f}" data-duration="0.62" data-track-index="12" data-volume="0.45" src="assets/sfx/card-slide-1.ogg"></audio>')
        t = end
    total = t + END

    chips = "".join(f'<span class="chip">{CHECK_SVG}{label}</span>' for label in ("Free", "No signup", "Settle by UPI"))
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <style>{CSS}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total:.2f}" data-width="1080" data-height="1920">
      <audio id="music" data-start="0" data-duration="{total:.2f}" data-track-index="10" data-volume="0.5" data-fade-in="0.05" data-fade-out="0.8" src="assets/music.mp3"></audio>
      <audio id="sfx-hook" data-start="0.25" data-duration="0.2" data-track-index="11" data-volume="0.6" src="assets/sfx/impactSoft_medium_001.ogg"></audio>
      {"".join(sfx)}
      <audio id="sfx-end" data-start="{t + 0.02:.2f}" data-duration="1.5" data-track-index="13" data-volume="0.55" src="assets/sfx/impactBell_heavy_000.ogg"></audio>
      <div class="scene" id="bg"><div id="glowB"></div><div id="glowA"></div></div>
      <div id="brand"><img src="assets/logo.png" alt="" />SplitBiller</div>
      <div class="scene clip" id="s0" data-start="0" data-duration="{HOOK:.2f}" data-track-index="1">
        <div class="hook" id="in0"><h1 class="display" id="hook">{spec["hook"]}</h1></div>
      </div>
      {"".join(scenes)}
      <div class="scene clip" id="send" data-start="{t:.2f}" data-duration="{END:.2f}" data-track-index="9">
        <div class="end" id="inend">
          <img id="endlogo" src="assets/logo.png" alt="" />
          <h2 class="display" id="endtitle">Split bills, <span class="u">privately.</span></h2>
          <div class="url" id="endurl">splitbiller.com</div>
          <div class="chips" id="endchips">{chips}</div>
        </div>
      </div>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      const E = "power3.out";
      tl.fromTo("#brand", {{opacity: 0, y: -20}}, {{opacity: 1, y: 0, duration: 0.5, ease: E}}, 0.05);
      tl.fromTo("#hook", {{opacity: 0, y: 60}}, {{opacity: 1, y: 0, duration: 0.7, ease: E}}, 0.25);
      tl.to("#in0", {{opacity: 0, y: -30, duration: 0.35, ease: "power2.in"}}, {HOOK - 0.38:.2f});
      {chr(10).join("      " + a for a in anim).strip()}
      tl.to("#brand", {{opacity: 0, duration: 0.3}}, {t - 0.1:.2f});
      tl.fromTo("#endlogo", {{opacity: 0, scale: 0.7}}, {{opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)"}}, {t + 0.02:.2f});
      tl.fromTo("#endtitle", {{opacity: 0, y: 50}}, {{opacity: 1, y: 0, duration: 0.6, ease: E}}, {t + 0.25:.2f});
      tl.fromTo("#endurl", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.5, ease: E}}, {t + 0.75:.2f});
      tl.fromTo("#endchips", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.5, ease: E}}, {t + 1.1:.2f});
      tl.to("#glowA", {{scale: 1.12, duration: {total:.2f}, ease: "sine.inOut"}}, 0);
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
    (out / "index.html").write_text(html)
    (out / "hyperframes.json").write_text((PROMO / "hyperframes.json").read_text())
    (out / "meta.json").write_text(json.dumps({"id": f"short-{spec['slug']}", "name": f"short-{spec['slug']}"}, indent=2))
    # The promo track from its first drop, cut to length.
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-ss", str(MUSIC_DROP), "-t", f"{total:.2f}",
         "-i", str(PROMO / "assets" / "music" / "splitbiller-groove.mp3"), "-c:a", "libmp3lame", "-b:a", "192k", str(out / "assets" / "music.mp3")],
        check=True,
    )
    print(f"{spec['slug']}: {total:.1f}s")


if __name__ == "__main__":
    for spec in SHORTS:
        if len(sys.argv) < 2 or spec["slug"] in sys.argv[1:]:
            build(spec)
