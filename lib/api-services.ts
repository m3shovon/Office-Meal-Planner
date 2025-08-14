import { apiClient } from "./api-client"
import type { Member, Meal, ShoppingList, Expense, Budget, DashboardStats } from "./types"

// Member Services
export const memberService = {
  getAll: () => apiClient.get<{ results: Member[] }>("/api/meal/members/"),
  getById: (id: number) => apiClient.get<Member>(`/api/meal/members/${id}/`),
  create: (data: Partial<Member>) => apiClient.post<Member>("/api/meal/members/", data),
  update: (id: number, data: Partial<Member>) => apiClient.put<Member>(`/api/meal/members/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/members/${id}/`),
}

// Meal Services
export const mealService = {
  getAll: (params?: {
    start_date?: string
    end_date?: string
    meal_type?: string
    status?: string
    search?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: Meal[] }>(`/api/meal/meals/${queryString ? `?${queryString}` : ""}`)
  },

  getById: (id: number) => apiClient.get<Meal>(`/api/meal/meals/${id}/`),

  create: (data: {
    name: string
    description?: string
    meal_type: string
    date: string
    time: string
    estimated_cost: number
    ingredients?: Array<{
      name: string
      quantity: number
      unit: string
      estimated_cost: number
    }>
  }) => apiClient.post<Meal>("/api/meal/meals/", data),

  update: (id: number, data: Partial<Meal>) => apiClient.put<Meal>(`/api/meal/meals/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/meals/${id}/`),
  approve: (id: number) => apiClient.post(`/api/meal/meals/${id}/approve/`),
  complete: (id: number, actualCost?: number) =>
    apiClient.post(`/api/meal/meals/${id}/complete/`, { actual_cost: actualCost }),
}

// Shopping List Services
export const shoppingService = {
  getAll: (params?: { status?: string; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: ShoppingList[] }>(
      `/api/meal/shopping-lists/${queryString ? `?${queryString}` : ""}`,
    )
  },

  getById: (id: number) => apiClient.get<ShoppingList>(`/api/meal/shopping-lists/${id}/`),

  create: (data: {
    name: string
    date_needed: string
    items?: Array<{
      name: string
      quantity: number
      unit: string
      estimated_cost: number
    }>
  }) => apiClient.post<ShoppingList>("/api/meal/shopping-lists/", data),

  update: (id: number, data: Partial<ShoppingList>) =>
    apiClient.put<ShoppingList>(`/api/meal/shopping-lists/${id}/`, data),

  delete: (id: number) => apiClient.delete(`/api/meal/shopping-lists/${id}/`),

  markItemPurchased: (listId: number, itemId: number, actualCost?: number) =>
    apiClient.post(`/api/meal/shopping-lists/${listId}/mark_item_purchased/`, {
      item_id: itemId,
      actual_cost: actualCost,
    }),

  generateFromMeals: (listId: number, startDate: string, endDate: string) =>
    apiClient.post(`/api/meal/shopping-lists/${listId}/generate_from_meals/`, {
      start_date: startDate,
      end_date: endDate,
    }),
}

// Expense Services
export const expenseService = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: Expense[] }>(`/api/meal/expenses/${queryString ? `?${queryString}` : ""}`)
  },

  getById: (id: number) => apiClient.get<Expense>(`/api/meal/expenses/${id}/`),

  create: (data: {
    title: string
    description?: string
    amount: number
    category: string
    date: string
    receipt?: File
  }) => {
    if (data.receipt) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value as string | Blob)
        }
      })
      return apiClient.uploadFile<Expense>("/api/meal/expenses/", formData)
    } else {
      return apiClient.post<Expense>("/api/meal/expenses/", data)
    }
  },

  update: (id: number, data: Partial<Expense>) => apiClient.put<Expense>(`/api/meal/expenses/${id}/`, data),

  delete: (id: number) => apiClient.delete(`/api/meal/expenses/${id}/`),
  approve: (id: number) => apiClient.post(`/api/meal/expenses/${id}/approve/`),
  reject: (id: number) => apiClient.post(`/api/meal/expenses/${id}/reject/`),
}

// Budget Services
export const budgetService = {
  getAll: (params?: { active_only?: boolean; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString())
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: Budget[] }>(`/api/meal/budgets/${queryString ? `?${queryString}` : ""}`)
  },

  getById: (id: number) => apiClient.get<Budget>(`/api/meal/budgets/${id}/`),

  create: (data: {
    name: string
    total_amount: number
    start_date: string
    end_date: string
  }) => apiClient.post<Budget>("/api/meal/budgets/", data),

  update: (id: number, data: Partial<Budget>) => apiClient.put<Budget>(`/api/meal/budgets/${id}/`, data),

  delete: (id: number) => apiClient.delete(`/api/meal/budgets/${id}/`),
}

// Dashboard Services
export const dashboardService = {
  getStats: () => apiClient.get<DashboardStats>("/api/meal/dashboard/stats/"),
}
