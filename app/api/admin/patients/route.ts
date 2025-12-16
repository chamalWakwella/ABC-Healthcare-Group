import { NextRequest, NextResponse } from "next/server"
import { dbGet, dbRun } from "@/lib/db"
import { getSession, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone, dob, gender, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingPatient = await dbGet("SELECT id FROM patients WHERE email = ?", [email]) as any
    if (existingPatient) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Check if username already exists (use email as username if not provided)
    const username = email.split("@")[0]
    const existingUsername = await dbGet("SELECT id FROM patients WHERE username = ?", [username]) as any
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const result = await dbRun(`
      INSERT INTO patients (name, email, username, password_hash, phone, dob, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, email, username, passwordHash, phone || null, dob || null, gender || null])

    return NextResponse.json({ 
      success: true, 
      patient: {
        id: result.lastID.toString(),
        name,
        email,
        phone,
        dob,
        gender,
      }
    })
  } catch (error: any) {
    console.error("Create patient error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

