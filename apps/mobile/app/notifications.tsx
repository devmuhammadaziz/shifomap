import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icons/Icon';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import { getTranslations } from '../lib/translations';
import { getTokens } from '../lib/design';
import { useNotificationStore, type NotificationItem } from '../store/notification-store';

const ACCENT = '#2563EB';
const PILL_ACTIVE = '#1E3A8A';

const CATEGORIES = ['all', 'reminders', 'clinicsTab', 'system'] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const language = useAuthStore((s) => s.language);
  const theme = useThemeStore((s) => s.theme);
  const t = getTranslations(language);
  const tokens = getTokens(theme);
  const colors = tokens.colors;
  const insets = useSafeAreaInsets();
  const isUz = language !== 'ru';

  const { notifications, clearAll, removeNotification, markAsRead, hydrate } = useNotificationStore();
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('all');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    if (activeCategory === 'reminders') return notifications.filter((n) => n.type === 'reminder');
    if (activeCategory === 'clinicsTab') return notifications.filter((n) => n.type === 'clinic');
    if (activeCategory === 'system') return notifications.filter((n) => n.type === 'system');
    return notifications;
  }, [activeCategory, notifications]);

  const sections = useMemo(() => {
    const todayCutoff = new Date().setHours(0, 0, 0, 0);
    const yesterdayCutoff = todayCutoff - 24 * 60 * 60 * 1000;

    const today = filteredNotifications.filter((n) => n.time >= todayCutoff);
    const yesterday = filteredNotifications.filter((n) => n.time >= yesterdayCutoff && n.time < todayCutoff);
    const older = filteredNotifications.filter((n) => n.time < yesterdayCutoff);

    return [
      { title: t.today, data: today },
      { title: t.yesterday, data: yesterday },
      { title: isUz ? 'Oldingilar' : 'Ранее', data: older },
    ].filter((s) => s.data.length > 0);
  }, [filteredNotifications, t, isUz]);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 1000 / 60);
    if (mins < 1) return isUz ? 'Hozir' : 'Только что';
    if (mins < 60) return isUz ? `${mins} daqiqa oldin` : `${mins} мин назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isUz ? `${hours} soat oldin` : `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return isUz ? `${days} kun oldin` : `${days} дн назад`;
  };

  const renderNotification = (item: NotificationItem) => {
    return (
      <View
        key={item.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
          },
          !item.isRead && { borderColor: ACCENT + '40', backgroundColor: theme === 'dark' ? colors.backgroundCard : '#F8FAFF' },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: (item.iconColor || ACCENT) + '18' }]}>
            <Icon name={item.icon} size={22} color={item.iconColor || ACCENT} />
          </View>
          <View style={styles.cardTextContent}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{formatTimeAgo(item.time)}</Text>
          </View>
        </View>

        <Text style={[styles.cardMessage, { color: colors.textSecondary }]}>{item.message}</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            activeOpacity={0.8}
            onPress={() => markAsRead(item.id)}
          >
            <Text style={styles.actionBtnText}>{t.viewDetail}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnGhost, { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : '#F3F4F6' }]}
            activeOpacity={0.8}
            onPress={() => removeNotification(item.id)}
          >
            <Text style={[styles.actionBtnGhostText, { color: colors.textSecondary }]}>{t.dismiss}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const empty = sections.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : '#F3F4F6' }]}
          onPress={() => router.back()}
          hitSlop={12}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t.notificationsTitle}
        </Text>
        <TouchableOpacity onPress={clearAll} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.clearBtn}>{t.clearAll}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsRow}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.85}
              style={[
                styles.tab,
                active
                  ? { backgroundColor: PILL_ACTIVE, borderColor: PILL_ACTIVE }
                  : {
                      backgroundColor: colors.background,
                      borderColor: theme === 'dark' ? colors.border : '#E5E7EB',
                    },
              ]}
            >
              <Text style={[styles.tabText, { color: active ? '#fff' : colors.text }]}>{t[cat]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          empty && styles.scrollEmpty,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : '#F3F4F6' }]}>
              <Icon name="notifications-outline" size={36} color={theme === 'dark' ? colors.textTertiary : '#6B7280'} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t.noResultsFound}</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{section.title}</Text>
              {section.data.map((item) => renderNotification(item))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearBtn: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: ACCENT,
  },
  tabsRow: {
    flexGrow: 0,
    marginBottom: 4,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: ACCENT,
    minWidth: 96,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnGhost: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 88,
    alignItems: 'center',
  },
  actionBtnGhostText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
  },
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
