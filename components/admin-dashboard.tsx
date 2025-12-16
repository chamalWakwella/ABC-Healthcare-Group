"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Staff, Patient } from "@/lib/types"
import { CreateStaffDialog } from "@/components/create-staff-dialog"
import { CreatePatientDialog } from "@/components/create-patient-dialog"
import { Badge } from "@/components/ui/badge"

interface AdminDashboardProps {
  staff: Staff[]
  patients: Patient[]
  assignments: any[]
}

export function AdminDashboard({ staff, patients, assignments }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.filter((a) => a.status !== "Completed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.filter((s) => s.is_available).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Staff Management</CardTitle>
              <CreateStaffDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff.slice(0, 10).map((member) => (
                <div key={member.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.role} {member.category && `- ${member.category}`}
                    </p>
                  </div>
                  <Badge variant={member.is_available ? "default" : "secondary"}>
                    {member.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patients</CardTitle>
              <CreatePatientDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patients.slice(0, 10).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(patient.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.slice(0, 15).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between border-b pb-3">
                <div className="space-y-1">
                  <p className="font-medium">{assignment.task_type}</p>
                  <p className="text-sm text-muted-foreground">
                    Patient: {assignment.patient?.name} | Assigned to: {assignment.assignee?.name} (
                    {assignment.assignee?.role})
                  </p>
                </div>
                <Badge
                  variant={
                    assignment.status === "Completed"
                      ? "default"
                      : assignment.status === "In Progress"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {assignment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
