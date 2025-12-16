import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { order_type, notes, status } = await request.json()
    const orderId = parseInt(params.id, 10)
    const doctorId = parseInt(user.id, 10)

    if (isNaN(orderId) || isNaN(doctorId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Verify order belongs to this doctor
    const order = await dbGet(`
      SELECT * FROM orders 
      WHERE id = ? AND doctor_id = ?
    `, [orderId, doctorId]) as any

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    // Update order
    await dbRun(`
      UPDATE orders 
      SET order_type = ?, notes = ?, status = ?
      WHERE id = ? AND doctor_id = ?
    `, [
      order_type || order.order_type,
      notes !== undefined ? notes : order.notes,
      status || order.status,
      orderId,
      doctorId
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orderId = parseInt(params.id, 10)
    const doctorId = parseInt(user.id, 10)

    if (isNaN(orderId) || isNaN(doctorId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Verify order belongs to this doctor
    const order = await dbGet(`
      SELECT * FROM orders 
      WHERE id = ? AND doctor_id = ?
    `, [orderId, doctorId]) as any

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    // Delete order
    await dbRun(`
      DELETE FROM orders 
      WHERE id = ? AND doctor_id = ?
    `, [orderId, doctorId])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete order error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

