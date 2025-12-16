import { NextRequest, NextResponse } from "next/server"
import { dbGet, dbRun } from "@/lib/db"
import { getSession, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, role, category, email, phone, password } = await request.json()

    if (!name || !role || !email || !password) {
      return NextResponse.json({ error: "Name, role, email, and password are required" }, { status: 400 })
    }

    if (!["admin", "doctor", "nurse", "radiologist"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if email already exists
    const existingStaff = await dbGet("SELECT id FROM staff WHERE email = ?", [email]) as any
    if (existingStaff) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Check if username already exists (use email as username if not provided)
    const username = email.split("@")[0]
    const existingUsername = await dbGet("SELECT id FROM staff WHERE username = ?", [username]) as any
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const result = await dbRun(`
      INSERT INTO staff (name, role, category, email, username, password_hash, phone, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, role, category || null, email, username, passwordHash, phone || null, 1])

    return NextResponse.json({ 
      success: true, 
      staff: {
        id: result.lastID.toString(),
        name,
        role,
        category,
        email,
        phone,
      }
    })
  } catch (error: any) {
    console.error("Create staff error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

