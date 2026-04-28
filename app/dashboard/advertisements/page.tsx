"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import AddAdvertisementModal from "@/components/add-advertisement-modal"
import { supabase } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
  const [loadingScreens, setLoadingScreens] = useState(false)
  const router = useRouter()

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

  // Fetch advertisements from Supabase
  const fetchAdvertisements = async (screensList: Screen[] = screens) => {
    const { data, error } = await supabase
      .from('adease_ads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error("Failed to fetch advertisements:", error.message)
    } else if (data) {
      // Join with screens for display
      const adsWithScreen = data.map((ad: Advertisement) => {
        const screen = screensList.find((s) => s.id === ad.screen_id)
        return {
          ...ad,
          screenTitle: screen?.title || "Unknown Screen",
          screenStatus: screen?.is_active || false,
        }
      })
      // Defensive: if query ever returns duplicates, avoid duplicated rows in UI
      const uniqueAds = Array.from(new Map(adsWithScreen.map((ad) => [ad.id, ad])).values())
      setAdvertisements(uniqueAds)
    }
  }

  useEffect(() => {
    if (screens.length > 0) fetchAdvertisements()
  }, [screens])

  const handleAddAdvertisement = async () => {
    // Refresh ads (avoid double-fetch via screens effect)
    await fetchAdvertisements()
    setIsModalOpen(false)
  }

const deleteAdvertisement = async (adId: string) => {
  if (!confirm("Are you sure you want to delete this advertisement?")) {
    return
  }
  
  // Delete from Supabase
  const { error } = await supabase
    .from("adease_ads")
    .delete()
    .eq("id", adId)

  if (error) {
    console.error("Failed to delete ad:", error.message)
    alert("Failed to delete advertisement. Please try again.")
    return
  }

  // Update React state
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

  const handlePreview = async (ad:any) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advertisements</h1>
          <p className="text-gray-600 mt-1">Manage advertisements across all your screens</p>
        </div>
        <Button onClick={async () => {
          // Refresh screens before opening modal to get latest screens
          await fetchScreens()
          setIsModalOpen(true)
        }} className="flex items-center gap-2 bg-[#ED7614] hover:bg-orange-500 cursor-pointer">
          <Plus size={16} />
          Add Advertisement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advertisements</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advertisements.length}</div>
            <p className="text-xs text-muted-foreground">Across {screens.length} screens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Screen Ads</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advertisements.filter((ad) => ad.screenStatus).length}</div>
            <p className="text-xs text-muted-foreground">On active screens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Screens with Ads</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(advertisements.map((ad) => ad.screen_id)).size}</div>
            <p className="text-xs text-muted-foreground">Out of {screens.length} total screens</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            All Advertisements ({advertisements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {advertisements.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No advertisements created yet</h3>
              <p className="mt-2 text-gray-500">Create your first advertisement to display on your screens.</p>
              <Button onClick={async () => {
                await fetchScreens()
                setIsModalOpen(true)
              }} className="mt-4 bg-[#ED7614] hover:bg-orange-500 cursor-pointer">
                <Plus size={16} className="mr-2" />
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
                      <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={ad.image_url || "/placeholder.svg"}
                          alt={ad.title}
                          className="w-full h-full object-cover"
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
                        <span className="text-sm text-gray-500">
                          {getAdvertisementsByScreen(ad.screen_id).length} ads on this screen
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-gray-500">
                      {(ad.duration && ad.duration > 0) ? `${ad.duration}s` : '10s (default)'}
                    </TableCell>

                    <TableCell className="text-gray-500">{formatDate(ad.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handlePreview(ad)}>
                          <Eye size={14} />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handleCopy(ad)}>
                          <Edit size={14} />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAdvertisement(ad.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
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

      {/* Advertisements by Screen */}
      {/* {screens.length > 0 && advertisements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Advertisements by Screen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {screens.map((screen) => {
                const screenAds = getAdvertisementsByScreen(screen.id)
                return (
                  <div key={screen.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${screen.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <h4 className="font-medium">{screen.title}</h4>
                          <p className="text-sm text-gray-500">{screen.location}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{screenAds.length} advertisements</Badge>
                    </div>
                    {screenAds.length > 0 ? (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {screenAds.map((ad) => (
                          <div key={ad.id} className="flex items-center gap-3 p-2 border rounded-md">
                            <div className="w-12 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={ad.image_url || "/placeholder.svg"}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=32&width=48"
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ad.title}</p>
                              <p className="text-xs text-gray-500">{formatDate(ad.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No advertisements on this screen</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )} */}

      <AddAdvertisementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAdvertisement}
        screens={screens}
      />
    </div>
  )
}
