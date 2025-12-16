"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { PatientSearchSelect } from "@/components/patient-search-select"

interface CreateAssignmentDialogProps {
  patients: Array<{ id: string; name: string; email?: string }>
  nurses: Array<{ id: string; name: string }>
  radiologists: Array<{ id: string; name: string }>
  doctorId: string
}

export function CreateAssignmentDialog({ patients, nurses, radiologists, doctorId }: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [formData, setFormData] = useState({
    patient_id: "",
    assignee_staff_id: "",
    task_type: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/doctor/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          doctor_id: doctorId,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || "Failed to create assignment")
        setLoading(false)
        return
      }

      setLoading(false)
      setOpen(false)
      setFormData({ patient_id: "", assignee_staff_id: "", task_type: "", notes: "" })
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create assignment")
      setLoading(false)
    }
  }

  // Filter assignees based on task type
  const getAvailableAssignees = () => {
    if (formData.task_type.includes("Scan") || formData.task_type.includes("X-Ray") || formData.task_type.includes("CT") || formData.task_type.includes("MRI")) {
      return radiologists
    }
    if (formData.task_type.includes("Nursing") || formData.task_type.includes("Care")) {
      return nurses
    }
    return [...nurses, ...radiologists]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create Assignment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Assignment (Ticket)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient</Label>
            <PatientSearchSelect
              patients={patients}
              value={formData.patient_id}
              onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              placeholder="Search and select patient..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task_type">Task Type</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) => setFormData({ ...formData, task_type: value, assignee_staff_id: "" })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Radiology Scan (X-Ray, CT, MRI)">Radiology Scan (X-Ray, CT, MRI)</SelectItem>
                <SelectItem value="Nursing Care">Nursing Care</SelectItem>
                <SelectItem value="Lab Test">Lab Test</SelectItem>
                <SelectItem value="ECG">ECG</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee_staff_id">Assign To</Label>
            <Select
              value={formData.assignee_staff_id}
              onValueChange={(value) => setFormData({ ...formData, assignee_staff_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableAssignees().map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

