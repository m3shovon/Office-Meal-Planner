"use client"

import { useAuth } from "@/lib/auth-context"
import { MealManagementDashboard } from "@/components/meal-management-dashboard"
import { AuthPage } from "@/components/auth/auth-page"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <MealManagementDashboard />
}
