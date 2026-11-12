import { Text, VStack, type Color } from "scripting"
import { leadingFillFrame, motion, palette } from "../design/AllPatternDesign"

/** 概览里的单个指标 */
export function StatTile({
  label,
  value,
  tint = palette.secondaryLabel,
}: {
  label: string
  value: number
  tint?: Color
}): ReturnType<typeof VStack> {
  return (
    <VStack alignment="leading" spacing={2} frame={leadingFillFrame}>
      <Text
        font="caption2"
        foregroundStyle={palette.secondaryLabel}
        contentTransition="opacity"
        animation={{ animation: motion.quick, value: label }}
      >
        {label}
      </Text>
      <Text
        font="title"
        fontWeight="bold"
        monospacedDigit
        foregroundStyle={tint}
        contentTransition="numericText"
        animation={{ animation: motion.number, value }}
      >
        {value}
      </Text>
    </VStack>
  )
}
