import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import { useFocusEffect } from "@react-navigation/native";
import AccountLogo from "@app/assets/icons/accountlogo.svg";
import ArrowLeft from "@app/assets/icons/arrow-left.svg";
import LogLeft from "@app/assets/icons/logleft.svg";
import LogRight from "@app/assets/icons/logright.svg";
import Pathver from "@app/assets/icons/pathver.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">;

const otpLength = 6;
const resendCooldownSeconds = 60;

export function VerifyEmailScreen({ navigation, route }: Props) {
  const {
    verifyEmail,
    passwordResetEmail,
    passwordResetOtp,
    setPasswordResetOtp,
  } = useAuth();
  const params = route.params;
  const isPasswordReset = params.flow === "password-reset";
  const email = isPasswordReset ? passwordResetEmail ?? "" : params.email;
  const [otp, setOtp] = useState(() =>
    isPasswordReset ? passwordResetOtp ?? "" : "",
  );
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(resendCooldownSeconds);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const interval = setInterval(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [resendSeconds]);

  useFocusEffect(
    useCallback(() => {
      if (isPasswordReset) setOtp(passwordResetOtp ?? "");
    }, [isPasswordReset, passwordResetOtp]),
  );

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, otpLength));
    setErrorMessage("");
    setStatusMessage("");
  };

  const handleVerify = async () => {
    if (otp.length !== otpLength) {
      setErrorMessage("Enter the 6-digit verification code.");
      setStatusMessage("");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      if (isPasswordReset) {
        setPasswordResetOtp(otp);
        navigation.navigate("ResetPassword");
      } else {
        await verifyEmail({ email, otp });
      }
      Keyboard.dismiss();
    } catch (error) {
      if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else if (error instanceof ApiRequestError && error.status === 400) {
        setErrorMessage("That code is invalid or expired. Check it and try again.");
      } else {
        setErrorMessage("We couldn't verify your email. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      if (isPasswordReset) {
        await authApi.requestMobilePasswordReset({ email });
      } else {
        await authApi.resendVerification({ email });
      }
      setResendSeconds(resendCooldownSeconds);
      setStatusMessage("If this email needs a code, a new one has been sent.");
    } catch (error) {
      if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else {
        setErrorMessage("We couldn't resend the code. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const formattedTime = `00:${String(resendSeconds).padStart(2, "0")}`;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3FF" />
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
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <ArrowLeft width={20} height={20} color={colors.text} />
        </Pressable>
        <AccountLogo
          width={173}
          height={56}
          style={styles.logo}
          accessibilityLabel="Pathway"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.card}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pathver
            width={148}
            height={148}
            style={styles.envelope}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />

          <Text style={styles.title}>
            {isPasswordReset ? "Enter password reset code" : "Enter verification code"}
          </Text>
          <Text style={styles.description}>
            We’ve sent a 6-digit {isPasswordReset ? "password reset " : ""}code to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <Pressable
            accessibilityLabel="Enter 6-digit verification code"
            accessibilityRole="button"
            onPress={() => inputRef.current?.focus()}
            style={styles.otpRow}
          >
            {Array.from({ length: otpLength }, (_, index) => {
              const isActive = isOtpFocused && index === Math.min(otp.length, otpLength - 1);
              return (
                <View
                  key={index}
                  style={[styles.otpCell, isActive && styles.otpCellActive]}
                >
                  {otp[index] ? (
                    <Text style={styles.otpDigit}>{otp[index]}</Text>
                  ) : isActive ? (
                    <View style={styles.cursor} />
                  ) : null}
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              accessibilityLabel={
                isPasswordReset ? "Password reset code" : "Verification code"
              }
              autoComplete="one-time-code"
              autoCorrect={false}
              caretHidden
              contextMenuHidden={false}
              keyboardType="number-pad"
              maxLength={otpLength}
              onBlur={() => setIsOtpFocused(false)}
              onChangeText={handleOtpChange}
              onFocus={() => setIsOtpFocused(true)}
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              value={otp}
            />
          </Pressable>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorMessage}>
              {errorMessage}
            </Text>
          ) : null}
          {statusMessage ? (
            <Text accessibilityLiveRegion="polite" style={styles.statusMessage}>
              {statusMessage}
            </Text>
          ) : null}

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Resend code in </Text>
            {resendSeconds > 0 ? (
              <Text style={styles.countdown}>{formattedTime}</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isResending, busy: isResending }}
                disabled={isResending}
                onPress={handleResend}
              >
                {isResending ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.countdown}>Resend code</Text>
                )}
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: isSubmitting || otp.length !== otpLength,
              busy: isSubmitting,
            }}
            disabled={isSubmitting || otp.length !== otpLength}
            onPress={handleVerify}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && !isSubmitting && styles.continueButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.continueButtonLabel}>Continue</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="link"
            onPress={() =>
              isPasswordReset
                ? navigation.navigate("ForgotPassword")
                : navigation.navigate("CreateAccount")
            }
            style={styles.differentEmailButton}
          >
            <Text style={styles.differentEmail}>Use a different email</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },
  header: {
    height: 184,
    position: "relative",
    backgroundColor: "#F7F3FF",
  },
  backgroundShapeOne: {
    position: "absolute",
    width: 410,
    height: 250,
    borderRadius: 180,
    backgroundColor: "#F0E9FF",
    top: -151,
    left: -116,
    transform: [{ rotate: "-25deg" }],
  },
  backgroundShapeTwo: {
    position: "absolute",
    width: 350,
    height: 140,
    borderRadius: 100,
    backgroundColor: "#FBF9FF",
    top: -54,
    left: 90,
    transform: [{ rotate: "-17deg" }],
  },
  leftNoodle: {
    position: "absolute",
    left: -16,
    top: 125,
  },
  rightNoodle: {
    position: "absolute",
    right: -6,
    top: 37,
  },
  backButton: {
    position: "absolute",
    zIndex: 1,
    top: 58,
    left: 22,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    position: "absolute",
    alignSelf: "center",
    top: 72,
  },
  card: {
    flex: 1,
    zIndex: 1,
    marginTop: -4,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 26,
    paddingBottom: 80,
  },
  envelope: {
    marginBottom: 22,
  },
  title: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 28,
    textAlign: "center",
  },
  description: {
    marginTop: 12,
    color: "#8A8D98",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  email: {
    color: "#9B69F5",
    fontWeight: "500",
  },
  otpRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
    marginTop: 30,
  },
  otpCell: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: "#E3E4E8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderColor: "#A16BFF",
    borderWidth: 1.5,
  },
  otpDigit: {
    color: "#111827",
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },
  cursor: {
    width: 1.5,
    height: 25,
    backgroundColor: "#111827",
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: "transparent",
  },
  errorMessage: {
    width: "100%",
    marginTop: 10,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  statusMessage: {
    width: "100%",
    marginTop: 10,
    color: colors.success,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 26,
    marginTop: 30,
  },
  resendLabel: {
    color: "#8A8D98",
    fontSize: 14,
  },
  countdown: {
    color: "#9B69F5",
    fontSize: 14,
    fontWeight: "600",
  },
  continueButton: {
    width: "100%",
    height: 54,
    marginTop: 34,
    borderRadius: 18,
    backgroundColor: "#9B5CF6",
    borderBottomWidth: 3,
    borderBottomColor: "#8246D3",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonPressed: {
    backgroundColor: "#8B4CE8",
  },
  continueButtonLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  differentEmailButton: {
    marginTop: 8,
    padding: 5,
  },
  differentEmail: {
    color: "#9B69F5",
    fontSize: 15,
    fontWeight: "600",
  },
});
