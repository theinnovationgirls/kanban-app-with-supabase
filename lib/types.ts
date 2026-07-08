export type TaskStatus = "pendiente" | "en_proceso" | "terminado"

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  position: number
  created_at: string
  user_id: string
  team_id: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

export const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "pendiente", title: "Pendiente" },
  { id: "en_proceso", title: "En proceso" },
  { id: "terminado", title: "Terminado" },
]
