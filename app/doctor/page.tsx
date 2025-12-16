import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { dbGet, dbAll } from "@/lib/db"
import { CreateAssignmentDialog } from "@/components/create-assignment-dialog"
import { WritePrescriptionDialog } from "@/components/write-prescription-dialog"
import { PatientHistoryViewer } from "@/components/patient-history-viewer"

export default async function DoctorPage() {
  const userWithRole = await getCurrentUserWithRole()

  if (!userWithRole || userWithRole.role !== "doctor") {
    redirect("/login")
  }

  const doctorId = userWithRole.user.id

  // Get doctor info
  const doctor = await dbGet("SELECT * FROM staff WHERE id = ? AND role = 'doctor'", [doctorId]) as any

  // Get all patients
  const patients = await dbAll("SELECT * FROM patients ORDER BY id DESC") as any[]

  // Get available nurses
  const nurses = await dbAll("SELECT * FROM staff WHERE role = 'nurse' AND is_available = 1 ORDER BY name") as any[]

  // Get available radiologists
  const radiologists = await dbAll("SELECT * FROM staff WHERE role = 'radiologist' AND is_available = 1 ORDER BY name") as any[]

  // Get notifications
  const notifications = await dbAll(`
    SELECT * FROM notifications
    WHERE staff_id = ?
    ORDER BY id DESC
    LIMIT 50
  `, [doctorId]) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Doctor Dashboard" userName={doctor?.name || "Doctor"} />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, Dr. {doctor?.name}</h2>
          {doctor?.category && <p className="text-gray-600">{doctor.category}</p>}
        </div>

        {/* Patient History Viewer */}
        <div className="mb-6">
          <PatientHistoryViewer
            patients={patients.map(p => ({ id: p.id.toString(), name: p.name, email: p.email }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <CreateAssignmentDialog
            patients={patients.map(p => ({ id: p.id.toString(), name: p.name, email: p.email }))}
            nurses={nurses.map(n => ({ id: n.id.toString(), name: n.name }))}
            radiologists={radiologists.map(r => ({ id: r.id.toString(), name: r.name }))}
            doctorId={doctorId}
          />
          <WritePrescriptionDialog
            patients={patients.map(p => ({ id: p.id.toString(), name: p.name, email: p.email }))}
            doctorId={doctorId}
          />
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

      </main>
    </div>
  )
}

