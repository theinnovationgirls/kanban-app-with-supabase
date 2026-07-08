"use client"

import { Droppable } from "@hello-pangea/dnd"
import { Plus } from "lucide-react"
import type { Task, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/task-card"

const accentByStatus: Record<TaskStatus, string> = {
  pendiente: "bg-muted-foreground/40",
  en_proceso: "bg-primary",
  terminado: "bg-accent-foreground/70",
}

interface BoardColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  onAdd: (status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function BoardColumn({ status, title, tasks, onAdd, onEdit, onDelete }: BoardColumnProps) {
  return (
    <section className="flex w-full flex-col rounded-xl border border-border bg-secondary/60">
      <header className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accentByStatus[status]}`} aria-hidden />
          <h2 className="text-sm font-semibold text-secondary-foreground">{title}</h2>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => onAdd(status)}
          aria-label={`Agregar tarea a ${title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-24 flex-1 flex-col gap-2 p-3 transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/50" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                Sin tareas
              </p>
            ) : null}
          </div>
        )}
      </Droppable>
    </section>
  )
}
