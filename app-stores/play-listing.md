# SplitBiller on Google Play: listing and forms

Copy these into Play Console. Everything here matches the app in PR #163 and the privacy page in PR #164.

## Create app
- App name: **SplitBiller**
- Default language: English (India), en-IN
- App or game: App
- Free or paid: **Free** (can't be changed to paid later; in-app purchases can still be added any time)
- Package name (from the bundle): `com.splitbiller.app`

## Store listing
**Short description (80 max)**
Split bills with friends and settle up by UPI. No signup, private by design.

**Full description**
SplitBiller splits trip, flat and dinner costs with friends.

• Add an expense in one line: type "Dinner 2400 paid by Asha, split with Ben and Dev" and it fills itself in.
• Scan a food delivery order or bill screenshot and tap what you ate.
• Split equally, by exact amounts, by percentages or by shares, with several payers.
• See who owes whom in the fewest payments, then pay straight from your UPI app.
• Share a group with one link. Everyone sees the same expenses and can add their own.
• Get an alert when someone adds an expense or marks a payment.
• Home-screen widget: see what you owe and get back, and add an expense in one tap.

Private by design
• No account, no phone number, no email.
• Your groups stay on your phone. Shared groups and backups are end-to-end encrypted, so even we can't read them.
• Bill screenshots are read on your phone and never uploaded.
• No ads, and we never sell your data.

SplitBiller never touches your money: payments go directly between UPI apps.

**Graphics**
- App icon 512×512: `app-stores/play-icon-512.png`
- Feature graphic 1024×500: `app-stores/feature-graphic.png`
- Phone screenshots: `app-stores/screenshots/` (demo names only)

**Category**: Finance · **Contact email**: wohnmohr.contact@gmail.com · **Website**: https://splitbiller.com
**Privacy policy**: https://splitbiller.com/privacy (live once PR #164 ships)

## App content
- **Ads**: No ads.
- **App access**: All functionality available without special access.
- **Target audience**: 18 and over. (The privacy page's "not for under 13" is consistent with this.)
- **Content rating questionnaire**: Utility/productivity; no violence, sexual content, gambling, or user-to-user chat with strangers. (Comments are only inside a group you were invited to.) Expect "Everyone / 3+".
- **News app**: No. **Government app**: No. **Health**: No.
- **Financial features**: "My app doesn't provide any financial features" (it only opens UPI apps; it never moves or holds money). Check the exact option wording in Play Console before picking it.
- **Data safety**:
  - Does your app collect or share user data? **Yes** (analytics, alerts, feedback, contact form).
  - Encrypted in transit: **Yes**. Users can request deletion: **Yes** (by email).
  - Collected, not shared, processed for **Analytics**, not linked to identity, optional = No:
    - App activity → App interactions
    - App info and performance → Crash logs, Diagnostics
    - Device or other IDs (also for **App functionality**: the push subscription stored when a user turns on group alerts, optional)
  - Messages → Other in-app messages: only if the user sends feedback (purpose: App functionality / developer communications, plus **Fraud prevention, security and compliance** for the salted IP hash used to rate-limit it), optional.
  - Personal info → Email address: only if the user sends the contact form (run by Tally), purpose: Developer communications, optional.
  - Groups, names and UPI IDs: stay on the device; shared groups and backups are end-to-end encrypted, so they don't count as collected.

## Release path (personal developer account)
1. Internal testing first (up to 100 testers, no review wait) to check the widget and the full-screen link.
2. Closed testing with at least 12 testers who stay opted in for 14 days.
3. Apply for production access, then roll out.

## Review-readiness checklist
Things that commonly delay or reject a first review, and where this app stands.
- **Metadata policy**: no superlatives ("best", "simplest", "#1"), no third-party brand names (Swiggy, Zomato, GPay, PhonePe) in the title, short or full description, or graphics. No "free" or prices in graphics.
- **Screenshots**: real app screens only, demo names (Asha, Ben, Chitra, Dev), no real UPI IDs. Include the widget. Add 7" and 10" tablet screenshots too: the app supports landscape and large screens.
- **Minimum functionality (web wrappers)**: reviewers reject apps that are only a website. Point out the native parts in the release notes and the production-access form: home-screen widget, "Add expense" shortcut, share-a-screenshot-to-scan, push alerts.
- **Full screen**: the signed build must open with no URL bar. Before submitting, check that `https://www.splitbiller.com/.well-known/assetlinks.json` lists both SHA-256 fingerprints (app signing and upload keys). The app uses `www` because the bare domain redirects there.
- **Privacy policy**: linked in Play Console, reachable without sign-in, and the Data safety answers above match it.
- **Target API**: targetSdk 36 meets Play's current requirement.
- **Testers**: closed test with 12+ testers opted in for 14 consecutive days. Ask them to actually use it (add a group, try the widget) and leave feedback in the testing channel; Google looks at engagement when granting production access.

## Production access form (draft answers)
- **How did you recruit testers?** Friends, flatmates and colleagues who split costs together, invited by email to the closed test.
- **How easy was it to recruit?** Easy; the app is useful to anyone who shares expenses.
- **How did testers use the app?** Created groups for trips and shared flats, added expenses by typing and by scanning bill screenshots, shared groups by link, settled up through their UPI apps, and added the home-screen widget.
- **Feedback received and changes made**: fill in from the real test (keep a short log during the 14 days).
- **Intended audience**: adults in India who split shared costs with friends, flatmates or travel groups.
- **How is the app valuable?** Splits shared expenses without an account, keeps data on the device with end-to-end encrypted sharing, and settles up through UPI.
- **First-year installs estimate**: pick a realistic bucket (e.g. 1K–10K).
- **Changes made for production readiness**: fill in from the test (e.g. fixes from tester feedback).
