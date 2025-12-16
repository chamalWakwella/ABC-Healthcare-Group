import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patient_id, doctor_id, prescription_text, medication, dosage, frequency, duration, instructions } = await request.json()

    if (!patient_id || !medication) {
      return NextResponse.json({ error: "Patient and medication are required" }, { status: 400 })
    }

    // Verify doctor_id matches session
    if (doctor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create prescription as an order with type "Prescription"
    const orderType = `Prescription: ${medication}`
    const notes = `Prescription Details:
Medication: ${medication}
Dosage: ${dosage || "As prescribed"}
Frequency: ${frequency || "As directed"}
Duration: ${duration || "As needed"}
Instructions: ${instructions || "Follow doctor's instructions"}`

    const result = await dbRun(`
      INSERT INTO orders (patient_id, doctor_id, order_type, notes, status)
      VALUES (?, ?, ?, ?, 'Active')
    `, [patient_id, doctor_id, orderType, notes])

    // Notify patient
    const message = `You have received a new prescription: ${medication}`
    await dbRun(`
      INSERT INTO patient_notifications (patient_id, message)
      VALUES (?, ?)
    `, [patient_id, message])

    return NextResponse.json({ 
      success: true, 
      prescription: {
        id: result.lastID.toString(),
        patient_id,
        doctor_id,
        medication,
      }
    })
  } catch (error: any) {
    console.error("Create prescription error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

