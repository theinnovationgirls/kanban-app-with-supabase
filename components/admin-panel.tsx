"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, LogOut, Plus, Users } from "lucide-react"

function randomInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // sin caracteres ambiguos (0/O, 1/I)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function AdminPanel({ onSelectTeam }: { onSelectTeam: (team: Team) => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState("")
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const supabase = createClient()

  const loadTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false })
    setTeams((data as Team[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreating(true)

    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: newTeamName.trim(),
        invite_code: randomInviteCode(),
        created_by: userData.user?.id,
      })
      .select()
      .single()

    if (!error && data) {
      setTeams((prev) => [data as Team, ...prev])
      setNewTeamName("")
    }
    setCreating(false)
  }

  const handleCopy = (team: Team) => {
    navigator.clipboard.writeText(team.invite_code)
    setCopiedId(team.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 md:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
            Panel de equipos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá un equipo por grupo y compartí el código con las integrantes.
          </p>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="icon" aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <form
        onSubmit={handleCreateTeam}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="team-name">Nombre del equipo</Label>
          <Input
            id="team-name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Ej: Equipo A - 4to año"
          />
        </div>
        <Button type="submit" disabled={creating || !newTeamName.trim()} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear equipo
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no creaste ningún equipo. Empezá arriba ↑
        </p>
      ) : (
        <ul className="space-y-3">
          {teams.map((team) => (
            <li
              key={team.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-card-foreground">{team.name}</p>
                <button
                  onClick={() => handleCopy(team)}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-sm font-mono tracking-widest text-secondary-foreground hover:bg-secondary/80"
                >
                  {team.invite_code}
                  <Copy className="h-3.5 w-3.5" />
                  {copiedId === team.id ? (
                    <span className="text-xs font-sans normal-case tracking-normal text-primary">
                      ¡copiado!
                    </span>
                  ) : null}
                </button>
              </div>
              <Button
                onClick={() => onSelectTeam(team)}
                variant="outline"
                className="gap-2 self-start sm:self-auto"
              >
                <Users className="h-4 w-4" />
                Ver tablero
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
