import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function Header({ title, userName }: { title: string; userName: string }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Welcome, {userName}</p>
        </div>
        <form action={signOut}>
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}
