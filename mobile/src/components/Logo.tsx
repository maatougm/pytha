import React from 'react';
import { Image, StyleSheet, View, type ImageStyle } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ImageStyle;
}

const sizes = {
  sm: 40,
  md: 60,
  lg: 100,
  xl: 150,
};

export function Logo({ size = 'md', style }: LogoProps) {
  const dimension = sizes[size];

  return (
    <View style={[styles.container, { width: dimension, height: dimension }, style]}>
      <Image
        source={require('@/assets/logo.jpg')}
        style={[styles.image, { width: dimension, height: dimension }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 12,
  },
});

export default Logo;
