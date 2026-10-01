import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'filled' | 'plain';
};

export function PrimaryButton({ title, loading, variant = 'filled', disabled, style, ...rest }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        filled && styles.filled,
        (state.pressed || isDisabled) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={filled ? '#ffffff' : Colors.light.accent} />
      ) : (
        <ThemedText style={filled ? styles.filledLabel : styles.plainLabel}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: Colors.light.accent },
  dimmed: { opacity: 0.6 },
  filledLabel: { color: '#ffffff', fontWeight: 700 },
  plainLabel: { color: Colors.light.accent, fontWeight: 600 },
});
