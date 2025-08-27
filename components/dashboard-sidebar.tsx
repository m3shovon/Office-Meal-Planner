"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UtensilsCrossed,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Calendar,
  Home,
  LogOut,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Meals", href: "/dashboard/meals", icon: UtensilsCrossed },
  { name: "Daily Tracker", href: "/dashboard/tracker", icon: Calendar },
  { name: "Deposits", href: "/dashboard/deposits", icon: DollarSign },
  { name: "Shopping", href: "/dashboard/shopping", icon: ShoppingCart },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Meal Management</h2>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge variant={user?.is_staff ? "default" : "secondary"} className="text-xs">
              {user?.is_staff ? "Admin" : "User"}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isActive && "bg-secondary")}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
