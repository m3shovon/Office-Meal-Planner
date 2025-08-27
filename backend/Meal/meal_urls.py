# meal_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .meal_views import (
    MemberViewSet,
    MealViewSet,
    ShoppingListViewSet,
    ExpenseViewSet,
    BudgetViewSet,
    DashboardStatsView,
    MonthlyDepositViewSet,
    DailyMealCostViewSet,
    MemberMealTrackingViewSet
)

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'meals', MealViewSet)
router.register(r'shopping-lists', ShoppingListViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'deposits', MonthlyDepositViewSet)
router.register(r'daily-costs', DailyMealCostViewSet)
router.register(r'meal-tracking', MemberMealTrackingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
