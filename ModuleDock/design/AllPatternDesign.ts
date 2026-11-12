import type { Color, CommonViewProps, LinearGradient, Shape, ShapeStyle } from "scripting"
import type { TargetId } from "../types"

export const palette = {
  accent: "#0A84FF" as Color,
  accentSoft: "rgba(10,132,255,0.14)" as Color,
  success: "systemGreen" as Color,
  warning: "systemOrange" as Color,
  danger: "systemRed" as Color,
  successSoft: "rgba(48,209,88,0.16)" as Color,
  warningSoft: "rgba(255,159,10,0.16)" as Color,
  dangerSoft: "rgba(255,69,58,0.18)" as Color,
  neutralSoft: "rgba(120,120,128,0.14)" as Color,
  hairline: "separator" as Color,
  secondaryLabel: "secondaryLabel" as Color,
  tertiaryLabel: "tertiaryLabel" as Color,
}

/** 目标 App 的强调色，用于徽标与图标 */
export const targetTint: Record<TargetId, Color> = {
  surge: "#0A84FF" as Color,
  loon: "#BF5AF2" as Color,
  stash: "#30D158" as Color,
  shadowrocket: "#FF9F0A" as Color,
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 }
export const radius = { sm: 10, md: 16, lg: 22, xl: 28 }

export const cardShape: Shape = { type: "rect", cornerRadius: radius.lg }
export const chipShape: Shape = "capsule"

/** 文本承载框：圆角矩形，比卡片小一档 */
export const textBoxShape: Shape = { type: "rect", cornerRadius: radius.md }

export const textBoxInsets: NonNullable<CommonViewProps["padding"]> = {
  horizontal: spacing.md,
  vertical: spacing.sm,
}

/** 所有卡片都使用同一个内边距，避免“工具卡”宽度/高度看起来不同 */
export const cardInsets: NonNullable<CommonViewProps["padding"]> = {
  horizontal: spacing.lg,
  vertical: spacing.md,
}

export const leadingFillFrame: NonNullable<CommonViewProps["frame"]> = {
  minWidth: 0,
  idealWidth: "infinity",
  maxWidth: "infinity",
  alignment: "leading",
}

export const fullFillFrame: NonNullable<CommonViewProps["frame"]> = {
  minWidth: 0,
  idealWidth: "infinity",
  maxWidth: "infinity",
  minHeight: 0,
  idealHeight: "infinity",
  maxHeight: "infinity",
  alignment: "topLeading",
}

export const motion = {
  page: Animation.smooth({ duration: 0.3 }),
  quick: Animation.easeOut(0.2),
  number: Animation.snappy({ duration: 0.32 }),
  tap: Animation.bouncy({ duration: 0.36, extraBounce: 0.12 }),
}

/** 保留最小集合，避免重复创建 */
export const pageTransition: Transition = Transition.opacity()
export const cardTransition: Transition = Transition.opacity()

const cardGlass = UIGlass.regular().interactive(false)
const tintedCardGlass = cardGlass.tint(palette.accent)
const chipGlass = UIGlass.regular().interactive(true)
const tintedChipGlass = chipGlass.tint(palette.accent)
const textBoxGlass = UIGlass.regular().interactive(false)
const tintedTextBoxGlass = textBoxGlass.tint(palette.accent)

/** 返回值缓存 */
export const glassCardNormal = { glass: cardGlass, shape: cardShape }
export const glassCardTinted = { glass: tintedCardGlass, shape: cardShape }
export const glassChipNormal = { glass: chipGlass, shape: chipShape }
export const glassChipTinted = { glass: tintedChipGlass, shape: chipShape }
export const glassTextBoxNormal = { glass: textBoxGlass, shape: textBoxShape }
export const glassTextBoxTinted = { glass: tintedTextBoxGlass, shape: textBoxShape }

export function glassCard(tinted = false): { glass: UIGlass; shape: Shape } {
  return tinted ? glassCardTinted : glassCardNormal
}

export function glassChip(tinted = false): { glass: UIGlass; shape: Shape } {
  return tinted ? glassChipTinted : glassChipNormal
}

/** 文本承载框的玻璃背景 */
export function glassTextBox(tinted = false): { glass: UIGlass; shape: Shape } {
  return tinted ? glassTextBoxTinted : glassTextBoxNormal
}

export function cardBackground(tinted = false): { style: ShapeStyle; shape: Shape } {
  return { style: tinted ? palette.accentSoft : "regularMaterial", shape: cardShape }
}

export const pageGradient: LinearGradient = {
  colors: [
    "rgba(10,132,255,0.22)" as Color,
    "rgba(120,90,255,0.16)" as Color,
    "rgba(48,209,88,0.10)" as Color,
  ],
  startPoint: "topLeading",
  endPoint: "bottomTrailing",
}

export const accentGradient: LinearGradient = {
  colors: ["#0A84FF" as Color, "#5E5CE6" as Color],
  startPoint: "leading",
  endPoint: "trailing",
}

export function statusColor(status: string): Color {
  switch (status) {
    case "success":
    case "up-to-date": return palette.success
    case "failed": return palette.danger
    case "no-url": return palette.warning
    case "updating": return palette.accent
    default: return palette.neutralSoft
  }
}