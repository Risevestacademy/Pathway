import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, spacing, typography } from "@shared/design-system/tokens";
import type { CareerLevel } from "@shared/types/domain";
import type { RootStackParamList } from "@app/navigation/types";
import { useOnboardingStore } from "../store/onboardingStore";
import { canContinueFromStep1 } from "../validation";
import { CareerLevelCard } from "../components/CareerLevelCard";

type Props = NativeStackScreenProps<RootStackParamList, "CareerLevel">;

const LEVEL_OPTIONS: {
  level: CareerLevel;
  title: string;
  description: string;
  icon: "school-outline" | "ribbon-outline" | "briefcase-outline";
}[] = [
  {
    level: "STUDENT",
    title: "University student",
    description: "Currently studying and exploring options",
    icon: "school-outline",
  },
  {
    level: "RECENT_GRAD",
    title: "Recent graduate",
    description: "Finished studies within the last couple of years",
    icon: "ribbon-outline",
  },
  {
    level: "EARLY_CAREER",
    title: "Early-career professional",
    description: "A few years into work and looking ahead",
    icon: "briefcase-outline",
  },
];

export function CareerLevelScreen({ navigation }: Props) {
  const posthog = usePostHog();
  const level = useOnboardingStore((s) => s.level);
  const selectLevel = useOnboardingStore((s) => s.selectLevel);
  const canContinue = canContinueFromStep1(level);

  const handleLevelSelect = (selectedLevel: CareerLevel) => {
    selectLevel(selectedLevel);
    posthog.capture("career_level_selected", { career_level: selectedLevel });
  };

  return (
    <ScreenContainer testID="career-level-screen" contentStyle={{ flexGrow: 1 }}>
      <Text style={styles.step}>Step 1 of 2</Text>
      <Text style={styles.title}>Where are you in your career?</Text>
      <Text style={styles.subtitle}>
        {"We'll put the most relevant careers first. You can change this any time."}
      </Text>

      <View style={styles.options}>
        {LEVEL_OPTIONS.map((option) => (
          <CareerLevelCard
            key={option.level}
            testID={`level-${option.level}`}
            level={option.level}
            title={option.title}
            description={option.description}
            icon={option.icon}
            selected={level === option.level}
            onSelect={handleLevelSelect}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continue"
          testID="continue-button"
          disabled={!canContinue}
          onPress={() => navigation.navigate("AboutYou")}
        />
        <Text style={styles.note}>
          No account needed. Your answers are kept only for this browsing session.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  step: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  options: { marginBottom: spacing.xl },
  footer: { marginTop: "auto", gap: spacing.lg },
  note: { ...typography.caption, color: colors.textSecondary, textAlign: "center" },
});
