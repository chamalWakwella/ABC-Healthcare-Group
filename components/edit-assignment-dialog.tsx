"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

interface EditAssignmentDialogProps {
  assignment: {
    id: string
    task_type: string
    notes: string | null
    status: string
    patient_name: string
    assignee_name: string
    assignee_role: string
    assignee_staff_id?: string
  }
  nurses: Array<{ id: string; name: string }>
  radiologists: Array<{ id: string; name: string }>
}

export function EditAssignmentDialog({ assignment, nurses, radiologists }: EditAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [formData, setFormData] = useState({
    task_type: assignment.task_type,
    notes: assignment.notes || "",
    status: assignment.status,
    assignee_staff_id: "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        task_type: assignment.task_type,
        notes: assignment.notes || "",
        status: assignment.status,
        assignee_staff_id: assignment.assignee_staff_id || "",
      })
      setError("")
    }
  }, [open, assignment.task_type, assignment.notes, assignment.status, assignment.assignee_staff_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/doctor/assignments/${assignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_type: formData.task_type,
          notes: formData.notes,
          status: formData.status,
          assignee_staff_id: formData.assignee_staff_id && formData.assignee_staff_id !== assignment.assignee_staff_id 
            ? formData.assignee_staff_id 
            : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || "Failed to update assignment")
        setLoading(false)
        return
      }

      setLoading(false)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update assignment")
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this assignment for ${assignment.patient_name}?`)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/doctor/assignments/${assignment.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || "Failed to delete assignment")
        setLoading(false)
        return
      }

      setLoading(false)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to delete assignment")
      setLoading(false)
    }
  }

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
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment - {assignment.patient_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_type">Task Type</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) => setFormData({ ...formData, task_type: value, assignee_staff_id: "" })}
            >
              <SelectTrigger>
                <SelectValue />
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
              value={formData.assignee_staff_id || ""}
              onValueChange={(value) => setFormData({ ...formData, assignee_staff_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {assignment.assignee_staff_id && (
                  <SelectItem value={assignment.assignee_staff_id}>
                    Current: {assignment.assignee_name} ({assignment.assignee_role})
                  </SelectItem>
                )}
                {getAvailableAssignees()
                  .filter(s => s.id !== assignment.assignee_staff_id)
                  .map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Leave as current or select a new assignee</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Updating..." : "Update Assignment"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

