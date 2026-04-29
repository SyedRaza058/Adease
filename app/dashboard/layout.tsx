import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <DashboardSidebar />
      <main className="min-w-0 flex flex-1 flex-col overflow-y-auto p-4">{children}</main>
    </div>
  )
}
