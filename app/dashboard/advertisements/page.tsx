"use client"

import { useState, useEffect, useCallback } from "react"
import { ImageIcon, Plus, Eye, Link2, Trash2, Clock, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import AddAdvertisementModal from "@/components/add-advertisement-modal"
import { supabase } from "@/lib/utils"

interface Screen {
  id: string
  title: string
  location: string
  type: string
  is_active?: boolean
}

interface Advertisement {
  id: string
  title: string
  screen_id: string
  image_url: string
  duration: number
  created_at: string
}

interface AdvertisementWithScreen extends Advertisement {
  screenTitle: string
  screenLocation: string
  screenStatus: boolean
}

interface ScreenGroup {
  screenId: string
  screenTitle: string
  screenLocation: string
  screenStatus: boolean
  ads: AdvertisementWithScreen[]
  totalDuration: number
}

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<AdvertisementWithScreen[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, setLoadingScreens] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ScreenGroup | null>(null)

  const fetchScreens = async () => {
    setLoadingScreens(true)
    const { data, error } = await supabase
      .from("adease_screens")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Failed to fetch screens:", error.message)
    } else if (data) {
      setScreens(data as Screen[])
    }
    setLoadingScreens(false)
  }

  useEffect(() => {
    fetchScreens()
  }, [])

  const fetchAdvertisements = useCallback(async (screensList: Screen[]) => {
    const { data, error } = await supabase
      .from("adease_ads")
      .select("*")
      .order("created_at", { ascending: true })
    if (error) {
      console.error("Failed to fetch advertisements:", error.message)
    } else if (data) {
      const adsWithScreen = data.map((ad: Advertisement) => {
        const screen = screensList.find((s) => s.id === ad.screen_id)
        return {
          ...ad,
          screenTitle: screen?.title || "Unknown Screen",
          screenLocation: screen?.location || "",
          screenStatus: screen?.is_active || false,
        }
      })
      setAdvertisements(adsWithScreen)
    }
  }, [])

  useEffect(() => {
    if (screens.length > 0) void fetchAdvertisements(screens)
  }, [screens, fetchAdvertisements])

  // Group ads by screen
  const screenGroups: ScreenGroup[] = Object.values(
    advertisements.reduce<Record<string, ScreenGroup>>((acc, ad) => {
      if (!acc[ad.screen_id]) {
        acc[ad.screen_id] = {
          screenId: ad.screen_id,
          screenTitle: ad.screenTitle,
          screenLocation: ad.screenLocation,
          screenStatus: ad.screenStatus,
          ads: [],
          totalDuration: 0,
        }
      }
      acc[ad.screen_id].ads.push(ad)
      acc[ad.screen_id].totalDuration += ad.duration > 0 ? ad.duration : 10
      return acc
    }, {})
  )

  const handleAddAdvertisement = async () => {
    await fetchAdvertisements(screens)
    setIsModalOpen(false)
    // Refresh selected group if open
    setSelectedGroup(null)
  }

  const deleteAllAdsForScreen = async (screenId: string, screenTitle: string) => {
    if (!confirm(`Delete all advertisements for "${screenTitle}"? This cannot be undone.`)) return
    const { error } = await supabase.from("adease_ads").delete().eq("screen_id", screenId)
    if (error) {
      alert("Failed to delete advertisements. Please try again.")
      return
    }
    setAdvertisements((prev) => prev.filter((ad) => ad.screen_id !== screenId))
    setSelectedGroup(null)
  }

  const deleteSingleAd = async (adId: string) => {
    if (!confirm("Delete this ad?")) return
    const { error } = await supabase.from("adease_ads").delete().eq("id", adId)
    if (error) { alert("Failed to delete ad."); return }
    setAdvertisements((prev) => prev.filter((ad) => ad.id !== adId))
    // Update selected group
    setSelectedGroup((prev) => {
      if (!prev) return null
      const updatedAds = prev.ads.filter((ad) => ad.id !== adId)
      if (updatedAds.length === 0) return null
      return {
        ...prev,
        ads: updatedAds,
        totalDuration: updatedAds.reduce((sum, ad) => sum + (ad.duration > 0 ? ad.duration : 10), 0),
      }
    })
  }

  const handlePreview = async (screenId: string, screenStatus: boolean) => {
    if (!screenStatus) { alert("Screen is not Active"); return }

    const url = `${window.location.origin}/ad/${screenId}`

    // Default to right-side secondary monitor (primary width = start of secondary)
    let x = window.screen.width, y = 0
    let width = window.screen.width, height = window.screen.height

    // Window Management API gives exact per-display coordinates (Chrome 100+, works on localhost)
    if ("getScreenDetails" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = await (window as any).getScreenDetails()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sec = details.screens.find((s: any) => !s.isPrimary)
        if (sec) { x = sec.left; y = sec.top; width = sec.width; height = sec.height }
      } catch {
        // Permission denied — use offset fallback above
      }
    }

    // Server-side exec: Next.js runs on the same Windows machine so Chrome launches locally
    await fetch("/api/launch-display", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, x, y, width, height }),
    })
  }

  const handleCopyLink = async (screenId: string) => {
    const url = `${window.location.origin}/ad/${screenId}`
    try {
      await navigator.clipboard.writeText(url)
      alert("Screen preview link copied to clipboard!")
    } catch {
      // Fallback for HTTP or browsers that block clipboard API
      const textarea = document.createElement("textarea")
      textarea.value = url
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        document.execCommand("copy")
        alert("Screen preview link copied to clipboard!")
      } catch {
        alert(`Could not copy automatically. Please copy this link manually:\n\n${url}`)
      }
      document.body.removeChild(textarea)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Advertisements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage advertisements across all your screens</p>
        </div>
        <Button
          onClick={async () => { await fetchScreens(); setIsModalOpen(true) }}
          className="shrink-0 bg-[#ED7614] hover:bg-orange-500 cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Advertisement
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Advertisements</CardTitle>
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg font-bold tabular-nums">{advertisements.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">Across {screens.length} screens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Active Screen Ads</CardTitle>
            <div className="h-4 w-4 shrink-0 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg font-bold tabular-nums">
              {advertisements.filter((ad) => ad.screenStatus).length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">On active screens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
            <CardTitle className="text-sm font-normal text-muted-foreground">Screens with Ads</CardTitle>
            <div className="h-4 w-4 shrink-0 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg font-bold tabular-nums">{screenGroups.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">Out of {screens.length} total screens</p>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Table */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            All Advertisements ({screenGroups.length} screen{screenGroups.length !== 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {screenGroups.length === 0 ? (
            <div className="py-6 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-75" />
              <h3 className="mt-2 text-sm font-medium">No advertisements created yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first advertisement to display on your screens.
              </p>
              <Button
                onClick={async () => { await fetchScreens(); setIsModalOpen(true) }}
                className="mt-4 bg-[#ED7614] hover:bg-orange-500 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Advertisement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Screen</TableHead>
                  <TableHead>Ads</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screenGroups.map((group) => (
                  <TableRow
                    key={group.screenId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedGroup(group)}
                  >
                    {/* Stacked thumbnails */}
                    <TableCell>
                      <div className="relative h-10 w-16">
                        {group.ads.slice(0, 3).map((ad, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={ad.id}
                            src={ad.image_url || "/placeholder.svg"}
                            alt={ad.title}
                            className="absolute h-10 w-16 rounded-md object-cover border-2 border-background"
                            style={{ left: i * 6, zIndex: 3 - i, opacity: 1 - i * 0.2 }}
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                          />
                        ))}
                        {group.ads.length > 3 && (
                          <div
                            className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#ED7614] text-[10px] font-bold text-white"
                            style={{ zIndex: 10 }}
                          >
                            +{group.ads.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Screen info */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              group.screenStatus ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="font-medium">{group.screenTitle}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-3.5">{group.screenLocation}</span>
                      </div>
                    </TableCell>

                    {/* Ad count */}
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {group.ads.length} ad{group.ads.length !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>

                    {/* Total duration */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm">{formatDuration(group.totalDuration)} loop</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="-mr-2 flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handlePreview(group.screenId, group.screenStatus)}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleCopyLink(group.screenId)}
                        >
                          <Link2 className="h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          onClick={() => deleteAllAdsForScreen(group.screenId, group.screenTitle)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete All
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => { if (!open) setSelectedGroup(null) }}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      selectedGroup?.screenStatus ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {selectedGroup?.screenTitle}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedGroup?.ads.length} ad{selectedGroup?.ads.length !== 1 ? "s" : ""} &middot;{" "}
                  {selectedGroup && formatDuration(selectedGroup.totalDuration)} total loop
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedGroup && handleCopyLink(selectedGroup.screenId)}
                >
                  <Link2 className="mr-1 h-3.5 w-3.5" />
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  className="bg-[#ED7614] hover:bg-orange-500"
                  onClick={() =>
                    selectedGroup && handlePreview(selectedGroup.screenId, selectedGroup.screenStatus)
                  }
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 mt-2 space-y-2 pr-1">
            {selectedGroup?.ads.map((ad, idx) => (
              <div key={ad.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                {/* Order */}
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </div>

                {/* Thumbnail */}
                <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.image_url || "/placeholder.svg"}
                    alt={ad.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <p className="truncate font-medium text-sm">{ad.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{ad.duration > 0 ? ad.duration : 10}s display time</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(ad.created_at)}</p>
                </div>

                {/* Delete single ad */}
                <button
                  type="button"
                  onClick={() => deleteSingleAd(ad.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove this ad"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() =>
                selectedGroup &&
                deleteAllAdsForScreen(selectedGroup.screenId, selectedGroup.screenTitle)
              }
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete All Ads
            </Button>
            <p className="text-xs text-muted-foreground">
              Ads play in order shown above, then loop
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AddAdvertisementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAdvertisement}
        screens={screens}
      />
    </div>
  )
}
