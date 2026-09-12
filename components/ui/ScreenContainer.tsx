import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
}

export default function ScreenContainer({
  children,
  scroll = true,
}: Props) {
  const { theme } = useTheme();
  const backgroundColor = theme.colors.background;
  const barStyle = theme.mode === "dark" ? "light-content" : "dark-content";

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle={barStyle} />
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
      <StatusBar barStyle={barStyle} />
      {children}
    </View>
  );
}