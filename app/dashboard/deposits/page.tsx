"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  History,
} from "lucide-react"
import { apiService } from "@/lib/api-services"
import type { MonthlyDeposit, Member } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<MonthlyDeposit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<MonthlyDeposit | null>(null)
  const [activeTab, setActiveTab] = useState("deposits")

  // Form state
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    month: "",
    year: new Date().getFullYear().toString(),
    payment_method: "cash" as "cash" | "bank_transfer" | "card" | "online",
    notes: "",
    status: "pending" as "pending" | "received" | "overdue",
  })

  useEffect(() => {
    fetchDeposits()
    fetchMembers()
  }, [])

  const fetchDeposits = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMonthlyDeposits()
      setDeposits(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deposits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const data = await apiService.getMembers()
      setMembers(data.filter((member) => member.is_active))
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const depositData = {
        ...formData,
        member_id: Number.parseInt(formData.member_id),
        amount: Number.parseFloat(formData.amount),
        year: Number.parseInt(formData.year),
      }

      if (editingDeposit) {
        await apiService.updateMonthlyDeposit(editingDeposit.id, depositData)
        toast({
          title: "Success",
          description: "Deposit updated successfully",
        })
      } else {
        await apiService.createMonthlyDeposit(depositData)
        toast({
          title: "Success",
          description: "Deposit created successfully",
        })
      }

      resetForm()
      fetchDeposits()
    } catch (error) {
      toast({
        title: "Error",
        description: editingDeposit ? "Failed to update deposit" : "Failed to create deposit",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteMonthlyDeposit(id)
      toast({
        title: "Success",
        description: "Deposit deleted successfully",
      })
      fetchDeposits()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deposit",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (depositId: number, newStatus: string) => {
    try {
      await apiService.updateMonthlyDeposit(depositId, { status: newStatus })
      toast({
        title: "Success",
        description: "Deposit status updated successfully",
      })
      fetchDeposits()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deposit status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      member_id: "",
      amount: "",
      month: "",
      year: new Date().getFullYear().toString(),
      payment_method: "cash",
      notes: "",
      status: "pending",
    })
    setEditingDeposit(null)
    setIsAddDialogOpen(false)
  }

  const openEditDialog = (deposit: MonthlyDeposit) => {
    setFormData({
      member_id: deposit.member.id.toString(),
      amount: deposit.amount.toString(),
      month: deposit.month,
      year: deposit.year.toString(),
      payment_method: deposit.payment_method,
      notes: deposit.notes || "",
      status: deposit.status,
    })
    setEditingDeposit(deposit)
    setIsAddDialogOpen(true)
  }

  const filteredDeposits = deposits.filter((deposit) => {
    const memberName = `${deposit.member.first_name} ${deposit.member.last_name}`.toLowerCase()
    const matchesSearch = memberName.includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || deposit.status === filterStatus
    const matchesMonth = filterMonth === "all" || deposit.month === filterMonth

    return matchesSearch && matchesStatus && matchesMonth
  })

  // Calculate member balances
  const memberBalances = members.map((member) => {
    const memberDeposits = deposits.filter((d) => d.member.id === member.id)
    const totalDeposited = memberDeposits.reduce((sum, d) => sum + (d.status === "received" ? d.amount : 0), 0)
    const pendingAmount = memberDeposits.reduce((sum, d) => sum + (d.status === "pending" ? d.amount : 0), 0)
    const overdueAmount = memberDeposits.reduce((sum, d) => sum + (d.status === "overdue" ? d.amount : 0), 0)

    return {
      member,
      totalDeposited,
      pendingAmount,
      overdueAmount,
      currentBalance: totalDeposited, // This would be calculated with meal costs in real implementation
      lastDeposit: memberDeposits.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0],
    }
  })

  const stats = {
    totalDeposits: deposits.reduce((sum, d) => sum + (d.status === "received" ? d.amount : 0), 0),
    pendingDeposits: deposits.reduce((sum, d) => sum + (d.status === "pending" ? d.amount : 0), 0),
    overdueDeposits: deposits.reduce((sum, d) => sum + (d.status === "overdue" ? d.amount : 0), 0),
    totalMembers: memberBalances.length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "overdue":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deposits</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deposits</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDeposit ? "Edit Deposit" : "Add New Deposit"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="member_id">Member</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: "cash" | "bank_transfer" | "card" | "online") =>
                      setFormData({ ...formData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "pending" | "received" | "overdue") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingDeposit ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.overdueDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Deposits/Balances */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deposits">
            <CreditCard className="h-4 w-4 mr-2" />
            Deposits
          </TabsTrigger>
          <TabsTrigger value="balances">
            <DollarSign className="h-4 w-4 mr-2" />
            Member Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deposits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeposits.map((deposit) => (
              <Card key={deposit.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/generic-placeholder-icon.png?height=40&width=40`} />
                        <AvatarFallback>
                          {deposit.member.first_name[0]}
                          {deposit.member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {deposit.member.first_name} {deposit.member.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {deposit.month} {deposit.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(deposit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Deposit</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this deposit record? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(deposit.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${deposit.amount}</span>
                    <Badge className={getStatusColor(deposit.status)}>
                      {getStatusIcon(deposit.status)}
                      <span className="ml-1 capitalize">{deposit.status}</span>
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">{deposit.payment_method.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(deposit.created_at), "MMM dd, yyyy")}</span>
                    </div>
                  </div>

                  {deposit.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes: </span>
                      <span className="text-muted-foreground">{deposit.notes}</span>
                    </div>
                  )}

                  {deposit.status === "pending" && (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleStatusChange(deposit.id, "received")} className="flex-1">
                        Mark Received
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(deposit.id, "overdue")}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Mark Overdue
                      </Button>
                    </div>
                  )}

                  {deposit.status === "overdue" && (
                    <Button size="sm" onClick={() => handleStatusChange(deposit.id, "received")} className="w-full">
                      Mark as Received
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDeposits.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No deposits found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterMonth !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first deposit"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {/* Member Balances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberBalances.map((balance) => (
              <Card key={balance.member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/generic-placeholder-icon.png?height=48&width=48`} />
                      <AvatarFallback>
                        {balance.member.first_name[0]}
                        {balance.member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {balance.member.first_name} {balance.member.last_name}
                      </h3>
                      <Badge variant={balance.member.member_type === "employee" ? "default" : "secondary"}>
                        {balance.member.member_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Deposited</p>
                      <p className="text-lg font-semibold text-green-600">${balance.totalDeposited.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Balance</p>
                      <p className="text-lg font-semibold">${balance.currentBalance.toFixed(2)}</p>
                    </div>
                  </div>

                  {balance.pendingAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending:</span>
                      <span className="text-yellow-600 font-medium">${balance.pendingAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {balance.overdueAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overdue:</span>
                      <span className="text-red-600 font-medium">${balance.overdueAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {balance.lastDeposit && (
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <History className="h-4 w-4" />
                        <span>
                          Last deposit: {balance.lastDeposit.month} {balance.lastDeposit.year}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {memberBalances.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No member balances found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add some members to see their balance information</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
