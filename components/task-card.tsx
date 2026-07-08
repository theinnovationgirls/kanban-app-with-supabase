"use client"

import { Draggable } from "@hello-pangea/dnd"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface TaskCardProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-ring" : "hover:shadow-md"
          }`}
        >
          <div className="flex items-start gap-2">
            <button
              {...provided.dragHandleProps}
              aria-label="Arrastrar tarea"
              className="mt-0.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h3 className="text-pretty text-sm font-medium leading-snug text-card-foreground">
                {task.title}
              </h3>
              {task.description ? (
                <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {task.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => onEdit(task)}
              aria-label="Editar tarea"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(task.id)}
              aria-label="Eliminar tarea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  )
}
