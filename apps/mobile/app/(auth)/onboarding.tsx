import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';
import { promptNotificationPermissionInOnboarding } from '../../lib/pill-local-notifications';
import * as Location from 'expo-location';

export default function OnboardingScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const setOnboardingSeen = useAuthStore((s) => s.setOnboardingSeen);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const brandBlue = tokens.brand.iris;

  const [index, setIndex] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const steps = useMemo(
    () => [
      {
        icon: 'notifications' as const,
        title: t.onboardingNotifTitle,
        subtitle: t.onboardingNotifSubtitle,
      },
      {
        icon: 'location' as const,
        title: language === 'uz' ? 'Yaqin aptekalarni ko‘rsatamiz' : 'Покажем аптеки рядом',
        subtitle:
          language === 'uz'
            ? 'Joylashuvga ruxsat bersangiz, yaqin 10 ta aptekani topib beramiz.'
            : 'Разрешите доступ к геолокации, и мы покажем 10 ближайших аптек.',
      },
      {
        icon: 'medkit' as const,
        title: t.onboardingStep1Title,
        subtitle: t.onboardingStep1Subtitle,
      },
      {
        icon: 'calendar' as const,
        title: t.onboardingStep2Title,
        subtitle: t.onboardingStep2Subtitle,
      },
      {
        icon: 'person' as const,
        title: t.onboardingStep3Title,
        subtitle: t.onboardingStep3Subtitle,
      },
    ],
    [language, t]
  );

  const totalSteps = steps.length;
  const step = steps[index];

  const finishOnboarding = useCallback(async () => {
    await setOnboardingSeen();
    router.replace('/(auth)/agreements');
  }, [setOnboardingSeen, router]);

  const goNext = useCallback(() => {
    if (index >= totalSteps - 1) {
      void finishOnboarding();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, totalSteps, finishOnboarding]);

  const onAllowNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      await promptNotificationPermissionInOnboarding();
    } finally {
      setNotifLoading(false);
    }
    setIndex(1);
  }, []);

  const onAllowLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } finally {
      setLocationLoading(false);
    }
    setIndex(2);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top', 'bottom']}>
      <WaveBackground />
      <View style={styles.headerRow}>
        <View style={{ width: 44 }} />
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? brandBlue : tokens.colors.border,
                  width: i === index ? 22 : 6,
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => void finishOnboarding()} hitSlop={12}>
          <Text style={{ color: tokens.colors.textSecondary, fontWeight: '600', fontSize: 15 }}>
            {t.onboardingSkip}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: tokens.colors.backgroundCard, shadowColor: brandBlue }]}>
          <Icon name={step.icon} size={48} color={brandBlue} />
        </View>
        <Text style={[styles.title, { color: tokens.colors.text }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>{step.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        {index === 0 ? (
          <View style={{ gap: 12 }}>
            <AuthCtaButton
              title={t.onboardingAllowNotifications}
              rightIcon="notifications"
              loading={notifLoading}
              disabled={notifLoading}
              onPress={() => void onAllowNotifications()}
            />
            <TouchableOpacity onPress={() => setIndex(1)} disabled={notifLoading} style={styles.laterBtn}>
              <Text style={{ color: tokens.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>
                {t.onboardingNotificationsLater}
              </Text>
            </TouchableOpacity>
          </View>
        ) : index === 1 ? (
          <View style={{ gap: 12 }}>
            <AuthCtaButton
              title={language === 'uz' ? 'Joylashuvni yoqish' : 'Включить геолокацию'}
              rightIcon="location"
              loading={locationLoading}
              disabled={locationLoading}
              onPress={() => void onAllowLocation()}
            />
            <TouchableOpacity onPress={() => setIndex(2)} disabled={locationLoading} style={styles.laterBtn}>
              <Text style={{ color: tokens.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>
                {language === 'uz' ? 'Keyinroq' : 'Позже'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <AuthCtaButton
            title={index >= totalSteps - 1 ? (language === 'uz' ? 'Boshlash' : 'Начать') : t.onboardingNext}
            rightIcon={index >= totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
            onPress={goNext}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', paddingHorizontal: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  laterBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
