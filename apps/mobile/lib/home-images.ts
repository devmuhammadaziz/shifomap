import { Image, type ImageSourcePropType } from 'react-native';

/** Display-sized brand mark — home header + tab FAB. Not the 512 play-store asset. */
export const BRAND_LOGO = require('../assets/brand-logo.png');
/** Display-sized Shifo robot with alpha. */
export const SHIFO_ROBOT = require('../assets/ai-shifo-mascot.png');

let warmed = false;

function warm(source: ImageSourcePropType) {
  const resolved = Image.resolveAssetSource(source);
  if (resolved?.uri) {
    void Image.prefetch(resolved.uri);
  }
}

/** Decode/cache only the two home hero bitmaps. Do not prefetch clinic photos or remote URLs. */
export function preloadHomeImages() {
  if (warmed) return;
  warmed = true;
  warm(BRAND_LOGO);
  warm(SHIFO_ROBOT);
}
