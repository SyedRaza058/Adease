"use client"

import { useState, useEffect } from "react"
import { Monitor, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { supabase } from "@/lib/utils"

// This would come from a database in a real application
interface Screen {
  id: string
  macAddress: string
  title: string
  location?: string
  createdAt: string
  created_at?: string
  isActive: boolean
  is_active?: boolean
}

export default function Dashboard() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [, setLoading] = useState(false)

  useEffect(() => {
    const fetchScreens = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("adease_screens")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch screens:", error.message)
      } else if (data) {
        setScreens(data)
      }
      setLoading(false)
    }
    fetchScreens()
  }, [])

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Screens and advertisements at a glance.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Screens</CardTitle>
            <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg font-bold tabular-nums">{screens.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {screens.filter((s) => s.is_active).length} active, {screens.filter((s) => !s.is_active).length}{" "}
              inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Active Screens</CardTitle>
            <div className="h-4 w-4 shrink-0 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg font-bold tabular-nums">{screens.filter((s) => s.is_active).length}</div>
            <p className="mt-1 text-sm text-muted-foreground">Currently displaying content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Quick Actions</CardTitle>
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Button asChild className="w-full bg-[#ED7614] hover:bg-orange-500 cursor-pointer">
              <Link href="/dashboard/screens">
                <Monitor className="mr-2 h-4 w-4" />
                Manage Screens
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/advertisements">
                <Plus className="mr-2 h-4 w-4" />
                Add Advertisement
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {screens.length > 0 && (
        <Card>
          <CardHeader className="pb-0 pt-1">
            <CardTitle className="text-base font-semibold">Recent Screens</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {screens.slice(0, 5).map((screen) => (
                <div key={screen.id} className="flex items-start justify-between gap-3 rounded-lg border p-2.5">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    {screen.is_active ? (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    ) : (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{screen.title}</p>
                      <p className="text-sm text-muted-foreground">{screen.location ?? "—"}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                    {new Date(screen.created_at ?? screen.createdAt ?? 0).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            {screens.length > 5 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/screens">View All Screens</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
