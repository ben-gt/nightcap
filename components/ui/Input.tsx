import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export default function Input({ label, error, containerStyle, icon, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputFocused, error && styles.inputError]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={Colors.textLo}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    backgroundColor: Colors.bgElevatedHi,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.bgElevated,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  iconWrapper: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textHi,
    fontSize: FontSize.body,
    fontFamily: 'Inter-Regular',
    minHeight: 48,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
  },
});
