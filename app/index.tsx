import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function index() {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Decor */}
      <View style={styles.circleDecor} />

      <View style={styles.content}>
        {/* Header Section - Moved slightly downward */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.headerContainer}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop' }}
            style={styles.logoBgImage}
            imageStyle={{ opacity: 0.12, borderRadius: 40 }}
          >
            <View style={styles.logoWrapper}>
              <Ionicons name="chatbubbles" size={54} color="#4F46E5" />
              <Text style={styles.logoText}>Talkies</Text>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Hero Image Section - Made bigger and adjusted position */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(1000)}
          style={styles.heroContainer}
        >
          <Image
            source="https://images.unsplash.com/photo-1577563906417-45a11b3f9f75?q=80&w=800&auto=format&fit=crop"
            style={styles.heroImage}
            contentFit="cover"
            transition={1000}
          />
        </Animated.View>

        {/* Text Section - Moved upper to reduce gap */}
        <View style={styles.textContainer}>
          <Animated.Text
            entering={FadeInDown.delay(600).springify()}
            style={styles.title}
          >
            Connect with{"\n"}
            <Text style={styles.highlightText}>Random Strangers</Text>
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(700).springify()}
            style={styles.subtitle}
          >
            Talk to people around the world instantly. Safe, anonymous, and free forever.
          </Animated.Text>
        </View>

        {/* Action Button */}
        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.footer}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  circleDecor: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: '#F5F3FF',
    zIndex: -1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start', // Anchored to top to control spacing manually
    paddingBottom: 20,
  },
  headerContainer: {
    marginTop: 20, // Moved downward
    alignItems: 'center',
    width: '100%',
  },
  logoBgImage: {
    width: '100%',
    height: '80%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48, // Slightly bigger
    fontWeight: '900',
    color: '#1F2937',
    marginTop: 2,
    letterSpacing: -1.5,
  },
  heroContainer: {
    height: height * 0.4, // Made bigger
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  textContainer: {
    marginTop: -420, // Pulling it upward to reduce gap
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  highlightText: {
    color: '#4F46E5',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  footer: {
    marginTop: 'auto', // Push to bottom
    paddingBottom: 10,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    width: '100%',
    height: 60,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0px 10px 20px rgba(79, 70, 229, 0.25)",
      }
    }),
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 15,
    textAlign: 'center',
  },
});
