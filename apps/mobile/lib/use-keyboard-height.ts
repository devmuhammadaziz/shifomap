import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Live keyboard height (0 when hidden). Prefer this over KeyboardAvoidingView for docked composers. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return height;
}

/**
 * Bottom inset for a fixed composer / bottom sheet:
 * - keyboard open → sit just above the keyboard
 * - keyboard closed → respect home-indicator safe area
 */
export function useComposerBottomInset(safeBottom: number, gapWhenOpen = 6): number {
  const keyboardHeight = useKeyboardHeight();
  if (keyboardHeight > 0) return keyboardHeight + gapWhenOpen;
  return Math.max(safeBottom, gapWhenOpen);
}
