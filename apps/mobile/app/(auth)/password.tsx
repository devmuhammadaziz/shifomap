import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import {
  authPhonePassword,
  getConnectionErrorMessage,
  getApiErrorMessage,
} from '../../lib/api';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { formatUzNationalDigits, isValidUzPhone9 } from '../../lib/uz-phone';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';
import { AuthBackButton } from '../../components/auth/AuthBackButton';

const SHIELD_IMG = require('../../assets/auth-shield-lock.png');

function isUzPhoneValid(phone: string): boolean {
  const d = phone.replace(/\D/g, '');
  if (d.length !== 12 || !d.startsWith('998')) return false;
  return isValidUzPhone9(d.slice(3));
}

const PASSWORD_RULE_MSG_UZ =
  "Parol kamida 8 ta belgi, kamida 1 katta harf (A–Z) va kamida 1 raqamdan iborat bo'lishi kerak.";
const PASSWORD_RULE_MSG_RU =
  'Пароль: минимум 8 символов, минимум 1 заглавная латинская буква (A–Z) и минимум 1 цифра.';

function normalizePhone(raw: string): string {
  const s = raw.replace(/^%2B/, '+').replace(/\s/g, '');
  return s.startsWith('+') ? s : `+${s}`;
}

export default function PasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const rawPhone = (params.phone ?? pendingPhone ?? '').trim();
  const phone = normalizePhone(rawPhone);
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const setToken = useAuthStore((s) => s.setToken);
  const setPatient = useAuthStore((s) => s.setPatient);
  const tokens = getTokens(theme);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const [focused, setFocused] = useState(false);
  const [showScreen, setShowScreen] = useState(false);
  const [errorPopover, setErrorPopover] = useState<{ title: string; message: string } | null>(null);
  const redirectDone = useRef(false);

  const t = getTranslations(language);
  const hasValidPhone = phone.length > 0 && isUzPhoneValid(phone);
  const brandBlue = tokens.brand.iris;
  const fieldBg = theme === 'dark' ? tokens.colors.backgroundInput : '#F4F7FF';
  const rulesBg = theme === 'dark' ? tokens.colors.backgroundSecondary : '#F3F4F6';

  useEffect(() => {
    if (redirectDone.current) return;
    if (hasValidPhone) {
      setShowScreen(true);
      return;
    }
    const timer = setTimeout(() => {
      const normalized = normalizePhone(params.phone ?? pendingPhone ?? '');
      const valid = normalized.length > 0 && isUzPhoneValid(normalized);
      if (!valid) {
        redirectDone.current = true;
        setPendingPhone(null);
        router.replace('/(auth)/login');
      } else {
        setShowScreen(true);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [hasValidPhone, params.phone, pendingPhone, router, setPendingPhone]);

  const onSubmit = async () => {
    const pwd = password.trim();
    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/\d/.test(pwd)) {
      setErrorPopover({
        title: t.passwordTitle,
        message: language === 'ru' ? PASSWORD_RULE_MSG_RU : PASSWORD_RULE_MSG_UZ,
      });
      return;
    }
    setLoading(true);
    setErrorPopover(null);
    try {
      const intent = params.mode === 'login' ? 'login' : 'signup';
      const data = await authPhonePassword(phone, pwd, language as 'uz' | 'ru' | 'en', intent);
      if (!data.token) throw new Error('Auth failed');
      setToken(data.token);
      setPatient(data.patient);
      setPendingPhone(null);
      const needsProfile = data.needsProfile ?? !data.patient?.fullName;
      router.replace(needsProfile ? '/(auth)/complete-profile' : '/(tabs)');
    } catch (e) {
      const apiMsg = getApiErrorMessage(e);
      const isNetwork =
        !apiMsg &&
        (getConnectionErrorMessage(e).includes('Cannot reach server') ||
          (e as { code?: string })?.code === 'ERR_NETWORK');
      if (isNetwork) {
        Alert.alert('Error', getConnectionErrorMessage(e));
      } else if (apiMsg === 'Invalid password') {
        setErrorPopover({ title: t.passwordWrongTitle, message: t.passwordWrongMessage });
      } else if (apiMsg === 'Phone already registered') {
        setErrorPopover({ title: t.passwordTitle, message: t.phoneAlreadyRegistered });
      } else {
        setErrorPopover({
          title: t.passwordTitle,
          message: apiMsg && apiMsg !== 'Auth failed' ? apiMsg : t.authServerError,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!showScreen) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: tokens.colors.background }]}>
        <ActivityIndicator size="large" color={brandBlue} />
      </View>
    );
  }

  const pwd = password.trim();
  const isValid = pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
  const phoneDisplay = isUzPhoneValid(phone)
    ? '+998 ' + formatUzNationalDigits(phone.replace(/\D/g, '').slice(-9))
    : phone;

  const rules = [
    {
      key: 'length',
      ok: pwd.length >= 8,
      icon: 'shield-checkmark-outline' as const,
      label:
        language === 'ru'
          ? 'Минимум 8 символов'
          : language === 'en'
            ? 'At least 8 characters'
            : "Kamida 8 ta belgi",
    },
    {
      key: 'upper',
      ok: /[A-Z]/.test(pwd),
      glyph: 'Aa',
      label:
        language === 'ru'
          ? 'Хотя бы 1 заглавная буква (A–Z)'
          : language === 'en'
            ? 'At least 1 uppercase letter (A–Z)'
            : "Kamida 1 ta katta harf (A-Z)",
    },
    {
      key: 'digit',
      ok: /\d/.test(pwd),
      glyph: '123',
      label:
        language === 'ru'
          ? 'Хотя бы 1 цифра (0–9)'
          : language === 'en'
            ? 'At least 1 number (0–9)'
            : "Kamida 1 ta raqam (0-9)",
    },
  ] as const;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top', 'bottom']}>
      <WaveBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <AuthBackButton onPress={() => router.back()} />
          </View>

          <Image source={SHIELD_IMG} style={styles.shield} resizeMode="contain" />

          <Text style={[styles.title, { color: tokens.colors.text }]}>
            {params.mode === 'login' ? t.passwordLoginTitle : t.passwordCreateTitle}
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            {params.mode === 'login' ? t.passwordLoginSubtitle : t.passwordCreateSubtitle}
          </Text>

          <View
            style={[
              styles.phoneChip,
              {
                backgroundColor: tokens.colors.backgroundCard,
                shadowColor: tokens.colors.cardShadow,
              },
            ]}
          >
            <Icon name="call" size={14} color={brandBlue} />
            <Text style={{ color: tokens.colors.text, fontWeight: '700', fontSize: 13 }}>{phoneDisplay}</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: tokens.colors.text }]}>{t.passwordTitle}</Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: fieldBg,
                  borderColor: focused ? brandBlue : tokens.colors.border,
                },
              ]}
            >
              <Icon name="lock-closed-outline" size={18} color={tokens.colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: tokens.colors.text }]}
                placeholder={t.passwordPlaceholder}
                placeholderTextColor={tokens.colors.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                secureTextEntry={secure}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setSecure((s) => !s)} hitSlop={10}>
                <Icon name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={tokens.colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.rulesWrap, { backgroundColor: rulesBg }]}>
              {rules.map((rule) => {
                const inactive = pwd.length === 0;
                const tone = inactive ? tokens.colors.textSecondary : rule.ok ? tokens.colors.success : tokens.colors.error;
                return (
                  <View key={rule.key} style={styles.ruleRow}>
                    <View
                      style={[
                        styles.ruleCircle,
                        { borderColor: inactive ? tokens.colors.border : tone },
                      ]}
                    >
                      {!inactive && rule.ok ? <View style={[styles.ruleDot, { backgroundColor: tone }]} /> : null}
                    </View>
                    {'icon' in rule && rule.icon ? (
                      <Icon name={rule.icon} size={15} color={brandBlue} />
                    ) : (
                      <Text style={[styles.ruleGlyph, { color: brandBlue }]}>{'glyph' in rule ? rule.glyph : ''}</Text>
                    )}
                    <Text style={{ color: tone, fontSize: 13, fontWeight: '600', flex: 1 }}>{rule.label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 22 }} />
            <AuthCtaButton
              title={t.passwordContinue}
              loading={loading}
              disabled={!isValid}
              onPress={onSubmit}
            />
          </View>

          <View style={styles.secureRow}>
            <Icon name="shield-checkmark" size={14} color={brandBlue} />
            <Text style={{ color: tokens.colors.textTertiary, fontSize: 12 }}>{t.passwordProtected}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!errorPopover} transparent animationType="fade" onRequestClose={() => setErrorPopover(null)}>
        <Pressable style={styles.popoverOverlay} onPress={() => setErrorPopover(null)}>
          <Pressable
            style={[styles.popoverCard, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border }]}
            onPress={(ev) => ev.stopPropagation()}
          >
            <View style={[styles.popoverIconWrap, { backgroundColor: tokens.colors.errorBg }]}>
              <Icon name="alert-circle" size={28} color={tokens.colors.error} />
            </View>
            <Text style={[tokens.type.title, { color: tokens.colors.text, marginBottom: 8, textAlign: 'center' }]}>
              {errorPopover?.title ?? ''}
            </Text>
            <Text style={{ color: tokens.colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 18 }}>
              {errorPopover?.message ?? ''}
            </Text>
            <AuthCtaButton title={t.errorDismiss} onPress={() => setErrorPopover(null)} rightIcon="close" />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  topRow: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
  shield: { width: 168, height: 168, alignSelf: 'center', marginTop: 4 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 36,
  },
  phoneChip: {
    alignSelf: 'center',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  form: { paddingHorizontal: 24, paddingTop: 22 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputBox: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  rulesWrap: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleDot: { width: 8, height: 8, borderRadius: 4 },
  ruleGlyph: { fontSize: 11, fontWeight: '800', width: 22, textAlign: 'center' },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popoverCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
  },
  popoverIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
});
