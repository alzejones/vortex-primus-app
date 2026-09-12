import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  title: string;
  onPress: () => void;
}

export default function PrimaryButton({ title, onPress }: Props) {
  const { theme } = useTheme();

  const styles = {
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center" as const,
      marginTop: 24,
    },
    text: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: "600" as const,
    },
  };

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
