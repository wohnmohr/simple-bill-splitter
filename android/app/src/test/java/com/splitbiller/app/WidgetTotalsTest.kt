package com.splitbiller.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetTotalsTest {
    @Test
    fun readsTheSitesTotals() {
        assertEquals(WidgetTotals("₹1,200", "₹300 + $20"), WidgetTotals.parse("""{"getBack":"₹1,200","owe":"₹300 + $20"}"""))
    }

    @Test
    fun emptyTotalsMeanAllSquare() {
        assertTrue(WidgetTotals.parse("""{"getBack":"","owe":""}""")!!.allSquare)
    }

    @Test
    fun ignoresAnythingElse() {
        assertNull(WidgetTotals.parse("splitbiller:widget"))
        assertNull(WidgetTotals.parse("""{"getBack":"₹1"}"""))
        assertNull(WidgetTotals.parse("""{"getBack":"${"9".repeat(101)}","owe":""}"""))
    }
}
