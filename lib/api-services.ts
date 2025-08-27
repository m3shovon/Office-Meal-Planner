import { apiClient } from "./api-client"
import type {
  Member,
  Meal,
  Ingredient,
  ShoppingList,
  Expense,
  Budget,
  DashboardStats,
  MonthlyDeposit,
  DailyMealCost,
  MemberMealTracking,
  CreateDepositData,
  CreateMealCostData,
  UpdateMealTrackingData,
  BulkMealTrackingData,
} from "./types"

// Member Services
export const memberService = {
  getAll: () => apiClient.get<{ results: Member[] }>("/api/meal/members/"),
  getById: (id: number) => apiClient.get<Member>(`/api/meal/members/${id}/`),
  create: (data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    member_type: "employee" | "guest"
    dietary_restrictions?: string
    monthly_deposit?: number
  }) => apiClient.post<Member>("/api/meal/members/", data),
  update: (
    id: number,
    data: {
      username?: string
      first_name?: string
      last_name?: string
      email?: string
      phone?: string
      member_type?: "employee" | "guest"
      dietary_restrictions?: string
      status?: "active" | "inactive" | "suspended"
      monthly_deposit?: number
    },
  ) => apiClient.put<Member>(`/api/meal/members/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/members/${id}/`),
}

// Ingredient Services
export const ingredientService = {
  getAll: () => apiClient.get<{ results: Ingredient[] }>("/api/meal/ingredients/"),
  getById: (id: number) => apiClient.get<Ingredient>(`/api/meal/ingredients/${id}/`),
  create: (data: {
    meal: number
    name: string
    quantity: number
    unit: "kg" | "g" | "l" | "ml" | "pcs" | "cups" | "tbsp" | "tsp"
    estimated_cost: number
  }) => apiClient.post<Ingredient>("/api/meal/ingredients/", data),
  update: (id: number, data: Partial<Ingredient>) => apiClient.put<Ingredient>(`/api/meal/ingredients/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/ingredients/${id}/`),
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
    meal_type: "breakfast" | "lunch" | "dinner" | "snack"
    date: string
    time: string
    estimated_cost: number
    ingredients?: Array<{
      name: string
      quantity: number
      unit: "kg" | "g" | "l" | "ml" | "pcs" | "cups" | "tbsp" | "tsp"
      estimated_cost: number
    }>
  }) => apiClient.post<Meal>("/api/meal/meals/", data),

  update: (id: number, data: Partial<Meal>) => apiClient.put<Meal>(`/api/meal/meals/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/meals/${id}/`),
  approve: (id: number) => apiClient.post(`/api/meal/meals/${id}/approve/`),
  complete: (id: number, actualCost?: number) =>
    apiClient.post(`/api/meal/meals/${id}/complete/`, { actual_cost: actualCost }),
}

// Monthly Deposit Services
export const monthlyDepositService = {
  getAll: (params?: { member?: number; month?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: MonthlyDeposit[] }>(
      `/api/meal/monthly-deposits/${queryString ? `?${queryString}` : ""}`,
    )
  },
  getById: (id: number) => apiClient.get<MonthlyDeposit>(`/api/meal/monthly-deposits/${id}/`),
  create: (data: CreateDepositData) => apiClient.post<MonthlyDeposit>("/api/meal/monthly-deposits/", data),
  update: (id: number, data: Partial<MonthlyDeposit>) =>
    apiClient.put<MonthlyDeposit>(`/api/meal/monthly-deposits/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/monthly-deposits/${id}/`),
}

// Daily Meal Cost Services
export const dailyMealCostService = {
  getAll: (params?: { date?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: DailyMealCost[] }>(
      `/api/meal/daily-meal-costs/${queryString ? `?${queryString}` : ""}`,
    )
  },
  getById: (id: number) => apiClient.get<DailyMealCost>(`/api/meal/daily-meal-costs/${id}/`),
  getByDate: (date: string) => apiClient.get<DailyMealCost>(`/api/meal/daily-meal-costs/by-date/${date}/`),
  create: (data: CreateMealCostData) => apiClient.post<DailyMealCost>("/api/meal/daily-meal-costs/", data),
  update: (id: number, data: Partial<DailyMealCost>) =>
    apiClient.put<DailyMealCost>(`/api/meal/daily-meal-costs/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/daily-meal-costs/${id}/`),
}

// Member Meal Tracking Services
export const memberMealTrackingService = {
  getAll: (params?: { date?: string; member?: number }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
    }
    const queryString = queryParams.toString()
    return apiClient.get<{ results: MemberMealTracking[] }>(
      `/api/meal/member-meal-tracking/${queryString ? `?${queryString}` : ""}`,
    )
  },
  getById: (id: number) => apiClient.get<MemberMealTracking>(`/api/meal/member-meal-tracking/${id}/`),
  getByDate: (date: string) =>
    apiClient.get<{ results: MemberMealTracking[] }>(`/api/meal/member-meal-tracking/by-date/${date}/`),
  create: (data: UpdateMealTrackingData) => apiClient.post<MemberMealTracking>("/api/meal/member-meal-tracking/", data),
  update: (id: number, data: Partial<MemberMealTracking>) =>
    apiClient.put<MemberMealTracking>(`/api/meal/member-meal-tracking/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/api/meal/member-meal-tracking/${id}/`),
  bulkUpdate: (data: BulkMealTrackingData) =>
    apiClient.post<{ results: MemberMealTracking[] }>("/api/meal/member-meal-tracking/bulk-update/", data),
  processPayments: (date: string) => apiClient.post(`/api/meal/member-meal-tracking/process-payments/`, { date }),
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

// Unified API Service Export
export const apiService = {
  // Members
  getMembers: () => memberService.getAll().then((response) => response.results),
  getMember: (id: number) => memberService.getById(id),
  createMember: (data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    member_type: "employee" | "guest"
    dietary_restrictions?: string
    monthly_deposit?: number
  }) => memberService.create(data),
  updateMember: (
    id: number,
    data: {
      username?: string
      first_name?: string
      last_name?: string
      email?: string
      phone?: string
      member_type?: "employee" | "guest"
      dietary_restrictions?: string
      status?: "active" | "inactive" | "suspended"
      monthly_deposit?: number
    },
  ) => memberService.update(id, data),
  deleteMember: (id: number) => memberService.delete(id),

  // Ingredients
  getIngredients: () => ingredientService.getAll().then((response) => response.results),
  getIngredient: (id: number) => ingredientService.getById(id),
  createIngredient: (data: {
    meal: number
    name: string
    quantity: number
    unit: "kg" | "g" | "l" | "ml" | "pcs" | "cups" | "tbsp" | "tsp"
    estimated_cost: number
  }) => ingredientService.create(data),
  updateIngredient: (id: number, data: Partial<Ingredient>) => ingredientService.update(id, data),
  deleteIngredient: (id: number) => ingredientService.delete(id),

  // Meals
  getMeals: (params?: any) => mealService.getAll(params).then((response) => response.results),
  getMeal: (id: number) => mealService.getById(id),
  createMeal: (data: any) => mealService.create(data),
  updateMeal: (id: number, data: any) => mealService.update(id, data),
  deleteMeal: (id: number) => mealService.delete(id),

  // Monthly Deposits
  getMonthlyDeposits: (params?: any) => monthlyDepositService.getAll(params).then((response) => response.results),
  getMonthlyDeposit: (id: number) => monthlyDepositService.getById(id),
  createMonthlyDeposit: (data: CreateDepositData) => monthlyDepositService.create(data),
  updateMonthlyDeposit: (id: number, data: any) => monthlyDepositService.update(id, data),
  deleteMonthlyDeposit: (id: number) => monthlyDepositService.delete(id),

  // Daily Meal Costs
  getDailyMealCosts: (params?: any) => dailyMealCostService.getAll(params).then((response) => response.results),
  getDailyMealCost: (id: number) => dailyMealCostService.getById(id),
  getDailyMealCostByDate: (date: string) => dailyMealCostService.getByDate(date),
  createDailyMealCost: (data: CreateMealCostData) => dailyMealCostService.create(data),
  updateDailyMealCost: (id: number, data: any) => dailyMealCostService.update(id, data),
  deleteDailyMealCost: (id: number) => dailyMealCostService.delete(id),

  // Member Meal Tracking
  getMemberMealTracking: (params?: any) =>
    memberMealTrackingService.getAll(params).then((response) => response.results),
  getMemberMealTrackingById: (id: number) => memberMealTrackingService.getById(id),
  getMemberMealTrackingByDate: (date: string) =>
    memberMealTrackingService.getByDate(date).then((response) => response.results),
  createMemberMealTracking: (data: UpdateMealTrackingData) => memberMealTrackingService.create(data),
  updateMemberMealTracking: (id: number, data: any) => memberMealTrackingService.update(id, data),
  deleteMemberMealTracking: (id: number) => memberMealTrackingService.delete(id),
  bulkUpdateMemberMealTracking: (data: BulkMealTrackingData) => memberMealTrackingService.bulkUpdate(data),
  processMealPayments: (date: string) => memberMealTrackingService.processPayments(date),

  // Dashboard
  getDashboardStats: () => dashboardService.getStats(),

  // Shopping Lists
  getShoppingLists: () => shoppingService.getAll().then((response) => response.results),
  getShoppingList: (id: number) => shoppingService.getById(id),
  createShoppingList: (data: any) => shoppingService.create(data),
  updateShoppingList: (id: number, data: any) => shoppingService.update(id, data),
  deleteShoppingList: (id: number) => shoppingService.delete(id),

  // Expenses
  getExpenses: () => expenseService.getAll().then((response) => response.results),
  getExpense: (id: number) => expenseService.getById(id),
  createExpense: (data: any) => expenseService.create(data),
  updateExpense: (id: number, data: any) => expenseService.update(id, data),
  deleteExpense: (id: number) => expenseService.delete(id),

  // Budgets
  getBudgets: () => budgetService.getAll().then((response) => response.results),
  getBudget: (id: number) => budgetService.getById(id),
  createBudget: (data: any) => budgetService.create(data),
  updateBudget: (id: number, data: any) => budgetService.update(id, data),
  deleteBudget: (id: number) => budgetService.delete(id),
}
