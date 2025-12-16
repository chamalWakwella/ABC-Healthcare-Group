import { NextResponse, type NextRequest } from "next/server"
import { dbGet } from "@/lib/db"

export async function proxy(request: NextRequest) {
  const protectedPaths = ["/admin", "/doctor", "/nurse", "/radiologist", "/patient"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    try {
      const sessionId = request.cookies.get("session_id")?.value

      if (!sessionId) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }

      // Verify session exists and is valid
      const session = await dbGet(`
        SELECT * FROM sessions 
        WHERE id = ? AND expires_at > datetime('now')
      `, [sessionId])

      if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }

      return NextResponse.next()
    } catch (error) {
      // If database not initialized, allow through (will be handled by page)
      if (error instanceof Error && error.message.includes("not found")) {
        return NextResponse.next()
      }
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
