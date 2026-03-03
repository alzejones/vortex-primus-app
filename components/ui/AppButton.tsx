import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

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

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#5B3FFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#3A3A3A",
    opacity: 0.6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  textDisabled: {
    color: "#CCCCCC",
  },
});
