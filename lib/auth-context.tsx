"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "./api-client"
import type { Member, LoginCredentials, RegisterData, AuthTokens } from "./types"

interface AuthContextType {
  user: Member | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: Partial<Member>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.get<{ user: Member }>("/api/auth/profile/")
      if (response.data) {
        setUser(response.data.user)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        apiClient.setAccessToken(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      apiClient.setAccessToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post<{
        message: string
        user: Member
        tokens: AuthTokens
      }>("/api/auth/login/", credentials)

      if (response.data) {
        const { user, tokens } = response.data

        // Store tokens
        localStorage.setItem("access_token", tokens.access)
        localStorage.setItem("refresh_token", tokens.refresh)
        apiClient.setAccessToken(tokens.access)

        setUser(user)
        return { success: true }
      } else {
        return { success: false, error: response.error || "Login failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<{
        message: string
        user: Member
        tokens: AuthTokens
      }>("/api/auth/register/", data)

      if (response.data) {
        const { user, tokens } = response.data

        // Store tokens
        localStorage.setItem("access_token", tokens.access)
        localStorage.setItem("refresh_token", tokens.refresh)
        apiClient.setAccessToken(tokens.access)

        setUser(user)
        return { success: true }
      } else {
        return { success: false, error: response.error || "Registration failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        await apiClient.post("/api/auth/logout/", { refresh_token: refreshToken })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      apiClient.setAccessToken(null)
      setUser(null)
    }
  }

  const updateProfile = async (data: Partial<Member>) => {
    try {
      const response = await apiClient.put<{
        message: string
        user: Member
      }>("/api/auth/profile/", data)

      if (response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error || "Profile update failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" }
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
