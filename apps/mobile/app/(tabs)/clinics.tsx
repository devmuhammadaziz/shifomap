import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/icons/Icon';
import { useRouter } from 'expo-router';
import { getClinicsList, type ClinicListItem } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { IconButton, SkeletonBlock } from '../../components/ui';

const ACCENT = '#2563EB';
const DEFAULT_CLINIC_COVER =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80';

function catName(cat: ClinicListItem['categories'][number]): string {
  return typeof cat === 'string' ? cat : cat.name;
}

function clinicCity(c: ClinicListItem): string | null {
  return c.branches?.[0]?.address?.city || null;
}

function ClinicCover({ uri }: { uri: string }) {
  const [ready, setReady] = useState(false);
  return (
    <View style={styles.coverWrap}>
      {!ready ? (
        <View style={styles.coverSkeleton}>
          <SkeletonBlock width="100%" height={176} radius={0} />
        </View>
      ) : null}
      <Image
        source={{ uri }}
        style={[styles.cover, { opacity: ready ? 1 : 0 }]}
        onLoad={() => setReady(true)}
        fadeDuration={0}
      />
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 0.15)', 'rgba(15, 23, 42, 0.78)']}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function ClinicsTabScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const isUz = language !== 'ru';
  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const rows = await getClinicsList(200);
      setClinics(rows);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter((c) => {
      const cats = (c.categories || []).map(catName).join(' ');
      const city = clinicCity(c) ?? '';
      return `${c.clinicDisplayName} ${cats} ${city} ${c.descriptionShort ?? ''}`.toLowerCase().includes(q);
    });
  }, [clinics, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
            {isUz ? 'Klinikalar' : 'Клиники'}
          </Text>
          <Text style={[styles.headerSub, { color: tokens.colors.textTertiary }]}>
            {isUz ? 'Sizga mos klinika toping' : 'Найдите подходящую клинику'}
          </Text>
        </View>
        <IconButton icon="map-outline" onPress={() => router.push('/clinics-map')} color={ACCENT} />
      </View>

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme === 'dark' ? tokens.colors.backgroundInput : '#F3F4F6',
            },
          ]}
        >
          <Icon name="search" size={18} color={tokens.colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: tokens.colors.text }]}
            placeholder={isUz ? 'Klinika yoki yo‘nalish qidiring...' : 'Клиника или направление...'}
            placeholderTextColor={tokens.colors.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={8}
            >
              <Icon name="close" size={18} color={tokens.colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: tokens.colors.backgroundCard }]}>
              <SkeletonBlock width="100%" height={176} radius={0} />
              <View style={{ padding: 14, gap: 8 }}>
                <SkeletonBlock width="70%" height={16} />
                <SkeletonBlock width="45%" height={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme === 'dark' ? tokens.colors.backgroundSecondary : '#EFF6FF' }]}>
            <Icon name="business-outline" size={36} color={ACCENT} />
          </View>
          <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>{t.noResultsFound}</Text>
          <Text style={[styles.emptySub, { color: tokens.colors.textTertiary }]}>
            {isUz ? 'Boshqa nom bilan qidirib ko‘ring' : 'Попробуйте другой запрос'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={ACCENT}
            />
          }
        >
          <TouchableOpacity
            style={[
              styles.mapPromo,
              {
                backgroundColor: theme === 'dark' ? tokens.colors.backgroundCard : '#EFF6FF',
                borderColor: theme === 'dark' ? tokens.colors.border : '#DBEAFE',
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/clinics-map')}
          >
            <View style={styles.mapPromoIcon}>
              <Icon name="map-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapPromoTitle, { color: tokens.colors.text }]}>
                {isUz ? 'Yaqin klinikalarni xaritada ko‘ring' : 'Клиники рядом на карте'}
              </Text>
              <Text style={{ color: tokens.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
                {filtered.length} {isUz ? 'ta klinika' : 'клиник'}
              </Text>
            </View>
            <View style={styles.mapArrow}>
              <Icon name="arrow-forward" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {filtered.map((c) => {
            const coverUri = c.coverUrl || c.logoUrl || DEFAULT_CLINIC_COVER;
            const cats = (c.categories || []).map(catName).filter(Boolean).slice(0, 2);
            const city = clinicCity(c);
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: tokens.colors.backgroundCard,
                    shadowColor: ACCENT,
                  },
                ]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/clinic/[id]', params: { id: c.id } })}
              >
                <View>
                  <ClinicCover uri={coverUri} />
                  <View style={styles.badgeRow}>
                    <View style={styles.serviceBadge}>
                      <Text style={styles.serviceBadgeText}>
                        {(t.nServices || '{{n}}').replace('{{n}}', String(c.servicesCount))}
                      </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingBadgeText}>
                        {c.rating.avg > 0 ? c.rating.avg.toFixed(1) : '—'}
                        {c.rating.count > 0 ? ` (${c.rating.count})` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.coverName} numberOfLines={1}>
                    {c.clinicDisplayName}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={{ flex: 1 }}>
                    {cats.length ? (
                      <View style={styles.chipRow}>
                        {cats.map((name) => (
                          <View
                            key={name}
                            style={[
                              styles.chip,
                              { backgroundColor: theme === 'dark' ? tokens.colors.primaryBg : '#EFF6FF' },
                            ]}
                          >
                            <Text style={styles.chipText} numberOfLines={1}>
                              {name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : c.descriptionShort ? (
                      <Text style={[styles.fallbackDesc, { color: tokens.colors.textTertiary }]} numberOfLines={1}>
                        {c.descriptionShort}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Icon name="location-outline" size={13} color={tokens.colors.textTertiary} />
                      <Text style={[styles.metaText, { color: tokens.colors.textTertiary }]} numberOfLines={1}>
                        {[city, `${c.branchesCount} ${t.branches}`].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardArrow}>
                    <Icon name="arrow-forward" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  searchBox: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 },
  mapPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  mapPromoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPromoTitle: { fontSize: 14, fontWeight: '700' },
  mapArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  coverWrap: { height: 176, backgroundColor: '#E5E7EB' },
  coverSkeleton: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  cover: { width: '100%', height: 176 },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  serviceBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  coverName: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  chipText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  fallbackDesc: { fontSize: 13, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500', flex: 1 },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
});
