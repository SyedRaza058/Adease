"use client"

import type React from "react"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// Data we need to add a screen
interface Screen {
  title: string
  location: string
  type: string
  is_active: boolean
}

interface AddScreenModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (screen: Omit<Screen, 'id' | 'created_at'>) => Promise<void>
}

export default function AddScreenModal({ isOpen, onClose, onSubmit }: AddScreenModalProps) {
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [type, setType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onSubmit({ title, location, type, is_active: false })
    setTitle("")
    setLocation("")
    setType("")
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("")
      setLocation("")
      setType("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Screen</DialogTitle>
          <DialogDescription>Enter the details for the new screen you want to add to your network.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Screen Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this screen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex space-x-2">
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter Location"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Screen Type</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select a screen type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Landscape", "Portrait"].map((screenType) => (
                      <SelectItem key={screenType} value={screenType}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full`} />
                          <span>{screenType}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>

            <Button  type="submit" disabled={isSubmitting} className="bg-[#ED7614] hover:bg-orange-500 cursor-pointer" >
              {isSubmitting ? "Adding..." : "Add Screen " } 
            </Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
