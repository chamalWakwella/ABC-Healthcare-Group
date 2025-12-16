import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params as either Promise or direct object (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params

    const { task_type, notes, assignee_staff_id, status } = await request.json()
    
    // Validate and parse IDs
    const assignmentIdStr = String(resolvedParams.id || "").trim()
    const doctorIdStr = String(user.id || "").trim()
    
    // Check if IDs are valid numeric strings
    if (!/^\d+$/.test(assignmentIdStr) || !/^\d+$/.test(doctorIdStr)) {
      console.error("Invalid ID format:", { assignmentIdStr, doctorIdStr, paramsId: resolvedParams.id, userId: user.id })
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    
    const assignmentId = parseInt(assignmentIdStr, 10)
    const doctorId = parseInt(doctorIdStr, 10)

    if (isNaN(assignmentId) || isNaN(doctorId) || assignmentId <= 0 || doctorId <= 0) {
      console.error("Invalid ID after parsing:", { assignmentId, doctorId, assignmentIdStr, doctorIdStr })
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Verify assignment belongs to this doctor
    const assignment = await dbGet(`
      SELECT * FROM assignments 
      WHERE id = ? AND doctor_id = ?
    `, [assignmentId, doctorId]) as any

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 })
    }

    // If changing assignee, verify it's valid
    let finalAssigneeId = assignment.assignee_staff_id
    if (assignee_staff_id && assignee_staff_id !== "" && assignee_staff_id !== assignment.assignee_staff_id) {
      const newAssigneeId = typeof assignee_staff_id === 'string' ? parseInt(assignee_staff_id, 10) : assignee_staff_id
      if (!isNaN(newAssigneeId) && newAssigneeId > 0) {
        const assignee = await dbGet("SELECT id, role FROM staff WHERE id = ? AND is_available = 1", [newAssigneeId]) as any
        if (!assignee || !["nurse", "radiologist"].includes(assignee.role)) {
          return NextResponse.json({ error: "Assignee must be an available nurse or radiologist" }, { status: 400 })
        }
        finalAssigneeId = newAssigneeId
      }
    }
    await dbRun(`
      UPDATE assignments 
      SET task_type = ?, notes = ?, assignee_staff_id = ?, status = ?
      WHERE id = ? AND doctor_id = ?
    `, [
      task_type || assignment.task_type,
      notes !== undefined ? notes : assignment.notes,
      finalAssigneeId || assignment.assignee_staff_id,
      status || assignment.status,
      assignmentId,
      doctorId
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update assignment error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getSession()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle params as either Promise or direct object (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params

    // Validate and parse IDs
    const assignmentIdStr = String(resolvedParams.id || "").trim()
    const doctorIdStr = String(user.id || "").trim()
    
    // Check if IDs are valid numeric strings
    if (!/^\d+$/.test(assignmentIdStr) || !/^\d+$/.test(doctorIdStr)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    
    const assignmentId = parseInt(assignmentIdStr, 10)
    const doctorId = parseInt(doctorIdStr, 10)

    if (isNaN(assignmentId) || isNaN(doctorId) || assignmentId <= 0 || doctorId <= 0) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Verify assignment belongs to this doctor
    const assignment = await dbGet(`
      SELECT * FROM assignments 
      WHERE id = ? AND doctor_id = ?
    `, [assignmentId, doctorId]) as any

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 })
    }

    // Delete assignment
    await dbRun(`
      DELETE FROM assignments 
      WHERE id = ? AND doctor_id = ?
    `, [assignmentId, doctorId])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete assignment error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

