import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@shared/components/Card";
import { UnavailableBadge } from "@shared/components/UnavailableBadge";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { OutlookEntry } from "../types";

function formatAmount(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value ?? "Unavailable"}</Text>
    </View>
  );
}

function FooterChip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

export function PayOutlookCard({ entry }: { entry: OutlookEntry }) {
  const isSalary = entry.type === "SALARY";
  const title = isSalary
    ? "Median annual salary, all experience levels"
    : "Pay and job outlook";

  return (
    <Card testID={`outlook-${entry.id}`}>
      <View style={styles.headerRow}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.geography}>{entry.geography ?? "Unavailable"}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.valueRow}>
        {isSalary && entry.median !== null ? (
          <Text style={styles.median} testID="outlook-median">
            {entry.currency ?? ""} {formatAmount(entry.median)}
          </Text>
        ) : !isSalary && entry.growthPercent !== null ? (
          <Text style={styles.median}>{entry.growthPercent}%</Text>
        ) : (
          <UnavailableBadge />
        )}
        <Text style={styles.per}>
          {entry.payPeriod ? `per ${entry.payPeriod}` : ""}
        </Text>
      </View>

      {isSalary && (entry.percentile25 !== null || entry.percentile75 !== null) ? (
        <View style={styles.percentileRow}>
          <Text style={styles.percentileLabel}>25th percentile</Text>
          <Text style={styles.percentileLabel}>75th percentile</Text>
        </View>
      ) : null}
      {isSalary && (entry.percentile25 !== null || entry.percentile75 !== null) ? (
        <View style={styles.percentileRow}>
          <Text style={styles.percentileValue} testID="outlook-p25">
            {entry.percentile25 !== null ? `${entry.currency ?? ""} ${formatAmount(entry.percentile25)}` : "Unavailable"}
          </Text>
          <Text style={styles.percentileValue} testID="outlook-p75">
            {entry.percentile75 !== null ? `${entry.currency ?? ""} ${formatAmount(entry.percentile75)}` : "Unavailable"}
          </Text>
        </View>
      ) : null}

      <View style={styles.chipRow}>
        {entry.currency ? <FooterChip>{entry.currency}</FooterChip> : null}
        {entry.payPeriod ? <FooterChip>{`per ${entry.payPeriod}`}</FooterChip> : null}
        {entry.grossOrNet ? <FooterChip>{entry.grossOrNet}</FooterChip> : null}
      </View>

      <View style={styles.meta}>
        <MetaRow label="Source" value={entry.source} />
        <MetaRow label="Period" value={entry.period} />
        <MetaRow label="Location" value={entry.geography} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  geography: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  valueRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  median: { ...typography.title, color: colors.text },
  per: { ...typography.caption, color: colors.textSecondary },
  percentileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  percentileLabel: { ...typography.caption, color: colors.textTertiary },
  percentileValue: { ...typography.bodyMedium, color: colors.text },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.md },
  chip: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  meta: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  metaRow: { flexDirection: "row", gap: spacing.md },
  metaLabel: { ...typography.caption, color: colors.textTertiary, width: 52 },
  metaValue: { ...typography.caption, color: colors.text },
});
