"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/utils"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    if (data.session) {
      localStorage.setItem("@session_id", JSON.stringify(data.session))
    }
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 mb-6">
        <Label htmlFor="email">Email</Label>
        <div className="relative" >
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Mail size={18} />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2 mb-10 ">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Lock size={18} />
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#ED7614] hover:bg-orange-500 cursor-pointer" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
      {error && (
        <div className="text-red-500 text-sm text-center mt-2">{error}</div>
      )}
    </form>
  )
}
