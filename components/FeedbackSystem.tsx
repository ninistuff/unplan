// components/FeedbackSystem.tsx - Enhanced User Feedback System
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type, visible, onHide }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const colors = {
    success: { bg: '#10B981', icon: 'checkmark-circle' },
    error: { bg: '#EF4444', icon: 'close-circle' },
    info: { bg: '#3B82F6', icon: 'information-circle' },
    warning: { bg: '#F59E0B', icon: 'warning' },
  };

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }, [slideAnim, opacityAnim, onHide]);
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, hideToast, opacityAnim, slideAnim]);
  
  if (!visible) return null;
  
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <Pressable onPress={hideToast}>
        <View style={{
          backgroundColor: colors[type].bg,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <Ionicons 
            name={colors[type].icon as any} 
            size={24} 
            color="#fff" 
            style={{ marginRight: 12 }}
          />
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
            lineHeight: 22,
          }}>
            {message}
          </Text>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface HapticButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  hapticType?: 'light' | 'medium' | 'heavy';
}

export function HapticButton({ onPress, children, style, hapticType = 'light' }: HapticButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    // Haptic feedback (would need expo-haptics)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle[hapticType]);
    
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export function LoadingDots({ color = '#007AFF', size = 8 }: LoadingDotsProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const duration = 600
    const delay = 200
    
    const doDots = () => {
    
    Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: duration / 2, useNativeDriver: true })
    ]).start();
      
    setTimeout(() => {
        Animated.sequence([
        Animated.timing(dot2, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: duration / 2, useNativeDriver: true })
    ]).start()
    }, delay)
      
    setTimeout(() => {
        Animated.sequence([
        Animated.timing(dot3, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: duration / 2, useNativeDriver: true })
    ]).start()
    }, delay * 2)
    }
    
    doDots()
    const interval = setInterval(doDots, 1800);
    return () => clearInterval(interval);
  }, [dot1, dot2, dot3])
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[dot1, dot2, dot3].map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            marginHorizontal: 2,
            opacity: anim,
            transform: [{
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1.2],
              }),
            }],
          }}
        />
      ))}
    </View>
  );
}

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export function ProgressRing({ 
  progress, 
  size = 60, 
  strokeWidth = 6, 
  color = '#007AFF',
  backgroundColor = '#E5E7EB'
}: ProgressRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedValue]);
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: backgroundColor,
      }} />
      
      <Animated.View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        transform: [{
          rotate: animatedValue.interpolate({
            inputRange: [0, 100],
            outputRange: ['0deg', '360deg'],
          }),
        }],
      }} />
      
      <Text style={{
        fontSize: size * 0.2,
        fontWeight: '700',
        color: color,
      }}>
        {Math.round(progress)}%
      </Text>
    </View>
  );
}

// Hook for managing toast notifications
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };
  
  const ToastComponent = () => (
    <Toast
      message={toast.message}
      type={toast.type}
      visible={toast.visible}
      onHide={hideToast}
    />
  );
  
  return {
    showToast,
    hideToast,
    ToastComponent,
  };
}
