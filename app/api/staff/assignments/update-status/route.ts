import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || !["nurse", "radiologist"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assignment_id, status } = await request.json()

    if (!assignment_id || !status) {
      return NextResponse.json({ error: "Assignment ID and status are required" }, { status: 400 })
    }

    if (!["Assigned", "In Progress", "Completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate and parse IDs
    const assignmentIdStr = String(assignment_id || "").trim()
    const staffIdStr = String(user.id || "").trim()
    
    // Check if IDs are valid numeric strings
    if (!/^\d+$/.test(assignmentIdStr) || !/^\d+$/.test(staffIdStr)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    
    const assignmentId = parseInt(assignmentIdStr, 10)
    const staffId = parseInt(staffIdStr, 10)

    if (isNaN(assignmentId) || isNaN(staffId) || assignmentId <= 0 || staffId <= 0) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Verify assignment belongs to this staff member
    const assignment = await dbGet(`
      SELECT * FROM assignments 
      WHERE id = ? AND assignee_staff_id = ?
    `, [assignmentId, staffId]) as any

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 })
    }

    // Update assignment status
    await dbRun(`
      UPDATE assignments 
      SET status = ? 
      WHERE id = ? AND assignee_staff_id = ?
    `, [status, assignmentId, staffId])

    // If completed, notify doctor and patient
    if (status === "Completed") {
      const message = `Task '${assignment.task_type}' for patient #${assignment.patient_id} was completed.`
      await dbRun(`
        INSERT INTO notifications (staff_id, message)
        VALUES (?, ?)
      `, [assignment.doctor_id, message])

      const patientMessage = `Your task '${assignment.task_type}' has been completed.`
      await dbRun(`
        INSERT INTO patient_notifications (patient_id, message)
        VALUES (?, ?)
      `, [assignment.patient_id, patientMessage])
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update assignment status error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

