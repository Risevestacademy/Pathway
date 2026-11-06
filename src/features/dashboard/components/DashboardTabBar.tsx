import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import HomeIcon from "@app/assets/icons/onehome.svg";
import ExploreIcon from "@app/assets/icons/onebin.svg";
import PathwayIcon from "@app/assets/icons/postsign.svg";
import OpportunitiesIcon from "@app/assets/icons/onebrief.svg";
import SavedIcon from "@app/assets/icons/oneheart.svg";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { DashboardTab } from "../types";

const TABS: {
  id: DashboardTab;
  Icon: React.ComponentType<SvgProps>;
}[] = [
  { id: "Home", Icon: HomeIcon },
  { id: "Explore", Icon: ExploreIcon },
  { id: "Pathway", Icon: PathwayIcon },
  { id: "Opportunities", Icon: OpportunitiesIcon },
  { id: "Saved", Icon: SavedIcon },
];

interface Props {
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
}

export function DashboardTabBar({ activeTab, onSelect }: Props) {
  return (
    <View style={styles.shadow} testID="dashboard-tab-bar">
      <View style={styles.bar}>
        {TABS.map(({ id, Icon }) => {
          const selected = id === activeTab;
          const color = selected ? colors.primary : "#474747";
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={id}
              onPress={() => onSelect(id)}
              style={[styles.tab, selected && styles.selectedTab]}
            >
              <Icon color={color} width={22} height={22} />
              {selected ? <Text style={styles.selectedLabel}>{id}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  bar: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  tab: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  selectedTab: {
    backgroundColor: "#F0E4FF",
  },
  selectedLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontSize: 13,
  },
});
