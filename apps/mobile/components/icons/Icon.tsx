import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as Iconsax from 'iconsax-react-nativejs';

type IconsaxComponent = React.ComponentType<{
  color?: string;
  size?: number | string;
  variant?: IconVariant;
  style?: StyleProp<ViewStyle>;
}>;

export type IconVariant = 'Linear' | 'Outline' | 'TwoTone' | 'Bulk' | 'Broken' | 'Bold';

const ICONS = Iconsax as unknown as Record<string, IconsaxComponent>;

/** Ionicons / MCI names → Iconsax PascalCase export. */
const MAP: Record<string, string> = {
  // nav / chevrons
  home: 'Home2',
  'home-outline': 'Home2',
  'arrow-back': 'ArrowLeft2',
  'chevron-back': 'ArrowLeft2',
  'arrow-forward': 'ArrowRight2',
  'chevron-forward': 'ArrowRight2',
  'chevron-down': 'ArrowDown2',
  'chevron-up': 'ArrowUp2',
  back: 'ArrowLeft2',

  // search / filter
  search: 'SearchNormal1',
  'search-outline': 'SearchNormal1',
  options: 'Setting4',
  'options-outline': 'Setting4',
  filter: 'Filter',
  'filter-outline': 'Filter',

  // people / profile
  person: 'Profile',
  'person-outline': 'Profile',
  people: 'People',
  'people-outline': 'People',
  female: 'Woman',
  male: 'Man',
  body: 'Profile',

  // clinic / medical
  medkit: 'Hospital',
  'medkit-outline': 'Hospital',
  medical: 'Hospital',
  'medical-outline': 'Hospital',
  business: 'Buildings2',
  'business-outline': 'Buildings2',
  flask: 'ChemicalGlass',
  'flask-outline': 'ChemicalGlass',
  bandage: 'Health',
  'bandage-outline': 'Health',
  pulse: 'Activity',
  'pulse-outline': 'Activity',
  hardware: 'Cpu',
  'hardware-chip-outline': 'Cpu',
  stethoscope: 'Hospital',
  'heart-pulse': 'HeartTick',
  tooth: 'Health',
  'tooth-outline': 'Health',
  'baby-face-outline': 'Happyemoji',
  'face-woman-outline': 'Woman',
  virus: 'Danger',
  'virus-outline': 'Danger',
  brain: 'Cpu',
  'hospital-marker': 'LocationTick',
  'water-check': 'Drop',
  stomach: 'Health',
  'ear-hearing': 'Headphone',
  bone: 'Health',
  'head-heart-outline': 'HeartCircle',
  'food-apple-outline': 'Apple',
  lipstick: 'Brush',
  'blood-bag': 'Drop',
  'water-outline': 'Drop',
  'emoticon-cry-outline': 'EmojiSad',
  'hospital-box-outline': 'Hospital',
  'hand-back-right-outline': 'Like1',
  thermometer: 'Health',
  flame: 'Flash',
  headset: 'Headphone',

  // pills
  pill: 'Health',
  'pill-multiple': 'Health',
  tablet: 'Health',
  needle: 'Health',
  'cup-water': 'Glass',
  eyedropper: 'Drop',
  lungs: 'Wind',
  'bottle-tonic': 'Milk',
  'medication-outline': 'Health',

  // heart / like / star
  heart: 'Heart',
  'heart-outline': 'Heart',
  star: 'Star1',
  'star-outline': 'Star1',
  bookmark: 'ArchiveTick',
  'bookmark-outline': 'Archive',
  sparkles: 'MagicStar',
  'sparkles-outline': 'MagicStar',

  // calendar / time
  calendar: 'Calendar',
  'calendar-outline': 'Calendar',
  'calendar-check-outline': 'CalendarTick',
  time: 'Clock',
  'time-outline': 'Clock',
  alarm: 'Alarm',
  'alarm-outline': 'Alarm',
  timer: 'Timer',

  // location / map
  location: 'Location',
  'location-outline': 'Location',
  map: 'Map1',
  'map-outline': 'Map1',
  navigate: 'Gps',
  'navigate-outline': 'Gps',

  // comms
  call: 'Call',
  'call-outline': 'Call',
  mail: 'Sms',
  'mail-outline': 'Sms',
  send: 'Send2',
  'paper-plane-outline': 'Send2',
  'paper-plane': 'Send2',
  chatbubble: 'MessageText1',
  'chatbubble-outline': 'MessageText1',
  chatbubbles: 'Messages',
  'chatbubbles-outline': 'Messages',
  'chatbubble-ellipses-outline': 'MessageNotif',
  mic: 'Microphone',
  'mic-outline': 'Microphone',
  notifications: 'Notification',
  'notifications-outline': 'Notification',
  'notifications-off-outline': 'Notification',

  // social / web
  globe: 'Global',
  'globe-outline': 'Global',
  'logo-instagram': 'Instagram',
  instagram: 'Instagram',
  'open-outline': 'ExportSquare',
  open: 'ExportSquare',

  // documents / files
  'document-text': 'DocumentText',
  'document-text-outline': 'DocumentText',
  document: 'Document',
  'document-outline': 'Document',
  clipboard: 'ClipboardText',
  'clipboard-outline': 'ClipboardText',
  pricetag: 'Tag',
  'pricetag-outline': 'Tag',
  cash: 'WalletMoney',
  'cash-outline': 'WalletMoney',
  briefcase: 'Briefcase',
  'briefcase-outline': 'Briefcase',

  // security
  lock: 'Lock',
  'lock-closed': 'Lock',
  'lock-closed-outline': 'Lock',
  'lock-open-outline': 'Unlock',
  eye: 'Eye',
  'eye-outline': 'Eye',
  'eye-off-outline': 'EyeSlash',
  'eye-off': 'EyeSlash',
  shield: 'ShieldTick',
  'shield-checkmark': 'ShieldTick',
  'shield-checkmark-outline': 'ShieldTick',
  'shield-outline': 'Shield',

  // system
  settings: 'Setting2',
  'settings-outline': 'Setting2',
  camera: 'Camera',
  'camera-outline': 'Camera',
  images: 'Gallery',
  'images-outline': 'Gallery',
  share: 'Share',
  'share-outline': 'Share',
  'share-social': 'Share',
  'share-social-outline': 'Share',
  trash: 'Trash',
  'trash-outline': 'Trash',
  'log-out-outline': 'Logout',
  'log-out': 'Logout',
  sunny: 'Sun1',
  'sunny-outline': 'Sun1',
  moon: 'Moon',
  'moon-outline': 'Moon',
  water: 'Drop',
  flag: 'Flag',
  'flag-outline': 'Flag',

  // actions
  close: 'Add',
  'close-outline': 'Add',
  'close-circle': 'CloseCircle',
  add: 'Add',
  'add-outline': 'Add',
  'add-circle-outline': 'AddCircle',
  'add-circle': 'AddCircle',
  checkmark: 'TickCircle',
  'checkmark-circle': 'TickCircle',
  'checkmark-outline': 'TickCircle',
  'alert-circle': 'Danger',
  'alert-circle-outline': 'Danger',
  warning: 'Warning2',
  'warning-outline': 'Warning2',
  information: 'InfoCircle',
  'information-circle-outline': 'InfoCircle',
  'information-circle': 'InfoCircle',
  'play-circle': 'PlayCircle',
  'play-circle-outline': 'PlayCircle',
  play: 'Play',
  book: 'Book1',
  'book-outline': 'Book1',
};

const BOLD_NAMES = new Set([
  'heart',
  'star',
  'bookmark',
  'home',
  'person',
  'calendar',
  'medkit',
  'medical',
  'checkmark',
  'checkmark-circle',
  'shield-checkmark',
  'send',
  'call',
  'camera',
  'sparkles',
  'notifications',
  'play',
  'play-circle',
  'add',
  'flag',
]);

export type IconName = keyof typeof MAP | (string & {});

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  variant?: IconVariant;
  style?: StyleProp<ViewStyle>;
};

function resolveKey(name: string): string {
  if (MAP[name]) return MAP[name];
  const stripped = name.replace(/-outline$/, '').replace(/-sharp$/, '');
  if (MAP[stripped]) return MAP[stripped];
  return 'Health';
}

function resolveVariant(name: string, variant?: IconVariant): IconVariant {
  if (variant) return variant;
  if (name.endsWith('-outline') || name.endsWith('-off-outline')) return 'Linear';
  if (BOLD_NAMES.has(name)) return 'Bold';
  return 'Linear';
}

const CLOSE_PLAIN = new Set(['close', 'close-outline']);

export function Icon({ name, size = 24, color = '#292D32', variant, style }: IconProps) {
  const key = resolveKey(String(name));
  const Cmp = ICONS[key] ?? ICONS.Health;
  const v = resolveVariant(String(name), variant);
  const extra = CLOSE_PLAIN.has(String(name)) ? { transform: [{ rotate: '45deg' as const }] } : undefined;

  return <Cmp size={size} color={color} variant={v} style={extra ? [extra, style] : style} />;
}

export default Icon;
