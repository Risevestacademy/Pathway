import React, { useEffect, useRef, useState } from "react";
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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import PathBack from "@app/assets/icons/pathback.svg";
import ResetKey from "@app/assets/icons/resetkey.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { passwordResetEmail, setPasswordResetEmail, clearPasswordResetFlow } = useAuth();
  const [email, setEmail] = useState(passwordResetEmail ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", () => {
        clearPasswordResetFlow();
      }),
    [clearPasswordResetFlow, navigation],
  );

  const handleSendEmail = async () => {
    if (submittingRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Enter your email address.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setErrorMessage("");
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await authApi.requestMobilePasswordReset({ email: normalizedEmail });
      setPasswordResetEmail(normalizedEmail);
      navigation.navigate("CheckEmail");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError && error.kind === "network"
          ? "Unable to connect. Check your internet connection and try again."
          : "We couldn't send the email. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
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
            <ResetKey width={40} height={40} />
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.description}>
              A confirmation mail would be sent to your email address
            </Text>

            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                if (passwordResetEmail && value.trim().toLowerCase() !== passwordResetEmail) {
                  clearPasswordResetFlow();
                }
                setErrorMessage("");
              }}
              onSubmitEditing={handleSendEmail}
              placeholder="Email address"
              placeholderTextColor="#A8A8A8"
              returnKeyType="send"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                {errorMessage}
              </Text>
            ) : null}

            <View style={styles.resendRow}>
              <Text style={styles.helperText}>Haven&apos;t received an email? </Text>
              <Pressable
                accessibilityRole="link"
                disabled={isSubmitting}
                onPress={handleSendEmail}
              >
                <Text style={styles.link}>Resend email</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleSendEmail}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isSubmitting && styles.primaryButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonLabel}>Send email</Text>
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
    marginBottom: 16,
    color: "#777777",
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 13,
  },
  errorMessage: {
    marginTop: 8,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  helperText: { color: "#A0A0A0", fontSize: 11, lineHeight: 16 },
  link: { color: "#8B45F6", fontSize: 11, lineHeight: 16, fontWeight: "500" },
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
});
