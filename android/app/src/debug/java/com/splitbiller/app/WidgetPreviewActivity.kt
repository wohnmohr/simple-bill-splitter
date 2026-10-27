package com.splitbiller.app

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.widget.LinearLayout

/** Preview-only (never merged): draws the widget in its states for emulator screenshots. */
class WidgetPreviewActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val dp = { v: Int -> TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt() }
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#3E5C76"))
            setPadding(dp(20), dp(40), dp(20), dp(20))
        }
        val states = listOf(null, WidgetTotals("₹2,385", ""), WidgetTotals("₹2,385", "₹640"), WidgetTotals("", ""))
        for (totals in states) {
            getSharedPreferences("balance_widget", MODE_PRIVATE).edit().clear().commit()
            if (totals != null) BalanceWidget.show(this, totals)
            val view = BalanceWidget.views(this).apply(this, column)
            column.addView(view, LinearLayout.LayoutParams(dp(300), dp(130)).apply { bottomMargin = dp(16) })
        }
        setContentView(column)
    }
}
