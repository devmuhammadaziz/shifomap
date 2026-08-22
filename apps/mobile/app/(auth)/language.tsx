import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';

const LOGO = require('../../assets/play_store_512-Photoroom.png');

type Lang = 'uz' | 'ru';

export default function LanguageScreen() {
  const router = useRouter();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const onboardingSeen = useAuthStore((s) => s.onboardingSeen);
  const agreementsAccepted = useAuthStore((s) => s.agreementsAccepted);
  const theme = useThemeStore((s) => s.theme);
  const tUz = getTranslations('uz');
  const tRu = getTranslations('ru');
  const tokens = getTokens(theme);
  const brandBlue = tokens.brand.iris;

  const [selected, setSelected] = useState<Lang>('uz');

  const confirmLanguage = async () => {
    await setLanguage(selected);
    if (!onboardingSeen) {
      router.replace('/(auth)/onboarding');
    } else if (!agreementsAccepted) {
      router.replace('/(auth)/agreements');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const options: { lang: Lang; flag: string; label: string }[] = [
    { lang: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
    { lang: 'ru', flag: '🇷🇺', label: 'Русский' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top', 'bottom']}>
      <WaveBackground />
      <View style={styles.content}>
        <View style={[styles.logoWrap, { backgroundColor: tokens.colors.backgroundCard, shadowColor: brandBlue }]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={[styles.brand, { color: brandBlue }]}>ShifoYo'l</Text>
        <Text style={[styles.title, { color: tokens.colors.text }]}>
          {tUz.languageSubtitle} / {tRu.languageSubtitle}
        </Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
          {tUz.loginBrandTagline} · {tRu.loginBrandTagline}
        </Text>

        <View style={styles.cards}>
          {options.map(({ lang, flag, label }) => {
            const active = selected === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.card,
                  {
                    backgroundColor: active
                      ? theme === 'dark'
                        ? tokens.colors.primaryBg
                        : '#E8F0FE'
                      : tokens.colors.backgroundCard,
                    borderColor: active ? brandBlue : tokens.colors.border,
                  },
                ]}
                onPress={() => setSelected(lang)}
                activeOpacity={0.85}
              >
                <Text style={styles.flag}>{flag}</Text>
                <Text style={[styles.cardText, { color: active ? brandBlue : tokens.colors.text }]}>{label}</Text>
                <View style={[styles.radioOuter, { borderColor: active ? brandBlue : tokens.colors.border }]}>
                  {active ? <View style={[styles.radioInner, { backgroundColor: brandBlue }]} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <AuthCtaButton title={getTranslations(selected).passwordContinue} onPress={() => void confirmLanguage()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 36, justifyContent: 'center' },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: { width: 52, height: 52 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 28, textAlign: 'center' },
  cards: { width: '100%', gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  flag: { fontSize: 22 },
  cardText: { flex: 1, fontSize: 16, fontWeight: '700' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
