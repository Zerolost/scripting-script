import type { Color, CommonViewProps, LinearGradient, Shape, ShapeStyle } from "scripting"

/** 统一配色 */
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

/** 间距刻度 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
}

/** 圆角刻度 */
export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
}

/** 卡片形状 */
export const cardShape: Shape = { type: "rect", cornerRadius: radius.lg }

/** 小控件形状 */
export const chipShape: Shape = "capsule"

/**
 * 统一铺满并左对齐。
 * 只写 maxWidth: "infinity" 时，Scripting/SwiftUI 会把窄内容按默认 center 对齐，
 * 这正是按钮和文字看起来“没靠左”的原因；必须显式给 alignment: "leading"。
 */
export const leadingFillFrame: NonNullable<CommonViewProps["frame"]> = {
  minWidth: 0,
  idealWidth: "infinity",
  maxWidth: "infinity",
  alignment: "leading",
}

/** 整页铺满（用于 ZStack 内的 ScrollView） */
export const fullFillFrame: NonNullable<CommonViewProps["frame"]> = {
  minWidth: 0,
  idealWidth: "infinity",
  maxWidth: "infinity",
  minHeight: 0,
  idealHeight: "infinity",
  maxHeight: "infinity",
  alignment: "topLeading",
}

/** 统一动效 */
export const motion = {
  page: Animation.smooth({ duration: 0.3 }),
  quick: Animation.easeOut(0.2),
  number: Animation.snappy({ duration: 0.32 }),
  tap: Animation.bouncy({ duration: 0.36, extraBounce: 0.12 }),
}

/** 页面插入/移除的轻量转场（不再使用，保留仅为兼容旧引用） */
export const pageTransition: Transition = Transition.opacity()

/** 列表与卡片出现：只用透明度，避免页面切回时材质层短暂重影 */
export const cardTransition: Transition = Transition.opacity()

/** 正文卡片：Liquid Glass，缓存实例避免重复构造 */
let cachedCardGlass: UIGlass | null = null
let cachedTintedGlass: UIGlass | null = null
let cachedChipGlass: UIGlass | null = null
let cachedTintedChipGlass: UIGlass | null = null

export function glassCard(tinted = false): { glass: UIGlass; shape: Shape } {
  if (tinted) {
    if (!cachedTintedGlass) cachedTintedGlass = UIGlass.regular().interactive(false).tint(palette.accent)
    return { glass: cachedTintedGlass, shape: cardShape }
  }
  if (!cachedCardGlass) cachedCardGlass = UIGlass.regular().interactive(false)
  return { glass: cachedCardGlass, shape: cardShape }
}

export function glassChip(tinted = false): { glass: UIGlass; shape: Shape } {
  if (!cachedChipGlass) cachedChipGlass = UIGlass.regular().interactive(true)
  if (!tinted) return { glass: cachedChipGlass, shape: chipShape }
  if (!cachedTintedChipGlass) cachedTintedChipGlass = cachedChipGlass.tint(palette.accent)
  return { glass: cachedTintedChipGlass, shape: chipShape }
}

/** 兼容旧写法的材质背景 */
export function cardBackground(tinted = false): { style: ShapeStyle; shape: Shape } {
  return { style: tinted ? palette.accentSoft : "regularMaterial", shape: cardShape }
}

/** 页面背景渐变 */
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
    case "up-to-date":
      return palette.success
    case "failed":
      return palette.danger
    case "no-url":
      return palette.warning
    case "updating":
      return palette.accent
    default:
      return palette.neutralSoft
  }
}
