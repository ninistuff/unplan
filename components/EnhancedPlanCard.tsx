// components/EnhancedPlanCard.tsx - Beautiful Plan Cards with Animations
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import type { Plan } from '../lib/planTypes';

interface Props {
  plan: Plan;
  index: number;
  lang: 'en' | 'ro';
  onShuffle?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// Theme colors for different plans
const themes = [
  { 
    primary: '#FF6B6B', 
    secondary: '#FFE5E5', 
    accent: '#FF5252',
    emoji: '🌟',
    gradient: ['#FF6B6B', '#FF8E8E']
  },
  { 
    primary: '#4ECDC4', 
    secondary: '#E5F9F7', 
    accent: '#26A69A',
    emoji: '🎯',
    gradient: ['#4ECDC4', '#6FDBDB']
  },
  { 
    primary: '#45B7D1', 
    secondary: '#E3F2FD', 
    accent: '#2196F3',
    emoji: '✨',
    gradient: ['#45B7D1', '#64B5F6']
  },
];

export default function EnhancedPlanCard({ plan, index, lang, onShuffle, isFavorite, onToggleFavorite }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const theme = themes[index % themes.length];
  
  useEffect(() => {
    // Staggered animation entrance
    const delay = index * 150;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim, scaleAnim])
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  const planPayload = encodeURIComponent(JSON.stringify(plan));
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ],
        marginBottom: 16,
      }}
    >
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 0,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
      }}>
        {/* Header with gradient */}
        <View style={{
          backgroundColor: theme.primary,
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>{theme.emoji}</Text>
            <View>
              <Text style={{ 
                color: '#fff', 
                fontSize: 20, 
                fontWeight: '800',
                letterSpacing: 0.5
              }}>
                {plan.title}
              </Text>
              <Text style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                {plan.mode} · {plan.min} min · {plan.km} km
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                fontWeight: '500'
              }}>
                {plan.stops?.length || 0} {lang === 'ro' ? 'opriri' : 'stops'} • {plan.km}km • {plan.min}min
              </Text>
            </View>
          </View>
          
          {/* Action buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onToggleFavorite && (
              <Pressable
                onPress={onToggleFavorite}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  marginRight: 8,
                }}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={20} 
                  color="#fff" 
                />
              </Pressable>
            )}
            
            {onShuffle && (
              <Pressable
                onPress={onShuffle}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Ionicons name="shuffle" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>
        
        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* Stops preview */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: '#333',
              marginBottom: 8
            }}>
              {lang === 'ro' ? '📍 Destinații' : '📍 Destinations'}
            </Text>
            
            {plan.stops?.slice(0, 3).map((stop, i) => (
              <View key={i} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
                paddingLeft: 12,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.primary,
                  marginRight: 12,
                }} />
                <Text style={{ 
                  fontSize: 15, 
                  color: '#555',
                  fontWeight: '500',
                  flex: 1
                }}>
                  {stop.name}
                </Text>
              </View>
            ))}
            
            {(plan.stops?.length || 0) > 3 && (
              <Text style={{ 
                fontSize: 14, 
                color: theme.primary,
                fontWeight: '600',
                paddingLeft: 32,
                marginTop: 4
              }}>
                +{(plan.stops?.length || 0) - 3} {lang === 'ro' ? 'mai multe' : 'more'}
              </Text>
            )}
          </View>
          
          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: theme.secondary,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="location" size={20} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 4 }}>
                {plan.km}km
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {lang === 'ro' ? 'Distanță' : 'Distance'}
              </Text>
            </View>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="time" size={20} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 4 }}>
                {plan.min}min
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {lang === 'ro' ? 'Durată' : 'Duration'}
              </Text>
            </View>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons 
                name={plan.mode === 'driving' ? 'car' : plan.mode === 'bike' ? 'bicycle' : 'walk'} 
                size={20} 
                color={theme.primary} 
              />
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 4 }}>
                {plan.mode === 'driving' ? (lang === 'ro' ? 'Auto' : 'Car') :
                 plan.mode === 'bike' ? (lang === 'ro' ? 'Bike' : 'Bike') :
                 (lang === 'ro' ? 'Mers' : 'Walk')}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {lang === 'ro' ? 'Transport' : 'Transport'}
              </Text>
            </View>
          </View>
          
          {/* Action button */}
          <Link 
            href={{ pathname: "/plan/[id]", params: { id: plan.id, payload: planPayload } }} 
            asChild
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{
                backgroundColor: theme.primary,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="map" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ 
                color: '#fff', 
                fontSize: 16, 
                fontWeight: '700',
                letterSpacing: 0.5
              }}>
                {lang === 'ro' ? 'Vezi pe hartă' : 'View on map'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>
          </Link>
        </View>
      </View>
    </Animated.View>
  );
}
