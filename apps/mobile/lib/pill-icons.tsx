import React from 'react';
import { Icon, type IconName } from '../components/icons/Icon';

export type PillIconId =
  | 'pill'
  | 'capsule'
  | 'tablet'
  | 'injection'
  | 'liquid'
  | 'drops'
  | 'inhaler'
  | 'bottle';

export type PillIconOption = {
  id: PillIconId;
  icon: IconName;
  labelUz: string;
  labelRu: string;
};

const FALLBACK_ICON: IconName = 'medication-outline';

/** Medication-style Iconsax glyphs. */
export const PILL_ICON_OPTIONS: PillIconOption[] = [
  { id: 'pill', icon: 'pill', labelUz: 'Tabletka', labelRu: 'Таблетка' },
  { id: 'capsule', icon: 'pill-multiple', labelUz: 'Kapsula', labelRu: 'Капсула' },
  { id: 'tablet', icon: 'tablet', labelUz: 'Parcha dori', labelRu: 'Таблетка' },
  { id: 'injection', icon: 'needle', labelUz: 'Inyeksiya', labelRu: 'Инъекция' },
  { id: 'liquid', icon: 'cup-water', labelUz: 'Suyuqlik', labelRu: 'Жидкость' },
  { id: 'drops', icon: 'eyedropper', labelUz: 'Tomchi', labelRu: 'Капли' },
  { id: 'inhaler', icon: 'lungs', labelUz: 'Ingalyator', labelRu: 'Ингалятор' },
  { id: 'bottle', icon: 'bottle-tonic', labelUz: 'Shisha', labelRu: 'Флакон' },
];

const ICON_BY_ID: Record<string, IconName> = Object.fromEntries(
  PILL_ICON_OPTIONS.map((o) => [o.id, o.icon]),
) as Record<string, IconName>;

/** Old icon names that were invalid in MCI — map saved metadata to valid glyphs. */
const LEGACY_ICON_ALIASES: Record<string, IconName> = {
  capsule: 'pill-multiple',
  asthma: 'lungs',
  round: 'pill',
  oval: 'pill',
  drop: 'eyedropper',
};

export function resolvePillIconName(shapeOrIconId: string | undefined): IconName {
  if (!shapeOrIconId) return FALLBACK_ICON;
  if (shapeOrIconId in ICON_BY_ID) return ICON_BY_ID[shapeOrIconId];
  if (shapeOrIconId in LEGACY_ICON_ALIASES) return LEGACY_ICON_ALIASES[shapeOrIconId];
  return FALLBACK_ICON;
}

export function pillIconLabel(id: PillIconId, language: string): string {
  const opt = PILL_ICON_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  return language === 'ru' ? opt.labelRu : opt.labelUz;
}

type PillIconProps = {
  iconId?: string;
  size?: number;
  color?: string;
};

export function PillIcon({ iconId, size = 28, color = '#fff' }: PillIconProps) {
  return <Icon name={resolvePillIconName(iconId)} size={size} color={color} />;
}
