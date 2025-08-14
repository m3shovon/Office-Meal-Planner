from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from ..models import Member, Meal, ShoppingList, ShoppingItem, Expense, Budget, MonthlyDeposit, DailyMealCost, MemberMealTracking
from ..serializers.meal_serializers import (
    MealSerializer, MealCreateSerializer,
    ShoppingListSerializer, ShoppingListCreateSerializer, ShoppingItemSerializer,
    ExpenseSerializer, BudgetSerializer, DashboardStatsSerializer,
    MonthlyDepositSerializer, DailyMealCostSerializer, MemberMealTrackingSerializer,
    MemberMealTrackingBulkSerializer, MemberDetailSerializer
)
from ..serializers.auth_serializers import MemberSerializer


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'status', 'member_type']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['join_date', 'user__first_name']
    ordering = ['-join_date']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MemberDetailSerializer
        return MemberSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            # Add role-based permissions here if needed
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]


class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['meal_type', 'status', 'date']
    search_fields = ['name', 'description']
    ordering_fields = ['date', 'time', 'created_at']
    ordering = ['-date', '-time']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MealCreateSerializer
        return MealSerializer
    
    def get_queryset(self):
        queryset = Meal.objects.all()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        meal = self.get_object()
        if meal.status == 'planned':
            meal.status = 'approved'
            meal.save()
            return Response({'message': 'Meal approved successfully'})
        return Response({'error': 'Meal cannot be approved'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        meal = self.get_object()
        actual_cost = request.data.get('actual_cost')
        
        if meal.status == 'approved':
            meal.status = 'prepared'
            if actual_cost:
                meal.actual_cost = actual_cost
            meal.save()
            return Response({'message': 'Meal marked as prepared'})
        return Response({'error': 'Meal cannot be completed'}, status=status.HTTP_400_BAD_REQUEST)


class MonthlyDepositViewSet(viewsets.ModelViewSet):
    queryset = MonthlyDeposit.objects.all()
    serializer_class = MonthlyDepositSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['member', 'month']
    search_fields = ['member__user__first_name', 'member__user__last_name']
    ordering_fields = ['month', 'deposit_date', 'amount']
    ordering = ['-month']
    
    def perform_create(self, serializer):
        deposit = serializer.save()
        # Update member's current balance
        member = deposit.member
        member.current_balance += deposit.amount
        member.save()


class DailyMealCostViewSet(viewsets.ModelViewSet):
    queryset = DailyMealCost.objects.all()
    serializer_class = DailyMealCostSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date']
    ordering_fields = ['date']
    ordering = ['-date']
    
    def perform_update(self, serializer):
        daily_cost = serializer.save()
        # Update all member meal tracking for this date
        tracking_records = MemberMealTracking.objects.filter(date=daily_cost.date)
        for tracking in tracking_records:
            tracking.save()  # This will trigger the cost recalculation


class MemberMealTrackingViewSet(viewsets.ModelViewSet):
    queryset = MemberMealTracking.objects.all()
    serializer_class = MemberMealTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['member', 'date', 'is_paid']
    search_fields = ['member__user__first_name', 'member__user__last_name']
    ordering_fields = ['date', 'total_cost']
    ordering = ['-date']
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update meal tracking for multiple members on a specific date"""
        serializer = MemberMealTrackingBulkSerializer(data=request.data)
        if serializer.is_valid():
            date = serializer.validated_data['date']
            member_tracking = serializer.validated_data['member_tracking']
            
            updated_records = []
            for item in member_tracking:
                member_id = item['member_id']
                lunch_count = item['lunch_count']
                dinner_count = item['dinner_count']
                
                try:
                    member = Member.objects.get(id=member_id)
                    tracking, created = MemberMealTracking.objects.get_or_create(
                        member=member,
                        date=date,
                        defaults={
                            'lunch_count': lunch_count,
                            'dinner_count': dinner_count
                        }
                    )
                    
                    if not created:
                        tracking.lunch_count = lunch_count
                        tracking.dinner_count = dinner_count
                        tracking.save()
                    
                    updated_records.append(tracking)
                    
                except Member.DoesNotExist:
                    continue
            
            # Update daily meal cost participant counts
            try:
                daily_cost = DailyMealCost.objects.get(date=date)
                daily_cost.lunch_participants = MemberMealTracking.objects.filter(
                    date=date, lunch_count__gt=0
                ).count()
                daily_cost.dinner_participants = MemberMealTracking.objects.filter(
                    date=date, dinner_count__gt=0
                ).count()
                daily_cost.save()
            except DailyMealCost.DoesNotExist:
                pass
            
            return Response({
                'message': f'Updated {len(updated_records)} meal tracking records',
                'updated_count': len(updated_records)
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def process_payments(self, request):
        """Process payments and update member balances"""
        date = request.data.get('date')
        if not date:
            return Response({'error': 'Date is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        tracking_records = MemberMealTracking.objects.filter(date=date, is_paid=False)
        processed_count = 0
        
        for tracking in tracking_records:
            member = tracking.member
            if member.current_balance >= tracking.total_cost:
                member.current_balance -= tracking.total_cost
                member.save()
                tracking.is_paid = True
                tracking.save()
                processed_count += 1
        
        return Response({
            'message': f'Processed payments for {processed_count} members',
            'processed_count': processed_count,
            'total_records': tracking_records.count()
        })


class ShoppingListViewSet(viewsets.ModelViewSet):
    queryset = ShoppingList.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'date_needed']
    search_fields = ['name']
    ordering_fields = ['date_created', 'date_needed']
    ordering = ['-date_created']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShoppingListCreateSerializer
        return ShoppingListSerializer
    
    @action(detail=True, methods=['post'])
    def mark_item_purchased(self, request, pk=None):
        shopping_list = self.get_object()
        item_id = request.data.get('item_id')
        actual_cost = request.data.get('actual_cost')
        
        try:
            item = shopping_list.items.get(id=item_id)
            item.is_purchased = True
            if actual_cost:
                item.actual_cost = actual_cost
            item.save()
            
            # Update shopping list total actual cost
            total_actual = shopping_list.items.filter(
                is_purchased=True, 
                actual_cost__isnull=False
            ).aggregate(Sum('actual_cost'))['actual_cost__sum'] or 0
            
            shopping_list.total_actual_cost = total_actual
            shopping_list.save()
            
            return Response({'message': 'Item marked as purchased'})
        except ShoppingItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def generate_from_meals(self, request, pk=None):
        """Generate shopping list from approved meals"""
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not start_date or not end_date:
            return Response({'error': 'Start and end dates are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get approved meals in date range
        meals = Meal.objects.filter(
            status='approved',
            date__range=[start_date, end_date]
        ).prefetch_related('ingredients')
        
        shopping_list = self.get_object()
        
        # Aggregate ingredients
        ingredient_totals = {}
        for meal in meals:
            for ingredient in meal.ingredients.all():
                key = f"{ingredient.name}_{ingredient.unit}"
                if key in ingredient_totals:
                    ingredient_totals[key]['quantity'] += ingredient.quantity
                    ingredient_totals[key]['cost'] += ingredient.estimated_cost
                else:
                    ingredient_totals[key] = {
                        'name': ingredient.name,
                        'quantity': ingredient.quantity,
                        'unit': ingredient.unit,
                        'cost': ingredient.estimated_cost
                    }
        
        # Create shopping items
        total_cost = 0
        for item_data in ingredient_totals.values():
            ShoppingItem.objects.create(
                shopping_list=shopping_list,
                name=item_data['name'],
                quantity=item_data['quantity'],
                unit=item_data['unit'],
                estimated_cost=item_data['cost']
            )
            total_cost += item_data['cost']
        
        shopping_list.total_estimated_cost = total_cost
        shopping_list.save()
        
        return Response({'message': f'Generated {len(ingredient_totals)} items from {meals.count()} meals'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'date']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if expense.status == 'pending':
            expense.status = 'approved'
            expense.approved_by = request.user.member
            expense.save()
            return Response({'message': 'Expense approved successfully'})
        return Response({'error': 'Expense cannot be approved'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expense = self.get_object()
        if expense.status == 'pending':
            expense.status = 'rejected'
            expense.approved_by = request.user.member
            expense.save()
            return Response({'message': 'Expense rejected'})
        return Response({'error': 'Expense cannot be rejected'}, status=status.HTTP_400_BAD_REQUEST)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['start_date', 'total_amount', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        queryset = Budget.objects.all()
        
        # Filter by active budgets
        active_only = self.request.query_params.get('active_only')
        if active_only:
            today = timezone.now().date()
            queryset = queryset.filter(start_date__lte=today, end_date__gte=today)
        
        return queryset


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Member stats
        total_members = Member.objects.count()
        active_members = Member.objects.filter(status='active').count()
        employee_members = Member.objects.filter(member_type='employee').count()
        guest_members = Member.objects.filter(member_type='guest').count()
        
        # Meal stats
        total_meals_this_week = Meal.objects.filter(
            date__gte=week_start,
            date__lte=today
        ).count()
        
        total_meals_this_month = Meal.objects.filter(
            date__gte=month_start,
            date__lte=today
        ).count()
        
        # Expense stats
        pending_expenses = Expense.objects.filter(status='pending').count()
        
        # Budget stats
        current_budgets = Budget.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        )
        
        total_budget = current_budgets.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        spent_budget = current_budgets.aggregate(Sum('spent_amount'))['spent_amount__sum'] or 0
        
        budget_utilization = 0
        if total_budget > 0:
            budget_utilization = (spent_budget / total_budget) * 100
        
        # Deposit and meal cost stats
        total_deposits_this_month = MonthlyDeposit.objects.filter(
            month__year=today.year,
            month__month=today.month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_meal_costs_this_month = MemberMealTracking.objects.filter(
            date__gte=month_start,
            date__lte=today
        ).aggregate(Sum('total_cost'))['total_cost__sum'] or 0
        
        # Recent data
        recent_meals = Meal.objects.order_by('-created_at')[:5]
        recent_expenses = Expense.objects.order_by('-created_at')[:5]
        recent_meal_tracking = MemberMealTracking.objects.order_by('-date')[:5]
        
        stats_data = {
            'total_members': total_members,
            'active_members': active_members,
            'employee_members': employee_members,
            'guest_members': guest_members,
            'total_meals_this_week': total_meals_this_week,
            'total_meals_this_month': total_meals_this_month,
            'pending_expenses': pending_expenses,
            'total_budget': total_budget,
            'spent_budget': spent_budget,
            'total_deposits_this_month': total_deposits_this_month,
            'total_meal_costs_this_month': total_meal_costs_this_month,
            'budget_utilization': budget_utilization,
            'recent_meals': recent_meals,
            'recent_expenses': recent_expenses,
            'recent_meal_tracking': recent_meal_tracking,
        }
        
        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)
