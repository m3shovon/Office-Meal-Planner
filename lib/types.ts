export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
}

export interface Member {
  id: number
  user: User
  full_name: string
  phone: string
  role: "admin" | "manager" | "member"
  status: "active" | "inactive" | "suspended"
  dietary_restrictions: string
  join_date: string
  avatar?: string
}

export interface Ingredient {
  id: number
  name: string
  quantity: number
  unit: string
  estimated_cost: number
}

export interface Meal {
  id: number
  name: string
  description: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  date: string
  time: string
  estimated_cost: number
  actual_cost?: number
  status: "planned" | "approved" | "prepared" | "cancelled"
  ingredients: Ingredient[]
  created_by: Member
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: number
  name: string
  quantity: number
  unit: string
  estimated_cost: number
  actual_cost?: number
  is_purchased: boolean
  notes: string
}

export interface ShoppingList {
  id: number
  name: string
  date_created: string
  date_needed: string
  status: "pending" | "in_progress" | "completed"
  total_estimated_cost: number
  total_actual_cost?: number
  created_by: Member
  created_by_name: string
  items: ShoppingItem[]
  items_count: number
  purchased_items_count: number
}

export interface Expense {
  id: number
  title: string
  description: string
  amount: number
  category: "groceries" | "supplies" | "equipment" | "utilities" | "other"
  date: string
  status: "pending" | "approved" | "rejected"
  receipt?: string
  submitted_by: Member
  approved_by?: Member
  submitted_by_name: string
  approved_by_name?: string
  created_at: string
}

export interface Budget {
  id: number
  name: string
  total_amount: number
  spent_amount: number
  remaining_amount: number
  utilization_percentage: number
  start_date: string
  end_date: string
  created_by: Member
  created_by_name: string
  created_at: string
}

export interface DashboardStats {
  total_members: number
  active_members: number
  total_meals_this_week: number
  total_meals_this_month: number
  pending_expenses: number
  total_budget: number
  spent_budget: number
  budget_utilization: number
  recent_meals: Meal[]
  recent_expenses: Expense[]
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  phone?: string
  dietary_restrictions?: string
}
