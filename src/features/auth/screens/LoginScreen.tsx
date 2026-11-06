import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import LogClip from "@app/assets/icons/logclip.svg";
import LogLeft from "@app/assets/icons/logleft.svg";
import LogLogo from "@app/assets/icons/loglogo.svg";
import LogRight from "@app/assets/icons/logright.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const { login, state } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Enter your email address and password.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await login({ email: normalizedEmail, password });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setErrorMessage("We couldn't sign you in. Check your details or verify your email.");
      } else if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else {
        setErrorMessage("We couldn't sign you in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF4ED" />
      <View style={styles.header}>
        <View pointerEvents="none" style={styles.backgroundShapeOne} />
        <View pointerEvents="none" style={styles.backgroundShapeTwo} />
        <LogLeft
          width={184}
          height={58}
          style={styles.leftNoodle}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <LogRight
          width={94}
          height={49}
          style={styles.rightNoodle}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <LogLogo
          width={173}
          height={56}
          style={styles.logo}
          accessibilityLabel="Pathway"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.card}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Log in</Text>

          <View style={styles.fields}>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#A8A8A8"
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
            <View style={styles.passwordField}>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                placeholder="Password"
                placeholderTextColor="#A8A8A8"
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                style={styles.passwordInput}
                textContentType="password"
                value={password}
              />
              <Pressable
                accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                accessibilityRole="button"
                onPress={() => setIsPasswordVisible((visible) => !visible)}
                style={styles.passwordToggle}
                hitSlop={10}
              >
                <Feather
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#A8A8A8"
                />
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorMessage}>
              {errorMessage}
            </Text>
          ) : null}
          {state.status === "unauthenticated" && state.error ? (
            <Text accessibilityRole="alert" style={styles.errorMessage}>
              {state.error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPassword}
          >
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            disabled={isSubmitting}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && !isSubmitting && styles.loginButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.loginButtonLabel}>Log in</Text>
            )}
          </Pressable>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <GoogleSignInButton
            disabled={isSubmitting}
            buttonStyle={styles.googleButton}
            pressedStyle={styles.googleButtonPressed}
            labelStyle={styles.googleButtonLabel}
          />

          <Text style={styles.createPrompt}>
            Don’t have an account?{" "}
            <Text
              accessibilityRole="link"
              onPress={() => navigation.navigate("CreateAccount")}
              style={styles.link}
            >
              Create one
            </Text>
          </Text>

          <Text style={styles.terms}>
            By signing in to Pathway, you agree to our{" "}
            <Text style={styles.termsEmphasis}>Terms and Privacy Policy.</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <View pointerEvents="none" style={styles.clip}>
        <LogClip width={82} height={75} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF4ED",
  },
  header: {
    height: 138,
    position: "relative",
    backgroundColor: "#FFF4ED",
  },
  backgroundShapeOne: {
    position: "absolute",
    width: 410,
    height: 230,
    borderRadius: 180,
    backgroundColor: "#FFE9D8",
    top: -151,
    left: -116,
    transform: [{ rotate: "-25deg" }],
  },
  backgroundShapeTwo: {
    position: "absolute",
    width: 350,
    height: 140,
    borderRadius: 100,
    backgroundColor: "#FFF9F5",
    top: -70,
    left: 90,
    transform: [{ rotate: "-17deg" }],
  },
  leftNoodle: {
    position: "absolute",
    left: -16,
    top: 102,
  },
  rightNoodle: {
    position: "absolute",
    right: -6,
    top: 37,
  },
  logo: {
    position: "absolute",
    alignSelf: "center",
    top: 64,
  },
  card: {
    flex: 1,
    zIndex: 1,
    marginTop: -6,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  content: {
    flexGrow: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  title: {
    color: "#171717",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 28,
  },
  fields: {
    gap: 8,
  },
  input: {
    height: 43,
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
  },
  passwordField: {
    height: 43,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
  },
  passwordToggle: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  forgotPassword: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  link: {
    color: "#9B5CF6",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  loginButton: {
    minHeight: 48,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: "#9B5CF6",
    borderBottomWidth: 4,
    borderBottomColor: "#8246D3",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonPressed: {
    backgroundColor: "#8B4CE8",
  },
  loginButtonLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#EEEEEE",
  },
  separatorText: {
    color: "#777777",
    fontSize: 16,
    lineHeight: 22,
  },
  googleButton: {
    minHeight: 45,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderBottomWidth: 4,
    borderBottomColor: "#E2E2E2",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  googleButtonPressed: {
    backgroundColor: "#FAFAFA",
  },
  googleButtonLabel: {
    color: "#777777",
    fontSize: 15,
    fontWeight: "500",
  },
  createPrompt: {
    marginTop: 27,
    color: "#777777",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  terms: {
    marginTop: 17,
    color: "#777777",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  termsEmphasis: {
    color: "#444444",
    fontWeight: "600",
  },
  clip: {
    position: "absolute",
    zIndex: 2,
    top: 124,
    right: 28,
    transform: [{ rotate: "42deg" }],
  },
});
