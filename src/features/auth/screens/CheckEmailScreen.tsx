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
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import EmailBox from "@app/assets/icons/emailbox.svg";
import PathBack from "@app/assets/icons/pathback.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "CheckEmail">;

export function CheckEmailScreen({ navigation }: Props) {
  const { passwordResetEmail, setPasswordResetEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const email = passwordResetEmail ?? "";

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await authApi.requestMobilePasswordReset({ email });
      setPasswordResetEmail(email);
      setStatusMessage("If an account exists for this email, a new code has been sent.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError && error.kind === "network"
          ? "Unable to connect. Check your internet connection and try again."
          : "We couldn't resend the email. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EEFF" />
      <View style={styles.header} />
      <View style={styles.card}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <PathBack width={77} height={36} />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <EmailBox width={40} height={40} />
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.description}>
              A six-digit password reset code has been sent to this email address.
            </Text>
            <Text style={styles.email}>{email}</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.changeEmail}
            >
              <Text style={styles.changeEmailText}>▢ Change email address</Text>
            </Pressable>
            {statusMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.statusMessage}>
                {statusMessage}
              </Text>
            ) : null}
            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                {errorMessage}
              </Text>
            ) : null}
            <View style={styles.placeholderNote}>
              <Text style={styles.placeholderText}>
                Enter the code from your email on the next screen to continue resetting your
                password.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isResending || !email, busy: false }}
              disabled={isResending || !email}
              onPress={() => navigation.navigate("VerifyEmail", { flow: "password-reset" })}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonLabel}>Continue</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isResending || !email, busy: isResending }}
              disabled={isResending || !email}
              onPress={handleResend}
              style={styles.resendButton}
            >
              {isResending ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.resendText}>Resend email</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5EEFF" },
  header: { height: 38, backgroundColor: "#F5EEFF" },
  card: {
    flex: 1,
    marginTop: -2,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  flex: { flex: 1 },
  backButton: { alignSelf: "flex-start", width: 77, height: 36 },
  content: { paddingTop: 20, flexGrow: 1 },
  title: {
    marginTop: 10,
    color: "#171717",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  description: {
    marginTop: 3,
    color: "#777777",
    fontSize: 12,
    lineHeight: 17,
  },
  email: {
    alignSelf: "center",
    marginTop: 24,
    color: "#171717",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  changeEmail: { alignSelf: "center", marginTop: 9, padding: 4 },
  changeEmailText: { color: "#8B45F6", fontSize: 11, lineHeight: 16 },
  statusMessage: {
    marginTop: 14,
    color: colors.success,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  placeholderNote: {
    marginTop: 24,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8F5FC",
  },
  placeholderText: {
    color: "#777777",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  footer: { paddingBottom: 48 },
  primaryButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#9B5CF6",
    borderBottomWidth: 3,
    borderBottomColor: "#8246D3",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: { backgroundColor: "#8B4CE8" },
  primaryButtonLabel: { color: colors.surface, fontSize: 12, fontWeight: "600" },
  resendButton: { height: 32, alignItems: "center", justifyContent: "center" },
  resendText: { color: "#8B45F6", fontSize: 11, fontWeight: "500" },
});
