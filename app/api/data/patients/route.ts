import { NextRequest, NextResponse } from "next/server"
import { dbAll } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const patients = await dbAll("SELECT * FROM patients ORDER BY created_at DESC") as any[]

    return NextResponse.json({ patients: patients.map(p => ({
      id: p.id.toString(),
      name: p.name,
      email: p.email,
      phone: p.phone,
      dob: p.dob,
      gender: p.gender,
      created_at: p.created_at,
      user_id: p.user_id,
    })) })
  } catch (error: any) {
    console.error("Get patients error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

