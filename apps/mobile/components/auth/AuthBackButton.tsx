import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../icons/Icon';
import { useThemeStore } from '../../store/theme-store';
import { getTokens } from '../../lib/design';

export function AuthBackButton({ onPress }: { onPress: () => void }) {
  const theme = useThemeStore((s) => s.theme);
  const tokens = getTokens(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[
        styles.btn,
        {
          backgroundColor: tokens.colors.backgroundCard,
          borderColor: tokens.colors.border,
          shadowColor: tokens.colors.cardShadow,
        },
      ]}
    >
      <Icon name="chevron-back" size={22} color={tokens.brand.iris} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});
