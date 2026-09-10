import React from "react";
import { View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  children: React.ReactNode;
}

export default function CardSurface({ children }: Props) {
  const { theme } = useTheme();

  const styles = {
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
  };

  return <View style={styles.card}>{children}</View>;
}
