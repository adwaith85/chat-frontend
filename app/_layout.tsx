import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../hooks/useAuthStore";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // segments[0] can be undefined (index), 'login', '+not-found', '(tabs)', 'chat'
    const segment = segments[0] as string | undefined;
    const isPublicRoute = segment === undefined || segment === 'login' || segment === '+not-found';

    if (!isAuthenticated && !isPublicRoute) {
      // Redirect to landing if no token and hits a protected route
      router.replace('/');
    } else if (isAuthenticated && (segment === undefined || segment === 'login')) {
      // If logged in and at landing or login, jump straight to home
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isInitialized, segments]);

  if (!isInitialized) {
    return null; // Don't show anything until we know the auth status
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "index" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="login" />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}
