"use client"

import { useState, useEffect, useCallback } from "react"
import { ImageIcon, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  screenStatus: boolean
}

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<AdvertisementWithScreen[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, setLoadingScreens] = useState(false)

  // Fetch screens from Supabase
  const fetchScreens = async () => {
    setLoadingScreens(true)
    const { data, error } = await supabase
      .from('adease_screens')
      .select('*')
      .order('created_at', { ascending: false })
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
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Failed to fetch advertisements:", error.message)
    } else if (data) {
      const adsWithScreen = data.map((ad: Advertisement) => {
        const screen = screensList.find((s) => s.id === ad.screen_id)
        return {
          ...ad,
          screenTitle: screen?.title || "Unknown Screen",
          screenStatus: screen?.is_active || false,
        }
      })
      const uniqueAds = Array.from(new Map(adsWithScreen.map((ad) => [ad.id, ad])).values())
      setAdvertisements(uniqueAds)
    }
  }, [])

  useEffect(() => {
    if (screens.length > 0) void fetchAdvertisements(screens)
  }, [screens, fetchAdvertisements])

  const handleAddAdvertisement = async () => {
    await fetchAdvertisements(screens)
    setIsModalOpen(false)
  }

  const deleteAdvertisement = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) {
      return
    }

    const { error } = await supabase.from("adease_ads").delete().eq("id", adId)

    if (error) {
      console.error("Failed to delete ad:", error.message)
      alert("Failed to delete advertisement. Please try again.")
      return
    }

    const updatedAds = advertisements.filter((ad) => ad.id !== adId)
    setAdvertisements(updatedAds)
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

  const getAdvertisementsByScreen = (screenId: string) => {
    return advertisements.filter((ad) => ad.screen_id === screenId)
  }

  const handlePreview = async (ad: AdvertisementWithScreen) => {
    // Refresh screens to ensure we have the latest data
    const { data: screensData, error } = await supabase
      .from('adease_screens')
      .select('*')
      .eq('id', ad.screen_id)
      .single()
    
    if (error || !screensData) {
      alert('Screen not found for this advertisement. Please refresh the page.')
      return
    }
    
    if(!screensData.is_active) {
      alert('Screen is not Active')
      return
    }
    // Use screen_id instead of ad_id to show all ads for the screen
    window.open(`/ad/${ad.screen_id}`, "_blank")
  }
  const handleCopy = (ad: AdvertisementWithScreen) => {
    // Copy the screen preview URL (shows all ads for that screen)
    const url = `${window.location.origin}/ad/${ad.screen_id}`
    navigator.clipboard.writeText(url)
    alert("Screen preview link copied to clipboard!")
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Advertisements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage advertisements across all your screens</p>
        </div>
        <Button
          onClick={async () => {
            await fetchScreens()
            setIsModalOpen(true)
          }}
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
            <div className="text-lg font-bold tabular-nums">
              {new Set(advertisements.map((ad) => ad.screen_id)).size}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Out of {screens.length} total screens</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            All Advertisements ({advertisements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {advertisements.length === 0 ? (
            <div className="py-6 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-75" />
              <h3 className="mt-2 text-sm font-medium">No advertisements created yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first advertisement to display on your screens.
              </p>
              <Button
                onClick={async () => {
                  await fetchScreens()
                  setIsModalOpen(true)
                }}
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
                  <TableHead>Title</TableHead>
                  <TableHead>Screen</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="h-10 w-16 overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic remote ad URLs */}
                        <img
                          src={ad.image_url || "/placeholder.svg"}
                          alt={ad.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=40&width=64"
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ad.screenTitle}</span>
                        <span className="text-sm text-muted-foreground">
                          {getAdvertisementsByScreen(ad.screen_id).length} ads on this screen
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {(ad.duration && ad.duration > 0) ? `${ad.duration}s` : '10s (default)'}
                    </TableCell>

                    <TableCell className="text-muted-foreground">{formatDate(ad.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="-mr-2 flex flex-wrap items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handlePreview(ad)}>
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handleCopy(ad)}>
                          <Edit className="h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAdvertisement(ad.id)}
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

      <AddAdvertisementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAdvertisement}
        screens={screens}
      />
    </div>
  )
}
