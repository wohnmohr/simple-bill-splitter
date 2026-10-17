# SplitBiller for Android (Google Play)

The Play Store app is a Trusted Web Activity: a thin Android shell that opens
splitbiller.com full screen, with no browser bar. Every web deploy updates the
app; a new Play release is only needed when this config changes.

`twa-manifest.json` is the app's config (package `com.splitbiller.app`, colours,
icons, start page). It is read by [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).

## Build a release bundle

Needs Node 20+. Bubblewrap downloads its own JDK and Android SDK on first run.

```sh
cd android
npx @bubblewrap/cli build     # first run: also creates android.keystore and asks for its passwords
```

This writes `app-release-bundle.aab` (upload to Play) and `app-release-signed.apk`
(install on a phone to try it). Bump `appVersionCode` and `appVersionName` in
`twa-manifest.json` before each new upload.

Keep `android.keystore` and its passwords outside the repo, in a password
manager. The folder's `.gitignore` already refuses it.

## Link the app to the site

Without this, the app shows a browser bar at the top.

1. In Play Console: Test and release → App integrity → App signing, copy the
   **SHA-256 certificate fingerprint** of the app signing key (and of the upload
   key, to test sideloaded builds).
2. In Vercel, set `ANDROID_CERT_FINGERPRINTS` to them, comma-separated, for
   Production, and redeploy.
3. Check https://splitbiller.com/.well-known/assetlinks.json lists them.
