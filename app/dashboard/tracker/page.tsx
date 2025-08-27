"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Save,
  Users,
  DollarSign,
  UtensilsCrossed,
  Calculator,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react"
import { apiService } from "@/lib/api-services"
import type { Member, DailyMealCost } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface MemberTrackingData {
  member: Member
  lunchCount: number
  dinnerCount: number
  totalCost: number
  notes: string
}

export default function DailyTrackerPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [members, setMembers] = useState<Member[]>([])
  const [dailyCost, setDailyCost] = useState<DailyMealCost | null>(null)
  const [memberTracking, setMemberTracking] = useState<MemberTrackingData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Daily cost form
  const [lunchCost, setLunchCost] = useState("")
  const [dinnerCost, setDinnerCost] = useState("")
  const [isEditingCosts, setIsEditingCosts] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchDailyData()
    }
  }, [selectedDate])

  const fetchMembers = async () => {
    try {
      const data = await apiService.getMembers()
      setMembers(data.filter((member) => member.is_active))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch members",
        variant: "destructive",
      })
    }
  }

  const fetchDailyData = async () => {
    try {
      setLoading(true)

      // Fetch daily meal cost
      const costs = await apiService.getDailyMealCosts()
      const todayCost = costs.find((cost) => cost.date === selectedDate)
      setDailyCost(todayCost || null)

      if (todayCost) {
        setLunchCost(todayCost.lunch_cost.toString())
        setDinnerCost(todayCost.dinner_cost.toString())
      } else {
        setLunchCost("")
        setDinnerCost("")
      }

      // Fetch member meal tracking
      const tracking = await apiService.getMemberMealTracking()
      const todayTracking = tracking.filter((track) => track.date === selectedDate)

      // Initialize member tracking data
      const trackingData = members.map((member) => {
        const existingTrack = todayTracking.find((track) => track.member.id === member.id)
        return {
          member,
          lunchCount: existingTrack?.lunch_count || 0,
          dinnerCount: existingTrack?.dinner_count || 0,
          totalCost: existingTrack?.total_cost || 0,
          notes: existingTrack?.notes || "",
        }
      })

      setMemberTracking(trackingData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch daily data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveDailyCosts = async () => {
    try {
      const costData = {
        date: selectedDate,
        lunch_cost: Number.parseFloat(lunchCost) || 0,
        dinner_cost: Number.parseFloat(dinnerCost) || 0,
      }

      if (dailyCost) {
        await apiService.updateDailyMealCost(dailyCost.id, costData)
      } else {
        await apiService.createDailyMealCost(costData)
      }

      toast({
        title: "Success",
        description: "Daily costs saved successfully",
      })

      setIsEditingCosts(false)
      fetchDailyData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save daily costs",
        variant: "destructive",
      })
    }
  }

  const updateMemberCount = (memberIndex: number, mealType: "lunch" | "dinner", change: number) => {
    const updated = [...memberTracking]
    const currentCount = mealType === "lunch" ? updated[memberIndex].lunchCount : updated[memberIndex].dinnerCount

    const newCount = Math.max(0, Math.min(2, currentCount + change))

    if (mealType === "lunch") {
      updated[memberIndex].lunchCount = newCount
    } else {
      updated[memberIndex].dinnerCount = newCount
    }

    // Recalculate total cost
    const lunchCostPerMeal = Number.parseFloat(lunchCost) || 0
    const dinnerCostPerMeal = Number.parseFloat(dinnerCost) || 0
    const totalLunchParticipants = updated.reduce((sum, m) => sum + m.lunchCount, 0)
    const totalDinnerParticipants = updated.reduce((sum, m) => sum + m.dinnerCount, 0)

    updated.forEach((member) => {
      const memberLunchCost =
        totalLunchParticipants > 0 ? (lunchCostPerMeal * member.lunchCount) / totalLunchParticipants : 0
      const memberDinnerCost =
        totalDinnerParticipants > 0 ? (dinnerCostPerMeal * member.dinnerCount) / totalDinnerParticipants : 0
      member.totalCost = memberLunchCost + memberDinnerCost
    })

    setMemberTracking(updated)
  }

  const setMemberCount = (memberIndex: number, mealType: "lunch" | "dinner", count: number) => {
    const updated = [...memberTracking]

    if (mealType === "lunch") {
      updated[memberIndex].lunchCount = count
    } else {
      updated[memberIndex].dinnerCount = count
    }

    // Recalculate total cost
    const lunchCostPerMeal = Number.parseFloat(lunchCost) || 0
    const dinnerCostPerMeal = Number.parseFloat(dinnerCost) || 0
    const totalLunchParticipants = updated.reduce((sum, m) => sum + m.lunchCount, 0)
    const totalDinnerParticipants = updated.reduce((sum, m) => sum + m.dinnerCount, 0)

    updated.forEach((member) => {
      const memberLunchCost =
        totalLunchParticipants > 0 ? (lunchCostPerMeal * member.lunchCount) / totalLunchParticipants : 0
      const memberDinnerCost =
        totalDinnerParticipants > 0 ? (dinnerCostPerMeal * member.dinnerCount) / totalDinnerParticipants : 0
      member.totalCost = memberLunchCost + memberDinnerCost
    })

    setMemberTracking(updated)
  }

  const updateMemberNotes = (memberIndex: number, notes: string) => {
    const updated = [...memberTracking]
    updated[memberIndex].notes = notes
    setMemberTracking(updated)
  }

  const saveAllTracking = async () => {
    try {
      setSaving(true)

      // First ensure daily costs are saved
      if (!dailyCost && (lunchCost || dinnerCost)) {
        await saveDailyCosts()
      }

      // Save member tracking data
      const trackingPromises = memberTracking.map((data) => {
        const trackingData = {
          member_id: data.member.id,
          date: selectedDate,
          lunch_count: data.lunchCount,
          dinner_count: data.dinnerCount,
          total_cost: data.totalCost,
          notes: data.notes,
        }

        return apiService.createOrUpdateMemberMealTracking(trackingData)
      })

      await Promise.all(trackingPromises)

      toast({
        title: "Success",
        description: "All meal tracking data saved successfully",
      })

      fetchDailyData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tracking data",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const setAllMembersCount = (mealType: "lunch" | "dinner", count: number) => {
    const updated = memberTracking.map((member) => ({
      ...member,
      [mealType === "lunch" ? "lunchCount" : "dinnerCount"]: count,
    }))

    // Recalculate costs
    const lunchCostPerMeal = Number.parseFloat(lunchCost) || 0
    const dinnerCostPerMeal = Number.parseFloat(dinnerCost) || 0
    const totalLunchParticipants = updated.reduce((sum, m) => sum + m.lunchCount, 0)
    const totalDinnerParticipants = updated.reduce((sum, m) => sum + m.dinnerCount, 0)

    updated.forEach((member) => {
      const memberLunchCost =
        totalLunchParticipants > 0 ? (lunchCostPerMeal * member.lunchCount) / totalLunchParticipants : 0
      const memberDinnerCost =
        totalDinnerParticipants > 0 ? (dinnerCostPerMeal * member.dinnerCount) / totalDinnerParticipants : 0
      member.totalCost = memberLunchCost + memberDinnerCost
    })

    setMemberTracking(updated)
  }

  // Calculate summary statistics
  const summary = {
    totalLunchParticipants: memberTracking.reduce((sum, m) => sum + m.lunchCount, 0),
    totalDinnerParticipants: memberTracking.reduce((sum, m) => sum + m.dinnerCount, 0),
    totalCost: memberTracking.reduce((sum, m) => sum + m.totalCost, 0),
    totalMembers: memberTracking.filter((m) => m.lunchCount > 0 || m.dinnerCount > 0).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Meal Tracker</h1>
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
        <h1 className="text-3xl font-bold">Daily Meal Tracker</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={fetchDailyData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={saveAllTracking} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Select Date</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Badge variant="outline" className="text-sm">
              {format(new Date(selectedDate), "EEEE, MMMM dd, yyyy")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Daily Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Daily Meal Costs</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingCosts(!isEditingCosts)}
              disabled={!lunchCost && !dinnerCost && !isEditingCosts}
            >
              {isEditingCosts ? "Cancel" : "Edit Costs"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="lunch_cost">Lunch Cost ($)</Label>
              <Input
                id="lunch_cost"
                type="number"
                step="0.01"
                value={lunchCost}
                onChange={(e) => setLunchCost(e.target.value)}
                disabled={!isEditingCosts}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="dinner_cost">Dinner Cost ($)</Label>
              <Input
                id="dinner_cost"
                type="number"
                step="0.01"
                value={dinnerCost}
                onChange={(e) => setDinnerCost(e.target.value)}
                disabled={!isEditingCosts}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              {isEditingCosts && (
                <Button onClick={saveDailyCosts} className="w-full">
                  Save Costs
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lunch Participants</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLunchParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dinner Participants</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDinnerParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setAllMembersCount("lunch", 1)}>
              All Lunch (1x)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAllMembersCount("dinner", 1)}>
              All Dinner (1x)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAllMembersCount("lunch", 0)}>
              Clear Lunch
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAllMembersCount("dinner", 0)}>
              Clear Dinner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAllMembersCount("lunch", 0)
                setAllMembersCount("dinner", 0)
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Member Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Member Meal Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberTracking.map((data, index) => (
              <div key={data.member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/generic-placeholder-icon.png?height=40&width=40`} />
                      <AvatarFallback>
                        {data.member.first_name[0]}
                        {data.member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {data.member.first_name} {data.member.last_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={data.member.member_type === "employee" ? "default" : "secondary"}>
                          {data.member.member_type}
                        </Badge>
                        {(data.lunchCount > 0 || data.dinnerCount > 0) && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Participating
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${data.totalCost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lunch Count */}
                  <div className="space-y-2">
                    <Label>Lunch Count</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMemberCount(index, "lunch", -1)}
                        disabled={data.lunchCount === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Select
                        value={data.lunchCount.toString()}
                        onValueChange={(value) => setMemberCount(index, "lunch", Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMemberCount(index, "lunch", 1)}
                        disabled={data.lunchCount === 2}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-1">
                        {data.lunchCount === 0 && <XCircle className="h-4 w-4 text-red-500" />}
                        {data.lunchCount === 1 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {data.lunchCount === 2 && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dinner Count */}
                  <div className="space-y-2">
                    <Label>Dinner Count</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMemberCount(index, "dinner", -1)}
                        disabled={data.dinnerCount === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Select
                        value={data.dinnerCount.toString()}
                        onValueChange={(value) => setMemberCount(index, "dinner", Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMemberCount(index, "dinner", 1)}
                        disabled={data.dinnerCount === 2}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-1">
                        {data.dinnerCount === 0 && <XCircle className="h-4 w-4 text-red-500" />}
                        {data.dinnerCount === 1 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {data.dinnerCount === 2 && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <Label htmlFor={`notes-${data.member.id}`}>Notes</Label>
                  <Input
                    id={`notes-${data.member.id}`}
                    value={data.notes}
                    onChange={(e) => updateMemberNotes(index, e.target.value)}
                    placeholder="Optional notes for this member..."
                  />
                </div>
              </div>
            ))}
          </div>

          {memberTracking.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No members found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add some active members to start tracking meals</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
