package com.splitbiller.app

import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsCallback
import androidx.browser.trusted.TrustedWebActivityIntentBuilder
import com.google.androidbrowserhelper.trusted.LauncherActivityMetadata
import com.google.androidbrowserhelper.trusted.SessionStore
import com.google.androidbrowserhelper.trusted.SharedPreferencesTokenStore
import com.google.androidbrowserhelper.trusted.TwaLauncher
import com.google.androidbrowserhelper.trusted.splashscreens.SplashScreenStrategy

/** Opens splitbiller.com in Chrome full screen, wired to [WidgetBridge] so the site can update the widget. */
class LauncherActivity : com.google.androidbrowserhelper.trusted.LauncherActivity() {
    private val bridge by lazy { WidgetBridge(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // A fixed orientation crashes translucent activities on Android 8.0.
        requestedOrientation = if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        } else {
            ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    override fun getCustomTabsCallback(): CustomTabsCallback = bridge

    // Same launcher as the library's, except it hands the bridge the session the site opens in.
    override fun createTwaLauncher(): TwaLauncher =
        object : TwaLauncher(
            this,
            LauncherActivityMetadata.parse(this).launchingBrowser,
            SessionStore.makeSessionId(taskId),
            SharedPreferencesTokenStore(this),
        ) {
            override fun launch(
                twaBuilder: TrustedWebActivityIntentBuilder,
                customTabsCallback: CustomTabsCallback,
                splashScreenStrategy: SplashScreenStrategy?,
                completionCallback: Runnable?,
                fallbackStrategy: TwaLauncher.FallbackStrategy,
            ) = super.launch(
                twaBuilder,
                customTabsCallback,
                bridge.capturingSession(splashScreenStrategy),
                completionCallback,
                fallbackStrategy,
            )
        }
}
