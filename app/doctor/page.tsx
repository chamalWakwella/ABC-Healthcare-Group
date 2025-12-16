import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { dbGet, dbAll } from "@/lib/db"
import { CreateAssignmentDialog } from "@/components/create-assignment-dialog"
import { WritePrescriptionDialog } from "@/components/write-prescription-dialog"
import { EditAssignmentDialog } from "@/components/edit-assignment-dialog"

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

  // Get recent assignments
  const recentAssignments = await dbAll(`
    SELECT a.*, p.name AS patient_name, s.name AS assignee_name, s.role AS assignee_role, s.id AS assignee_staff_id
    FROM assignments a
    JOIN patients p ON p.id = a.patient_id
    JOIN staff s ON s.id = a.assignee_staff_id
    WHERE a.doctor_id = ?
    ORDER BY a.id DESC
    LIMIT 200
  `, [doctorId]) as any[]

  // Get notifications
  const notifications = await dbAll(`
    SELECT * FROM notifications
    WHERE staff_id = ?
    ORDER BY id DESC
    LIMIT 50
  `, [doctorId]) as any[]

  // Get radiology reports for patients assigned by this doctor
  // Get all scan reports and filter to show those for patients this doctor has assigned
  const allReports = await dbAll(`
    SELECT 
      r.*, 
      p.name AS patient_name,
      s.name AS staff_name,
      s.role AS staff_role
    FROM reports r
    JOIN patients p ON p.id = r.patient_id
    JOIN staff s ON s.id = r.created_by_staff_id
    WHERE (r.report_type LIKE '%Scan%' OR r.report_type LIKE '%Radiology%' OR s.role = 'radiologist')
    ORDER BY r.id DESC
    LIMIT 200
  `) as any[]

  // Get patient IDs that this doctor has assigned
  const assignedPatientIds = await dbAll(`
    SELECT DISTINCT patient_id 
    FROM assignments 
    WHERE doctor_id = ?
  `, [doctorId]) as any[]

  const assignedIds = new Set(assignedPatientIds.map((a: any) => a.patient_id.toString()))
  
  // Filter reports to only show those for patients this doctor has assigned
  const radiologyReports = allReports.filter((report: any) => 
    assignedIds.has(report.patient_id.toString())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Doctor Dashboard" userName={doctor?.name || "Doctor"} />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, Dr. {doctor?.name}</h2>
          {doctor?.category && <p className="text-gray-600">{doctor.category}</p>}
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

        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Active Assignments</h3>
          <div className="space-y-3">
            {recentAssignments.slice(0, 10).map((assignment: any) => (
              <div key={assignment.id} className="border-b pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{assignment.task_type}</p>
                    <p className="text-sm text-gray-600">Patient: {assignment.patient_name}</p>
                    <p className="text-sm text-gray-600">Assigned to: {assignment.assignee_name} ({assignment.assignee_role})</p>
                    {assignment.notes && <p className="text-sm text-gray-500 mt-1">{assignment.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EditAssignmentDialog
                      assignment={{
                        id: assignment.id.toString(),
                        task_type: assignment.task_type,
                        notes: assignment.notes,
                        status: assignment.status,
                        patient_name: assignment.patient_name,
                        assignee_name: assignment.assignee_name,
                        assignee_role: assignment.assignee_role,
                        assignee_staff_id: assignment.assignee_staff_id?.toString(),
                      }}
                      nurses={nurses.map(n => ({ id: n.id.toString(), name: n.name }))}
                      radiologists={radiologists.map(r => ({ id: r.id.toString(), name: r.name }))}
                    />
                    <span className={`px-2 py-1 rounded text-xs ${
                      assignment.status === "Completed" ? "bg-green-100 text-green-800" :
                      assignment.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentAssignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No assignments yet</p>
            )}
          </div>
        </div>

        {/* Radiology Scan Results */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">📋 Radiology Scan Results</h3>
          <div className="space-y-4">
            {radiologyReports.map((report: any) => (
              <div key={report.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-lg">{report.report_type}</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {report.staff_role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Patient: <span className="font-medium">{report.patient_name}</span></p>
                    <p className="text-sm text-gray-600 mb-2">Radiologist: {report.staff_name}</p>
                    {report.report_text && (
                      <div className="bg-gray-50 p-3 rounded mt-2 mb-3">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{report.report_text}</p>
                      </div>
                    )}
                    {report.image_filename && (
                      <div className="mt-3 flex gap-2">
                        <a 
                          href={`/uploads/${report.image_filename}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        >
                          📷 View Scan Image
                        </a>
                        <a 
                          href={`/uploads/${report.image_filename}`} 
                          download
                          className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Created: {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {radiologyReports.length === 0 && (
              <p className="text-gray-500 text-center py-8">No radiology scan results yet</p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

