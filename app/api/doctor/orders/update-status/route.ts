import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { order_id, status } = await request.json()

    if (!order_id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Verify order belongs to this doctor
    const order = await dbGet(`
      SELECT * FROM orders 
      WHERE id = ? AND doctor_id = ?
    `, [order_id, user.id]) as any

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    // Update order status
    await dbRun(`
      UPDATE orders 
      SET status = ? 
      WHERE id = ? AND doctor_id = ?
    `, [status, order_id, user.id])

    // If completed, notify patient
    if (status === "Completed") {
      const patient = await dbGet("SELECT name FROM patients WHERE id = ?", [order.patient_id]) as any
      const message = `Your order '${order.order_type}' has been completed.`
      await dbRun(`
        INSERT INTO patient_notifications (patient_id, message)
        VALUES (?, ?)
      `, [order.patient_id, message])
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update order status error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

