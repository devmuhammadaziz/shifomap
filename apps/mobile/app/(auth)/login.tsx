import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import {
  formatUzNationalDigits,
  isValidUzPhone9,
  UZ_PHONE_INLINE_ERROR_RU,
  UZ_PHONE_INLINE_ERROR_UZ,
} from '../../lib/uz-phone';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';
import { GoogleMark } from '../../components/auth/GoogleMark';

const PHONE_PREFIX = '+998';
const LOGO_IMG = require('../../assets/play_store_512-Photoroom.png');

export default function Login() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const [digits, setDigits] = useState('');
  const [navigating, setNavigating] = useState(false);
  const [focused, setFocused] = useState(false);

  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);

  const isValid = digits.length === 9 && isValidUzPhone9(digits);
  const showOperatorError = digits.length === 9 && !isValidUzPhone9(digits);
  const brandBlue = tokens.brand.iris;
  const fieldBg = theme === 'dark' ? tokens.colors.backgroundInput : '#FFFFFF';

  const goToPassword = (mode: 'login' | 'signup') => {
    if (!isValid) {
      Alert.alert(
        '',
        digits.length === 9
          ? language === 'ru'
            ? UZ_PHONE_INLINE_ERROR_RU
            : UZ_PHONE_INLINE_ERROR_UZ
          : t.loginError
      );
      return;
    }
    const fullPhone = PHONE_PREFIX + digits;
    setPendingPhone(fullPhone);
    setNavigating(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        router.push(
          `/(auth)/password?phone=${encodeURIComponent(fullPhone)}&mode=${mode}`
        );
        setNavigating(false);
      }, 0);
    });
  };

  const onGoogle = () => {
    Alert.alert(t.comingSoonTitle, t.comingSoonMessage);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top', 'bottom']}>
      <WaveBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View
              style={[
                styles.logoWrap,
                {
                  backgroundColor: tokens.colors.backgroundCard,
                  shadowColor: brandBlue,
                },
              ]}
            >
              <Image source={LOGO_IMG} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={[styles.brandName, { color: brandBlue }]}>ShifoYo'l</Text>
            <Text style={[styles.tagline, { color: tokens.brand.indigo }]}>{t.loginBrandTagline}</Text>
            <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>{t.homeSubtitle}</Text>
          </View>

          <View
            style={[
              styles.phonePill,
              {
                backgroundColor: fieldBg,
                borderColor: focused ? brandBlue : tokens.colors.border,
              },
            ]}
          >
            <View style={styles.prefixRow}>
              <Text style={styles.flag}>🇺🇿</Text>
              <Text style={[styles.prefixText, { color: tokens.colors.text }]}>{PHONE_PREFIX}</Text>
              <Icon name="chevron-down" size={14} color={tokens.colors.textTertiary} />
            </View>
            <View style={[styles.vDivider, { backgroundColor: tokens.colors.border }]} />
            <TextInput
              style={[styles.input, { color: tokens.colors.text }]}
              placeholder="90 123 45 67"
              placeholderTextColor={tokens.colors.textPlaceholder}
              value={formatUzNationalDigits(digits)}
              onChangeText={(v) => setDigits(v.replace(/\D/g, '').slice(0, 9))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="phone-pad"
              maxLength={13}
              editable={!navigating}
            />
          </View>
          {showOperatorError ? (
            <Text style={{ color: tokens.colors.error, fontSize: 12, marginTop: 8, marginLeft: 8 }}>
              {language === 'ru' ? UZ_PHONE_INLINE_ERROR_RU : UZ_PHONE_INLINE_ERROR_UZ}
            </Text>
          ) : null}

          <View style={{ height: 18 }} />
          <AuthCtaButton title={t.loginTitle} pill loading={navigating} disabled={!isValid} onPress={() => goToPassword('login')} />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: tokens.colors.border }]} />
            <Text style={{ color: tokens.colors.textTertiary, fontSize: 13, fontWeight: '500' }}>
              {language === 'uz' ? 'yoki' : 'или'}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: tokens.colors.border }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                borderColor: tokens.colors.border,
                backgroundColor: fieldBg,
              },
            ]}
            onPress={onGoogle}
            activeOpacity={0.85}
          >
            <GoogleMark size={20} />
            <Text style={{ color: tokens.colors.text, fontWeight: '600', fontSize: 15 }}>{t.loginGoogle}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{ color: tokens.colors.textSecondary, fontSize: 14 }}>
              {t.loginNoAccount}{' '}
              <Text style={{ color: brandBlue, fontWeight: '700' }} onPress={() => goToPassword('signup')}>
                {t.loginSignUpCta}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: { width: 52, height: 52 },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  phonePill: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700' },
  vDivider: { width: 1, height: 22, marginHorizontal: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', letterSpacing: 0.3, paddingVertical: 0 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  googleBtn: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 36,
  },
});
