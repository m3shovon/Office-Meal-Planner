"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Calendar,
  Clock,
  DollarSign,
  Users,
  ChefHat,
  Loader2,
  CalendarDays,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { apiService } from "@/lib/api-services"
import type { Meal, Ingredient } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    meal_type: "lunch" as "breakfast" | "lunch" | "dinner" | "snack",
    scheduled_date: "",
    scheduled_time: "",
    estimated_cost: "",
    serves: "",
    dietary_tags: "",
    preparation_time: "",
    cooking_instructions: "",
    status: "planned" as "planned" | "approved" | "prepared" | "cancelled",
  })

  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredient_id: number; quantity: string; unit: string }>
  >([])

  useEffect(() => {
    fetchMeals()
    fetchIngredients()
  }, [])

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMeals()
      setMeals(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch meals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const data = await apiService.getIngredients()
      setIngredients(data)
    } catch (error) {
      console.error("Failed to fetch ingredients:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const mealData = {
        ...formData,
        estimated_cost: Number.parseFloat(formData.estimated_cost) || 0,
        serves: Number.parseInt(formData.serves) || 1,
        preparation_time: Number.parseInt(formData.preparation_time) || 0,
        scheduled_datetime:
          formData.scheduled_date && formData.scheduled_time
            ? `${formData.scheduled_date}T${formData.scheduled_time}:00`
            : null,
        ingredients: selectedIngredients,
      }

      if (editingMeal) {
        await apiService.updateMeal(editingMeal.id, mealData)
        toast({
          title: "Success",
          description: "Meal updated successfully",
        })
      } else {
        await apiService.createMeal(mealData)
        toast({
          title: "Success",
          description: "Meal created successfully",
        })
      }

      resetForm()
      fetchMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: editingMeal ? "Failed to update meal" : "Failed to create meal",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteMeal(id)
      toast({
        title: "Success",
        description: "Meal deleted successfully",
      })
      fetchMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meal",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (mealId: number, newStatus: string) => {
    try {
      await apiService.updateMeal(mealId, { status: newStatus })
      toast({
        title: "Success",
        description: "Meal status updated successfully",
      })
      fetchMeals()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meal status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      meal_type: "lunch",
      scheduled_date: "",
      scheduled_time: "",
      estimated_cost: "",
      serves: "",
      dietary_tags: "",
      preparation_time: "",
      cooking_instructions: "",
      status: "planned",
    })
    setSelectedIngredients([])
    setEditingMeal(null)
    setIsAddDialogOpen(false)
  }

  const openEditDialog = (meal: Meal) => {
    const scheduledDate = meal.scheduled_datetime ? new Date(meal.scheduled_datetime) : null
    setFormData({
      name: meal.name,
      description: meal.description || "",
      meal_type: meal.meal_type,
      scheduled_date: scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : "",
      scheduled_time: scheduledDate ? format(scheduledDate, "HH:mm") : "",
      estimated_cost: meal.estimated_cost?.toString() || "",
      serves: meal.serves?.toString() || "",
      dietary_tags: meal.dietary_tags || "",
      preparation_time: meal.preparation_time?.toString() || "",
      cooking_instructions: meal.cooking_instructions || "",
      status: meal.status,
    })
    setSelectedIngredients(
      meal.ingredients?.map((ing) => ({
        ingredient_id: ing.ingredient.id,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
      })) || [],
    )
    setEditingMeal(meal)
    setIsAddDialogOpen(true)
  }

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: 0, quantity: "", unit: "" }])
  }

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string | number) => {
    const updated = [...selectedIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedIngredients(updated)
  }

  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || meal.status === filterStatus
    const matchesType = filterType === "all" || meal.meal_type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: meals.length,
    planned: meals.filter((m) => m.status === "planned").length,
    approved: meals.filter((m) => m.status === "approved").length,
    prepared: meals.filter((m) => m.status === "prepared").length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planned":
        return <AlertCircle className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "prepared":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "prepared":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Meals</h1>
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
        <h1 className="text-3xl font-bold">Meals</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMeal ? "Edit Meal" : "Add New Meal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Meal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="meal_type">Meal Type</Label>
                  <Select
                    value={formData.meal_type}
                    onValueChange={(value: "breakfast" | "lunch" | "dinner" | "snack") =>
                      setFormData({ ...formData, meal_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Scheduled Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="serves">Serves</Label>
                  <Input
                    id="serves"
                    type="number"
                    value={formData.serves}
                    onChange={(e) => setFormData({ ...formData, serves: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="preparation_time">Prep Time (min)</Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dietary_tags">Dietary Tags</Label>
                <Input
                  id="dietary_tags"
                  value={formData.dietary_tags}
                  onChange={(e) => setFormData({ ...formData, dietary_tags: e.target.value })}
                  placeholder="e.g., vegetarian, gluten-free, dairy-free"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "planned" | "approved" | "prepared" | "cancelled") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ingredients Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ingredients</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ingredient
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Select
                        value={ingredient.ingredient_id.toString()}
                        onValueChange={(value) => updateIngredient(index, "ingredient_id", Number.parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id.toString()}>
                              {ing.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Qty"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                        className="w-20"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeIngredient(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="cooking_instructions">Cooking Instructions</Label>
                <Textarea
                  id="cooking_instructions"
                  value={formData.cooking_instructions}
                  onChange={(e) => setFormData({ ...formData, cooking_instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingMeal ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prepared</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prepared}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for List/Calendar View */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
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
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="prepared">Prepared</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Meal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{meal.meal_type}</Badge>
                        <Badge className={getStatusColor(meal.status)}>
                          {getStatusIcon(meal.status)}
                          <span className="ml-1 capitalize">{meal.status}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(meal)}>
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
                            <AlertDialogTitle>Delete Meal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{meal.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(meal.id)}
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
                  {meal.description && <p className="text-sm text-muted-foreground">{meal.description}</p>}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {meal.scheduled_datetime && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(meal.scheduled_datetime), "MMM dd, yyyy")}</span>
                      </div>
                    )}

                    {meal.scheduled_datetime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(meal.scheduled_datetime), "HH:mm")}</span>
                      </div>
                    )}

                    {meal.estimated_cost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${meal.estimated_cost}</span>
                      </div>
                    )}

                    {meal.serves && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Serves {meal.serves}</span>
                      </div>
                    )}
                  </div>

                  {meal.dietary_tags && (
                    <div className="flex flex-wrap gap-1">
                      {meal.dietary_tags.split(",").map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {meal.status === "planned" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(meal.id, "approved")}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(meal.id, "cancelled")}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {meal.status === "approved" && (
                    <Button size="sm" onClick={() => handleStatusChange(meal.id, "prepared")} className="w-full">
                      Mark as Prepared
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMeals.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No meals found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first meal"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="text-center py-12">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">Calendar View</h3>
            <p className="mt-1 text-sm text-muted-foreground">Calendar view will be implemented in the next update</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
