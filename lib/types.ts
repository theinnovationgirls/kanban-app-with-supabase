export type TaskStatus = "pendiente" | "en_proceso" | "terminado"

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  position: number
  created_at: string
  user_id: string
}

export const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "pendiente", title: "Pendiente" },
  { id: "en_proceso", title: "En proceso" },
  { id: "terminado", title: "Terminado" },
]
