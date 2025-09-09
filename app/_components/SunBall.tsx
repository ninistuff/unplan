// app/components/SunBall.tsx
import React from 'react';
import { View } from 'react-native';

type Props = {
  size?: number;
};

// Simple sun without animations for stability
export default function SunBall({ size = 80 }: Props) {
  const r = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: '#FACC15', // warm yellow 400
          shadowColor: '#FACC15',
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      />

      {/* Simple highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.18,
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: (size * 0.35) / 2,
          backgroundColor: 'rgba(255,255,255,0.25)',
        }}
      />
    </View>
  );
}

