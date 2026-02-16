import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Error Code */}
      <Text style={styles.code}>404</Text>

      {/* Message */}
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        Oops! This page doesn’t exist or has been moved.
      </Text>

      {/* Action */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>

      {/* Branding */}
      <Text style={styles.brand}>Talkies 💬</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  code: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#46e573",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#46e573",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 40,
  },

  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },

  brand: {
    position: "absolute",
    bottom: 20,
    fontSize: 14,
    color: "#64748b",
  },
});
