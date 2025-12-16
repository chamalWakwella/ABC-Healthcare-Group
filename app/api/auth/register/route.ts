import { NextRequest, NextResponse } from "next/server"
import { dbGet, dbRun } from "@/lib/db"
import { createSession, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, phone, dob, gender } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (role !== "patient") {
      return NextResponse.json({ error: "Only patient registration is allowed" }, { status: 400 })
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

    const sessionId = await createSession(result.lastID.toString(), "patient")

    return NextResponse.json({ 
      success: true, 
      user: {
        id: result.lastID.toString(),
        email,
        name,
        role: "patient",
      },
      sessionId,
    })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

