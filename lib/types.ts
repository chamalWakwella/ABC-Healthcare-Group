export type UserRole = "admin" | "doctor" | "nurse" | "radiologist" | "patient"

export interface Patient {
  id: string
  name: string
  email: string
  phone: string | null
  dob: string | null
  gender: string | null
  created_at: string
  user_id: string | null
}

export interface Staff {
  id: string
  name: string
  role: UserRole
  category: string | null
  email: string
  phone: string | null
  is_available: boolean
  created_at: string
  user_id: string | null
}

export interface Order {
  id: string
  patient_id: string
  doctor_id: string
  order_type: string
  notes: string | null
  status: string
  created_at: string
}

export interface Assignment {
  id: string
  patient_id: string
  doctor_id: string
  assignee_staff_id: string
  task_type: string
  notes: string | null
  status: "Assigned" | "In Progress" | "Completed"
  created_at: string
}

export interface Notification {
  id: string
  staff_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Report {
  id: string
  patient_id: string
  created_by_staff_id: string
  report_type: string
  report_text: string | null
  image_url: string | null
  created_at: string
}

export interface PatientNotification {
  id: string
  patient_id: string
  message: string
  is_read: boolean
  created_at: string
}
