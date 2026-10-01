import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../design-system/tokens";

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  testID?: string;
}

/** Simple RN substitute for the shadcn Select shown in the design. */
export function SelectField({ placeholder, value, options, onChange, testID }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={selected ? selected.label : placeholder}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                testID={`${testID}-option-${option.value}`}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value && { color: colors.primary, fontWeight: "600" },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    marginBottom: spacing.md,
  },
  value: { ...typography.body, color: colors.text },
  placeholder: { color: colors.textTertiary },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  option: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  optionText: { ...typography.bodyMedium, color: colors.text },
});
