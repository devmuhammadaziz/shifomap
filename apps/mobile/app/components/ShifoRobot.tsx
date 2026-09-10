import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { SHIFO_ROBOT } from '../../lib/home-images';

type Props = {
  style?: StyleProp<ImageStyle>;
};

/** Shifo mascot — always visible at a compact size that fits the AI card. */
export default function ShifoRobot({ style }: Props) {
  return (
    <Image
      source={SHIFO_ROBOT}
      defaultSource={SHIFO_ROBOT}
      fadeDuration={0}
      resizeMode="contain"
      style={[styles.img, style]}
    />
  );
}

const styles = StyleSheet.create({
  img: {
    width: 88,
    height: 108,
  },
});
