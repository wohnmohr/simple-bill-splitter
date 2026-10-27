#!/usr/bin/env bash
# Preview-only (never merged): screenshots of the app and widget on an emulator.
set -x
LINK='https://splitbiller.com/share#sb1.j3a1JeeptSXrvTuOdgdZnJXScyroxhEFUV30jPaLBME.kD0VnnuX-pg9aCm8ocFqpgccbmwPAqajQIZ-z27DghpXK6LfnzU7algy7EcnPKLx0NxIkYztQHfRrWpHHAQEP5kuZAXTukNxnKeerux6hP1EbkajQj6Ph63eRb1VYadcHIf5TTfUuv00JNq-3G_Tb3s0w5oA-1uT58Lxm71xEwxlX5Hba4qEU3XiKrqrKaH_fa80AjiRfxbZzZ1EJ_lqOdvqXNQs5-ZSIOcpRIlrdG0XVY0Vy1hN7EBmRABCJKHC8Tn-ocKrvdtjupuM-5oRFV6cJifxLOsO_-m7BTVbMlRwvn8EY8vMMbdnJqu1vlXET2CoU1WvFQ9_s-FvBbRPE_DyAn12QYmPWQNKhTop-iaPImUhBPY'
OUT=$GITHUB_WORKSPACE/preview; mkdir -p "$OUT"
shot() { sleep "${2:-0}"; adb exec-out screencap -p > "$OUT/$1.png"; adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$OUT/$1.xml" >/dev/null 2>&1; }
# Taps the first on-screen element whose text or description matches $1.
tap() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1 || return 0
  local at
  at=$(python3 - "$1" <<'PY'
import re, sys, xml.etree.ElementTree as ET
pat = re.compile(sys.argv[1])
for n in ET.parse('/tmp/ui.xml').iter('node'):
    if pat.search(n.get('text', '')) or pat.search(n.get('content-desc', '')):
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.get('bounds')))
        print((x1 + x2) // 2, (y1 + y2) // 2)
        break
PY
)
  [ -n "$at" ] && adb shell input tap $at
  return 0
}
chrome_setup() { for b in 'Accept & continue' 'Use without an account' 'No thanks' 'No, thanks' 'Got it' 'Continue'; do tap "^$b\$"; sleep 2; done; }

adb root; sleep 5
adb shell pm list packages | grep -i -E "chrome|webview"
adb shell "echo '_ --disable-fre --no-default-browser-check --no-first-run --disable-digital-asset-link-verification-for-url=\"https://splitbiller.com\" --host-resolver-rules=\"MAP *.posthog.com 127.0.0.1\"' > /data/local/tmp/chrome-command-line"
adb shell chmod 644 /data/local/tmp/chrome-command-line
adb shell am force-stop com.android.chrome
adb install -r app/build/outputs/apk/debug/app-debug.apk

adb shell am start -n com.splitbiller.app/.WidgetPreviewActivity; shot widget-light 5
adb shell am force-stop com.splitbiller.app
adb shell cmd uimode night yes; sleep 2
adb shell am start -n com.splitbiller.app/.WidgetPreviewActivity; shot widget-dark 5
adb shell am force-stop com.splitbiller.app
adb shell cmd uimode night no; sleep 2

adb shell am start -n com.splitbiller.app/.LauncherActivity; shot 0-first-launch 25
chrome_setup; shot 1-launch 10
adb shell am start -a android.intent.action.VIEW -d "'$LINK'" -n com.splitbiller.app/.LauncherActivity; shot 2-shared-link 20
chrome_setup
tap '^Asha$'; sleep 3; shot 3-picked 2
tap 'Open in SplitBiller'; shot 4-dashboard 10
tap 'Goa trip'; shot 5-group 8
adb shell input swipe 540 1900 540 700 600; shot 6-group-scrolled 4
adb shell am start -a android.intent.action.VIEW -d "'https://splitbiller.com/dashboard?add'" -n com.splitbiller.app/.LauncherActivity; shot 7-add-expense 15
exit 0
