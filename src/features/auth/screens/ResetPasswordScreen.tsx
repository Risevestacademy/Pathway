import React, { useRef, useState } from "react";
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
import PathBack from "@app/assets/icons/pathback.svg";
import PasswordBox from "@app/assets/icons/passwordbox.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ navigation }: Props) {
  const {
    passwordResetEmail,
    passwordResetOtp,
    clearPasswordResetFlow,
    clearLocalSession,
  } = useAuth();
  const email = passwordResetEmail;
  const otp = passwordResetOtp;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetOtp, setResetOtp] = useState(otp ?? "");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);

  const handleResetPassword = async () => {
    if (submittingRef.current) return;
    if (!password || !confirmPassword) {
      setErrorMessage("Enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }
    if (!email || !/^\d{6}$/.test(resetOtp)) {
      setErrorMessage("Your reset code is missing. Go back and enter the six-digit code again.");
      return;
    }

    setIsSubmitting(true);
    submittingRef.current = true;
    setErrorMessage("");
    try {
      await authApi.confirmMobilePasswordReset({
        email,
        otp: resetOtp,
        newPassword: password,
      });
      let warning: string | undefined;
      try {
        await clearLocalSession();
      } catch {
        warning =
          "Your password changed, but this device couldn't clear its saved session. Sign in again.";
      }
      clearPasswordResetFlow();
      setPassword("");
      setConfirmPassword("");
      setResetOtp("");
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "ResetSuccess",
            params: warning ? { warning } : undefined,
          },
        ],
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else if (error instanceof ApiRequestError && error.status === 400) {
        setShowOtpInput(true);
        setErrorMessage(
          "The code may be invalid, expired, or already used. Check your details and try again.",
        );
      } else {
        setErrorMessage("We couldn't reset your password. Please try again.");
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    isVisible: boolean,
    toggleVisibility: () => void,
    textContentType: "newPassword",
  ) => (
    <View style={styles.passwordField}>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isSubmitting}
        onChangeText={(text) => {
          onChangeText(text);
          setErrorMessage("");
        }}
        placeholder={label}
        placeholderTextColor="#A8A8A8"
        secureTextEntry={!isVisible}
        style={styles.passwordInput}
        textContentType={textContentType}
        value={value}
      />
      <Pressable
        accessibilityLabel={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        accessibilityRole="button"
        onPress={toggleVisibility}
        style={styles.visibilityButton}
        hitSlop={8}
      >
        <Feather name={isVisible ? "eye-off" : "eye"} size={16} color="#A8A8A8" />
      </Pressable>
    </View>
  );

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
            <PasswordBox width={46} height={46} />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.description}>
              Your new password must be different from your old password
            </Text>
            <View style={styles.fields}>
              {renderPasswordInput(
                "Password",
                password,
                setPassword,
                isPasswordVisible,
                () => setIsPasswordVisible((visible) => !visible),
                "newPassword",
              )}
              {renderPasswordInput(
                "Confirm password",
                confirmPassword,
                setConfirmPassword,
                isConfirmPasswordVisible,
                () => setIsConfirmPasswordVisible((visible) => !visible),
                "newPassword",
              )}
            </View>
            {showOtpInput ? (
              <View style={[styles.passwordField, styles.otpField]}>
                <TextInput
                  accessibilityLabel="Password reset code"
                  autoComplete="one-time-code"
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(value) => {
                    setResetOtp(value.replace(/\D/g, "").slice(0, 6));
                    setErrorMessage("");
                  }}
                  placeholder="Six-digit reset code"
                  placeholderTextColor="#A8A8A8"
                  style={styles.passwordInput}
                  value={resetOtp}
                />
              </View>
            ) : null}
            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.errorMessage}>
                {errorMessage}
              </Text>
            ) : null}
            {email ? (
              <Text accessibilityLabel="Password reset email" style={styles.emailContext}>
                Reset requested for {email}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleResetPassword}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isSubmitting && styles.primaryButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonLabel}>Reset password</Text>
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
  fields: { gap: 8 },
  otpField: { marginTop: 8 },
  passwordField: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 12,
  },
  visibilityButton: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  errorMessage: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 16,
  },
  emailContext: { marginTop: 12, color: "#999999", fontSize: 10 },
  footer: { paddingBottom: 56 },
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
