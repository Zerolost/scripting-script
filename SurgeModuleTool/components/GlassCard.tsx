import { VStack, type CommonViewProps, type VirtualNode } from "scripting"
import { glassCard, leadingFillFrame, motion, spacing } from "../design/AllPatternDesign"

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
}: {
  children: CardChildren
  tinted?: boolean
  padding?: CommonViewProps["padding"]
  spacingValue?: number
  sensoryFeedback?: CommonViewProps["sensoryFeedback"]
  animationValue?: number
}): VirtualNode {
  return (
    <VStack
      alignment="leading"
      spacing={0}
      padding={padding}
      frame={leadingFillFrame}
      glassEffect={glassCard(tinted)}
    >
      <VStack
        alignment="leading"
        spacing={spacingValue}
        frame={leadingFillFrame}
        sensoryFeedback={sensoryFeedback}
        animation={animationValue === undefined ? undefined : { animation: motion.page, value: animationValue }}
      >
        {children}
      </VStack>
    </VStack>
  )
}
