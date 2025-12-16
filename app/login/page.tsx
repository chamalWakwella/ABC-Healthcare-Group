import { LoginForm } from "@/components/login-form"
import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  try {
    const userWithRole = await getCurrentUserWithRole()
    if (userWithRole?.role) {
      redirect(`/${userWithRole.role}`)
    }
  } catch (error) {
    // If there's a database error, just show the login form
    // Don't redirect on error to avoid loops
    console.error("Error checking user:", error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <LoginForm />
    </div>
  )
}
