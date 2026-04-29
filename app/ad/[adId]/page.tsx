"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
  const [screenActive, setScreenActive] = useState(true)
  const [showFullscreenHint, setShowFullscreenHint] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const enterFullscreen = () => {
    const el = containerRef.current ?? document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    }
    setShowFullscreenHint(false)
  }

  // Auto-hide the hint after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowFullscreenHint(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const fetchAds = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("adease_ads")
      .select("*")
      .eq("screen_id", screenId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      const now = new Date()
      const activeAds = data.filter((ad: Ad) => {
        if (!ad.start_time && !ad.end_time) return true
        const startTime = ad.start_time ? new Date(ad.start_time) : null
        const endTime = ad.end_time ? new Date(ad.end_time) : null
        if (startTime && now < startTime) return false
        if (endTime && now > endTime) return false
        return true
      })
      setAds(activeAds as Ad[])
      setCurrentAdIndex((prev) => (activeAds.length === 0 ? 0 : prev % activeAds.length))
    }
    setLoading(false)
  }, [screenId])

  // Initial fetch
  useEffect(() => {
    if (screenId) fetchAds()
  }, [screenId, fetchAds])

  // Real-time: screen active/inactive + re-fetch ads when screen goes active
  useEffect(() => {
    if (!screenId) return

    const fetchScreenStatus = async () => {
      const { data } = await supabase
        .from("adease_screens")
        .select("is_active")
        .eq("id", screenId)
        .single()
      if (data) setScreenActive(data.is_active)
    }
    fetchScreenStatus()

    const channel = supabase
      .channel(`screen-status-${screenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "adease_screens", filter: `id=eq.${screenId}` },
        (payload) => {
          const updated = payload.new as { is_active: boolean }
          setScreenActive(updated.is_active)
          // Re-fetch ads on activation so deleted/updated ads don't reappear from cache
          if (updated.is_active) fetchAds()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [screenId, fetchAds])

  // Real-time: re-fetch whenever ads for this screen are added/updated/deleted
  useEffect(() => {
    if (!screenId) return

    const channel = supabase
      .channel(`ads-changes-${screenId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adease_ads", filter: `screen_id=eq.${screenId}` },
        () => { fetchAds() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [screenId, fetchAds])

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

  if (!screenActive)
    return <div className="fixed inset-0 bg-black" />

  if (loading)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-sm text-white">
        Loading...
      </div>
    )

  if (ads.length === 0)
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-sm text-red-500">
        No ads found for this screen.
      </div>
    )

  const currentAd = ads[currentAdIndex]

  return (
    <div ref={containerRef} className="fixed inset-0 m-0 h-screen w-screen overflow-hidden bg-black p-0">
      {/* Full-bleed slideshow: native img avoids Next remote config for arbitrary ad URLs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentAd.id}
        src={currentAd.image_url || "/placeholder.svg"}
        alt={currentAd.title}
        className="h-full w-full object-contain transition-opacity duration-500 md:object-contain"
      />

      {/* Fullscreen hint overlay */}
      {showFullscreenHint && (
        <button
          onClick={enterFullscreen}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 transition-opacity duration-700"
        >
          <svg className="h-12 w-12 text-white opacity-80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          <span className="text-white text-sm font-medium tracking-wide opacity-90">Click to go fullscreen</span>
        </button>
      )}
    </div>
  )
}
