"use client"

import * as React from "react"
import { PatientSearchSelect } from "@/components/patient-search-select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface PatientHistoryViewerProps {
  patients: Array<{ id: string; name: string; email?: string }>
}

interface PatientHistory {
  patient: any
  prescriptions: any[]
  assignments: any[]
  reports: any[]
}

export function PatientHistoryViewer({ patients }: PatientHistoryViewerProps) {
  const [selectedPatientId, setSelectedPatientId] = React.useState<string>("")
  const [history, setHistory] = React.useState<PatientHistory | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchPatientHistory = async (patientId: string) => {
    if (!patientId) {
      setHistory(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/doctor/patient-history?patientId=${patientId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch patient history")
      }
      const data = await response.json()
      setHistory(data)
    } catch (err: any) {
      setError(err.message || "Failed to load patient history")
      setHistory(null)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId)
    } else {
      setHistory(null)
    }
  }, [selectedPatientId])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Patient History</CardTitle>
          <CardDescription>Search and view complete patient medical history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Select Patient</label>
            <PatientSearchSelect
              patients={patients}
              value={selectedPatientId}
              onValueChange={setSelectedPatientId}
              placeholder="Search for a patient..."
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading patient history...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && history && (
            <div className="mt-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-2">{history.patient.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {history.patient.email && (
                    <div>
                      <span className="text-gray-600">Email:</span> {history.patient.email}
                    </div>
                  )}
                  {history.patient.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span> {history.patient.phone}
                    </div>
                  )}
                  {history.patient.dob && (
                    <div>
                      <span className="text-gray-600">Date of Birth:</span> {history.patient.dob}
                    </div>
                  )}
                  {history.patient.gender && (
                    <div>
                      <span className="text-gray-600">Gender:</span> {history.patient.gender}
                    </div>
                  )}
                </div>
              </div>

              <Tabs defaultValue="prescriptions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prescriptions">
                    Prescriptions ({history.prescriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="assignments">
                    Assignments ({history.assignments.length})
                  </TabsTrigger>
                  <TabsTrigger value="reports">
                    Reports ({history.reports.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prescriptions" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {history.prescriptions.length > 0 ? (
                          history.prescriptions.map((prescription: any) => (
                            <div key={prescription.id} className="border-b pb-4 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-lg">{prescription.order_type}</p>
                                  <p className="text-sm text-gray-600">
                                    By: Dr. {prescription.doctor_name}
                                    {prescription.doctor_specialty && ` (${prescription.doctor_specialty})`}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded text-sm ${
                                  prescription.status === "Completed" ? "bg-green-100 text-green-800" :
                                  prescription.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {prescription.status}
                                </span>
                              </div>
                              {prescription.notes && (
                                <div className="bg-gray-50 p-3 rounded mt-2">
                                  <p className="text-sm text-gray-700 whitespace-pre-line">{prescription.notes}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Created: {new Date(prescription.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No prescriptions found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {history.assignments.length > 0 ? (
                          history.assignments.map((assignment: any) => (
                            <div key={assignment.id} className="border-b pb-4 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-lg">{assignment.task_type}</p>
                                  <p className="text-sm text-gray-600">
                                    Assigned by: Dr. {assignment.doctor_name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Assigned to: {assignment.assignee_name} ({assignment.assignee_role})
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded text-sm ${
                                  assignment.status === "Completed" ? "bg-green-100 text-green-800" :
                                  assignment.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {assignment.status}
                                </span>
                              </div>
                              {assignment.notes && (
                                <div className="bg-gray-50 p-3 rounded mt-2">
                                  <p className="text-sm text-gray-700 whitespace-pre-line">{assignment.notes}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Created: {new Date(assignment.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No assignments found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {history.reports.length > 0 ? (
                          history.reports.map((report: any) => (
                            <div key={report.id} className="border-b pb-4 last:border-b-0">
                              <div className="mb-2">
                                <p className="font-semibold text-lg">{report.report_type}</p>
                                <p className="text-sm text-gray-600">
                                  By: {report.staff_name} ({report.staff_role})
                                </p>
                              </div>
                              {report.report_text && (
                                <div className="bg-gray-50 p-3 rounded mt-2">
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
                                    📷 View Image/Scan
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
                              <p className="text-xs text-gray-400 mt-2">
                                Created: {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No reports found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!loading && !error && !history && selectedPatientId && (
            <div className="text-center py-8 text-gray-500">
              No history data available for this patient
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

