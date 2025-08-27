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
  phone: string
  role: "admin" | "manager" | "member"
  status: "active" | "inactive" | "suspended"
  member_type: "employee" | "guest"
  dietary_restrictions: string
  join_date: string
  avatar?: string
  monthly_deposit: number
  current_balance: number
}

export interface MonthlyDeposit {
  id: number
  member: Member
  amount: number
  month: string
  deposit_date: string
  notes: string
}

export interface DailyMealCost {
  id: number
  date: string
  lunch_cost: number
  dinner_cost: number
  lunch_participants: number
  dinner_participants: number
  lunch_cost_per_person: number
  dinner_cost_per_person: number
}

export interface MemberMealTracking {
  id: number
  member: Member
  date: string
  lunch_count: 0 | 1 | 2
  dinner_count: 0 | 1 | 2
  lunch_cost: number
  dinner_cost: number
  total_cost: number
  is_paid: boolean
  notes: string
}

export interface Ingredient {
  id: number
  meal: number
  name: string
  quantity: number
  unit: "kg" | "g" | "l" | "ml" | "pcs" | "cups" | "tbsp" | "tsp"
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
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: number
  shopping_list: number
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
  created_by: Member
  total_estimated_cost: number
  total_actual_cost?: number
  items: ShoppingItem[]
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
  created_at: string
}

export interface DashboardStats {
  total_members: number
  active_members: number
  employee_members: number
  guest_members: number
  total_deposits_this_month: number
  total_meal_costs_today: number
  pending_expenses: number
  total_budget: number
  spent_budget: number
  budget_utilization: number
  recent_meals: Meal[]
  recent_expenses: Expense[]
  recent_deposits: MonthlyDeposit[]
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
  member_type: "employee" | "guest"
  dietary_restrictions?: string
}

export interface CreateDepositData {
  member: number
  amount: number
  month: string
  notes?: string
}

export interface CreateMealCostData {
  date: string
  lunch_cost: number
  dinner_cost: number
}

export interface UpdateMealTrackingData {
  member: number
  date: string
  lunch_count: 0 | 1 | 2
  dinner_count: 0 | 1 | 2
  notes?: string
}

export interface BulkMealTrackingData {
  date: string
  tracking_data: UpdateMealTrackingData[]
}
