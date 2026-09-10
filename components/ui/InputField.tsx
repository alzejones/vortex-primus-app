import React from "react";
import { TextInput, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function InputField({ value, onChangeText, placeholder }: Props) {
  const { theme } = useTheme();

  const styles = {
    container: {
      marginBottom: 16,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
      />
    </View>
  );
}