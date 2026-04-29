"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { ImageIcon, Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/utils"

interface Screen {
  id: string
  title: string
  location: string
  type: string
  is_active?: boolean
}

interface AdItem {
  id: string
  file: File
  previewUrl: string
  title: string
  duration: string
}

interface AddAdvertisementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  screens: Screen[]
}

export default function AddAdvertisementModal({ isOpen, onClose, onSubmit, screens }: AddAdvertisementModalProps) {
  const [selectedScreen, setSelectedScreen] = useState("")
  const [adItems, setAdItems] = useState<AdItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    const newItems: AdItem[] = imageFiles.map((file) => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ""),
      duration: "10",
    }))
    setAdItems((prev) => [...prev, ...newItems])
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const removeItem = (id: string) => {
    setAdItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  const updateItem = (id: string, field: "title" | "duration", value: string) => {
    setAdItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const clearAll = () => {
    adItems.forEach((i) => URL.revokeObjectURL(i.previewUrl))
    setAdItems([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScreen) { alert("Please select a screen."); return }
    if (adItems.length === 0) { alert("Please add at least one image."); return }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      alert("You must be signed in to create an advertisement.")
      return
    }

    setIsSubmitting(true)

    // Upload all files to storage
    const uploadResults = await Promise.all(
      adItems.map(async (item) => {
        const filePath = `ads/${Date.now()}_${Math.random().toString(36).slice(2)}_${item.file.name}`
        try {
          const { error } = await supabase.storage.from("adease").upload(filePath, item.file)
          if (error) throw error
          const { data } = supabase.storage.from("adease").getPublicUrl(filePath)
          return { item, url: data.publicUrl, error: null }
        } catch (err) {
          return { item, url: null, error: err }
        }
      })
    )

    const failed = uploadResults.filter((r) => !r.url)
    if (failed.length > 0) {
      alert(`${failed.length} image(s) failed to upload. Please try again.`)
      setIsSubmitting(false)
      return
    }

    const adsToInsert = uploadResults.map(({ item, url }) => ({
      title: item.title.trim() || item.file.name,
      screen_id: selectedScreen,
      image_url: url!,
      duration: Math.max(5, parseInt(item.duration, 10) || 10),
    }))

    const { error } = await supabase.from("adease_ads").insert(adsToInsert)
    if (error) {
      alert(`Failed to save advertisements: ${error.message}`)
      setIsSubmitting(false)
      return
    }

    adItems.forEach((i) => URL.revokeObjectURL(i.previewUrl))
    setAdItems([])
    setSelectedScreen("")
    setIsSubmitting(false)
    onSubmit()
  }

  const handleClose = () => {
    if (isSubmitting) return
    clearAll()
    setSelectedScreen("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Advertisements</DialogTitle>
        </DialogHeader>

        {screens.length === 0 ? (
          <div className="py-6 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-75" />
            <h3 className="mt-2 text-sm font-medium">No screens available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one screen before creating advertisements.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden">
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Screen selector */}
              <div className="space-y-2">
                <Label>Select Screen</Label>
                <Select value={selectedScreen} onValueChange={setSelectedScreen}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a screen" />
                  </SelectTrigger>
                  <SelectContent>
                    {screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              screen.is_active ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span>{screen.title}</span>
                          <span className="text-xs text-muted-foreground">({screen.location})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drop zone */}
              <div
                className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer select-none
                  ${
                    isDragging
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                      : "border-muted-foreground/25 hover:border-orange-400/50 hover:bg-muted/40"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop images here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select multiple images — each becomes a separate ad that plays in sequence
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 pointer-events-none"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Choose Files
                </Button>
              </div>

              {/* Queued ad cards */}
              {adItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {adItems.length} ad{adItems.length !== 1 ? "s" : ""} queued
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:text-red-600"
                      onClick={clearAll}
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {adItems.map((item, idx) => (
                      <div key={item.id} className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                        {/* Thumbnail */}
                        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                        </div>

                        {/* Fields */}
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{idx + 1}.</span>
                            <Input
                              value={item.title}
                              onChange={(e) => updateItem(item.id, "title", e.target.value)}
                              placeholder="Ad title"
                              className="h-7 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Duration</span>
                            <Input
                              type="number"
                              min="5"
                              max="300"
                              value={item.duration}
                              onChange={(e) => updateItem(item.id, "duration", e.target.value)}
                              className="h-7 w-20 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">seconds</span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex-shrink-0 self-start text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#ED7614] hover:bg-orange-500"
                disabled={isSubmitting || adItems.length === 0 || !selectedScreen}
              >
                {isSubmitting
                  ? "Uploading & Saving..."
                  : `Add ${adItems.length > 0 ? adItems.length + " " : ""}Ad${adItems.length !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
