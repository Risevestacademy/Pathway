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
import type { RootStackParamList } from "@app/navigation/types";
import AccountLogo from "@app/assets/icons/accountlogo.svg";
import LeftNoodle from "@app/assets/icons/leftnoodle.svg";
import RightNoodle from "@app/assets/icons/rightnoodle.svg";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { authApi } from "../api/authApi";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = NativeStackScreenProps<RootStackParamList, "CreateAccount">;

export function CreateAccountScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !normalizedEmail || !password) {
      setErrorMessage("Enter your full name, email address, and password.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await authApi.register({
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
      });
      navigation.navigate("VerifyEmail", {
        flow: "signup",
        email: response.email,
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setErrorMessage("An account with this email already exists.");
      } else if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else {
        setErrorMessage("We couldn't create your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF7FD" />
      <View style={styles.header}>
        <View pointerEvents="none" style={styles.backgroundShapeOne} />
        <View pointerEvents="none" style={styles.backgroundShapeTwo} />
        <LeftNoodle
          width={184}
          height={58}
          style={styles.leftNoodle}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <RightNoodle
          width={94}
          height={49}
          style={styles.rightNoodle}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <AccountLogo
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
          <Text style={styles.title}>Create an account</Text>

          <View style={styles.fields}>
            <TextInput
              accessibilityLabel="Full name"
              autoCapitalize="words"
              autoComplete="name"
              editable={!isSubmitting}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#A8A8A8"
              returnKeyType="next"
              style={styles.input}
              textContentType="name"
              value={fullName}
            />
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
                autoComplete="new-password"
                editable={!isSubmitting}
                onChangeText={setPassword}
                onSubmitEditing={handleCreateAccount}
                placeholder="Password"
                placeholderTextColor="#A8A8A8"
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                style={styles.passwordInput}
                textContentType="newPassword"
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
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            disabled={isSubmitting}
            onPress={handleCreateAccount}
            style={({ pressed }) => [
              styles.createButton,
              pressed && !isSubmitting && styles.createButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.createButtonLabel}>Create account</Text>
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

          <Text style={styles.signInPrompt}>
            Already have an account?{" "}
            <Text
              accessibilityRole="link"
              onPress={() => navigation.navigate("Login")}
              style={styles.link}
            >
              Sign in
            </Text>
          </Text>

          <Text style={styles.terms}>
            By signing in to Pathway, you agree to our{" "}
            <Text style={styles.termsEmphasis}>Terms and Privacy Policy.</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF7FD",
  },
  header: {
    height: 138,
    position: "relative",
    backgroundColor: "#EAF7FD",
  },
  backgroundShapeOne: {
    position: "absolute",
    width: 410,
    height: 230,
    borderRadius: 180,
    backgroundColor: "#D5EFFC",
    top: -151,
    left: -116,
    transform: [{ rotate: "-25deg" }],
  },
  backgroundShapeTwo: {
    position: "absolute",
    width: 350,
    height: 140,
    borderRadius: 100,
    backgroundColor: "#F3FAFE",
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
  createButton: {
    minHeight: 48,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: "#9B5CF6",
    borderBottomWidth: 4,
    borderBottomColor: "#8246D3",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonPressed: {
    backgroundColor: "#8B4CE8",
  },
  createButtonLabel: {
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
  signInPrompt: {
    marginTop: 27,
    color: "#777777",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  link: {
    color: "#9B5CF6",
    fontWeight: "600",
    textDecorationLine: "underline",
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
});
