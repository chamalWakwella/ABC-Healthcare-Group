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
    let user: any
    try {
      user = await dbGet("SELECT * FROM patients WHERE email = ?", [email]) as any
    } catch (dbError: any) {
      console.error("Database error in login (patients):", dbError)
      // Check if it's a SQLite/Vercel issue
      if (dbError.message?.includes("timeout") || dbError.message?.includes("SQLite")) {
        return NextResponse.json({ 
          error: "Database connection failed. SQLite does not work on Vercel. Please migrate to a cloud database.",
          details: dbError.message 
        }, { status: 503 })
      }
      throw dbError
    }

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
    try {
      user = await dbGet("SELECT * FROM staff WHERE email = ?", [email]) as any
    } catch (dbError: any) {
      console.error("Database error in login (staff):", dbError)
      // Check if it's a SQLite/Vercel issue
      if (dbError.message?.includes("timeout") || dbError.message?.includes("SQLite")) {
        return NextResponse.json({ 
          error: "Database connection failed. SQLite does not work on Vercel. Please migrate to a cloud database.",
          details: dbError.message 
        }, { status: 503 })
      }
      throw dbError
    }

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

