import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons/Icon';
import { useRouter } from 'expo-router';
import { getClinicsList, type ClinicListItem } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import Skeleton from '../components/Skeleton';

const ACCENT = '#2563EB';
const DEFAULT_CLINIC_COVER =
  'https://www.shutterstock.com/image-photo/medical-coverage-insurance-concept-hands-260nw-1450246616.jpg';

export default function ClinicsTabScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
          {language === 'uz' ? 'Klinikalar' : 'Клиники'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/clinics-map')} hitSlop={10}>
          <Icon name="map-outline" size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border }]}
            >
              <Skeleton width="100%" height={140} style={{ backgroundColor: tokens.colors.border }} />
              <View style={styles.cardInfo}>
                <Skeleton width="85%" height={17} style={{ marginBottom: 6 }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : clinics.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="business-outline" size={56} color={tokens.colors.border} />
          <Text style={[styles.emptyTitle, { color: tokens.colors.textSecondary }]}>{t.clinics}</Text>
          <Text style={[styles.emptySub, { color: tokens.colors.textTertiary }]}>{t.noResultsFound}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={ACCENT} />
          }
        >
          {clinics.map((c) => {
            const coverUri = c.coverUrl || c.logoUrl || DEFAULT_CLINIC_COVER;
            const catNames = (c.categories || []).map((cat) => (typeof cat === 'string' ? cat : cat.name));
            const tagline = catNames.length
              ? catNames.slice(0, 2).join(' · ') + (catNames.length > 2 ? ' ...' : '')
              : (c.descriptionShort || '').slice(0, 40);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.card, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border }]}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/clinic/[id]', params: { id: c.id } })}
              >
                <View style={styles.cardCoverWrap}>
                  <Image source={{ uri: coverUri }} style={[styles.cardCover, { backgroundColor: tokens.colors.border }]} />
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>
                      {(t.nServices || '{{n}}').replace('{{n}}', String(c.servicesCount))}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: tokens.colors.text }]} numberOfLines={1}>
                    {c.clinicDisplayName}
                  </Text>
                  {tagline ? (
                    <Text style={[styles.cardTagline, { color: tokens.colors.textTertiary }]} numberOfLines={1}>
                      {tagline}
                    </Text>
                  ) : null}
                  <View style={styles.cardMetaRow}>
                    <Icon name="star" size={14} color="#F59E0B" />
                    <Text style={styles.cardRating}>
                      {c.rating.avg > 0 ? c.rating.avg.toFixed(1) : '—'}{' '}
                      {c.rating.count > 0 ? `(${c.rating.count})` : ''}
                    </Text>
                    <Text style={{ color: tokens.colors.textTertiary }}>·</Text>
                    <Text style={{ color: tokens.colors.textTertiary, fontSize: 12 }}>
                      {c.branchesCount} {t.branches}
                    </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 140 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  cardCoverWrap: { position: 'relative', width: '100%', height: 140 },
  cardCover: { width: '100%', height: 140 },
  cardBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cardBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardInfo: { padding: 14 },
  cardName: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  cardTagline: { fontSize: 13, marginBottom: 6 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardRating: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
