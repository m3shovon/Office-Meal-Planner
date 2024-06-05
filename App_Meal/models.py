from django.db import models
from django.utils import timezone

class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

    def add_balance(self, amount):
        self.balance += amount
        self.save()

    def subtract_balance(self, amount):
        if self.balance >= amount:
            self.balance -= amount
            self.save()
        else:
            raise ValueError("Insufficient balance")

class Meal(models.Model):
    MEAL_TYPES = [
        ('B', 'Breakfast'),
        ('L', 'Lunch'),
        ('D', 'Dinner'),
    ]
    type = models.CharField(max_length=1, choices=MEAL_TYPES)
    cost = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.get_type_display()

class DailyMeal(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ('customer', 'meal', 'date')

    def __str__(self):
        return f"{self.customer.name} - {self.meal.get_type_display()} on {self.date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.customer.subtract_balance(self.meal.cost)
