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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [duration, setDuration] = useState("10") // Default 10 seconds
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})

  // Find the selected screen object for display
  const selectedScreenObj = screens.find(s => s.id === selectedScreen)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const newFiles = Array.from(files)
    setImageFiles(prev => [...prev, ...newFiles])
    
    // Upload all files
    const uploadPromises = newFiles.map(async (file, index) => {
      const fileIndex = imageFiles.length + index
      const filePath = `ads/${Date.now()}_${fileIndex}_${file.name}`
      
      try {
        const { error } = await supabase.storage.from('adease').upload(filePath, file)
        if (error) {
          console.error("Failed to upload image:", error.message)
          throw error
        }
        const { data } = supabase.storage.from('adease').getPublicUrl(filePath)
        return data.publicUrl
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        return null
      }
    })
    
    const uploadedUrls = await Promise.all(uploadPromises)
    const validUrls = uploadedUrls.filter(url => url !== null) as string[]
    setImageUrls(prev => [...prev, ...validUrls])
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrls.length === 0) {
      alert("Please upload at least one image.")
      return
    }
    setIsSubmitting(true)
    
    try {
      // Prepare ads data - one ad per image
      const adsToInsert = imageUrls.map((imageUrl, index) => {
        const adData: any = {
          title: imageUrls.length > 1 ? `${title} (${index + 1})` : title,
          screen_id: selectedScreen,
          image_url: imageUrl,
        }
        
        // Only add optional fields if they have values
        // This prevents errors if columns don't exist in database yet
        const durationValue = parseInt(duration)
        if (durationValue && durationValue > 0) {
          adData.duration = durationValue
        }
        
        if (startTime) {
          adData.start_time = startTime
        }
        
        if (endTime) {
          adData.end_time = endTime
        }
        
        // Note: display_order is not included to avoid errors if column doesn't exist
        // It can be added later via migration if needed
        
        return adData
      })
      
      // Insert all ads into Supabase
      const { error } = await supabase.from('adease_ads').insert(adsToInsert)
      
      if (error) {
        console.error("Failed to create advertisement:", error.message)
        alert(`Failed to create advertisement: ${error.message}`)
        setIsSubmitting(false)
        return
      }
      
      // Reset form
      setTitle("")
      setSelectedScreen("")
      setImageFiles([])
      setImageUrls([])
      setDuration("10")
      setStartTime("")
      setEndTime("")
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
      setImageFiles([])
      setImageUrls([])
      setDuration("10")
      setStartTime("")
      setEndTime("")
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
                <Label htmlFor="image">Advertisement Images (Multiple allowed)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  required={imageUrls.length === 0}
                />
                <p className="text-xs text-gray-500">Pick one or more images to upload. Each image will create a separate ad.</p>
                
                {imageUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Uploaded Images ({imageUrls.length})</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
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

              <div className="space-y-2">
                <Label htmlFor="startTime">Schedule Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <p className="text-xs text-gray-500">When should these ads start displaying? Leave empty for immediate start.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Schedule End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <p className="text-xs text-gray-500">When should these ads stop displaying? Leave empty for no end time.</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Advertisement"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
