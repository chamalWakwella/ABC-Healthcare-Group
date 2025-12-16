import { NextRequest, NextResponse } from "next/server"
import { dbRun, dbGet } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || !["nurse", "radiologist"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const patient_id = formData.get("patient_id") as string
    const report_type = formData.get("report_type") as string || "Report"
    const report_text = formData.get("report_text") as string
    const image_file = formData.get("image_file") as File | null

    if (!patient_id || !report_text) {
      return NextResponse.json({ error: "Patient and report text are required" }, { status: 400 })
    }

    let image_filename = null

    if (image_file && image_file.size > 0) {
      // Ensure upload directory exists
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true })
      }

      const bytes = await image_file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const timestamp = Date.now()
      const originalName = image_file.name
      const ext = originalName.split(".").pop() || ""
      const allowedExts = ["png", "jpg", "jpeg", "webp", "pdf"]
      
      if (!allowedExts.includes(ext.toLowerCase())) {
        return NextResponse.json({ error: "Invalid file type. Allowed: PNG, JPG, JPEG, WEBP, PDF" }, { status: 400 })
      }

      image_filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      const filePath = join(UPLOAD_DIR, image_filename)

      await writeFile(filePath, buffer)
    }

    const result = await dbRun(`
      INSERT INTO reports (patient_id, created_by_staff_id, report_type, report_text, image_filename)
      VALUES (?, ?, ?, ?, ?)
    `, [patient_id, user.id, report_type, report_text, image_filename])

    // Notify patient
    const patient = await dbGet("SELECT name FROM patients WHERE id = ?", [patient_id]) as any
    const message = `New ${report_type.toLowerCase()} has been added to your records.`
    await dbRun(`
      INSERT INTO patient_notifications (patient_id, message)
      VALUES (?, ?)
    `, [patient_id, message])

    return NextResponse.json({ 
      success: true, 
      report: {
        id: result.lastID.toString(),
        patient_id,
        report_type,
        report_text,
        image_filename,
      }
    })
  } catch (error: any) {
    console.error("Create report error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

