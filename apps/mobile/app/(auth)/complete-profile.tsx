import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { completeProfile } from '../../lib/api';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { WaveBackground } from '../../components/auth/WaveBackground';
import { AuthCtaButton } from '../../components/auth/AuthCtaButton';
import { AuthBackButton } from '../../components/auth/AuthBackButton';

const AVATAR_IMG = require('../../assets/auth-profile-avatar.png');

export default function CompleteProfileScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const setPatient = useAuthStore((s) => s.setPatient);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const brandBlue = tokens.brand.iris;
  const fieldBg = theme === 'dark' ? tokens.colors.backgroundInput : '#FFFFFF';

  const onDone = async () => {
    const name = fullName.trim();
    if (!name) {
      Alert.alert('', t.completeError);
      return;
    }
    const ageNum = age.trim() ? parseInt(age, 10) : null;
    if (age.trim() && (isNaN(ageNum!) || ageNum! < 1 || ageNum! > 150)) {
      Alert.alert('', t.completeAgeError);
      return;
    }
    setLoading(true);
    try {
      const updated = await completeProfile({ fullName: name, gender, age: ageNum });
      setPatient(updated);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
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
          <View style={styles.topRow}>
            <AuthBackButton onPress={() => router.back()} />
          </View>

          <Image source={AVATAR_IMG} style={styles.avatar} resizeMode="contain" />

          <Text style={[styles.title, { color: tokens.colors.text }]}>{t.completeTitle}</Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>{t.completeSubtitle}</Text>

          <View style={styles.form}>
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.fieldLabel, { color: tokens.colors.text }]}>{t.completeFullName}</Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: fieldBg,
                    borderColor: focusedField === 'name' ? brandBlue : tokens.colors.border,
                  },
                ]}
              >
                <Icon name="person-outline" size={18} color={tokens.colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: tokens.colors.text }]}
                  placeholder={t.completeFullNamePlaceholder}
                  placeholderTextColor={tokens.colors.textPlaceholder}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.fieldLabel, { color: tokens.colors.text }]}>{t.completeAge}</Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: fieldBg,
                    borderColor: focusedField === 'age' ? brandBlue : tokens.colors.border,
                  },
                ]}
              >
                <Icon name="calendar-outline" size={18} color={tokens.colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: tokens.colors.text }]}
                  placeholder={t.completeAgePlaceholder}
                  placeholderTextColor={tokens.colors.textPlaceholder}
                  value={age}
                  onChangeText={(v) => setAge(v.replace(/\D/g, '').slice(0, 3))}
                  onFocus={() => setFocusedField('age')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={[styles.fieldLabel, { color: tokens.colors.text }]}>{t.completeGender}</Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as const).map((g) => {
                  const active = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        {
                          backgroundColor: active
                            ? theme === 'dark'
                              ? tokens.colors.primaryBg
                              : '#E8F0FE'
                            : fieldBg,
                          borderColor: active ? brandBlue : tokens.colors.border,
                        },
                      ]}
                      onPress={() => setGender(g)}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Icon
                        name={g === 'male' ? 'male' : 'female'}
                        size={18}
                        color={active ? brandBlue : tokens.colors.textTertiary}
                      />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          fontWeight: '700',
                          color: active ? brandBlue : tokens.colors.text,
                        }}
                      >
                        {g === 'male' ? t.completeMale : t.completeFemale}
                      </Text>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: active ? brandBlue : tokens.colors.border },
                        ]}
                      >
                        {active ? <View style={[styles.radioInner, { backgroundColor: brandBlue }]} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <AuthCtaButton
              title={t.completeDone}
              rightIcon="checkmark"
              loading={loading}
              onPress={onDone}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  topRow: { paddingHorizontal: 20, paddingTop: 4 },
  avatar: { width: 148, height: 148, alignSelf: 'center', marginTop: 4 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  form: { paddingHorizontal: 24, paddingTop: 24 },
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
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
