import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native';
type BottomTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};
import { Icon, type IconName } from '../../components/icons/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/theme-store';
import { useAuthStore } from '../../store/auth-store';
import TabBarCurveBackground, { TAB_BAR_NOTCH_LIFT, TAB_BAR_NOTCH_HALF } from './TabBarCurveBackground';

const ACCENT = '#2563EB';
const BAR_BODY_HEIGHT = 62;
const AI_SIZE = 62;
const CENTER_SLOT = TAB_BAR_NOTCH_HALF * 2 + 8;
const AI_BOTTOM_OFFSET = 10;
import { BRAND_LOGO } from '../../lib/home-images';

type TabDef = {
  key: string;
  route: string;
  icon: IconName;
  iconActive: IconName;
  uz: string;
  ru: string;
};

const LEFT_TABS: TabDef[] = [
  { key: 'index', route: 'index', icon: 'home-outline', iconActive: 'home', uz: 'Bosh sahifa', ru: 'Главная' },
  { key: 'clinics', route: 'clinics', icon: 'medkit-outline', iconActive: 'medkit', uz: 'Klinikalar', ru: 'Клиники' },
];

const RIGHT_TABS: TabDef[] = [
  { key: 'appointments', route: 'appointments', icon: 'calendar-outline', iconActive: 'calendar', uz: 'Yozuvlar', ru: 'Записи' },
  { key: 'profile', route: 'profile', icon: 'person-outline', iconActive: 'person', uz: 'Profil', ru: 'Профиль' },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const isDark = theme === 'dark';

  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName === 'feed') return null;

  const barBg = isDark ? '#18181b' : '#ffffff';
  const inactiveIcon = isDark ? '#a1a1aa' : '#94a3b8';
  const totalHeight = BAR_BODY_HEIGHT + TAB_BAR_NOTCH_LIFT + insets.bottom;

  const handlePress = (routeName: string) => {
    const route = state.routes.find((r: { name: string }) => r.name === routeName);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };

  const renderTab = (tab: TabDef) => {
    const focused = tab.route === activeRouteName;
    return (
      <TouchableOpacity
        key={tab.key}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        onPress={() => handlePress(tab.route)}
        style={styles.slot}
        activeOpacity={0.75}
      >
        <Icon
          name={focused ? tab.iconActive : tab.icon}
          size={22}
          color={focused ? ACCENT : inactiveIcon}
          variant={focused ? 'Bold' : 'Linear'}
        />
        <Text style={[styles.label, { color: focused ? ACCENT : inactiveIcon }]} numberOfLines={1}>
          {language === 'ru' ? tab.ru : tab.uz}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { height: totalHeight, width: screenW }]} pointerEvents="box-none">
      <TabBarCurveBackground height={totalHeight} fill={barBg} isDark={isDark} />

      <View
        style={[
          styles.iconsRow,
          {
            paddingBottom: insets.bottom,
            marginTop: TAB_BAR_NOTCH_LIFT,
            height: BAR_BODY_HEIGHT + insets.bottom,
          },
        ]}
      >
        <View style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</View>
        <View style={{ width: CENTER_SLOT }} />
        <View style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="AI"
        onPress={() => router.push('/ai-chat')}
        style={[
          styles.aiFab,
          {
            bottom: insets.bottom + AI_BOTTOM_OFFSET,
            backgroundColor: ACCENT,
            shadowColor: ACCENT,
          },
        ]}
        activeOpacity={0.9}
      >
        <Image
          source={BRAND_LOGO}
          defaultSource={BRAND_LOGO}
          fadeDuration={0}
          style={styles.aiLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0A2FB8',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  aiFab: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -AI_SIZE / 2,
    width: AI_SIZE,
    height: AI_SIZE,
    borderRadius: AI_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 14 },
    }),
  },
  aiLogo: { width: 34, height: 34 },
});
