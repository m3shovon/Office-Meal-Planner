from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal


class Member(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('member', 'Member'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    MEMBER_TYPE_CHOICES = [
        ('employee', 'Employee'),
        ('guest', 'Guest'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    member_type = models.CharField(max_length=10, choices=MEMBER_TYPE_CHOICES, default='employee')
    dietary_restrictions = models.TextField(blank=True)
    join_date = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    monthly_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class MonthlyDeposit(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    month = models.DateField()  # First day of the month
    deposit_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['member', 'month']
        ordering = ['-month']
    
    def __str__(self):
        return f"{self.member.user.username} - {self.month.strftime('%B %Y')} - ${self.amount}"


class DailyMealCost(models.Model):
    date = models.DateField()
    lunch_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dinner_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lunch_participants = models.IntegerField(default=0)
    dinner_participants = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['date']
        ordering = ['-date']
    
    @property
    def lunch_cost_per_person(self):
        return self.lunch_cost / self.lunch_participants if self.lunch_participants > 0 else 0
    
    @property
    def dinner_cost_per_person(self):
        return self.dinner_cost / self.dinner_participants if self.dinner_participants > 0 else 0
    
    def __str__(self):
        return f"{self.date} - Lunch: ${self.lunch_cost}, Dinner: ${self.dinner_cost}"


class MemberMealTracking(models.Model):
    MEAL_COUNT_CHOICES = [
        (0, 'No Meal'),
        (1, 'One Meal'),
        (2, 'Two Meals'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='meal_tracking')
    date = models.DateField()
    lunch_count = models.IntegerField(choices=MEAL_COUNT_CHOICES, default=0)
    dinner_count = models.IntegerField(choices=MEAL_COUNT_CHOICES, default=0)
    lunch_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    dinner_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['member', 'date']
        ordering = ['-date']
    
    def save(self, *args, **kwargs):
        try:
            daily_cost = DailyMealCost.objects.get(date=self.date)
            self.lunch_cost = self.lunch_count * daily_cost.lunch_cost_per_person
            self.dinner_cost = self.dinner_count * daily_cost.dinner_cost_per_person
            self.total_cost = self.lunch_cost + self.dinner_cost
        except DailyMealCost.DoesNotExist:
            self.lunch_cost = 0
            self.dinner_cost = 0
            self.total_cost = 0
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.member.user.username} - {self.date} - ${self.total_cost}"


class Meal(models.Model):
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('approved', 'Approved'),
        ('prepared', 'Prepared'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    meal_type = models.CharField(max_length=10, choices=MEAL_TYPE_CHOICES)
    date = models.DateField()
    time = models.TimeField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='planned')
    created_by = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='created_meals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-time']
    
    def __str__(self):
        return f"{self.name} - {self.date} ({self.meal_type})"


class Ingredient(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('g', 'Gram'),
        ('l', 'Liter'),
        ('ml', 'Milliliter'),
        ('pcs', 'Pieces'),
        ('cups', 'Cups'),
        ('tbsp', 'Tablespoon'),
        ('tsp', 'Teaspoon'),
    ]
    
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    estimated_cost = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    def __str__(self):
        return f"{self.name} - {self.quantity} {self.unit}"


class ShoppingList(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    name = models.CharField(max_length=200)
    date_created = models.DateTimeField(auto_now_add=True)
    date_needed = models.DateField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(Member, on_delete=models.CASCADE)
    total_estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['-date_created']
    
    def __str__(self):
        return f"{self.name} - {self.date_needed}"


class ShoppingItem(models.Model):
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=10)
    estimated_cost = models.DecimalField(max_digits=8, decimal_places=2)
    actual_cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_purchased = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.quantity} {self.unit}"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('groceries', 'Groceries'),
        ('supplies', 'Supplies'),
        ('equipment', 'Equipment'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    receipt = models.ImageField(upload_to='receipts/', blank=True, null=True)
    submitted_by = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='submitted_expenses')
    approved_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.title} - ${self.amount}"


class Budget(models.Model):
    name = models.CharField(max_length=200)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(Member, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def remaining_amount(self):
        return self.total_amount - self.spent_amount
    
    @property
    def utilization_percentage(self):
        if self.total_amount > 0:
            return (self.spent_amount / self.total_amount) * 100
        return 0
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - ${self.total_amount}"
