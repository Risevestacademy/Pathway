import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";

interface Props {
  placeholder: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions?: readonly string[];
  testID?: string;
}

export function TagInput({ placeholder, tags, onAdd, onRemove, suggestions, testID }: Props) {
  const [text, setText] = useState("");
  const availableSuggestions = (suggestions ?? []).filter((s) => !tags.includes(s));

  const commit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && !tags.includes(trimmed)) {
      onAdd(trimmed);
    }
    setText("");
  };

  return (
    <View testID={testID} style={styles.wrap}>
      <View style={styles.inputWrap}>
        {tags.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${tag}`}
              onPress={() => onRemove(tag)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholder={tags.length === 0 ? placeholder : ""}
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => commit(text)}
          returnKeyType="done"
        />
      </View>
      {availableSuggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>Suggestions</Text>
          {availableSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              testID={`${testID}-suggestion-${suggestion}`}
              onPress={() => commit(suggestion)}
              style={styles.suggestionRow}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  inputWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 46,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  chipText: { ...typography.caption, color: colors.primaryDark },
  input: { flex: 1, minWidth: 120, ...typography.body, color: colors.text, paddingVertical: 6 },
  suggestions: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
  },
  suggestionsLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  suggestionRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  suggestionText: { ...typography.body, color: colors.text },
});
