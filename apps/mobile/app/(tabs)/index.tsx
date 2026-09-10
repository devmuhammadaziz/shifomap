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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/icons/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { useNotificationStore } from '../../store/notification-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { searchServicesSuggest, listStories, type PublicServiceItem, type ClinicListItem, type StoryItem } from '../../lib/api';
import { IconButton, SkeletonBlock } from '../../components/ui';
import HomePriceFilterSheet from '../components/HomePriceFilterSheet';
import ShifoRobot from '../components/ShifoRobot';
import StoriesRibbon from '../components/StoriesRibbon';
import { BRAND_LOGO, preloadHomeImages } from '../../lib/home-images';

const ACCENT = '#2563EB';
preloadHomeImages();
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8e25d1d?w=400&q=80';

type QuickItem = {
  key: string;
  icon: IconName;
  uz: string;
  ru: string;
  onPress: (router: ReturnType<typeof useRouter>) => void;
};

const QUICK: QuickItem[] = [
  {
    key: 'clinic',
    icon: 'business-outline',
    uz: 'Klinika topish',
    ru: 'Найти клинику',
    onPress: (r) => r.push('/(tabs)/clinics'),
  },
  {
    key: 'doctor',
    icon: 'medkit-outline',
    uz: 'Shifokorga yozilish',
    ru: 'Запись к врачу',
    onPress: (r) => r.push('/doctor-search'),
  },
  {
    key: 'lab',
    icon: 'flask-outline',
    uz: 'Tahlillar va tekshiruvlar',
    ru: 'Анализы',
    onPress: (r) => r.push('/services-results?q=laboratoriya' as never),
  },
  {
    key: 'ai',
    icon: 'sparkles-outline',
    uz: 'AI Doktor',
    ru: 'AI доктор',
    onPress: (r) => r.push('/ai-chat'),
  },
  {
    key: 'pills',
    icon: 'alarm-outline',
    uz: 'Dori eslatmasi',
    ru: 'Напоминание',
    onPress: (r) => r.push('/pill-reminder'),
  },
  {
    key: 'health',
    icon: 'heart-outline',
    uz: 'Salomatlik boshqaruvi',
    ru: 'Здоровье',
    onPress: (r) => r.push('/health-test'),
  },
  {
    key: 'aid',
    icon: 'bandage-outline',
    uz: 'Birinchi yordam',
    ru: 'Первая помощь',
    onPress: (r) => r.push('/first-aid'),
  },
  {
    key: 'water',
    icon: 'water-outline',
    uz: 'Suv ichish eslatmasi',
    ru: 'Питьевой режим',
    onPress: () => {},
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [serviceSuggestions, setServiceSuggestions] = useState<PublicServiceItem[]>([]);
  const [clinicSuggestions, setClinicSuggestions] = useState<ClinicListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceFilterVisible, setPriceFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stories, setStories] = useState<StoryItem[]>([]);

  const { getUnreadCount, hydrated, hydrate } = useNotificationStore();
  const unread = getUnreadCount();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    listStories(20)
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hydrate();
      const next = await listStories(20).catch(() => [] as StoryItem[]);
      setStories(next);
    } finally {
      setRefreshing(false);
    }
  }, [hydrate]);

  const isUz = language !== 'ru';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Image
                source={BRAND_LOGO}
                defaultSource={BRAND_LOGO}
                fadeDuration={0}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[styles.brand, { color: ACCENT }]}>ShifoYo'l</Text>
              <Text style={[styles.slogan, { color: tokens.colors.textTertiary }]}>
                {isUz ? "Sog'lom hayot sari" : 'К здоровой жизни'}
              </Text>
            </View>
          </View>
          <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} badge={unread} />
        </View>

        <StoriesRibbon stories={stories} language={language} />

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme === 'dark' ? tokens.colors.backgroundInput : '#F3F4F6',
                borderColor: showSuggestions ? ACCENT : 'transparent',
              },
            ]}
          >
            <Icon name="search" size={18} color={tokens.colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: tokens.colors.text }]}
              placeholder={isUz ? 'Klinika, shifokor, xizmat qidiring...' : 'Клиника, врач, услуга...'}
              placeholderTextColor={tokens.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery && setShowSuggestions(true)}
            />
            <TouchableOpacity
              hitSlop={8}
              onPress={() => {
                Keyboard.dismiss();
                setShowSuggestions(false);
                setPriceFilterVisible(true);
              }}
            >
              <Icon name="options-outline" size={20} color={ACCENT} />
            </TouchableOpacity>
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
                    </View>
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
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        <LinearGradient
          colors={theme === 'dark' ? ['#1E3A8A', '#1E40AF'] : ['#DBEAFE', '#EFF6FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiCard}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.aiEyebrow, { color: ACCENT }]}>
              {isUz ? 'AI YORDAMCHI' : 'ИИ ПОМОЩНИК'}
            </Text>
            <Text style={[styles.aiTitle, { color: tokens.colors.text }]}>Shifo</Text>
            <Text style={[styles.aiSub, { color: tokens.colors.textSecondary }]}>
              {isUz
                ? 'Savollaringizga javob berish va yo‘naltirishga shayman!'
                : 'Отвечу на вопросы и подскажу, куда обратиться!'}
            </Text>
            <TouchableOpacity style={styles.aiBtn} onPress={() => router.push('/ai-chat')} activeOpacity={0.88}>
              <Text style={styles.aiBtnText}>{isUz ? 'Shifoga yozish' : 'Написать Шифо'}</Text>
              <Icon name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <ShifoRobot style={styles.robot} />
        </LinearGradient>

        <TouchableOpacity
          style={[
            styles.feedPromo,
            {
              backgroundColor: theme === 'dark' ? tokens.colors.backgroundCard : '#FFF7ED',
              borderColor: theme === 'dark' ? tokens.colors.border : '#FED7AA',
            },
          ]}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/feed')}
        >
          <View style={[styles.feedPromoIcon, { backgroundColor: ACCENT }]}>
            <Icon name="play-circle-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.feedPromoTitle, { color: tokens.colors.text }]}>
              {isUz ? 'Lenta va postlar' : 'Лента и посты'}
            </Text>
            <Text style={{ color: tokens.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
              {isUz ? 'Yangiliklar, layklar va izohlar' : 'Новости, лайки и комментарии'}
            </Text>
          </View>
          <View style={styles.mapArrow}>
            <Icon name="arrow-forward" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            {isUz ? 'Tezkor xizmatlar' : 'Быстрые услуги'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/services-results')}>
            <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 13 }}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {QUICK.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.quickItem}
              activeOpacity={0.8}
              onPress={() => {
                if (item.key === 'water') {
                  Alert.alert(t.comingSoonTitle, t.comingSoonMessage);
                  return;
                }
                item.onPress(router);
              }}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme === 'dark' ? tokens.colors.primaryBg : '#EFF6FF' }]}>
                <Icon name={item.icon} size={22} color={ACCENT} />
              </View>
              <Text style={[styles.quickLabel, { color: tokens.colors.text }]} numberOfLines={2}>
                {isUz ? item.uz : item.ru}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.mapCard, { backgroundColor: theme === 'dark' ? tokens.colors.backgroundCard : '#F8FAFC', borderColor: tokens.colors.border }]}
          onPress={() => router.push('/clinics-map')}
          activeOpacity={0.88}
        >
          <View style={[styles.mapIcon, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="map" size={22} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.mapTitle, { color: tokens.colors.text }]}>
              {isUz ? 'Yaqin klinikalarni xaritada ko‘ring' : 'Клиники рядом на карте'}
            </Text>
            <Text style={{ color: tokens.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
              {isUz ? 'Klinika va aptekalar' : 'Клиники и аптеки'}
            </Text>
          </View>
          <View style={styles.mapArrow}>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: { width: 24, height: 24 },
  brand: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  slogan: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  searchWrap: { paddingHorizontal: 20, marginTop: 8 },
  searchBox: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
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
  aiCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  aiEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  aiTitle: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  aiSub: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  aiBtn: {
    alignSelf: 'flex-start',
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  robot: { width: 118, height: 150, marginRight: -6, marginBottom: -18 },
  feedPromo: {
    marginHorizontal: 20,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  feedPromoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedPromoTitle: { fontSize: 14, fontWeight: '700' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  quickItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  mapCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
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
  mapTitle: { fontSize: 14, fontWeight: '700' },
  mapArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
