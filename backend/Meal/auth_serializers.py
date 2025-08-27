# auth_serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import Member


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class MemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'user', 'full_name', 'phone', 'role', 'status', 
                 'dietary_restrictions', 'join_date', 'avatar']
        read_only_fields = ['id', 'join_date']
    
    def get_full_name(self, obj):
        if isinstance(obj, Member):  # normal case
            return obj.user.get_full_name() or obj.user.username
        # If it's a dict (during creation)
        user = obj.get("user")
        if isinstance(user, dict):
            return f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get("username")
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    dietary_restrictions = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 
                 'first_name', 'last_name', 'phone', 'dietary_restrictions']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        # Remove password_confirm and member fields
        validated_data.pop('password_confirm')
        phone = validated_data.pop('phone', '')
        dietary_restrictions = validated_data.pop('dietary_restrictions', '')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create member profile
        Member.objects.create(
            user=user,
            phone=phone,
            dietary_restrictions=dietary_restrictions
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password.')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    dietary_restrictions = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'dietary_restrictions', 'avatar']
    
    def update(self, instance, validated_data):
        # Extract member fields
        phone = validated_data.pop('phone', None)
        dietary_restrictions = validated_data.pop('dietary_restrictions', None)
        avatar = validated_data.pop('avatar', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update member fields
        member = instance.member
        if phone is not None:
            member.phone = phone
        if dietary_restrictions is not None:
            member.dietary_restrictions = dietary_restrictions
        if avatar is not None:
            member.avatar = avatar
        member.save()
        
        return instance


class MemberCreateSerializer(serializers.ModelSerializer):
    # User fields
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    # Member fields
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    role = serializers.CharField(max_length=20, required=False, default='member')
    status = serializers.CharField(max_length=20, required=False, default='active')
    dietary_restrictions = serializers.CharField(required=False, allow_blank=True)
    member_type = serializers.CharField(max_length=20, required=False, default='employee')
    monthly_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    
    class Meta:
        model = Member
        fields = ['username', 'email', 'first_name', 'last_name', 'password',
                 'phone', 'role', 'status', 'dietary_restrictions', 'member_type', 'monthly_deposit']
    
    def create(self, validated_data):
        # Extract user fields
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
        }
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create member with remaining fields
        member = Member.objects.create(user=user, **validated_data)
        
        return member


class MemberUpdateSerializer(serializers.ModelSerializer):
    # User fields
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    
    # Member fields
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    role = serializers.CharField(max_length=20, required=False)
    status = serializers.CharField(max_length=20, required=False)
    dietary_restrictions = serializers.CharField(required=False, allow_blank=True)
    member_type = serializers.CharField(max_length=20, required=False)
    monthly_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = Member
        fields = ['username', 'email', 'first_name', 'last_name',
                 'phone', 'role', 'status', 'dietary_restrictions', 'member_type', 'monthly_deposit']
    
    def update(self, instance, validated_data):
        # Extract user fields
        user_fields = ['username', 'email', 'first_name', 'last_name']
        user_data = {}
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)
        
        # Update user fields
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        
        # Update member fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance
