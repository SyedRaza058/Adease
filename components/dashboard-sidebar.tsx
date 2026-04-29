"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Monitor, ImageIcon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "./ui/button"

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Screens",
    href: "/dashboard/screens",
    icon: Monitor,
  },
  {
    name: "Advertisements",
    href: "/dashboard/advertisements",
    icon: ImageIcon,
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="glass-sidebar flex min-h-screen w-56 shrink-0 flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <div className="mx-auto max-w-fit rounded-lg bg-white/10 px-2.5 py-1 shadow-sm backdrop-blur-md">
          <Image
            src="/logo.svg"
            alt="AD-EASE"
            className="h-9 w-auto"
            width={204}
            height={72}
            unoptimized
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-sidebar-accent-foreground shadow-inner"
                  : "text-sidebar-foreground/90 hover:bg-white/10 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "mr-2 h-4 w-4 shrink-0 opacity-75",
                  isActive ? "text-sidebar-primary opacity-100" : "opacity-65 group-hover:opacity-85",
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem("@session_id")
            window.location.href = "/"
          }}
          className="w-full border-white/15 bg-white/5 text-sidebar-foreground backdrop-blur-sm hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4 opacity-70" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
