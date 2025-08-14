from django.contrib import admin
from .models import Member, Meal, Ingredient, ShoppingList, ShoppingItem, Expense, Budget


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'status', 'join_date']
    list_filter = ['role', 'status', 'join_date']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']


class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ['name', 'meal_type', 'date', 'time', 'status', 'estimated_cost', 'created_by']
    list_filter = ['meal_type', 'status', 'date', 'created_by']
    search_fields = ['name', 'description']
    inlines = [IngredientInline]


class ShoppingItemInline(admin.TabularInline):
    model = ShoppingItem
    extra = 1


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ['name', 'date_needed', 'status', 'total_estimated_cost', 'created_by']
    list_filter = ['status', 'date_needed', 'created_by']
    search_fields = ['name']
    inlines = [ShoppingItemInline]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'category', 'date', 'status', 'submitted_by']
    list_filter = ['category', 'status', 'date', 'submitted_by']
    search_fields = ['title', 'description']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'total_amount', 'spent_amount', 'remaining_amount', 'start_date', 'end_date']
    list_filter = ['start_date', 'end_date', 'created_by']
    search_fields = ['name']
