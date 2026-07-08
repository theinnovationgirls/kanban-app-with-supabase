"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinTeamForm({ onJoined }: { onJoined: (teamId: string) => void }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.rpc("join_team", { code: code.trim() })

    if (error) {
      setError(
        error.message.includes("inválido")
          ? "Ese código no corresponde a ningún equipo. Fijate que esté bien escrito."
          : "Algo salió mal, probá de nuevo.",
      )
      setLoading(false)
      return
    }

    onJoined(data as string)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-card-foreground">
            ¡Casi listo!
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            Pedile a tu profe el código de tu equipo e ingresalo acá abajo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Código de equipo</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: A3F7K2"
              className="text-center text-lg tracking-widest uppercase"
              maxLength={8}
              autoFocus
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={loading || !code.trim()} className="w-full">
            {loading ? "Entrando..." : "Entrar al equipo"}
          </Button>
        </form>
      </div>
    </main>
  )
}
