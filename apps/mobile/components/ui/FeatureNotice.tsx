import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTokens } from '../../lib/design';
import { featureMessage, type FeatureKind } from '../../lib/clinic-features';

type Props = {
  kind: FeatureKind;
  /** Hide the title line, e.g. when shown inside a card that already has a heading. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Explains in the user's language why an action button is missing. */
export function FeatureNotice({ kind, compact, style }: Props) {
  const language = useAuthStore((s) => s.language);
  const theme = useThemeStore((s) => s.theme);
  const tokens = getTokens(theme);
  const msg = featureMessage(kind, language);
  const icon = kind === 'reviews' ? 'star-outline' : kind === 'homeVisit' ? 'home-outline' : 'calendar-outline';

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: tokens.colors.backgroundSecondary, borderColor: tokens.colors.border },
        style,
      ]}
      accessibilityRole="text"
    >
      <View style={[styles.iconWrap, { backgroundColor: tokens.colors.backgroundCard }]}>
        <Icon name={icon} size={16} color={tokens.colors.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        {!compact ? (
          <Text style={[styles.title, { color: tokens.colors.text }]}>{msg.title}</Text>
        ) : null}
        <Text style={[styles.body, { color: tokens.colors.textTertiary }]}>{msg.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 12, lineHeight: 17 },
});
