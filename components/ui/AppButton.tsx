import React from "react";
import {
  GestureResponderEvent,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  disabled = false,
  style,
}: AppButtonProps) {
  const { theme } = useTheme();

  const styles = {
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 20,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    text: {
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: "600" as const,
    },
    textDisabled: {
      color: theme.colors.textMuted,
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          disabled && styles.textDisabled,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
