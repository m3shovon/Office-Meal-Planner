# Generated migration for the new meal tracking system

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('Meal', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='member',
            name='member_type',
            field=models.CharField(choices=[('employee', 'Employee'), ('guest', 'Guest')], default='employee', max_length=10),
        ),
        migrations.AddField(
            model_name='member',
            name='monthly_deposit',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='member',
            name='current_balance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.CreateModel(
            name='MonthlyDeposit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('month', models.DateField()),
                ('deposit_date', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deposits', to='Meal.member')),
            ],
            options={
                'ordering': ['-month'],
            },
        ),
        migrations.CreateModel(
            name='DailyMealCost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('lunch_cost', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('dinner_cost', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('lunch_participants', models.IntegerField(default=0)),
                ('dinner_participants', models.IntegerField(default=0)),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='MemberMealTracking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('lunch_count', models.IntegerField(choices=[(0, 'No Meal'), (1, 'One Meal'), (2, 'Two Meals')], default=0)),
                ('dinner_count', models.IntegerField(choices=[(0, 'No Meal'), (1, 'One Meal'), (2, 'Two Meals')], default=0)),
                ('lunch_cost', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('dinner_cost', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('total_cost', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('is_paid', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meal_tracking', to='Meal.member')),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='monthlydeposit',
            unique_together={('member', 'month')},
        ),
        migrations.AlterUniqueTogether(
            name='dailymealcost',
            unique_together={('date',)},
        ),
        migrations.AlterUniqueTogether(
            name='membermealtracking',
            unique_together={('member', 'date')},
        ),
    ]
