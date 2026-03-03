import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
}

export default function ScreenContainer({
  children,
  scroll = true,
}: Props) {
  const backgroundColor = "#0F172A"; // Azul profundo tecnológico

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 140,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        backgroundColor,
      }}
    >
      <StatusBar barStyle="light-content" />
      {children}
    </View>
  );
}