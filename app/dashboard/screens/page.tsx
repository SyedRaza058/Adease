"use client"

import { useState, useEffect } from "react"
import { Monitor, Plus, Power, PowerOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import AddScreenModal from "@/components/add-screen-modal"
import { supabase } from "@/lib/utils"

interface Screen {
  id: string
  is_active: boolean
  title: string
  location: string
  type: string
  created_at: string
}

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch screens from Supabase
  useEffect(() => {
    const fetchScreens = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("adease_screens")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("Failed to fetch screens:", error.message)
        alert("Failed to load screens. Please refresh the page.")
      } else if (data) {
        setScreens(data as Screen[])
      }
      setLoading(false)
    }
    fetchScreens()
  }, [])

  // Add screen handler
  const handleAddScreen = async (screen: Omit<Screen, "id" | "created_at">) => {
    setLoading(true)
    const { error } = await supabase.from("adease_screens").insert([screen])
    if (error) {
      console.error("Failed to add screen:", error.message)
      alert("Failed to add screen. Please try again.")
      setLoading(false)
      return
    }
    // Refresh list
    const { data } = await supabase
      .from("adease_screens")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) {
      setScreens(data as Screen[])
      setIsModalOpen(false)
    }
    setLoading(false)
  }

  // Toggle status handler
  const toggleScreenStatus = async (screenId: string) => {
    const screen = screens.find((s) => s.id === screenId)
    if (!screen) return
    setLoading(true)
    const { error } = await supabase.from("adease_screens").update({ is_active: !screen.is_active }).eq("id", screenId)
    if (error) {
      console.error("Failed to update screen status:", error.message)
      alert("Failed to update screen status. Please try again.")
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from("adease_screens")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) {
      setScreens(data as Screen[])
    }
    setLoading(false)
  }

  // Delete handler
  const deleteScreen = async (screenId: string) => {
    if (!confirm("Are you sure you want to delete this screen?")) {
      return
    }
    setLoading(true)
    const { error } = await supabase.from("adease_screens").delete().eq("id", screenId)
    if (error) {
      console.error("Failed to delete screen:", error.message)
      alert("Failed to delete screen. Please try again.")
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from("adease_screens")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) {
      setScreens(data as Screen[])
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Screens</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your digital screens and their status</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 bg-[#ED7614] hover:bg-orange-500 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Screen
        </Button>
      </header>

      <Card className="gap-0 overflow-hidden p-0">
        <CardHeader className="flex flex-row items-center border-b border-white/15 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold leading-tight">
            <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
            All Screens ({screens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-3">
          {loading ? (
            <div className="py-10 text-center">
              <Monitor className="mx-auto h-8 w-8 text-muted-foreground opacity-75" />
              <h3 className="mt-2 text-sm font-medium">Loading screens...</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please wait while we fetch the screens.</p>
            </div>
          ) : screens.length === 0 ? (
            <div className="py-10 text-center">
              <Monitor className="mx-auto h-8 w-8 text-muted-foreground opacity-75" />
              <h3 className="mt-2 text-sm font-medium">No screens added yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first screen.</p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-4 bg-[#ED7614] hover:bg-orange-500 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Screen
              </Button>
            </div>
          ) : (
            <Table className="table-fixed">
              <colgroup>
                <col className="w-[132px]" />
                <col />
                <col className="w-[12rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[11.5rem]" />
                <col className="w-[15.5rem]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="align-middle">
                    Status
                  </TableHead>
                  <TableHead scope="col">Title</TableHead>
                  <TableHead scope="col">Location</TableHead>
                  <TableHead scope="col">Type</TableHead>
                  <TableHead scope="col" className="align-middle whitespace-nowrap">
                    Created
                  </TableHead>
                  <TableHead scope="col" className="text-end align-middle whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screens.map((screen) => (
                  <TableRow key={screen.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {screen.is_active ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={screen.is_active ? "default" : "secondary"}>
                          {screen.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{screen.title}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{screen.location}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{screen.type}</TableCell>
                    <TableCell className="whitespace-nowrap align-middle tabular-nums leading-normal text-muted-foreground">
                      {formatDate(screen.created_at)}
                    </TableCell>
                    <TableCell className="text-end align-middle">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScreenStatus(screen.id)}
                          className="flex items-center gap-1"
                        >
                          {screen.is_active ? (
                            <>
                              <PowerOff className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteScreen(screen.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddScreenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddScreen} />
    </div>
  )
}
