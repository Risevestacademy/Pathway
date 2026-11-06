import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import PathwayLogo from "../assets/icons/pathwaylogo.svg";

const splashBackground = require("../assets/images/screenpathway.png");

export function SplashScreen() {
  return (
    <ImageBackground
      source={splashBackground}
      resizeMode="cover"
      style={styles.background}
      accessibilityLabel="Pathway splash screen"
    >
      <View style={styles.logo}>
        <PathwayLogo width={184} height={35} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#F8F3FF",
  },
  logo: {
    position: "absolute",
    top: "41.8%",
    alignSelf: "center",
  },
});
