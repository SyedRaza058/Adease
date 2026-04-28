"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/utils"

interface Screen {
  id: string
  title: string
  location: string
  type: string
  is_active: boolean
}

interface Advertisement {
  title: string
  screenId: string
  imageUrl: string
}

interface AddAdvertisementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void // no argument, just triggers refresh
  screens: Screen[]
}

export default function AddAdvertisementModal({ isOpen, onClose, onSubmit, screens }: AddAdvertisementModalProps) {
  const [title, setTitle] = useState("")
  const [selectedScreen, setSelectedScreen] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [duration, setDuration] = useState("10") // Default 10 seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})

  // Find the selected screen object for display
  const selectedScreenObj = screens.find(s => s.id === selectedScreen)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setImageFile(file)

    setUploadError(null)
    setIsUploading(true)

    const filePath = `ads/${Date.now()}_${file.name}`
    try {
      const { error } = await supabase.storage.from("adease").upload(filePath, file)
      if (error) {
        console.error("Failed to upload image:", error.message)
        throw error
      }
      const { data } = supabase.storage.from("adease").getPublicUrl(filePath)
      setImageUrl(data.publicUrl)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      setImageUrl("")
      setUploadError(
        "Upload failed. Make sure Storage bucket `adease` exists and your Storage policies allow uploads.",
      )
    }

    setIsUploading(false)
  }

  const removeImage = () => {
    setImageFile(null)
    setImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      alert("You must be signed in to create an advertisement.")
      return
    }
    if (isUploading) {
      alert("Please wait for the image upload to finish.")
      return
    }
    if (!imageUrl) {
      alert("Please upload at least one image.")
      return
    }
    setIsSubmitting(true)
    
    try {
      // Enforce one ad per screen: remove older ads first
      const { error: deleteError } = await supabase.from("adease_ads").delete().eq("screen_id", selectedScreen)
      if (deleteError) {
        console.error("Failed to replace existing ads:", deleteError.message)
        alert(`Failed to replace existing ads: ${deleteError.message}`)
        setIsSubmitting(false)
        return
      }

      const adToInsert: any = {
        title,
        screen_id: selectedScreen,
        image_url: imageUrl,
      }

      const durationValue = parseInt(duration)
      if (durationValue && durationValue > 0) {
        adToInsert.duration = durationValue
      }

      const { error } = await supabase.from("adease_ads").insert([adToInsert])
      
      if (error) {
        console.error("Failed to create advertisement:", error.message)
        alert(`Failed to create advertisement: ${error.message}`)
        setIsSubmitting(false)
        return
      }
      
      // Reset form
      setTitle("")
      setSelectedScreen("")
      setImageFile(null)
      setImageUrl("")
      setDuration("10")
      setIsSubmitting(false)
      onSubmit() // trigger parent to refresh ads
    } catch (error: any) {
      console.error("Error creating ads:", error)
      alert(`Error: ${error.message || "Failed to create advertisement"}`)
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("")
      setSelectedScreen("")
      setImageFile(null)
      setImageUrl("")
      setDuration("10")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {/* <DialogHeader>
          <DialogTitle>Add New Advertisement</DialogTitle>
          <DialogDescription>Create a new advertisement to display on your selected screen.</DialogDescription>
        </DialogHeader> */}

        {screens.length === 0 ? (
          <div className="text-center p-6">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No screens available</h3>
            <p className="mt-2 text-gray-500">You need to add at least one screen before creating advertisements.</p>
            {/* <Button asChild className="mt-4 bg-[#ED7614] hover:bg-orange-500 cursor-pointer" onClick={handleClose} >
              <a href="/dashboard/screens">Add Screen</a>
            </Button> */}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Advertisement Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this advertisement"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screen">Select Screen</Label>
                <Select value={selectedScreen} onValueChange={setSelectedScreen} required>
                  <SelectTrigger id="screen" className="w-full">
                    <SelectValue placeholder="Select a screen" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        <div className="flex items-center gap-2 w-full">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${screen.is_active ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="truncate">{screen.title}</span>
                          <span className="text-xs text-gray-500 truncate">({screen.location})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Advertisement Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!imageUrl}
                  disabled={isSubmitting || isUploading}
                />
                <p className="text-xs text-gray-500">Pick one image to upload.</p>

                {isUploading && (
                  <p className="text-xs text-blue-600">Uploading images…</p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600">{uploadError}</p>
                )}
                
                {imageUrl && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Uploaded Image</p>
                    <div className="relative group max-w-[260px]">
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Display Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="10"
                  required
                />
                <p className="text-xs text-gray-500">How long each ad should display (5-300 seconds)</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isUploading ? "Uploading..." : isSubmitting ? "Creating..." : "Create Advertisement"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
