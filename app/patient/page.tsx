import { getCurrentUserWithRole } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { dbGet, dbAll } from "@/lib/db"

export default async function PatientPage() {
  const userWithRole = await getCurrentUserWithRole()

  if (!userWithRole || userWithRole.role !== "patient") {
    redirect("/login")
  }

  const patientId = userWithRole.user.id

  // Get patient info
  const patient = await dbGet("SELECT * FROM patients WHERE id = ?", [patientId]) as any

  // Get patient orders
  const myOrders = await dbAll(`
    SELECT o.*, d.name AS doctor_name, d.category AS doctor_specialty
    FROM orders o
    JOIN staff d ON d.id = o.doctor_id
    WHERE o.patient_id = ?
    ORDER BY o.id DESC
    LIMIT 300
  `, [patientId]) as any[]

  // Get patient assignments
  const myAssignments = await dbAll(`
    SELECT a.*, d.name AS doctor_name, s.name AS assignee_name, s.role AS assignee_role
    FROM assignments a
    JOIN staff d ON d.id = a.doctor_id
    JOIN staff s ON s.id = a.assignee_staff_id
    WHERE a.patient_id = ?
    ORDER BY a.id DESC
    LIMIT 300
  `, [patientId]) as any[]

  // Get patient reports
  const myReports = await dbAll(`
    SELECT r.*, s.name AS staff_name, s.role AS staff_role
    FROM reports r
    JOIN staff s ON s.id = r.created_by_staff_id
    WHERE r.patient_id = ?
    ORDER BY r.id DESC
    LIMIT 300
  `, [patientId]) as any[]

  // Get notifications
  const notifications = await dbAll(`
    SELECT * FROM patient_notifications
    WHERE patient_id = ?
    ORDER BY id DESC
    LIMIT 50
  `, [patientId]) as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Patient Dashboard" userName={patient?.name || "Patient"} />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {patient?.name}</h2>
          <p className="text-gray-600">{patient?.email}</p>
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* My Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">My Orders</h3>
            <div className="space-y-3">
              {myOrders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="border-b pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${order.order_type.includes("Prescription") ? "text-blue-600" : ""}`}>
                        {order.order_type}
                        {order.order_type.includes("Prescription") && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Prescription</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Doctor: {order.doctor_name} ({order.doctor_specialty})</p>
                      {order.notes && (
                        <div className="text-sm text-gray-700 mt-2 whitespace-pre-line bg-gray-50 p-2 rounded">
                          {order.notes}
                        </div>
                      )}
                    </div>
                    <span className={`ml-4 px-2 py-1 rounded text-xs ${
                      order.status === "Completed" ? "bg-green-100 text-green-800" :
                      order.status === "Active" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {myOrders.length === 0 && (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>

          {/* My Assignments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">My Assignments</h3>
            <div className="space-y-3">
              {myAssignments.slice(0, 10).map((assignment: any) => (
                <div key={assignment.id} className="border-b pb-3">
                  <p className="font-medium">{assignment.task_type}</p>
                  <p className="text-sm text-gray-600">Doctor: {assignment.doctor_name}</p>
                  <p className="text-sm text-gray-600">Assigned to: {assignment.assignee_name} ({assignment.assignee_role})</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    assignment.status === "Completed" ? "bg-green-100 text-green-800" :
                    assignment.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              ))}
              {myAssignments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No assignments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* My Reports */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">My Reports</h3>
          <div className="space-y-4">
            {myReports.map((report: any) => (
              <div key={report.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-lg">{report.report_type}</p>
                    <p className="text-sm text-gray-600 mt-1">By: {report.staff_name} ({report.staff_role})</p>
                    {report.report_text && <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{report.report_text}</p>}
                    {report.image_filename && (
                      <div className="mt-3">
                        <a 
                          href={`/uploads/${report.image_filename}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          View Image/Scan
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Created: {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {myReports.length === 0 && (
              <p className="text-gray-500 text-center py-8">No reports yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

