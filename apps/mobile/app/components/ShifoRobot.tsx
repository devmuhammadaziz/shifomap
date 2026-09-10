import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { SHIFO_ROBOT } from '../../lib/home-images';

type Props = {
  style?: StyleProp<ImageStyle>;
};

/** Pulse placeholder briefly while the robot bitmap decodes, then fade it in. */
export default function ShifoRobot({ style }: Props) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const [hidePulse, setHidePulse] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 520, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 520, useNativeDriver: true }),
      ]),
    );
    loop.start();

    const timer = setTimeout(() => {
      Animated.timing(reveal, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start(() => {
        loop.stop();
        setHidePulse(true);
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [pulse, reveal]);

  return (
    <View style={[styles.slot, style]} pointerEvents="none">
      {!hidePulse ? <Animated.View style={[styles.pulse, { opacity: pulse }]} /> : null}
      <Animated.Image
        source={SHIFO_ROBOT}
        defaultSource={SHIFO_ROBOT}
        fadeDuration={0}
        resizeMode="contain"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: reveal,
            transform: [
              {
                scale: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    overflow: 'visible',
  },
  pulse: {
    ...StyleSheet.absoluteFill,
    marginHorizontal: 18,
    marginVertical: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
});
