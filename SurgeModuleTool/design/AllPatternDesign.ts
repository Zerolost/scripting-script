import type { Color, LinearGradient, Shape, ShapeStyle } from "scripting"

/** 统一配色：全部使用 Scripting 的 Color 类型，避免样式字段类型不匹配 */
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

/** 统一动效：所有状态切换共用，避免各处硬编码时长 */
export const motion = {
  /** 页面/卡片切换 */
  page: Animation.smooth({ duration: 0.3 }),
  /** 列表项、文本变化 */
  quick: Animation.easeOut(0.2),
  /** 数字滚动 */
  number: Animation.snappy({ duration: 0.32 }),
  /** 按钮反馈 */
  tap: Animation.bouncy({ duration: 0.36, extraBounce: 0.12 }),
}

/** 页面插入/移除的轻量转场 */
export const pageTransition: Transition = Transition.asymmetric(
  Transition.opacity().combined(Transition.scale(0.985)),
  Transition.opacity()
)

/** 列表与卡片出现 */
export const cardTransition: Transition = Transition.opacity().combined(Transition.move("top"))

/** 正文卡片：Liquid Glass，默认不响应交互，材质对象做缓存避免重复构造 */
let cachedCardGlass: UIGlass | null = null
let cachedTintedGlass: UIGlass | null = null
let cachedChipGlass: UIGlass | null = null
let cachedTintedChipGlass: UIGlass | null = null

export function glassCard(tinted = false): { glass: UIGlass; shape: Shape } {
  if (tinted) {
    if (!cachedTintedGlass) {
      cachedTintedGlass = UIGlass.regular().interactive(false).tint(palette.accent)
    }
    return { glass: cachedTintedGlass, shape: cardShape }
  }
  if (!cachedCardGlass) {
    cachedCardGlass = UIGlass.regular().interactive(false)
  }
  return { glass: cachedCardGlass, shape: cardShape }
}

/** 小控件玻璃：让按钮 / 徽标带材质互动 */
export function glassChip(tinted = false): { glass: UIGlass; shape: Shape } {
  if (!cachedChipGlass) {
    cachedChipGlass = UIGlass.regular().interactive(true)
  }
  if (!tinted) {
    return { glass: cachedChipGlass, shape: chipShape }
  }
  if (!cachedTintedChipGlass) {
    cachedTintedChipGlass = cachedChipGlass.tint(palette.accent)
  }
  return { glass: cachedTintedChipGlass, shape: chipShape }
}

/** 兼容旧写法的材质背景（仅用于不适合玻璃的小元素） */
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

/** 主按钮的高亮渐变 */
export const accentGradient: LinearGradient = {
  colors: ["#0A84FF" as Color, "#5E5CE6" as Color],
  startPoint: "leading",
  endPoint: "trailing",
}

/** 状态色映射 */
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
