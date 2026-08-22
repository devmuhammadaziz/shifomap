import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Icon, type IconName } from '../../components/icons/Icon';
import { useAuthStore, DEFAULT_AVATAR } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { useNotificationStore } from '../../store/notification-store';
import { getTranslations } from '../../lib/translations';
import { getTokens } from '../../lib/design';
import { getNextUpcomingBooking, deleteMe, type Booking } from '../../lib/api';
import { Avatar, IconButton } from '../../components/ui';

const ACCENT = '#2563EB';

const MONTHS_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function formatVisit(dateStr: string, time: string, isUz: boolean) {
  const [y, m, d] = (dateStr || '').split('-');
  const month = Number(m);
  const monthName = isUz ? MONTHS_UZ[month - 1] : MONTHS_RU[month - 1];
  if (!d || !monthName) return `${dateStr} · ${time}`;
  return isUz ? `${Number(d)}-${monthName} ${y} — ${time}` : `${Number(d)} ${monthName} ${y} — ${time}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language) ?? 'uz';
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const patient = useAuthStore((s) => s.patient);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const unread = useNotificationStore((s) => s.getUnreadCount());

  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const isUz = language !== 'ru';

  useFocusEffect(
    useCallback(() => {
      getNextUpcomingBooking().then(setNextBooking).catch(() => setNextBooking(null));
    }, [])
  );

  const onLogout = () => {
    Alert.alert(isUz ? 'Chiqish?' : 'Выйти?', isUz ? 'Ishonchingiz komilmi?' : 'Вы уверены?', [
      { text: isUz ? 'Bekor' : 'Отмена', style: 'cancel' },
      {
        text: isUz ? 'Chiqish' : 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert(
      t.deleteAccount as string,
      `${t.deleteAccountConfirm as string}\n\n${t.deleteAccountWarning as string}`,
      [
        { text: isUz ? 'Bekor' : 'Отмена', style: 'cancel' },
        {
          text: t.delete as string,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMe();
              await logout();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const name = patient?.fullName?.trim() || (isUz ? 'Foydalanuvchi' : 'Пользователь');
  const avatarUri = patient?.avatarUrl || DEFAULT_AVATAR;
  const showNext =
    nextBooking && (nextBooking.status === 'pending' || nextBooking.status === 'confirmed');

  const menu: Array<{ icon: IconName; title: string; onPress: () => void }> = [
    {
      icon: 'time-outline',
      title: isUz ? 'Yozuvlar tarixi' : 'История записей',
      onPress: () => router.push('/(tabs)/appointments'),
    },
    {
      icon: 'chatbubbles-outline',
      title: isUz ? 'Shifokorlar bilan chat' : 'Чат с врачами',
      onPress: () => router.push('/chat'),
    },
    {
      icon: 'bookmark-outline',
      title: isUz ? 'Saqlangan xizmatlar' : 'Сохранённые услуги',
      onPress: () => router.push('/services-results?saved=1' as never),
    },
    {
      icon: 'document-text-outline',
      title: isUz ? 'Mening tahlillarim' : 'Мои анализы',
      onPress: () => router.push('/ai-analyze'),
    },
  ];

  const social = [
    { icon: 'paper-plane-outline' as const, title: 'Telegram', url: 'https://t.me/shifo_yol' },
    { icon: 'logo-instagram' as const, title: 'Instagram', url: 'https://instagram.com/shifoyol' },
    { icon: 'globe-outline' as const, title: isUz ? 'Veb-sayt' : 'Веб-сайт', url: 'https://shifoyol.uz' },
    { icon: 'chatbubble-ellipses-outline' as const, title: isUz ? 'Telegram bot' : 'Telegram-бот', url: 'https://t.me/shifoyol_contact_bot' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.langChip, { borderColor: tokens.colors.border }]}
            onPress={() => void setLanguage(isUz ? 'ru' : 'uz')}
          >
            <Text style={{ color: ACCENT, fontWeight: '800', fontSize: 13 }}>{isUz ? 'Uz' : 'Ru'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon="settings-outline" onPress={() => router.push('/settings')} />
            <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} badge={unread} />
          </View>
        </View>

        <View style={styles.identity}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/edit-profile')}
            style={styles.avatarWrap}
          >
            <Avatar uri={avatarUri} name={name} size={88} ring />
            <View style={styles.camBadge}>
              <Icon name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: tokens.colors.text }]}>{name}</Text>
          <Text style={{ color: tokens.colors.textSecondary, fontSize: 14, marginTop: 4 }}>
            {patient?.contacts?.phone ?? ''}
          </Text>
        </View>

        {showNext && nextBooking ? (
          <TouchableOpacity
            style={[styles.nextCard, { borderColor: ACCENT, backgroundColor: theme === 'dark' ? tokens.colors.backgroundCard : '#EFF6FF' }]}
            onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: nextBooking._id } })}
            activeOpacity={0.88}
          >
            <View style={styles.nextIcon}>
              <Icon name="calendar" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>{isUz ? 'KEYINGI YOZUV' : 'СЛЕДУЮЩАЯ ЗАПИСЬ'}</Text>
              <Text style={[styles.nextWhen, { color: tokens.colors.text }]} numberOfLines={1}>
                {formatVisit(nextBooking.scheduledDate, nextBooking.scheduledTime, isUz)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={ACCENT} />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.listCard, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border }]}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.row, i < menu.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.colors.borderLight }]}
              onPress={item.onPress}
            >
              <View style={styles.rowIcon}>
                <Icon name={item.icon} size={18} color={ACCENT} />
              </View>
              <Text style={[styles.rowTitle, { color: tokens.colors.text }]}>{item.title}</Text>
              <Icon name="chevron-forward" size={16} color={tokens.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.groupLabel, { color: tokens.colors.textTertiary }]}>
          {isUz ? 'Ijtimoiy tarmoqlar' : 'Социальные сети'}
        </Text>
        <View style={[styles.listCard, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border }]}>
          {social.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.row, i < social.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.colors.borderLight }]}
              onPress={() => Linking.openURL(item.url)}
            >
              <View style={styles.rowIcon}>
                <Icon name={item.icon} size={18} color={ACCENT} />
              </View>
              <Text style={[styles.rowTitle, { color: tokens.colors.text }]}>{item.title}</Text>
              <Icon name="open-outline" size={16} color={tokens.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.listCard, { backgroundColor: tokens.colors.backgroundCard, borderColor: tokens.colors.border, marginTop: 14 }]}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/settings')}>
            <View style={styles.rowIcon}>
              <Icon name="settings-outline" size={18} color={ACCENT} />
            </View>
            <Text style={[styles.rowTitle, { color: tokens.colors.text }]}>{t.settings}</Text>
            <Icon name="chevron-forward" size={16} color={tokens.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 18, gap: 10 }}>
          <TouchableOpacity style={[styles.ghostBtn, { borderColor: tokens.colors.border }]} onPress={onLogout}>
            <Text style={{ color: tokens.colors.text, fontWeight: '700' }}>{t.logOut}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Text style={{ color: tokens.colors.error, textAlign: 'center', fontWeight: '600' }}>{t.deleteAccount}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  langChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { alignItems: 'center', paddingTop: 18, paddingBottom: 8 },
  avatarWrap: { position: 'relative' },
  camBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  nextCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { color: ACCENT, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  nextWhen: { fontWeight: '700', fontSize: 14, marginTop: 2 },
  listCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  groupLabel: {
    marginHorizontal: 24,
    marginTop: 20,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ghostBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
