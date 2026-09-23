import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/icons/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore, DEFAULT_AVATAR } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { useNotificationStore } from '../../store/notification-store';
import { getTranslations } from '../../lib/translations';
import { getTokens, shadows } from '../../lib/design';
import {
  searchServicesSuggest,
  getNextUpcomingBooking,
  getClinicsList,
  getMyNextPill,
  submitCustomReminderPillEvent,
  setPrescriptionEvent,
  searchServicesWithFilters,
  type PublicServiceItem,
  type NextPillInfo,
  type Booking,
  type ClinicListItem,
} from '../../lib/api';
import { Avatar, IconButton, SkeletonBlock } from '../../components/ui';
import HomePriceFilterSheet from '../components/HomePriceFilterSheet';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8e25d1d?w=400&q=80';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function formatPrice(price: PublicServiceItem['price']): string {
  if (price.amount != null) return `${price.amount.toLocaleString()} ${price.currency}`;
  if (price.minAmount != null && price.maxAmount != null) {
    return `${price.minAmount.toLocaleString()} – ${price.maxAmount.toLocaleString()} ${price.currency}`;
  }
  return price.currency;
}

type Tool = {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  gradient: [string, string];
  path: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const patient = useAuthStore((s) => s.patient);
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const isUz = language !== 'ru';
  const isDark = theme === 'dark';
  const avatarUri = patient?.avatarUrl || DEFAULT_AVATAR;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [serviceSuggestions, setServiceSuggestions] = useState<PublicServiceItem[]>([]);
  const [clinicSuggestions, setClinicSuggestions] = useState<ClinicListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceFilterVisible, setPriceFilterVisible] = useState(false);

  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [nextPill, setNextPill] = useState<NextPillInfo | null>(null);
  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [featured, setFeatured] = useState<PublicServiceItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { getUnreadCount, hydrated, hydrate } = useNotificationStore();
  const unread = getUnreadCount();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const loadAll = useCallback(async () => {
    await Promise.all([
      getClinicsList(6)
        .then(setClinics)
        .catch(() => setClinics([]))
        .finally(() => setClinicsLoading(false)),
      getNextUpcomingBooking()
        .then(setNextBooking)
        .catch(() => setNextBooking(null)),
      getMyNextPill()
        .then(setNextPill)
        .catch(() => setNextPill(null)),
      searchServicesWithFilters({}, 1, 30)
        .then((r) => setFeatured(shuffle(r.services ?? []).slice(0, 8)))
        .catch(() => setFeatured([]))
        .finally(() => setFeaturedLoading(false)),
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
      await hydrate();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll, hydrate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setServiceSuggestions([]);
      setClinicSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setShowSuggestions(true);
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchServicesSuggest(searchQuery.trim(), 10);
        setServiceSuggestions(res.services);
        setClinicSuggestions(res.clinics);
      } catch {
        setServiceSuggestions([]);
        setClinicSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const tools: Tool[] = [
    {
      key: 'ai',
      title: isUz ? 'AI Doktor' : 'AI Доктор',
      subtitle: isUz ? 'Suhbat' : 'Чат',
      icon: 'sparkles',
      gradient: [tokens.brand.iris, tokens.brand.lilac],
      path: '/ai-chat',
    },
    {
      key: 'health',
      title: isUz ? '10 ta savol' : '10 вопросов',
      subtitle: isUz ? 'Holatingizni baholang' : 'Оценка здоровья',
      icon: 'pulse',
      gradient: [tokens.brand.rose, tokens.brand.peach],
      path: '/health-test',
    },
    {
      key: 'aid',
      title: isUz ? 'Ilk yordam' : 'Первая помощь',
      subtitle: isUz ? "Qo'llanmalar" : 'Инструкции',
      icon: 'medkit',
      gradient: [tokens.brand.mint, '#a7f3d0'],
      path: '/first-aid',
    },
    {
      key: 'analyze',
      title: isUz ? 'AI Tahlil' : 'AI Анализ',
      subtitle: isUz ? 'AI izohi' : 'AI объяснит',
      icon: 'document-text',
      gradient: [tokens.brand.sky, tokens.brand.skySoft],
      path: '/ai-analyze',
    },
  ];

  const firstName =
    patient?.fullName?.trim()?.split(/\s+/)[0] || (isUz ? 'Foydalanuvchi' : 'Пользователь');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.brand.iris} />}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.greeting}
            activeOpacity={0.85}
          >
            <Avatar uri={avatarUri} name={patient?.fullName} size={48} ring />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[tokens.type.overline, { color: tokens.colors.textTertiary }]} numberOfLines={1}>
                {isUz ? 'SALOM' : 'ПРИВЕТ'}
              </Text>
              <Text style={[styles.userName, { color: tokens.colors.text }]} numberOfLines={1}>
                {firstName}
              </Text>
            </View>
          </TouchableOpacity>
          <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} badge={unread} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? tokens.colors.backgroundInput : '#F3F4F6',
                borderColor: showSuggestions ? tokens.brand.iris : 'transparent',
                ...(!isDark ? shadows.sm : null),
              },
            ]}
          >
            <Icon name="search" size={18} color={tokens.colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: tokens.colors.text }]}
              placeholder={t.searchPlaceholder || (isUz ? 'Qidirish' : 'Поиск')}
              placeholderTextColor={tokens.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                hitSlop={8}
                onPress={() => {
                  setSearchQuery('');
                  Keyboard.dismiss();
                }}
              >
                <Icon name="close-circle" size={18} color={tokens.colors.textTertiary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                hitSlop={8}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowSuggestions(false);
                  setPriceFilterVisible(true);
                }}
              >
                <Icon name="options-outline" size={20} color={tokens.brand.iris} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <HomePriceFilterSheet
          visible={priceFilterVisible}
          onClose={() => setPriceFilterVisible(false)}
          initialQuery={searchQuery}
          language={language}
          tokens={tokens}
        />

        {showSuggestions && searchQuery.trim() ? (
          <View
            style={[
              styles.suggestions,
              { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border },
            ]}
          >
            {searchLoading ? (
              <View style={{ padding: 16, gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <SkeletonBlock width={44} height={44} radius={12} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBlock width="80%" height={12} />
                      <SkeletonBlock width="50%" height={10} />
                    </View>
                  </View>
                ))}
              </View>
            ) : serviceSuggestions.length + clinicSuggestions.length === 0 ? (
              <Text style={{ color: tokens.colors.textTertiary, textAlign: 'center', padding: 20, fontSize: 13 }}>
                {t.noResultsFound}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {clinicSuggestions.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.sugRow, { borderBottomColor: tokens.colors.borderLight }]}
                    onPress={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                      Keyboard.dismiss();
                      router.push({ pathname: '/clinic/[id]', params: { id: c.id } });
                    }}
                  >
                    <Image
                      source={{ uri: c.logoUrl || DEFAULT_IMAGE }}
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tokens.colors.border }}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: tokens.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {c.clinicDisplayName}
                      </Text>
                      <Text style={{ color: tokens.colors.textTertiary, fontSize: 12 }}>
                        {c.branchesCount} {isUz ? 'filial' : 'филиалов'}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color={tokens.colors.textTertiary} />
                  </TouchableOpacity>
                ))}
                {serviceSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.sugRow, { borderBottomColor: tokens.colors.borderLight }]}
                    onPress={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                      Keyboard.dismiss();
                      router.push({ pathname: '/service/[id]', params: { id: s._id } });
                    }}
                  >
                    <Image
                      source={{ uri: s.serviceImage || DEFAULT_IMAGE }}
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tokens.colors.border }}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: tokens.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={{ color: tokens.colors.textTertiary, fontSize: 12 }}>{s.clinicDisplayName}</Text>
                    </View>
                    <Text style={{ color: tokens.brand.iris, fontWeight: '700', fontSize: 13 }}>
                      {formatPrice(s.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {/* Map search — matches previous first-viewport card */}
        <TouchableOpacity
          style={[
            styles.mapCard,
            {
              backgroundColor: tokens.colors.backgroundCard,
              borderColor: tokens.colors.border,
              ...(!isDark ? shadows.sm : null),
            },
          ]}
          onPress={() => router.push('/clinics-map')}
          activeOpacity={0.88}
        >
          <LinearGradient colors={[tokens.brand.iris, tokens.brand.indigo]} style={styles.mapIcon}>
            <Icon name="map" size={20} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.mapTitle, { color: tokens.colors.text }]}>
              {isUz ? 'Xaritadan qidirish' : 'Поиск на карте'}
            </Text>
            <Text style={{ color: tokens.colors.textTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {isUz ? 'Yaqin atrofdagi klinika va aptekalar' : 'Клиники и аптеки рядом'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={tokens.colors.textTertiary} />
        </TouchableOpacity>

        {/* Hero CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <LinearGradient
            colors={tokens.gradients.hero as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, !isDark ? shadows.md : null]}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.heroEyebrow}>{isUz ? 'SIZ UCHUN' : 'ДЛЯ ВАС'}</Text>
              <Text style={styles.heroTitle}>
                {nextBooking
                  ? isUz
                    ? 'Keyingi tashrif tayyor'
                    : 'Следующий приём готов'
                  : isUz
                    ? "Shifokor bilan bog'laning"
                    : 'Запишитесь к врачу'}
              </Text>
              <Text style={styles.heroSub}>
                {nextBooking
                  ? `${nextBooking.scheduledDate.split('-').reverse().join('/')} · ${nextBooking.scheduledTime}`
                  : isUz
                    ? 'Bir necha daqiqada bron qiling'
                    : 'Запись за пару минут'}
              </Text>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() =>
                  router.push(nextBooking ? '/(tabs)/appointments' : '/doctor-search')
                }
                activeOpacity={0.88}
              >
                <Text style={[styles.heroBtnText, { color: tokens.brand.indigoDeep }]}>
                  {nextBooking ? (isUz ? "Ko'rish" : 'Посмотреть') : isUz ? 'Bron qilish' : 'Записаться'}
                </Text>
                <Icon name="arrow-forward" size={14} color={tokens.brand.indigoDeep} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroCircle}>
              <Icon name="medkit" size={36} color="#fff" />
            </View>
          </LinearGradient>
        </View>

        {/* Tezkor tools */}
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <Text style={[tokens.type.titleLg, { color: tokens.colors.text }]}>
            {isUz ? 'Tezkor' : 'Быстрый доступ'}
          </Text>
          <View style={styles.toolsGrid}>
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.key}
                style={[
                  styles.toolCard,
                  {
                    backgroundColor: tokens.colors.backgroundCard,
                    borderColor: tokens.colors.border,
                    ...(!isDark ? shadows.sm : null),
                  },
                ]}
                onPress={() => router.push(tool.path as never)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={tool.gradient} style={styles.toolIcon}>
                  <Icon name={tool.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.toolTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                  {tool.title}
                </Text>
                <Text style={{ color: tokens.colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {tool.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pill reminder */}
        {nextPill ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View
              style={[
                styles.pillBanner,
                {
                  backgroundColor: tokens.colors.backgroundCard,
                  borderColor: tokens.colors.border,
                  ...(!isDark ? shadows.sm : null),
                },
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                onPress={() => router.push('/pill-reminder')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={tokens.gradients.warm as [string, string, ...string[]]} style={styles.pillIcon}>
                  <Icon name="medical" size={20} color={tokens.brand.amber} />
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: tokens.colors.textSecondary, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                    {isUz ? 'Doringizni ichdingizmi?' : 'Вы приняли лекарство?'}
                  </Text>
                  <Text style={{ color: tokens.colors.text, fontSize: 15, fontWeight: '700', marginTop: 3 }} numberOfLines={1}>
                    {nextPill.medicineName} · {nextPill.time}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillCheckBtn, { backgroundColor: tokens.brand.iris }]}
                activeOpacity={0.88}
                onPress={async () => {
                  try {
                    if (nextPill.customReminderId) {
                      await submitCustomReminderPillEvent({
                        reminderId: nextPill.customReminderId,
                        action: 'taken',
                        date: nextPill.date,
                        time: nextPill.time,
                      });
                    } else if (nextPill.prescriptionId && nextPill.medicineKey) {
                      await setPrescriptionEvent({
                        prescriptionId: nextPill.prescriptionId,
                        medicineKey: nextPill.medicineKey,
                        date: nextPill.date,
                        time: nextPill.time,
                        action: 'taken',
                      });
                    }
                    setNextPill(await getMyNextPill().catch(() => null));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Icon name="checkmark" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Top clinics */}
        <View style={{ marginTop: 26 }}>
          <View style={[styles.rowBetween, { paddingHorizontal: 20, marginBottom: 12 }]}>
            <Text style={[tokens.type.titleLg, { color: tokens.colors.text }]}>
              {isUz ? 'Eng yaxshi klinikalar' : 'Лучшие клиники'}
            </Text>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/(tabs)/clinics')}>
              <Text style={{ color: tokens.brand.iris, fontWeight: '700', fontSize: 14 }}>{t.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 24, gap: 14 }}
          >
            {clinicsLoading && clinics.length === 0
              ? [1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.clinicCard,
                      { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border },
                    ]}
                  >
                    <SkeletonBlock width="100%" height={120} radius={0} />
                    <View style={{ padding: 12, gap: 6 }}>
                      <SkeletonBlock width="80%" height={14} />
                      <SkeletonBlock width="50%" height={10} />
                    </View>
                  </View>
                ))
              : clinics.map((c) => {
                  const cover = c.coverUrl || c.logoUrl || DEFAULT_COVER;
                  const cats = (c.categories || [])
                    .map((x) => (typeof x === 'string' ? x : x.name))
                    .slice(0, 2)
                    .join(' · ');
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.clinicCard,
                        {
                          backgroundColor: tokens.colors.backgroundCard,
                          borderColor: tokens.colors.border,
                          ...(!isDark ? shadows.sm : null),
                        },
                      ]}
                      activeOpacity={0.88}
                      onPress={() => router.push({ pathname: '/clinic/[id]', params: { id: c.id } })}
                    >
                      <Image source={{ uri: cover }} style={styles.clinicCover} />
                      <View style={styles.ratingPill}>
                        <Icon name="star" size={11} color={tokens.brand.amber} />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                          {(c.rating?.avg ?? 0).toFixed(1)}
                        </Text>
                      </View>
                      <View style={{ padding: 12 }}>
                        <Text style={{ color: tokens.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                          {c.clinicDisplayName}
                        </Text>
                        <Text style={{ color: tokens.colors.textTertiary, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                          {cats || `${c.servicesCount} ${isUz ? 'xizmat' : 'услуг'}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>

        {/* Popular services */}
        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <View style={[styles.rowBetween, { paddingHorizontal: 20, marginBottom: 12 }]}>
            <Text style={[tokens.type.titleLg, { color: tokens.colors.text }]}>
              {isUz ? 'Mashhur xizmatlar' : 'Популярные услуги'}
            </Text>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/services-results')}>
              <Text style={{ color: tokens.brand.iris, fontWeight: '700', fontSize: 14 }}>{t.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 24, gap: 14 }}
          >
            {featuredLoading && featured.length === 0
              ? [1, 2, 3].map((i) => (
                  <View key={i} style={styles.serviceCardSkeleton}>
                    <SkeletonBlock width="100%" height={110} radius={16} />
                    <View style={{ gap: 6, marginTop: 8 }}>
                      <SkeletonBlock width="80%" height={12} />
                      <SkeletonBlock width="55%" height={10} />
                    </View>
                  </View>
                ))
              : featured.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={[
                      styles.serviceCard,
                      {
                        backgroundColor: tokens.colors.backgroundCard,
                        borderColor: tokens.colors.border,
                        ...(!isDark ? shadows.sm : null),
                      },
                    ]}
                    activeOpacity={0.88}
                    onPress={() => router.push({ pathname: '/service/[id]', params: { id: s._id } })}
                  >
                    <Image
                      source={{ uri: s.serviceImage || DEFAULT_IMAGE }}
                      style={styles.serviceImage}
                    />
                    <View style={styles.serviceCardBody}>
                      <Text style={{ color: tokens.colors.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text
                        style={{ color: tokens.brand.iris, fontWeight: '800', fontSize: 13, marginTop: 6 }}
                        numberOfLines={1}
                      >
                        {formatPrice(s.price)}
                      </Text>
                      <Text
                        style={{ color: tokens.colors.textTertiary, fontSize: 11, marginTop: 4 }}
                        numberOfLines={1}
                      >
                        {s.clinicDisplayName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', lineHeight: 22, marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, marginTop: 14 },
  searchBox: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  suggestions: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mapCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTitle: { fontSize: 15, fontWeight: '800' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    minHeight: 148,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 28,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  heroBtn: {
    marginTop: 14,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBtnText: { fontWeight: '800', fontSize: 13 },
  heroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  toolCard: {
    width: '47.5%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: { elevation: 2 },
    }),
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: { fontSize: 14, fontWeight: '800', marginTop: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pillIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pillCheckBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicCard: {
    width: 220,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  clinicCover: { width: '100%', height: 120, backgroundColor: '#e2e8f0' },
  ratingPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  serviceCard: {
    width: 188,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  serviceCardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  serviceCardSkeleton: {
    width: 188,
    padding: 6,
  },
});
