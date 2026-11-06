import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import GoogleIcon from "@app/assets/icons/googleicon.svg";
import { ApiRequestError } from "@shared/api/client";
import { colors } from "@shared/design-system/tokens";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInError } from "../services/googleSignIn";

interface Props {
  disabled?: boolean;
  buttonStyle: StyleProp<ViewStyle>;
  pressedStyle: StyleProp<ViewStyle>;
  labelStyle: StyleProp<TextStyle>;
}

export function GoogleSignInButton({
  disabled = false,
  buttonStyle,
  pressedStyle,
  labelStyle,
}: Props) {
  const { signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePress = async () => {
    if (isSubmitting || disabled) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof GoogleSignInError) {
        setErrorMessage(
          error.kind === "play-services"
            ? "Google Play Services is unavailable. Update it and try again."
            : error.kind === "missing-id-token"
              ? "Google didn't return a sign-in token. Please try again."
              : error.kind === "unsupported-platform"
                ? "Google sign-in is currently available on Android."
                : error.kind === "missing-client-id"
                  ? "Google sign-in isn't configured for this build."
                  : "We couldn't start Google sign-in. Please try again.",
        );
      } else if (error instanceof ApiRequestError && error.kind === "network") {
        setErrorMessage("Unable to connect. Check your internet connection and try again.");
      } else if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        setErrorMessage("Google couldn't verify your sign-in. Please try again.");
      } else {
        setErrorMessage("We couldn't sign in with Google. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || isSubmitting,
          busy: isSubmitting,
        }}
        disabled={disabled || isSubmitting}
        onPress={handlePress}
        style={({ pressed }) => [
          buttonStyle,
          pressed && !isSubmitting && !disabled && pressedStyle,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <>
            <GoogleIcon width={19} height={19} />
            <Text style={labelStyle}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorMessage: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    textAlign: "center",
  },
});
