import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patient_id, doctor_id, order_type, notes } = await request.json()

    if (!patient_id || !order_type) {
      return NextResponse.json({ error: "Patient and order type are required" }, { status: 400 })
    }

    // Verify doctor_id matches session
    if (doctor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await dbRun(`
      INSERT INTO orders (patient_id, doctor_id, order_type, notes)
      VALUES (?, ?, ?, ?)
    `, [patient_id, doctor_id, order_type, notes || null])

    return NextResponse.json({ 
      success: true, 
      order: {
        id: result.lastID.toString(),
        patient_id,
        doctor_id,
        order_type,
        notes,
      }
    })
  } catch (error: any) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

