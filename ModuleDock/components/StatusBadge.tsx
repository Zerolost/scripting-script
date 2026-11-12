import { Text, type Color, type VirtualNode } from "scripting"
import { glassTextBox, motion, palette, textBoxInsets } from "../design/AllPatternDesign"

/** 状态徽标 */
export function StatusBadge({
  text,
  color = palette.accent,
  plain = false,
}: {
  text: string
  color?: Color
  plain?: boolean
}): VirtualNode {
  if (plain) {
    return (
      <Text
        font="caption2"
        fontWeight="semibold"
        foregroundStyle={color}
        padding={{ horizontal: 8, vertical: 3 }}
        background={palette.neutralSoft}
        clipShape="capsule"
      >
        {text}
      </Text>
    )
  }
  return (
    <Text
      font="caption2"
      fontWeight="semibold"
      foregroundStyle={color}
      padding={textBoxInsets}
      glassEffect={glassTextBox()}
      contentTransition="opacity"
      animation={{ animation: motion.quick, value: text }}
    >
      {text}
    </Text>
  )
}
