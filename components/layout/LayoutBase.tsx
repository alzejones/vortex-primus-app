import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  children: React.ReactNode;
}

export default function LayoutBase({ children }: Props) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});