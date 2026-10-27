# SplitBiller for Android (Google Play)

The Play app is a Trusted Web Activity: Chrome opens splitbiller.com full screen, with no
browser bar. Every web deploy updates the app, so a new Play release is only needed when
this folder changes. Push alerts, the share target (share a bill screenshot into the app)
and groups people already have in Chrome all work as they do on the site.

The native part is small:

| File | What it does |
|---|---|
| `LauncherActivity.kt` | Opens the site, using Google's [android-browser-helper](https://github.com/GoogleChrome/android-browser-helper). |
| `BalanceWidget.kt`, `res/layout/widget_balance.xml` | Home-screen widget: "You get back" / "You owe" and Add expense. |
| `WidgetBridge.kt` | Receives the widget's totals from the site through Chrome's message channel. |

## How the widget gets your balance

Balances live only on the phone, so the widget can't fetch them. When the app opens, it
asks Chrome for a message channel to the site, and the site (`lib/androidWidget.ts`) sends
back two formatted totals, such as `₹1,200` and `₹300`, and again on every change. Chrome
hands them straight to the app, nothing goes to a server, and the app keeps them in its
own storage, which is left out of backups. No names, groups or UPI IDs are sent.

This needs Chrome 115 or newer, and the site's `/.well-known/assetlinks.json` must list the
app's signing keys (step 4 below). Until the app is opened once, the widget says
"Open SplitBiller to see your balance".

## Build

Every pull request that touches this folder is built by GitHub Actions (`Android app`
workflow), which runs the tests and keeps a debug APK for a week.

To build on your Mac, open this `android` folder in Android Studio, or run
`./gradlew assembleDebug` with JDK 17 and the Android SDK installed.

## Release to Play

1. **Bump the version** in `app/build.gradle.kts` (`versionCode` +1, `versionName`).
2. **Build a signed bundle.** In Android Studio: Build → Generate Signed App Bundle →
   Android App Bundle. The first time, choose *Create new* to make an upload key. Keep the
   `.jks` file and both passwords in your password manager, never in this repo (the
   `.gitignore` refuses them). Pick the `release` build type.
3. **Upload** `app/release/app-release.aab` to Play Console (Closed testing first). Keep
   Play App Signing on, which is the default.
4. **Link the app to the site**, or it shows a browser bar and the widget stays empty:
   - Play Console → Test and release → App integrity → App signing: copy the SHA-256
     fingerprints of the app signing key and the upload key.
   - Vercel → Production env vars: `ANDROID_CERT_FINGERPRINTS` = `FP1,FP2`, then redeploy.
   - Check https://www.splitbiller.com/.well-known/assetlinks.json lists them.

## Try the widget before Play

The debug APK from the workflow is signed with a throwaway key, so Chrome won't link it to
the site: it shows a browser bar and the widget stays on "Open SplitBiller". The widget's
look, the Add expense button and the shortcut can still be checked. For the full thing,
install from the Play internal testing track.
