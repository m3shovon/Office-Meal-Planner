from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from ..models import Member


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
        return obj.user.get_full_name() or obj.user.username


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
