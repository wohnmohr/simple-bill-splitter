package com.splitbiller.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import androidx.annotation.IdRes
import androidx.annotation.StringRes

/**
 * Home-screen widget: what you get back and owe across your groups, and Add expense.
 * The totals come from the site through [WidgetBridge] and are kept only in this app's storage,
 * which is excluded from backups.
 */
class BalanceWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        manager.updateAppWidget(ids, views(context))
    }

    companion object {
        private const val PREFS = "balance_widget"
        private const val GET_BACK = "getBack"
        private const val OWE = "owe"

        /** Saves the site's latest totals and redraws every widget. */
        fun show(context: Context, totals: WidgetTotals) {
            prefs(context).edit().putString(GET_BACK, totals.getBack).putString(OWE, totals.owe).apply()
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, BalanceWidget::class.java))
            if (ids.isNotEmpty()) manager.updateAppWidget(ids, views(context))
        }

        private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        /** Null until the app has been opened once with the widget support live. */
        private fun saved(context: Context): WidgetTotals? {
            val prefs = prefs(context)
            val getBack = prefs.getString(GET_BACK, null) ?: return null
            return WidgetTotals(getBack, prefs.getString(OWE, null).orEmpty())
        }

        internal fun views(context: Context) = RemoteViews(context.packageName, R.layout.widget_balance).apply {
            setOnClickPendingIntent(R.id.root, open(context, R.string.launchUrl))
            setOnClickPendingIntent(R.id.add, open(context, R.string.addExpenseUrl))

            val totals = saved(context)
            val showTotals = totals != null && !totals.allSquare
            setViewVisibility(R.id.status, if (showTotals) View.GONE else View.VISIBLE)
            setViewVisibility(R.id.totals, if (showTotals) View.VISIBLE else View.GONE)
            if (totals == null || !showTotals) {
                setTextViewText(R.id.status, context.getText(if (totals == null) R.string.widgetOpenApp else R.string.widgetAllSquare))
            } else {
                amount(R.id.getBackColumn, R.id.getBack, totals.getBack)
                amount(R.id.oweColumn, R.id.owe, totals.owe)
            }
        }

        private fun RemoteViews.amount(@IdRes column: Int, @IdRes text: Int, value: String) {
            setViewVisibility(column, if (value.isEmpty()) View.GONE else View.VISIBLE)
            setTextViewText(text, value)
        }

        /** Opens a page of the site in the app. The URLs differ, so each gets its own PendingIntent. */
        private fun open(context: Context, @StringRes url: Int): PendingIntent {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(context.getString(url)), context, LauncherActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
    }
}
