import React, { useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface Props extends TextInputProps {
  label: string;
}

export default function AppInput({ label, style, ...rest }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 8,
          color: "#94A3B8", // Cinza tecnológico
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
        placeholderTextColor="#64748B"
        style={[
          {
            borderWidth: 1,
            borderColor: isFocused ? "#6366F1" : "#1E293B",
            borderRadius: 18,
            padding: 18,
            backgroundColor: "#111827",
            color: "#FFFFFF",
            fontSize: 16,
          },
          style,
        ]}
      />
    </View>
  );
}