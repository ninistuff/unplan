import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

export type AppIconName =
  // transport
  | 'walk-outline' | 'bus-outline' | 'car-outline' | 'bicycle-outline'
  // with who
  | 'people-outline' | 'people-circle-outline' | 'wine-outline' | 'paw-outline'
  // custom composites
  | 'family-custom' | 'date-custom';

export default function Icon({ name, size = 28, color }: { name: AppIconName; size?: number; color?: string }) {
  // Composite family (2 părinți + copil)
  if (name === 'family-custom') {
    const parent = Math.round(size * 0.5);
    const child = Math.round(size * 0.36);
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
        <Ionicons name="person-outline" size={parent} color={color} style={{ marginRight: 2 }} />
        <Ionicons name="person-outline" size={child} color={color} />
        <Ionicons name="person-outline" size={parent} color={color} style={{ marginLeft: 2 }} />
      </View>
    );
  }

  // Composite romantic date (2 pahare + inimioară)
  if (name === 'date-custom') {
    const glass = Math.round(size * 0.46);
    const heart = Math.round(size * 0.36);
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="wine-outline" size={glass} color={color} style={{ marginRight: 2, transform: [{ rotate: '-12deg' }] }} />
          <Ionicons name="wine-outline" size={glass} color={color} style={{ marginLeft: 2, transform: [{ rotate: '12deg' }] }} />
        </View>
        <Ionicons name="heart-outline" size={heart} color={color} style={{ position: 'absolute', top: 0 }} />
      </View>
    );
  }

  // Default single icon fallback
  return <Ionicons name={name as any} size={size} color={color} />;
}

