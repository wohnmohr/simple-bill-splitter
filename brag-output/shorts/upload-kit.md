# YouTube Shorts upload kit

Three vertical Shorts (1080×1920, 17–24s, loudness −14 LUFS), built by `build.py` from the real app clips. Upload in YouTube Studio → Create → Upload videos. Anything vertical and under 3 minutes becomes a Short automatically.

## Same for all three
- **Audience:** No, it's not made for kids
- **Category:** Science & Technology
- **Altered or synthetic content:** No (it's real app footage)
- **Comments:** on. Pin one: "Free, no signup: splitbiller.com"
- **Schedule:** one every 2–3 days, around 7:30 pm IST (evenings are when your Indian, mostly-phone audience is on)
- **Order:** Goa trip → One link → Private groups (the broadest story first)

Links in Shorts descriptions aren't clickable in the Shorts feed, which is why every video ends on "splitbiller.com". Each link still carries a `ref` tag, so visits from viewers who open the full description show up in PostHog.

---

## 1. `splitbiller-short-goa-trip.mp4` (24s)

**Title**
```
4 friends, 1 Goa trip: who owes whom? 🧾 #Shorts
```

**Description**
```
Split a trip in seconds and settle up by UPI. SplitBiller works out the fewest payments that settle everyone, then opens your UPI app with the amount filled in. Free, no signup.

Try it: https://www.splitbiller.com/?ref=yt-goa

#splitbills #goatrip #upi #travelindia #friends
```

## 2. `splitbiller-short-one-link.mp4` (17s)

**Title**
```
The friend who never pays back? Send one link 💸 #Shorts
```

**Description**
```
Set the total and your UPI ID, share one link, and friends pay you straight by UPI. Everyone sees who's paid. Free, no signup.

Make one: https://www.splitbiller.com/split?ref=yt-link

#upi #splitthebill #friends #dinner #moneytips
```

## 3. `splitbiller-short-private-groups.mp4` (23s)

**Title**
```
Split bills without giving away your data 🔒 #Shorts
```

**Description**
```
Join a group with a made-up name, add expenses from your own phone, and everything is end-to-end encrypted. Our server can't read a thing. Free, no signup.

Start a group: https://www.splitbiller.com/?ref=yt-private

#privacy #splitbills #flatmates #upi #encryption
```

---

## Making more
Add an entry to `SHORTS` in `build.py`, using any clip in `public/features/`, then:
```
python3 -I brag-output/shorts/build.py <slug>
cd brag-output/shorts/<slug> && npx --yes hyperframes@0.8.137 render -q delivery -o ../raw-<slug>.mp4 .
cd .. && ffmpeg -i raw-<slug>.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart splitbiller-short-<slug>.mp4
```
