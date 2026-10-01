/**
 * Design tokens — single source of truth for the temporary Pathway design.
 * When final designs arrive, update values here (or swap this file) without
 * touching feature code.
 */
export const colors = {
  primary: "#8B5CF6",
  primaryDark: "#7C3AED",
  primarySoft: "#EDE9FE",
  primaryDisabled: "#C4B5FD",
  background: "#F5F6F8",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  skeleton: "#E9E9EE",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  danger: "#DC2626",
  success: "#16A34A",
  warningBg: "#FEF2F2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: "600" as const },
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;
