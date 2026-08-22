import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '../icons/Icon';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  rightIcon?: IconName;
  pill?: boolean;
};

export function AuthCtaButton({
  title,
  onPress,
  loading,
  disabled,
  rightIcon = 'arrow-forward',
  pill = false,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} disabled={isDisabled} style={{ opacity: isDisabled ? 0.5 : 1 }}>
      <LinearGradient
        colors={['#0A2FB8', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.cta, { borderRadius: pill ? 999 : 18 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            <Text style={styles.title}>{title}</Text>
            <Icon name={rightIcon} size={18} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cta: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
