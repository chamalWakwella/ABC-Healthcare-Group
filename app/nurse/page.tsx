import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { dbGet, dbAll } from "@/lib/db"
import { UpdateAssignmentStatus } from "@/components/update-assignment-status"

export default async function NursePage() {
  const userWithRole = await getCurrentUserWithRole()

  if (!userWithRole || userWithRole.role !== "nurse") {
    redirect("/login")
  }

  const nurseId = userWithRole.user.id

  // Get nurse info
  const nurse = await dbGet("SELECT * FROM staff WHERE id = ? AND role = 'nurse'", [nurseId]) as any

  // Get assignments
  const assignments = await dbAll(`
    SELECT a.*, p.name AS patient_name, d.name AS doctor_name
    FROM assignments a
    JOIN patients p ON p.id = a.patient_id
    JOIN staff d ON d.id = a.doctor_id
    WHERE a.assignee_staff_id = ?
    ORDER BY a.id DESC
    LIMIT 300
  `, [nurseId]) as any[]

  // Get notifications
  const notifications = await dbAll(`
    SELECT * FROM notifications
    WHERE staff_id = ?
    ORDER BY id DESC
    LIMIT 200
  `, [nurseId]) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Nurse Dashboard" userName={nurse?.name || "Nurse"} />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {nurse?.name}</h2>
        </div>

        {/* Notifications */}
        {notifications.filter((n: any) => !n.is_read).length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">🔔 Notifications</h3>
            <div className="space-y-2">
              {notifications.filter((n: any) => !n.is_read).map((notif: any) => (
                <div key={notif.id} className="flex justify-between items-start p-3 bg-white rounded border">
                  <div>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">My Assignments</h3>
          <div className="space-y-4">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-lg">{assignment.task_type}</p>
                    <p className="text-sm text-gray-600 mt-1">Patient: {assignment.patient_name}</p>
                    <p className="text-sm text-gray-600">Doctor: {assignment.doctor_name}</p>
                    {assignment.notes && <p className="text-sm text-gray-500 mt-1">{assignment.notes}</p>}
                    <p className="text-xs text-gray-400 mt-2">Created: {new Date(assignment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <UpdateAssignmentStatus
                      assignmentId={assignment.id.toString()}
                      currentStatus={assignment.status}
                    />
                  </div>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-gray-500 text-center py-8">No assignments yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

