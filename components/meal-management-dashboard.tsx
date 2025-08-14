"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, ChefHat, ShoppingCart, Users, LogOut, DollarSign, Clock } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import {
  memberService,
  mealService,
  shoppingService,
  expenseService,
  budgetService,
  dashboardService,
} from "@/lib/api-services"
import type { Member, Meal, ShoppingList, Expense, Budget, DashboardStats } from "@/lib/types"

type ActiveSection = "dashboard" | "meals" | "members" | "shopping" | "deposits" | "reports"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "meals", label: "Meals", icon: ChefHat },
  { id: "members", label: "Members", icon: Users },
  { id: "shopping", label: "Shopping", icon: ShoppingCart },
  { id: "deposits", label: "Deposits", icon: DollarSign },
  { id: "reports", label: "Reports", icon: Clock },
]

export function MealManagementDashboard() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard")

  // API Data States
  const [members, setMembers] = useState<Member[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [deposits, setDeposits] = useState<any[]>([])
  const [memberBalances, setMemberBalances] = useState<any[]>([])

  const [costDistribution, setCostDistribution] = useState<any[]>([])
  const [monthlyBilling, setMonthlyBilling] = useState<any[]>([])
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [reportView, setReportView] = useState<"distribution" | "billing" | "payments" | "analytics">("distribution")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isLoadingMeals, setIsLoadingMeals] = useState(false)
  const [isLoadingShopping, setIsLoadingShopping] = useState(false)
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false)
  const [isLoadingMealTracking, setIsLoadingMealTracking] = useState(false)
  const [isSavingMealTracking, setIsSavingMealTracking] = useState(false)

  // UI States
  const [shoppingView, setShoppingView] = useState<"list" | "budget" | "expenses">("list")
  const [mealView, setMealView] = useState<"calendar" | "list">("calendar")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "manager" | "member">("all")
  const [depositView, setDepositView] = useState<"overview" | "history" | "balances">("overview")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dailyMealCost, setDailyMealCost] = useState({
    lunch_cost: 0,
    dinner_cost: 0,
    lunch_participants: 0,
    dinner_participants: 0,
    lunch_cost_per_person: 0,
    dinner_cost_per_person: 0,
  })
  const [memberMealTracking, setMemberMealTracking] = useState<any[]>([])

  // Dialog States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddMealOpen, setIsAddMealOpen] = useState(false)
  const [isAddShoppingListOpen, setIsAddShoppingListOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false)

  // Editing States
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const [depositForm, setDepositForm] = useState({
    member_id: "",
    amount: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    notes: "",
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    switch (activeSection) {
      case "members":
        loadMembers()
        break
      case "meals":
        loadMealTracking(selectedDate)
        break
      case "shopping":
        loadShoppingData()
        break
      case "deposits":
        loadDeposits()
        break
      case "reports":
        loadReportsData()
        break
      default:
        break
    }
  }, [activeSection, selectedDate])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await dashboardService.getStats()
      if (response.data) {
        setDashboardStats(response.data)
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true)
      const response = await memberService.getAll()
      if (response.data) {
        setMembers(response.data.results)
      }
    } catch (error) {
      console.error("Failed to load members:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const loadMeals = async () => {
    try {
      setIsLoadingMeals(true)
      const response = await mealService.getAll()
      if (response.data) {
        setMeals(response.data.results)
      }
    } catch (error) {
      console.error("Failed to load meals:", error)
    } finally {
      setIsLoadingMeals(false)
    }
  }

  const loadShoppingData = async () => {
    try {
      setIsLoadingShopping(true)
      const [shoppingResponse, expenseResponse, budgetResponse] = await Promise.all([
        shoppingService.getAll(),
        expenseService.getAll(),
        budgetService.getAll({ active_only: true }),
      ])

      if (shoppingResponse.data) {
        setShoppingLists(shoppingResponse.data.results)
      }
      if (expenseResponse.data) {
        setExpenses(expenseResponse.data.results)
      }
      if (budgetResponse.data) {
        setBudgets(budgetResponse.data.results)
      }
    } catch (error) {
      console.error("Failed to load shopping data:", error)
    } finally {
      setIsLoadingShopping(false)
    }
  }

  const handleApproveMeal = async (mealId: number) => {
    try {
      const response = await mealService.approve(mealId)
      if (response.status === 200) {
        loadMeals() // Refresh meals
        loadDashboardData() // Refresh dashboard stats
      }
    } catch (error) {
      console.error("Failed to approve meal:", error)
    }
  }

  const handleApproveExpense = async (expenseId: number) => {
    try {
      const response = await expenseService.approve(expenseId)
      if (response.status === 200) {
        loadShoppingData() // Refresh expenses
        loadDashboardData() // Refresh dashboard stats
      }
    } catch (error) {
      console.error("Failed to approve expense:", error)
    }
  }

  const handleRejectExpense = async (expenseId: number) => {
    try {
      const response = await expenseService.reject(expenseId)
      if (response.status === 200) {
        loadShoppingData() // Refresh expenses
      }
    } catch (error) {
      console.error("Failed to reject expense:", error)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const loadDeposits = async () => {
    try {
      setIsLoadingDeposits(true)
      // Mock data for now - replace with actual API calls
      const mockDeposits = [
        {
          id: 1,
          member: { id: 1, user: { first_name: "John", last_name: "Doe" }, full_name: "John Doe" },
          amount: 500.0,
          month: "2024-01-01",
          month_display: "January 2024",
          deposit_date: "2024-01-01T10:00:00Z",
          notes: "Monthly meal deposit",
        },
        {
          id: 2,
          member: { id: 2, user: { first_name: "Jane", last_name: "Smith" }, full_name: "Jane Smith" },
          amount: 450.0,
          month: "2024-01-01",
          month_display: "January 2024",
          deposit_date: "2024-01-02T10:00:00Z",
          notes: "",
        },
      ]

      const mockBalances = [
        {
          member: {
            id: 1,
            user: { first_name: "John", last_name: "Doe" },
            full_name: "John Doe",
            member_type: "employee",
          },
          current_balance: 450.0,
          monthly_deposit: 500.0,
          current_month_consumption: { total_cost: 50.0, total_meals: 8, days_with_meals: 4 },
        },
        {
          member: {
            id: 2,
            user: { first_name: "Jane", last_name: "Smith" },
            full_name: "Jane Smith",
            member_type: "employee",
          },
          current_balance: 425.0,
          monthly_deposit: 450.0,
          current_month_consumption: { total_cost: 25.0, total_meals: 4, days_with_meals: 2 },
        },
      ]

      setDeposits(mockDeposits)
      setMemberBalances(mockBalances)
    } catch (error) {
      console.error("Failed to load deposits:", error)
    } finally {
      setIsLoadingDeposits(false)
    }
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Mock submission - replace with actual API call
      console.log("Submitting deposit:", depositForm)
      setIsAddDepositOpen(false)
      setDepositForm({
        member_id: "",
        amount: "",
        month: new Date().toISOString().slice(0, 7),
        notes: "",
      })
      loadDeposits() // Refresh data
    } catch (error) {
      console.error("Failed to add deposit:", error)
    }
  }

  const loadMealTracking = async (date: Date) => {
    try {
      setIsLoadingMealTracking(true)
      const dateStr = format(date, "yyyy-MM-dd")

      // Mock data for now - replace with actual API calls
      const mockDailyCost = {
        lunch_cost: 150.0,
        dinner_cost: 200.0,
        lunch_participants: 8,
        dinner_participants: 10,
        lunch_cost_per_person: 18.75,
        dinner_cost_per_person: 20.0,
      }

      const mockMemberTracking = members.map((member) => ({
        id: Math.random(),
        member: member,
        member_name: member.full_name,
        date: dateStr,
        lunch_count: Math.floor(Math.random() * 3), // 0, 1, or 2
        dinner_count: Math.floor(Math.random() * 3), // 0, 1, or 2
        lunch_cost: 0,
        dinner_cost: 0,
        total_cost: 0,
        is_paid: false,
        notes: "",
      }))

      // Calculate costs based on counts
      mockMemberTracking.forEach((tracking) => {
        tracking.lunch_cost = tracking.lunch_count * mockDailyCost.lunch_cost_per_person
        tracking.dinner_cost = tracking.dinner_count * mockDailyCost.dinner_cost_per_person
        tracking.total_cost = tracking.lunch_cost + tracking.dinner_cost
      })

      setDailyMealCost(mockDailyCost)
      setMemberMealTracking(mockMemberTracking)
    } catch (error) {
      console.error("Failed to load meal tracking:", error)
    } finally {
      setIsLoadingMealTracking(false)
    }
  }

  const handleMealCountChange = (memberId: number, mealType: "lunch" | "dinner", count: number) => {
    setMemberMealTracking((prev) =>
      prev.map((tracking) => {
        if (tracking.member.id === memberId) {
          const updated = { ...tracking }
          if (mealType === "lunch") {
            updated.lunch_count = count
            updated.lunch_cost = count * dailyMealCost.lunch_cost_per_person
          } else {
            updated.dinner_count = count
            updated.dinner_cost = count * dailyMealCost.dinner_cost_per_person
          }
          updated.total_cost = updated.lunch_cost + updated.dinner_cost
          return updated
        }
        return tracking
      }),
    )
  }

  const handleSaveMealTracking = async () => {
    try {
      setIsSavingMealTracking(true)
      // Mock save - replace with actual API call
      console.log("Saving meal tracking:", {
        date: format(selectedDate, "yyyy-MM-dd"),
        member_tracking: memberMealTracking.map((t) => ({
          member_id: t.member.id,
          lunch_count: t.lunch_count,
          dinner_count: t.dinner_count,
        })),
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message or update UI
      console.log("Meal tracking saved successfully")
    } catch (error) {
      console.error("Failed to save meal tracking:", error)
    } finally {
      setIsSavingMealTracking(false)
    }
  }

  const handleSetDailyCost = async (lunchCost: number, dinnerCost: number) => {
    try {
      // Mock API call - replace with actual implementation
      const updatedCost = {
        ...dailyMealCost,
        lunch_cost: lunchCost,
        dinner_cost: dinnerCost,
        lunch_cost_per_person: lunchCost / dailyMealCost.lunch_participants || 0,
        dinner_cost_per_person: dinnerCost / dailyMealCost.dinner_participants || 0,
      }

      setDailyMealCost(updatedCost)

      // Recalculate member costs
      setMemberMealTracking((prev) =>
        prev.map((tracking) => ({
          ...tracking,
          lunch_cost: tracking.lunch_count * updatedCost.lunch_cost_per_person,
          dinner_cost: tracking.dinner_count * updatedCost.dinner_cost_per_person,
          total_cost:
            tracking.lunch_count * updatedCost.lunch_cost_per_person +
            tracking.dinner_count * updatedCost.dinner_cost_per_person,
        })),
      )
    } catch (error) {
      console.error("Failed to set daily cost:", error)
    }
  }

  const loadReportsData = async () => {
    try {
      setIsLoadingReports(true)

      // Mock cost distribution data
      const mockCostDistribution = members.map((member) => ({
        member: member,
        member_name: member.full_name,
        total_meals_this_month: Math.floor(Math.random() * 40) + 10,
        total_cost_this_month: (Math.random() * 200 + 50).toFixed(2),
        average_daily_cost: (Math.random() * 15 + 5).toFixed(2),
        lunch_meals: Math.floor(Math.random() * 20) + 5,
        dinner_meals: Math.floor(Math.random() * 20) + 5,
        outstanding_balance: (Math.random() * 50).toFixed(2),
        last_payment_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }))

      // Mock monthly billing data
      const mockMonthlyBilling = members.map((member) => ({
        member: member,
        member_name: member.full_name,
        opening_balance: (Math.random() * 100 + 400).toFixed(2),
        monthly_deposit: member.member_type === "employee" ? 500 : 0,
        total_consumption: (Math.random() * 150 + 50).toFixed(2),
        closing_balance: (Math.random() * 100 + 300).toFixed(2),
        payment_status: Math.random() > 0.3 ? "paid" : "pending",
        due_amount: Math.random() > 0.7 ? (Math.random() * 50).toFixed(2) : "0.00",
      }))

      // Mock payment history
      const mockPaymentHistory = []
      for (let i = 0; i < 20; i++) {
        const member = members[Math.floor(Math.random() * members.length)]
        mockPaymentHistory.push({
          id: i + 1,
          member: member,
          member_name: member.full_name,
          amount: (Math.random() * 100 + 20).toFixed(2),
          payment_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          payment_type: Math.random() > 0.5 ? "deposit" : "meal_charge",
          description: Math.random() > 0.5 ? "Monthly deposit" : "Daily meal charges",
          status: "completed",
        })
      }

      setCostDistribution(mockCostDistribution)
      setMonthlyBilling(mockMonthlyBilling)
      setPaymentHistory(
        mockPaymentHistory.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
      )
    } catch (error) {
      console.error("Failed to load reports data:", error)
    } finally {
      setIsLoadingReports(false)
    }
  }

  const handleProcessMonthlyBilling = async () => {
    try {
      // Mock API call to process monthly billing
      console.log("Processing monthly billing for:", selectedMonth)

      // Update member balances based on meal consumption
      const updatedBilling = monthlyBilling.map((bill) => ({
        ...bill,
        payment_status: "processed",
        closing_balance: (
          Number.parseFloat(bill.opening_balance) +
          bill.monthly_deposit -
          Number.parseFloat(bill.total_consumption)
        ).toFixed(2),
      }))

      setMonthlyBilling(updatedBilling)

      // Show success message
      console.log("Monthly billing processed successfully")
    } catch (error) {
      console.error("Failed to process monthly billing:", error)
    }
  }

  const handleDistributeDailyCosts = async (date: Date) => {
    try {
      // Calculate total daily costs and distribute among participants
      const totalDailyCost = dailyMealCost.lunch_cost + dailyMealCost.dinner_cost
      const totalParticipants = memberMealTracking.filter((t) => t.lunch_count > 0 || t.dinner_count > 0).length

      // Update member balances
      const distributionData = memberMealTracking.map((tracking) => ({
        member_id: tracking.member.id,
        member_name: tracking.member_name,
        date: format(date, "yyyy-MM-dd"),
        lunch_cost: tracking.lunch_cost,
        dinner_cost: tracking.dinner_cost,
        total_cost: tracking.total_cost,
        balance_deduction: tracking.total_cost,
      }))

      console.log("Distributing daily costs:", distributionData)

      // Mock API call to update member balances
      // This would deduct the meal costs from member balances

      return distributionData
    } catch (error) {
      console.error("Failed to distribute daily costs:", error)
    }
  }

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {/* Placeholder for dashboard content */}
    </div>
  )

  const renderMembersContent = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Members</h1>
      {/* Placeholder for members content */}
    </div>
  )

  const renderDepositsContent = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Deposits</h1>
      {/* Placeholder for deposits content */}
    </div>
  )

  const renderMealsContent = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meals</h1>
      {/* Placeholder for meals content */}
    </div>
  )

  const renderReportsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cost Distribution & Reports</h1>
        <div className="flex items-center space-x-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
          <Button onClick={handleProcessMonthlyBilling}>Process Monthly Billing</Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={reportView} onValueChange={(value: any) => setReportView(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distribution">Cost Distribution</SelectItem>
            <SelectItem value="billing">Monthly Billing</SelectItem>
            <SelectItem value="payments">Payment History</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingReports ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      ) : (
        <>
          {reportView === "distribution" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      $
                      {costDistribution
                        .reduce((sum, item) => sum + Number.parseFloat(item.total_cost_this_month), 0)
                        .toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Cost/Member</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      $
                      {(
                        costDistribution.reduce((sum, item) => sum + Number.parseFloat(item.total_cost_this_month), 0) /
                        costDistribution.length
                      ).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Per member</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Meals Served</CardTitle>
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {costDistribution.reduce((sum, item) => sum + item.total_meals_this_month, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      $
                      {costDistribution
                        .reduce((sum, item) => sum + Number.parseFloat(item.outstanding_balance), 0)
                        .toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total due</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Member Cost Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-8 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                      <div className="col-span-2">Member</div>
                      <div className="text-center">Total Meals</div>
                      <div className="text-center">Lunch</div>
                      <div className="text-center">Dinner</div>
                      <div className="text-center">Total Cost</div>
                      <div className="text-center">Avg/Day</div>
                      <div className="text-center">Outstanding</div>
                    </div>

                    {costDistribution.map((item) => (
                      <div key={item.member.id} className="grid grid-cols-8 gap-4 items-center py-2 border-b">
                        <div className="col-span-2 flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={item.member.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {item.member.user.first_name[0]}
                              {item.member.user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{item.member_name}</p>
                            <Badge
                              variant={item.member.member_type === "employee" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {item.member.member_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-center font-medium">{item.total_meals_this_month}</div>
                        <div className="text-center">{item.lunch_meals}</div>
                        <div className="text-center">{item.dinner_meals}</div>
                        <div className="text-center font-medium">${item.total_cost_this_month}</div>
                        <div className="text-center">${item.average_daily_cost}</div>
                        <div className="text-center">
                          <Badge variant={Number.parseFloat(item.outstanding_balance) > 0 ? "destructive" : "default"}>
                            ${item.outstanding_balance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportView === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Monthly Billing Summary -{" "}
                  {new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-8 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                    <div className="col-span-2">Member</div>
                    <div className="text-center">Opening Balance</div>
                    <div className="text-center">Deposit</div>
                    <div className="text-center">Consumption</div>
                    <div className="text-center">Closing Balance</div>
                    <div className="text-center">Due Amount</div>
                    <div className="text-center">Status</div>
                  </div>

                  {monthlyBilling.map((bill) => (
                    <div key={bill.member.id} className="grid grid-cols-8 gap-4 items-center py-2 border-b">
                      <div className="col-span-2 flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={bill.member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {bill.member.user.first_name[0]}
                            {bill.member.user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{bill.member_name}</p>
                          <Badge
                            variant={bill.member.member_type === "employee" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {bill.member.member_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-center">${bill.opening_balance}</div>
                      <div className="text-center">${bill.monthly_deposit}</div>
                      <div className="text-center">${bill.total_consumption}</div>
                      <div className="text-center font-medium">${bill.closing_balance}</div>
                      <div className="text-center">
                        <Badge variant={Number.parseFloat(bill.due_amount) > 0 ? "destructive" : "default"}>
                          ${bill.due_amount}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Badge variant={bill.payment_status === "paid" ? "default" : "secondary"}>
                          {bill.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {reportView === "payments" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.slice(0, 20).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={payment.member.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {payment.member.user.first_name[0]}
                            {payment.member.user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payment.member_name}</p>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                          <Badge
                            variant={payment.payment_type === "deposit" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {payment.payment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">${payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                        </p>
                        <Badge variant="default" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {reportView === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Daily Cost:</span>
                        <span className="font-medium">$12.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak Day Cost:</span>
                        <span className="font-medium">$18.75</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lowest Day Cost:</span>
                        <span className="font-medium">$8.25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost Efficiency:</span>
                        <span className="font-medium">92%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Participation Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Participation:</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lunch Participation:</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dinner Participation:</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular Members:</span>
                        <span className="font-medium">12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">$2,450.00</p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">$2,180.00</p>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">$270.00</p>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboardContent()
      case "members":
        return renderMembersContent()
      case "deposits":
        return renderDepositsContent()
      case "meals":
        return renderMealsContent()
      case "reports":
        return renderReportsContent()
      case "shopping":
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Fixed Sidebar */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Meal Manager</h2>
              <p className="text-sm text-muted-foreground">Office Kitchen</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-sidebar-border">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(item.id as ActiveSection)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar>
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {user?.user.first_name[0]}
                {user?.user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sidebar-foreground">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{renderContent()}</div>
      </div>
    </div>
  )
}
