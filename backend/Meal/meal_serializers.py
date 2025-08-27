# auth_serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (Member, Meal, Ingredient, ShoppingList, ShoppingItem, 
                     Expense, Budget, MonthlyDeposit, DailyMealCost, MemberMealTracking)
from .auth_serializers import MemberSerializer
from datetime import datetime, timedelta


class MonthlyDepositSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    member_name = serializers.SerializerMethodField()
    month_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyDeposit
        fields = ['id', 'member', 'member_name', 'amount', 'month', 'month_display', 
                 'deposit_date', 'notes']
        read_only_fields = ['id', 'member', 'deposit_date']
    
    def get_member_name(self, obj):
        return obj.member.user.get_full_name() or obj.member.user.username
    
    def get_month_display(self, obj):
        return obj.month.strftime('%B %Y')
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['member'] = request.user.member
        return super().create(validated_data)


class DailyMealCostSerializer(serializers.ModelSerializer):
    lunch_cost_per_person = serializers.ReadOnlyField()
    dinner_cost_per_person = serializers.ReadOnlyField()
    total_cost = serializers.SerializerMethodField()
    total_participants = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyMealCost
        fields = ['id', 'date', 'lunch_cost', 'dinner_cost', 'lunch_participants',
                 'dinner_participants', 'lunch_cost_per_person', 'dinner_cost_per_person',
                 'total_cost', 'total_participants']
    
    def get_total_cost(self, obj):
        return obj.lunch_cost + obj.dinner_cost
    
    def get_total_participants(self, obj):
        return obj.lunch_participants + obj.dinner_participants


class MemberMealTrackingSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    member_name = serializers.SerializerMethodField()
    daily_cost = DailyMealCostSerializer(source='date', read_only=True)
    
    class Meta:
        model = MemberMealTracking
        fields = ['id', 'member', 'member_name', 'date', 'lunch_count', 'dinner_count',
                 'lunch_cost', 'dinner_cost', 'total_cost', 'is_paid', 'notes', 'daily_cost']
        read_only_fields = ['id', 'member', 'lunch_cost', 'dinner_cost', 'total_cost']
    
    def get_member_name(self, obj):
        return obj.member.user.get_full_name() or obj.member.user.username


class MemberMealTrackingBulkSerializer(serializers.Serializer):
    date = serializers.DateField()
    member_tracking = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        )
    )
    
    def validate_member_tracking(self, value):
        for item in value:
            if 'member_id' not in item:
                raise serializers.ValidationError("member_id is required for each tracking item")
            if 'lunch_count' not in item or 'dinner_count' not in item:
                raise serializers.ValidationError("lunch_count and dinner_count are required")
            if item['lunch_count'] not in [0, 1, 2] or item['dinner_count'] not in [0, 1, 2]:
                raise serializers.ValidationError("Meal counts must be 0, 1, or 2")
        return value


class MemberDetailSerializer(MemberSerializer):
    current_month_deposit = serializers.SerializerMethodField()
    current_month_consumption = serializers.SerializerMethodField()
    recent_meal_tracking = serializers.SerializerMethodField()
    
    class Meta(MemberSerializer.Meta):
        fields = MemberSerializer.Meta.fields + [
            'member_type', 'monthly_deposit', 'current_balance',
            'current_month_deposit', 'current_month_consumption', 'recent_meal_tracking'
        ]
    
    def get_current_month_deposit(self, obj):
        from datetime import date
        current_month = date.today().replace(day=1)
        try:
            deposit = obj.deposits.get(month=current_month)
            return MonthlyDepositSerializer(deposit).data
        except MonthlyDeposit.DoesNotExist:
            return None
    
    def get_current_month_consumption(self, obj):
        from datetime import date
        current_month = date.today().replace(day=1)
        next_month = (current_month.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        tracking = obj.meal_tracking.filter(
            date__gte=current_month,
            date__lt=next_month
        )
        
        total_cost = sum(t.total_cost for t in tracking)
        total_meals = sum(t.lunch_count + t.dinner_count for t in tracking)
        
        return {
            'total_cost': total_cost,
            'total_meals': total_meals,
            'days_with_meals': tracking.count()
        }
    
    def get_recent_meal_tracking(self, obj):
        recent_tracking = obj.meal_tracking.all()[:7]  # Last 7 days
        return MemberMealTrackingSerializer(recent_tracking, many=True).data


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'quantity', 'unit', 'estimated_cost']


class MealSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, read_only=True)
    created_by = MemberSerializer(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Meal
        fields = ['id', 'name', 'description', 'meal_type', 'date', 'time', 
                 'estimated_cost', 'actual_cost', 'status', 'ingredients',
                 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return obj.created_by.user.get_full_name() or obj.created_by.user.username
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user.member
        return super().create(validated_data)


class MealCreateSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, required=False)
    
    class Meta:
        model = Meal
        fields = ['name', 'description', 'meal_type', 'date', 'time', 
                 'estimated_cost', 'ingredients']
    
    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user.member
        
        meal = Meal.objects.create(**validated_data)
        
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(meal=meal, **ingredient_data)
        
        return meal


class ShoppingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingItem
        fields = ['id', 'name', 'quantity', 'unit', 'estimated_cost', 
                 'actual_cost', 'is_purchased', 'notes']


class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingItemSerializer(many=True, read_only=True)
    created_by = MemberSerializer(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    purchased_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingList
        fields = ['id', 'name', 'date_created', 'date_needed', 'status',
                 'total_estimated_cost', 'total_actual_cost', 'created_by',
                 'created_by_name', 'items', 'items_count', 'purchased_items_count']
        read_only_fields = ['id', 'date_created', 'created_by']
    
    def get_created_by_name(self, obj):
        return obj.created_by.user.get_full_name() or obj.created_by.user.username
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_purchased_items_count(self, obj):
        return obj.items.filter(is_purchased=True).count()
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user.member
        return super().create(validated_data)


class ShoppingListCreateSerializer(serializers.ModelSerializer):
    items = ShoppingItemSerializer(many=True, required=False)
    
    class Meta:
        model = ShoppingList
        fields = ['name', 'date_needed', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user.member
        
        shopping_list = ShoppingList.objects.create(**validated_data)
        
        total_cost = 0
        for item_data in items_data:
            item = ShoppingItem.objects.create(shopping_list=shopping_list, **item_data)
            total_cost += item.estimated_cost
        
        shopping_list.total_estimated_cost = total_cost
        shopping_list.save()
        
        return shopping_list


class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by = MemberSerializer(read_only=True)
    approved_by = MemberSerializer(read_only=True)
    submitted_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = ['id', 'title', 'description', 'amount', 'category', 'date',
                 'status', 'receipt', 'submitted_by', 'approved_by',
                 'submitted_by_name', 'approved_by_name', 'created_at']
        read_only_fields = ['id', 'submitted_by', 'approved_by', 'created_at']
    
    def get_submitted_by_name(self, obj):
        return obj.submitted_by.user.get_full_name() or obj.submitted_by.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.user.get_full_name() or obj.approved_by.user.username
        return None
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['submitted_by'] = request.user.member
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    created_by = MemberSerializer(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    remaining_amount = serializers.ReadOnlyField()
    utilization_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = ['id', 'name', 'total_amount', 'spent_amount', 'remaining_amount',
                 'utilization_percentage', 'start_date', 'end_date', 'created_by',
                 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'spent_amount']
    
    def get_created_by_name(self, obj):
        return obj.created_by.user.get_full_name() or obj.created_by.user.username
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user.member
        return super().create(validated_data)


class DashboardStatsSerializer(serializers.Serializer):
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    employee_members = serializers.IntegerField()
    guest_members = serializers.IntegerField()
    total_meals_this_week = serializers.IntegerField()
    total_meals_this_month = serializers.IntegerField()
    pending_expenses = serializers.IntegerField()
    total_budget = serializers.DecimalField(max_digits=12, decimal_places=2)
    spent_budget = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_deposits_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_meal_costs_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_meals = MealSerializer(many=True)
    recent_expenses = ExpenseSerializer(many=True)
    recent_meal_tracking = MemberMealTrackingSerializer(many=True)
    budget_utilization = serializers.DecimalField(max_digits=5, decimal_places=2)
