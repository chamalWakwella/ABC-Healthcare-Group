import { NextRequest, NextResponse } from "next/server"
import { dbGet } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Try to find user in patients table
    let user = await dbGet("SELECT * FROM patients WHERE email = ?", [email]) as any

    if (user) {
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const sessionId = await createSession(user.id.toString(), "patient")
      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: "patient",
        },
        sessionId,
      })
    }

    // Try to find user in staff table
    user = await dbGet("SELECT * FROM staff WHERE email = ?", [email]) as any

    if (user) {
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const sessionId = await createSession(user.id.toString(), "staff")
      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        sessionId,
      })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

