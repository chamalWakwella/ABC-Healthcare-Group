import { cookies } from "next/headers"
import { dbGet, dbRun } from "./db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  userType: "patient" | "staff"
}

export async function createSession(userId: string, userType: "patient" | "staff"): Promise<string> {
  const sessionId = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await dbRun(`
    INSERT INTO sessions (id, user_id, user_type, expires_at)
    VALUES (?, ?, ?, ?)
  `, [sessionId, userId, userType, expiresAt.toISOString()])

  const cookieStore = await cookies()
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return null
    }

    let session: any
    try {
      session = await dbGet(`
        SELECT * FROM sessions 
        WHERE id = ? AND expires_at > datetime('now')
      `, [sessionId]) as any
    } catch (error: any) {
      // If database query fails (timeout, etc.), return null to allow login
      console.error("Database error in getSession:", error)
      return null
    }

    if (!session) {
      return null
    }

    if (session.user_type === "patient") {
      let patient: any
      try {
        patient = await dbGet("SELECT * FROM patients WHERE id = ?", [session.user_id]) as any
      } catch (error: any) {
        console.error("Database error fetching patient:", error)
        return null
      }
      if (!patient) return null

      return {
        id: patient.id.toString(),
        email: patient.email,
        name: patient.name,
        role: "patient",
        userType: "patient",
      }
    } else {
      let staff: any
      try {
        staff = await dbGet("SELECT * FROM staff WHERE id = ?", [session.user_id]) as any
      } catch (error: any) {
        console.error("Database error fetching staff:", error)
        return null
      }
      if (!staff) return null

      return {
        id: staff.id.toString(),
        email: staff.email,
        name: staff.name,
        role: staff.role,
        userType: "staff",
      }
    }
  } catch (error: any) {
    // Catch any other errors and return null to allow login
    console.error("Error in getSession:", error)
    return null
  }
}

export async function deleteSession(sessionId: string) {
  await dbRun("DELETE FROM sessions WHERE id = ?", [sessionId])

  const cookieStore = await cookies()
  cookieStore.delete("session_id")
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
