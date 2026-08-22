import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useThemeStore } from '../../store/theme-store';

/** Faint medical-style waves used on the redesigned auth screens. */
export function WaveBackground() {
  const { width, height } = useWindowDimensions();
  const theme = useThemeStore((s) => s.theme);
  const stroke = theme === 'dark' ? '#1E3A8A' : '#93C5FD';
  const opacity = theme === 'dark' ? 0.35 : 0.28;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Path
          d={`M ${-10} ${height * 0.18}
              C ${width * 0.14} ${height * 0.08}, ${width * 0.1} ${height * 0.3}, ${width * 0.22} ${height * 0.24}
              C ${width * 0.08} ${height * 0.38}, ${width * 0.16} ${height * 0.48}, ${-8} ${height * 0.52}`}
          stroke={stroke}
          strokeWidth={1.4}
          fill="none"
          opacity={opacity}
        />
        <Path
          d={`M ${-6} ${height * 0.28}
              C ${width * 0.18} ${height * 0.2}, ${width * 0.05} ${height * 0.42}, ${width * 0.16} ${height * 0.4}
              C ${width * 0.04} ${height * 0.55}, ${width * 0.12} ${height * 0.62}, ${-10} ${height * 0.68}`}
          stroke={stroke}
          strokeWidth={1.1}
          fill="none"
          opacity={opacity * 0.8}
        />
        <Path
          d={`M ${width + 10} ${height * 0.22}
              C ${width * 0.86} ${height * 0.12}, ${width * 0.92} ${height * 0.34}, ${width * 0.78} ${height * 0.3}
              C ${width * 0.94} ${height * 0.44}, ${width * 0.84} ${height * 0.56}, ${width + 8} ${height * 0.6}`}
          stroke={stroke}
          strokeWidth={1.4}
          fill="none"
          opacity={opacity}
        />
        <Path
          d={`M ${width + 6} ${height * 0.72}
              C ${width * 0.84} ${height * 0.64}, ${width * 0.96} ${height * 0.82}, ${width * 0.8} ${height * 0.86}
              C ${width * 0.94} ${height * 0.94}, ${width * 0.88} ${height * 1.02}, ${width + 10} ${height * 1.04}`}
          stroke={stroke}
          strokeWidth={1.2}
          fill="none"
          opacity={opacity * 0.85}
        />
      </Svg>
    </View>
  );
}
