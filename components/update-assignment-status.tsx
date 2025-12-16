"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface UpdateAssignmentStatusProps {
  assignmentId: string
  currentStatus: string
}

export function UpdateAssignmentStatus({ assignmentId, currentStatus }: UpdateAssignmentStatusProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return

    setLoading(true)
    try {
      const response = await fetch("/api/staff/assignments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        alert(data.error || "Failed to update status")
        setStatus(currentStatus) // Revert on error
        setLoading(false)
        return
      }

      setStatus(newStatus)
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to update status")
      setStatus(currentStatus) // Revert on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={loading || status === "Completed"}
    >
      <SelectTrigger className="w-40 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Assigned">Assigned</SelectItem>
        <SelectItem value="In Progress">In Progress</SelectItem>
        <SelectItem value="Completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  )
}

