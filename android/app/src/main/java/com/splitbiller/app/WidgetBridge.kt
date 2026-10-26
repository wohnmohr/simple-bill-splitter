package com.splitbiller.app

import android.content.Context
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsSession
import androidx.browser.trusted.TrustedWebActivityIntentBuilder
import com.google.androidbrowserhelper.trusted.QualityEnforcer
import com.google.androidbrowserhelper.trusted.splashscreens.SplashScreenStrategy

/**
 * Opens a message channel to the site through Chrome, so the site can send the widget its totals.
 * Everything stays on the phone: Chrome passes the message straight to this app.
 *
 * Chrome (115+) only opens the channel to a site whose assetlinks.json lists this app with
 * `use_as_origin`. Without it, or in other browsers, the widget keeps its last totals.
 */
class WidgetBridge(private val context: Context) : QualityEnforcer() {
    private var session: CustomTabsSession? = null

    /** Wraps the launcher's splash screen, the one step that is handed the TWA's session. */
    fun capturingSession(splash: SplashScreenStrategy?) = object : SplashScreenStrategy {
        override fun onTwaLaunchInitiated(providerPackage: String?, builder: TrustedWebActivityIntentBuilder) {
            splash?.onTwaLaunchInitiated(providerPackage, builder)
        }

        override fun configureTwaBuilder(
            builder: TrustedWebActivityIntentBuilder,
            session: CustomTabsSession,
            onReadyCallback: Runnable,
        ) {
            this@WidgetBridge.session = session
            if (splash == null) onReadyCallback.run() else splash.configureTwaBuilder(builder, session, onReadyCallback)
        }
    }

    // A full page load drops the channel, so ask again after each one.
    override fun onNavigationEvent(navigationEvent: Int, extras: Bundle?) {
        if (navigationEvent == NAVIGATION_FINISHED) session?.requestPostMessageChannel(ORIGIN, ORIGIN, Bundle())
    }

    override fun onMessageChannelReady(extras: Bundle?) {
        session?.postMessage(HELLO, null)
    }

    override fun onPostMessage(message: String, extras: Bundle?) {
        WidgetTotals.parse(message)?.let { BalanceWidget.show(context, it) }
    }

    private companion object {
        val ORIGIN: Uri = Uri.parse(BuildConfig.ORIGIN)

        /** The site answers this with the totals (lib/androidWidget.ts). */
        const val HELLO = "splitbiller:widget"
    }
}
