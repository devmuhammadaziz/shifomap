import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../components/icons/Icon';

type Lang = 'uz' | 'ru' | 'en';

type WeeklySlot = { day: number; from: string; to: string };

const DAY_LABELS: Record<Lang, [string, string, string, string, string, string, string]> = {
  uz: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'],
  ru: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const CLOSED_LABEL: Record<Lang, string> = {
  uz: 'Dam olish kuni',
  ru: 'Выходной',
  en: 'Closed',
};

const OPEN_NOW: Record<Lang, string> = {
  uz: 'Hozir ochiq',
  ru: 'Открыто сейчас',
  en: 'Open now',
};

const TODAY_LABEL: Record<Lang, string> = {
  uz: 'Bugun',
  ru: 'Сегодня',
  en: 'Today',
};

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function isCurrentlyOpen(from: string, to: string): boolean {
  const [fh, fm] = from.split(':').map((n) => parseInt(n, 10));
  const [th, tm] = to.split(':').map((n) => parseInt(n, 10));
  if ([fh, fm, th, tm].some((n) => Number.isNaN(n))) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = (fh ?? 0) * 60 + (fm ?? 0);
  const end = (th ?? 0) * 60 + (tm ?? 0);
  return cur >= start && cur <= end;
}

export interface WorkingHoursListProps {
  weekly: WeeklySlot[] | undefined;
  language: string;
  textColor: string;
  secondaryColor: string;
  borderColor: string;
  accentColor: string;
  accentBg: string;
}

export default function WorkingHoursList({
  weekly,
  language,
  textColor,
  secondaryColor,
  borderColor,
  accentColor,
  accentBg,
}: WorkingHoursListProps) {
  const lang: Lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uz';
  const todayIndex = getTodayIndex();

  const slotByDay = new Map<number, WeeklySlot>();
  (weekly ?? []).forEach((w) => {
    if (typeof w.day === 'number') slotByDay.set(w.day, w);
  });

  return (
    <View>
      {Array.from({ length: 7 }).map((_, i) => {
        const dayNumber = i + 1;
        const slot = slotByDay.get(dayNumber);
        const isToday = i === todayIndex;
        const isLast = i === 6;
        const dayLabel = DAY_LABELS[lang][i];

        return (
          <View
            key={dayNumber}
            style={[
              styles.row,
              { borderBottomColor: borderColor, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth },
              isToday && { backgroundColor: accentBg, borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
            ]}
          >
            <View style={styles.left}>
              {isToday ? (
                <View style={[styles.todayDot, { backgroundColor: accentColor }]} />
              ) : (
                <View style={[styles.dot, { backgroundColor: borderColor }]} />
              )}
              <Text
                style={[
                  styles.dayText,
                  { color: isToday ? accentColor : textColor },
                ]}
                numberOfLines={1}
              >
                {dayLabel}
              </Text>
              {isToday ? (
                <View style={[styles.todayPill, { backgroundColor: accentColor }]}>
                  <Text style={styles.todayPillText}>{TODAY_LABEL[lang]}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.right}>
              {slot ? (
                <>
                  <Icon
                    name="time-outline"
                    size={13}
                    color={isToday ? accentColor : secondaryColor}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: isToday ? accentColor : textColor,
                      fontSize: 13,
                      fontWeight: isToday ? '700' : '600',
                    }}
                  >
                    {slot.from}–{slot.to}
                  </Text>
                  {isToday && isCurrentlyOpen(slot.from, slot.to) ? (
                    <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>
                      {OPEN_NOW[lang]}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={{ color: secondaryColor, fontSize: 13, fontStyle: 'italic' }}>
                  {CLOSED_LABEL[lang]}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  dayText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  todayPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  todayPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
