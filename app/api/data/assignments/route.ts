import { NextRequest, NextResponse } from "next/server"
import { dbAll } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const assignments = await dbAll(`
      SELECT 
        a.*,
        p.name AS patient_name,
        d.name AS doctor_name,
        s.name AS assignee_name,
        s.role AS assignee_role
      FROM assignments a
      JOIN patients p ON p.id = a.patient_id
      JOIN staff d ON d.id = a.doctor_id
      JOIN staff s ON s.id = a.assignee_staff_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `) as any[]

    return NextResponse.json({ 
      assignments: assignments.map(a => ({
        id: a.id.toString(),
        patient_id: a.patient_id.toString(),
        doctor_id: a.doctor_id.toString(),
        assignee_staff_id: a.assignee_staff_id.toString(),
        task_type: a.task_type,
        notes: a.notes,
        status: a.status,
        created_at: a.created_at,
        patient: { name: a.patient_name },
        doctor: { name: a.doctor_name },
        assignee: { name: a.assignee_name, role: a.assignee_role },
      }))
    })
  } catch (error: any) {
    console.error("Get assignments error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

