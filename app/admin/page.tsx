import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { AdminDashboard } from "@/components/admin-dashboard"
import { dbGet, dbAll } from "@/lib/db"

export default async function AdminPage() {
  const userWithRole = await getCurrentUserWithRole()

  if (!userWithRole || userWithRole.role !== "admin") {
    redirect("/login")
  }
  
  // Get current staff member
  const staff = await dbGet("SELECT * FROM staff WHERE id = ?", [userWithRole.user.id]) as any

  // Get all staff
  const allStaff = await dbAll("SELECT * FROM staff ORDER BY created_at DESC") as any[]

  // Get all patients
  const allPatients = await dbAll("SELECT * FROM patients ORDER BY created_at DESC") as any[]

  // Get recent assignments with joins
  const recentAssignments = await dbAll(`
    SELECT 
      a.*,
      p.name AS patient_name,
      d.name AS doctor_name,
      s.name AS assignee_name,
      s.role AS assignee_role
    FROM assignments a
    JOIN patients p ON p.id = a.patient_id
    JOIN staff d ON d.id = a.doctor_id
    JOIN staff s ON s.id = a.assignee_staff_id
    ORDER BY a.created_at DESC
    LIMIT 100
  `) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Admin Dashboard" userName={staff?.name || "Admin"} />
      <main className="container mx-auto p-6">
        <AdminDashboard 
          staff={allStaff.map(s => ({
            id: s.id.toString(),
            name: s.name,
            role: s.role,
            category: s.category,
            email: s.email,
            phone: s.phone,
            is_available: s.is_available === 1,
            created_at: s.created_at,
            user_id: s.user_id,
          }))} 
          patients={allPatients.map(p => ({
            id: p.id.toString(),
            name: p.name,
            email: p.email,
            phone: p.phone,
            dob: p.dob,
            gender: p.gender,
            created_at: p.created_at,
            user_id: p.user_id,
          }))} 
          assignments={recentAssignments.map(a => ({
            id: a.id.toString(),
            patient_id: a.patient_id.toString(),
            doctor_id: a.doctor_id.toString(),
            assignee_staff_id: a.assignee_staff_id.toString(),
            task_type: a.task_type,
            notes: a.notes,
            status: a.status,
            created_at: a.created_at,
            patient: { name: a.patient_name },
            doctor: { name: a.doctor_name },
            assignee: { name: a.assignee_name, role: a.assignee_role },
          }))} 
        />
      </main>
    </div>
  )
}
