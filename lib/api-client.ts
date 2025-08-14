interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") {
    this.baseURL = baseURL
    this.loadTokenFromStorage()
  }

  private loadTokenFromStorage() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token")
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("access_token", token)
      } else {
        localStorage.removeItem("access_token")
      }
    }
  }

  private async refreshToken(): Promise<boolean> {
    if (typeof window === "undefined") return false

    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.setAccessToken(data.access)
        return true
      } else {
        // Refresh token is invalid, clear all tokens
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        return false
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      })

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Retry the request with new token
          headers.Authorization = `Bearer ${this.accessToken}`
          response = await fetch(url, {
            ...options,
            headers,
          })
        }
      }

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || data.error || "An error occurred",
        status: response.status,
      }
    } catch (error) {
      return {
        error: "Network error occurred",
        status: 0,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" })
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      let response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      })

      // Handle token refresh for file uploads
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          headers.Authorization = `Bearer ${this.accessToken}`
          response = await fetch(url, {
            method: "POST",
            headers,
            body: formData,
          })
        }
      }

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || data.error || "Upload failed",
        status: response.status,
      }
    } catch (error) {
      return {
        error: "Upload failed",
        status: 0,
      }
    }
  }
}

export const apiClient = new ApiClient()
