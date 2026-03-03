import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

interface Props {
  children: React.ReactNode;
}

export default function LayoutBase({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Fundo premium neutro
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});