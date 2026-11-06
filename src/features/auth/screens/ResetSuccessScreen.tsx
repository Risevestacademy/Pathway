import React from "react";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Yaay from "@app/assets/icons/yaay.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { colors } from "@shared/design-system/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ResetSuccess">;

const confetti: {
  left: `${number}%`;
  bottom: number;
  color: string;
  rotate: string;
}[] = [
  { left: "2%", bottom: 18, color: "#FF8A4C", rotate: "-20deg" },
  { left: "7%", bottom: 35, color: "#FFC533", rotate: "24deg" },
  { left: "13%", bottom: 14, color: "#FFA000", rotate: "-12deg" },
  { left: "19%", bottom: 44, color: "#FFCA45", rotate: "38deg" },
  { left: "24%", bottom: 20, color: "#FF7E51", rotate: "-32deg" },
  { left: "30%", bottom: 58, color: "#FFD970", rotate: "15deg" },
  { left: "36%", bottom: 30, color: "#FFA000", rotate: "-22deg" },
  { left: "42%", bottom: 12, color: "#FF8A4C", rotate: "28deg" },
  { left: "48%", bottom: 48, color: "#FFD970", rotate: "-16deg" },
  { left: "54%", bottom: 24, color: "#FF9F00", rotate: "35deg" },
  { left: "60%", bottom: 66, color: "#FF7E51", rotate: "-28deg" },
  { left: "66%", bottom: 18, color: "#FFD970", rotate: "12deg" },
  { left: "72%", bottom: 42, color: "#FFA000", rotate: "-36deg" },
  { left: "78%", bottom: 14, color: "#FF8A4C", rotate: "20deg" },
  { left: "84%", bottom: 54, color: "#FFD970", rotate: "-14deg" },
  { left: "90%", bottom: 27, color: "#FFA000", rotate: "32deg" },
  { left: "96%", bottom: 45, color: "#FF7E51", rotate: "-24deg" },
  { left: "5%", bottom: 86, color: "#FFD970", rotate: "10deg" },
  { left: "17%", bottom: 75, color: "#FF9F00", rotate: "-28deg" },
  { left: "28%", bottom: 97, color: "#FF8A4C", rotate: "18deg" },
  { left: "39%", bottom: 82, color: "#FFD970", rotate: "-10deg" },
  { left: "51%", bottom: 103, color: "#FFA000", rotate: "26deg" },
  { left: "63%", bottom: 88, color: "#FF7E51", rotate: "-32deg" },
  { left: "75%", bottom: 100, color: "#FFD970", rotate: "14deg" },
  { left: "87%", bottom: 83, color: "#FFA000", rotate: "-20deg" },
];

export function ResetSuccessScreen({ navigation, route }: Props) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EEFF" />
      <View style={styles.card}>
        <View style={styles.content}>
          <Yaay width={47} height={44} accessibilityLabel="Celebration" />
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.description}>
            Your password has now been reset{"\n"}successfully
          </Text>
          {route.params?.warning ? (
            <Text accessibilityRole="alert" style={styles.warning}>
              {route.params.warning}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace("Login")}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueLabel}>Continue</Text>
          </Pressable>
        </View>
        <View pointerEvents="none" style={styles.confetti}>
          {confetti.map((piece, index) => (
            <View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  left: piece.left,
                  bottom: piece.bottom,
                  backgroundColor: piece.color,
                  transform: [{ rotate: piece.rotate }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5EEFF",
  },
  card: {
    flex: 1,
    marginTop: 44,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: "48%",
  },
  title: {
    marginTop: 18,
    color: "#171717",
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginTop: 22,
    color: "#777777",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
  },
  warning: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  continueButton: {
    width: "100%",
    height: 56,
    marginTop: 28,
    borderRadius: 20,
    backgroundColor: "#9B5CF6",
    borderBottomWidth: 4,
    borderBottomColor: "#8246D3",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonPressed: {
    backgroundColor: "#8B4CE8",
  },
  continueLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  confetti: {
    ...StyleSheet.absoluteFill,
    top: undefined,
    height: 160,
  },
  confettiPiece: {
    position: "absolute",
    width: 5,
    height: 2.5,
    borderRadius: 1,
  },
});
