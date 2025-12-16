import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const userWithRole = await getCurrentUserWithRole()

  if (userWithRole?.role) {
    redirect(`/${userWithRole.role}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Hospital Management System</h1>
        <p className="text-lg text-gray-600">Welcome to our comprehensive healthcare platform</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Register as Patient
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
