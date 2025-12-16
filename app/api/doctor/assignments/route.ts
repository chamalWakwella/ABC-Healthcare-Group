import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patient_id, doctor_id, assignee_staff_id, task_type, notes } = await request.json()

    if (!patient_id || !assignee_staff_id || !task_type) {
      return NextResponse.json({ error: "Patient, assignee, and task type are required" }, { status: 400 })
    }

    // Verify doctor_id matches session
    if (doctor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify assignee is available and is nurse or radiologist
    const assignee = await dbGet("SELECT id, role, name FROM staff WHERE id = ? AND is_available = 1", [assignee_staff_id]) as any
    
    if (!assignee || !["nurse", "radiologist"].includes(assignee.role)) {
      return NextResponse.json({ error: "Assignee must be an available nurse or radiologist" }, { status: 400 })
    }

    // Create assignment
    const result = await dbRun(`
      INSERT INTO assignments (patient_id, doctor_id, assignee_staff_id, task_type, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [patient_id, doctor_id, assignee_staff_id, task_type, notes || null])

    // Create notification for assignee
    const message = `New assignment: ${task_type} (Patient ID ${patient_id})`
    await dbRun(`
      INSERT INTO notifications (staff_id, message)
      VALUES (?, ?)
    `, [assignee_staff_id, message])

    return NextResponse.json({ 
      success: true, 
      assignment: {
        id: result.lastID.toString(),
        patient_id,
        doctor_id,
        assignee_staff_id,
        task_type,
        notes,
      }
    })
  } catch (error: any) {
    console.error("Create assignment error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

