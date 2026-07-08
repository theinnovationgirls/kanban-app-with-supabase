"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import { LogOut, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { COLUMNS, type Task, type TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { BoardColumn } from "@/components/board-column"
import { TaskDialog } from "@/components/task-dialog"

export function KanbanBoard() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("pendiente")
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setUserEmail(data.user?.email ?? null)
    })
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true })
    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadTasks()
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        loadTasks()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadTasks])

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      pendiente: [],
      en_proceso: [],
      terminado: [],
    }
    for (const task of tasks) map[task.status]?.push(task)
    for (const status of Object.keys(map) as TaskStatus[]) {
      map[status].sort((a, b) => a.position - b.position)
    }
    return map
  }, [tasks])

  const openCreate = (status: TaskStatus) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleSubmit = async ({ title, description }: { title: string; description: string }) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, title, description } : t)),
      )
      await supabase.from("tasks").update({ title, description }).eq("id", editingTask.id)
    } else {
      if (!userId) return
      const position = tasksByStatus[defaultStatus].length
      const { data } = await supabase
        .from("tasks")
        .insert({ title, description, status: defaultStatus, position, user_id: userId })
        .select()
        .single()
      if (data) setTasks((prev) => [...prev, data as Task])
    }
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from("tasks").delete().eq("id", id)
  }

  const persistColumn = async (status: TaskStatus, columnTasks: Task[]) => {
    await Promise.all(
      columnTasks.map((task, index) =>
        supabase.from("tasks").update({ status, position: index }).eq("id", task.id),
      ),
    )
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const fromStatus = source.droppableId as TaskStatus
    const toStatus = destination.droppableId as TaskStatus

    const source_ = [...tasksByStatus[fromStatus]]
    const [moved] = source_.splice(source.index, 1)
    if (!moved) return

    if (fromStatus === toStatus) {
      source_.splice(destination.index, 0, moved)
      const reindexed = source_.map((t, i) => ({ ...t, position: i }))
      setTasks((prev) =>
        prev.map((t) => reindexed.find((r) => r.id === t.id) ?? t),
      )
      await persistColumn(toStatus, reindexed)
    } else {
      const dest = [...tasksByStatus[toStatus]]
      const updatedMoved = { ...moved, status: toStatus }
      dest.splice(destination.index, 0, updatedMoved)
      const reindexedSource = source_.map((t, i) => ({ ...t, position: i }))
      const reindexedDest = dest.map((t, i) => ({ ...t, position: i }))
      const merged = [...reindexedSource, ...reindexedDest]
      setTasks((prev) => prev.map((t) => merged.find((r) => r.id === t.id) ?? t))
      await Promise.all([
        persistColumn(fromStatus, reindexedSource),
        persistColumn(toStatus, reindexedDest),
      ])
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 md:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
            Tablero Kanban
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra las tarjetas para organizar tu flujo de trabajo.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {userEmail ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
          ) : null}
          <Button onClick={() => openCreate("pendiente")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="icon"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.id} className="h-64 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid flex-1 items-start gap-4 md:grid-cols-3">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                status={column.id}
                title={column.title}
                tasks={tasksByStatus[column.id]}
                onAdd={openCreate}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
