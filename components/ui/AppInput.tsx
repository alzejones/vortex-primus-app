import React, { useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props extends TextInputProps {
  label: string;
}

export default function AppInput({ label, style, ...rest }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 8,
          color: theme.colors.textMuted,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>

      <TextInput
        {...rest}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: isFocused ? theme.colors.primary : theme.colors.border,
            borderRadius: 18,
            padding: 18,
            backgroundColor: theme.colors.card,
            color: theme.colors.textPrimary,
            fontSize: 16,
          },
          style,
        ]}
      />
    </View>
  );
}