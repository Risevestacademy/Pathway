import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@shared/design-system/tokens";
import type { DashboardTab } from "../types";
import { DashboardTabBar } from "./DashboardTabBar";

interface Props {
  activeTab: DashboardTab;
  children: ReactNode;
  onSelectTab: (tab: DashboardTab) => void;
}

export function DashboardScreenFrame({ activeTab, children, onSelectTab }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.content}>{children}</View>
      <DashboardTabBar activeTab={activeTab} onSelect={onSelectTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1 },
});
