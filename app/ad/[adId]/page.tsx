"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/utils"

interface Ad {
  id: string
  title: string
  image_url: string
  screen_id: string
  duration: number
  start_time?: string
  end_time?: string
  created_at: string
}

export default function AdPreviewPage() {
  const params = useParams()
  const screenId = params?.adId as string // Actually screen_id now
  const [ads, setAds] = useState<Ad[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("adease_ads")
        .select("*")
        .eq("screen_id", screenId)
        .order("created_at", { ascending: true })
      
      if (!error && data && data.length > 0) {
        // Filter ads based on schedule (if start_time/end_time exist)
        const now = new Date()
        const activeAds = data.filter((ad: Ad) => {
          // If no schedule, always show
          if (!ad.start_time && !ad.end_time) return true
          
          const startTime = ad.start_time ? new Date(ad.start_time) : null
          const endTime = ad.end_time ? new Date(ad.end_time) : null
          
          // Check if current time is within schedule
          if (startTime && now < startTime) return false
          if (endTime && now > endTime) return false
          
          return true
        })
        
        setAds(activeAds as Ad[])
      }
      setLoading(false)
    }

    if (screenId) fetchAds()
  }, [screenId])

  // Rotate ads based on duration
  useEffect(() => {
    if (ads.length === 0) return

    const currentAd = ads[currentAdIndex]
    if (!currentAd) return

    // Handle both old ads (no duration) and new ads (with duration)
    const duration = ((currentAd.duration && currentAd.duration > 0) ? currentAd.duration : 10) * 1000 // Convert to milliseconds

    const timer = setTimeout(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length)
    }, duration)

    return () => clearTimeout(timer)
  }, [ads, currentAdIndex])

  if (loading)
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white text-xl">
        Loading...
      </div>
    )

  if (ads.length === 0)
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-red-500 text-xl">
        No ads found for this screen.
      </div>
    )

  const currentAd = ads[currentAdIndex]

  return (
    <div className="fixed inset-0 m-0 p-0 w-screen h-screen bg-black overflow-hidden">
      <img
        key={currentAd.id} // Key forces re-render on change
        src={currentAd.image_url || "/placeholder.svg"}
        alt={currentAd.title}
        className="w-full h-full object-contain md:object-contain transition-opacity duration-500"
      />
    </div>
  )
}
