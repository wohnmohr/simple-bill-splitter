package com.splitbiller.app

import org.json.JSONException
import org.json.JSONObject

/** What the widget shows, formatted by the site: "₹1,200", "₹300 + $20", or "" for nothing. */
data class WidgetTotals(val getBack: String, val owe: String) {
    val allSquare get() = getBack.isEmpty() && owe.isEmpty()

    companion object {
        private const val MAX_LENGTH = 100

        /** The site's message, `{"getBack":"…","owe":"…"}`. Anything else is ignored, never shown. */
        fun parse(message: String): WidgetTotals? = try {
            val json = JSONObject(message)
            WidgetTotals(json.getString("getBack"), json.getString("owe"))
                .takeIf { it.getBack.length <= MAX_LENGTH && it.owe.length <= MAX_LENGTH }
        } catch (_: JSONException) {
            null
        }
    }
}
