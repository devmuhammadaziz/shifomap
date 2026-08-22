import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';
import { AuthBackButton } from '../../components/auth/AuthBackButton';

const PRIVACY_URL = 'https://shifoyol.uz/privacy';
const TERMS_URL = 'https://shifoyol.uz/terms';
const SHIELD_IMG = require('../../assets/auth-shield-lock.png');

export default function AgreementsScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const setAgreementsAccepted = useAuthStore((s) => s.setAgreementsAccepted);
  const theme = useThemeStore((s) => s.theme);
  const tokens = getTokens(theme);
  const t = getTranslations(language);
  const brandBlue = tokens.brand.iris;

  const [checked, setChecked] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const onAccept = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await setAgreementsAccepted();
      router.replace('/(auth)/login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top', 'bottom']}>
      <WaveBackground />
      <View style={styles.header}>
        <AuthBackButton onPress={() => router.back()} />
      </View>

      <View style={styles.content}>
        <Image source={SHIELD_IMG} style={styles.shield} resizeMode="contain" />
        <Text style={[styles.title, { color: tokens.colors.text }]}>{t.agreementsTitle}</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
          {language === 'ru'
            ? 'Ваши данные в безопасности — мы заботимся о вашем здоровье и конфиденциальности.'
            : "Ma'lumotlaringiz xavfsiz — sog'ligingiz va maxfiyligingiz biz uchun muhim."}
        </Text>
      </View>

      <View style={styles.consentRow}>
        <Pressable
          onPress={() => setChecked((v) => !v)}
          style={[
            styles.checkbox,
            {
              borderColor: checked ? brandBlue : tokens.colors.border,
              backgroundColor: checked ? brandBlue : 'transparent',
            },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          {checked ? <Icon name="checkmark" size={16} color="#fff" /> : null}
        </Pressable>

        <Text style={[styles.consentText, { color: tokens.colors.textSecondary }]}>
          {t.agreementsConsentPrefix}
          <Text style={[styles.link, { color: brandBlue }]} onPress={() => openUrl(PRIVACY_URL)}>
            {t.agreementsPrivacyLink}
          </Text>
          {language === 'ru' ? ' и ' : ' va '}
          <Text style={[styles.link, { color: brandBlue }]} onPress={() => openUrl(TERMS_URL)}>
            {t.agreementsTermsLink}
          </Text>
          {t.agreementsConsentSuffix}
        </Text>
      </View>

      <View style={styles.footer}>
        <AuthCtaButton
          title={t.agreementsAccept}
          rightIcon="checkmark"
          disabled={!checked}
          loading={submitting}
          onPress={() => void onAccept()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 4 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  shield: { width: 160, height: 160, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  link: { fontWeight: '700' },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
