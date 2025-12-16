"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { PatientSearchSelect } from "@/components/patient-search-select"

interface WritePrescriptionDialogProps {
  patients: Array<{ id: string; name: string; email?: string }>
  doctorId: string
}

export function WritePrescriptionDialog({ patients, doctorId }: WritePrescriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [formData, setFormData] = useState({
    patient_id: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.patient_id || !formData.medication) {
      setError("Patient and medication are required")
      setLoading(false)
      return
    }

    try {
      const prescriptionText = `Prescription:
Medication: ${formData.medication}
Dosage: ${formData.dosage || "As prescribed"}
Frequency: ${formData.frequency || "As directed"}
Duration: ${formData.duration || "As needed"}
Instructions: ${formData.instructions || "Follow doctor's instructions"}`

      const response = await fetch("/api/doctor/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          doctor_id: doctorId,
          prescription_text: prescriptionText,
          medication: formData.medication,
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          instructions: formData.instructions,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || "Failed to write prescription")
        setLoading(false)
        return
      }

      setLoading(false)
      setOpen(false)
      setFormData({
        patient_id: "",
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      })
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to write prescription")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Write Prescription</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient *</Label>
            <PatientSearchSelect
              patients={patients}
              value={formData.patient_id}
              onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              placeholder="Search and select patient..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication">Medication *</Label>
            <Input
              id="medication"
              placeholder="e.g., Paracetamol 500mg"
              value={formData.medication}
              onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              placeholder="e.g., 1 tablet"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Input
              id="frequency"
              placeholder="e.g., Twice daily"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 7 days"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Additional Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Special instructions for the patient..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Prescription"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

