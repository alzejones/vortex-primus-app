import { Linking, StyleSheet, Text, TouchableOpacity } from "react-native";

const WHATSAPP_URL =
  "https://wa.me/5516992107040?text=Ol%C3%A1%21+Preciso+de+suporte+no+Vortex+Primus.";

interface Props {
  bottom?: number;
}

export default function SupportButton({ bottom = 90 }: Props) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom }]}
      onPress={() => Linking.openURL(WHATSAPP_URL)}
      activeOpacity={0.85}
    >
      <Text style={styles.icon}>💬</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  icon: { fontSize: 26 },
});