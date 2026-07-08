"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Team } from "@/lib/types"
import { JoinTeamForm } from "@/components/join-team-form"
import { AdminPanel } from "@/components/admin-panel"
import { KanbanBoard } from "@/components/kanban-board"

type Status =
  | { kind: "loading" }
  | { kind: "join" }
  | { kind: "admin-menu" }
  | { kind: "board"; team: Team; isAdminViewing: boolean }

export function TeamGate() {
  const supabase = createClient()
  const [status, setStatus] = useState<Status>({ kind: "loading" })

  const bootstrap = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return // el middleware ya redirige a /auth/login

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    const profile = profileData as Profile | null

    if (profile?.is_admin) {
      setStatus({ kind: "admin-menu" })
      return
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    const team = (membership as unknown as { teams: Team } | null)?.teams
    if (team) {
      setStatus({ kind: "board", team, isAdminViewing: false })
    } else {
      setStatus({ kind: "join" })
    }
  }

  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
      </div>
    )
  }

  if (status.kind === "join") {
    return <JoinTeamForm onJoined={() => bootstrap()} />
  }

  if (status.kind === "admin-menu") {
    return (
      <AdminPanel
        onSelectTeam={(team) => setStatus({ kind: "board", team, isAdminViewing: true })}
      />
    )
  }

  return (
    <KanbanBoard
      teamId={status.team.id}
      teamName={status.team.name}
      onBack={status.isAdminViewing ? () => setStatus({ kind: "admin-menu" }) : undefined}
    />
  )
}
