"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface UploadScanDialogProps {
  assignment: {
    id: string
    patient_id: string
    patient_name: string
    task_type: string
  }
  radiologistId: string
}

export function UploadScanDialog({ assignment, radiologistId }: UploadScanDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [formData, setFormData] = useState({
    report_text: "",
    image_file: null as File | null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image_file: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.report_text.trim()) {
      setError("Report text is required")
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("patient_id", assignment.patient_id)
      formDataToSend.append("report_type", "Scan Result")
      formDataToSend.append("report_text", formData.report_text)
      if (formData.image_file) {
        formDataToSend.append("image_file", formData.image_file)
      }

      const response = await fetch("/api/staff/reports", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || "Failed to upload scan")
        setLoading(false)
        return
      }

      // Update assignment status to completed
      await fetch("/api/staff/assignments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: assignment.id,
          status: "Completed",
        }),
      })

      setLoading(false)
      setOpen(false)
      setFormData({ report_text: "", image_file: null })
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to upload scan")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Upload Result</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Scan Result - {assignment.patient_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image_file">Scan Image (Optional)</Label>
            <Input
              id="image_file"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500">Accepted: PNG, JPG, JPEG, PDF</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report_text">Report / Findings *</Label>
            <Textarea
              id="report_text"
              placeholder="Enter scan findings and notes..."
              value={formData.report_text}
              onChange={(e) => setFormData({ ...formData, report_text: e.target.value })}
              required
              rows={6}
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading..." : "Submit Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

