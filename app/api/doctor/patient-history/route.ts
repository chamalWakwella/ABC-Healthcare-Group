import { NextRequest, NextResponse } from "next/server"
import { dbAll } from "@/lib/db"
import { getCurrentUserWithRole } from "@/lib/actions/auth"

export async function GET(request: NextRequest) {
  try {
    const userWithRole = await getCurrentUserWithRole()
    
    if (!userWithRole || userWithRole.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    // Get patient info
    const patient = await dbAll("SELECT * FROM patients WHERE id = ?", [patientId]) as any[]
    
    if (patient.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Get patient prescriptions/orders
    const prescriptions = await dbAll(`
      SELECT o.*, d.name AS doctor_name, d.category AS doctor_specialty
      FROM orders o
      JOIN staff d ON d.id = o.doctor_id
      WHERE o.patient_id = ?
      ORDER BY o.id DESC
    `, [patientId]) as any[]

    // Get patient assignments
    const assignments = await dbAll(`
      SELECT a.*, d.name AS doctor_name, s.name AS assignee_name, s.role AS assignee_role
      FROM assignments a
      JOIN staff d ON d.id = a.doctor_id
      JOIN staff s ON s.id = a.assignee_staff_id
      WHERE a.patient_id = ?
      ORDER BY a.id DESC
    `, [patientId]) as any[]

    // Get patient reports
    const reports = await dbAll(`
      SELECT r.*, s.name AS staff_name, s.role AS staff_role
      FROM reports r
      JOIN staff s ON s.id = r.created_by_staff_id
      WHERE r.patient_id = ?
      ORDER BY r.id DESC
    `, [patientId]) as any[]

    return NextResponse.json({
      patient: patient[0],
      prescriptions,
      assignments,
      reports,
    })
  } catch (error: any) {
    console.error("Get patient history error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

