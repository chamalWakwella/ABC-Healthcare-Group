import { NextRequest, NextResponse } from "next/server"
import { dbAll } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const staff = await dbAll("SELECT * FROM staff ORDER BY created_at DESC") as any[]

    return NextResponse.json({ staff: staff.map(s => ({
      id: s.id.toString(),
      name: s.name,
      role: s.role,
      category: s.category,
      email: s.email,
      phone: s.phone,
      is_available: s.is_available === 1,
      created_at: s.created_at,
      user_id: s.user_id,
    })) })
  } catch (error: any) {
    console.error("Get staff error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

