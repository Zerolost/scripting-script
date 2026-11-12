import { VStack, type CommonViewProps, type VirtualNode } from "scripting"
import { cardInsets, glassCard, leadingFillFrame, motion } from "../design/AllPatternDesign"

type CardChildren =
  | VirtualNode
  | (VirtualNode | boolean | undefined | null | (VirtualNode | undefined | null | boolean)[])[]

/** 所有卡片统一使用相同 padding 和 frame */
export function GlassCard({
  children,
  tinted = false,
  spacingValue = 12,
  sensoryFeedback,
  animationValue,
}: {
  children: CardChildren
  tinted?: boolean
  spacingValue?: number
  sensoryFeedback?: CommonViewProps["sensoryFeedback"]
  animationValue?: number
}): VirtualNode {
  return (
    <VStack
      alignment="leading"
      spacing={0}
      padding={cardInsets}
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
