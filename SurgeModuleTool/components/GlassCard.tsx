import { VStack, type CommonViewProps, type VirtualNode } from "scripting"
import { glassCard, motion, spacing } from "../design/AllPatternDesign"

/** 卡片允许的 children 形态，与 Scripting 内置组件的声明保持一致 */
type CardChildren =
  | VirtualNode
  | (VirtualNode | boolean | undefined | null | (VirtualNode | undefined | null | boolean)[])[]

/** Liquid Glass 卡片容器 */
export function GlassCard({
  children,
  tinted = false,
  padding = spacing.lg,
  spacingValue = spacing.md,
  sensoryFeedback,
  animationValue,
  transition,
}: {
  children: CardChildren
  tinted?: boolean
  padding?: CommonViewProps["padding"]
  spacingValue?: number
  sensoryFeedback?: CommonViewProps["sensoryFeedback"]
  animationValue?: number
  transition?: CommonViewProps["transition"]
}): VirtualNode {
  return (
    <VStack
      alignment="leading"
      spacing={0}
      padding={padding}
      frame={{ maxWidth: "infinity" }}
      glassEffect={glassCard(tinted)}
    >
      <VStack
        alignment="leading"
        spacing={spacingValue}
        frame={{ maxWidth: "infinity" }}
        sensoryFeedback={sensoryFeedback}
        animation={animationValue === undefined ? undefined : { animation: motion.page, value: animationValue }}
        transition={transition}
      >
        {children}
      </VStack>
    </VStack>
  )
}
