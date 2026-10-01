import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { colors, radius, spacing } from "../design-system/tokens";

function Line({ width, height = 12 }: { width: number | `${number}%`; height?: number }) {
  return <View style={[styles.line, { width, height }]} />;
}

function CardSkeleton() {
  return (
    <Card>
      <Line width="45%" height={10} />
      <View style={styles.gap} />
      <Line width="60%" height={16} />
      <View style={styles.gap} />
      <Line width="95%" />
      <View style={styles.gapSm} />
      <Line width="80%" />
      <View style={styles.gap} />
      <Line width="30%" height={10} />
    </Card>
  );
}

export function CatalogueSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View testID="catalogue-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
  gap: { height: spacing.md },
  gapSm: { height: spacing.sm },
});
