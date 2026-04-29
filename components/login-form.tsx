"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn, supabase } from "@/lib/utils"

const splitInputClass =
  "h-10 rounded-lg border-white/12 bg-black/35 pl-9 text-sm text-white shadow-none placeholder:text-white/40 " +
  "focus-visible:border-[#ED7614]/80 focus-visible:ring-[3px] focus-visible:ring-[#ED7614]/28 " +
  "dark:border-white/12 dark:bg-black/35 dark:text-white dark:hover:bg-black/45 dark:placeholder:text-white/40"

const splitIconClass = "text-white/45"

type LoginFormProps = {
  variant?: "default" | "split"
}

export default function LoginForm({ variant = "default" }: LoginFormProps) {
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

  if (variant === "split") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={splitInputClass}
            required
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5",
              splitIconClass,
            )}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </div>
        </div>

        <div className="relative">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={splitInputClass}
            required
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5",
              splitIconClass,
            )}
          >
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </div>
        </div>

        <Button
          type="submit"
          className="h-10 w-full rounded-lg bg-[#ED7614] text-sm font-semibold text-white shadow-sm hover:bg-[#d96a0f]"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Login"}
        </Button>

        {error && <p className="text-center text-sm leading-snug text-red-400">{error}</p>}

        <p className="text-center text-sm text-white/65">
          <button
            type="button"
            title="Password recovery is not available yet"
            className="cursor-default font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
          >
            Forgot password?
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email-default">Email</Label>
        <div className="relative">
          <Input
            id="email-default"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password-default">Password</Label>
        <div className="relative">
          <Input
            id="password-default"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full cursor-pointer bg-[#ED7614] hover:bg-orange-500" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
      {error && <div className="mt-1 text-center text-sm text-red-500">{error}</div>}
    </form>
  )
}
