import { Text, type Color, type VirtualNode } from "scripting"
import { glassTextBox, motion, palette, textBoxInsets } from "../design/AllPatternDesign"

/** 状态徽标：圆角矩形文本框 */
export function StatusBadge({ text, color = palette.accent }: { text: string; color?: Color }): VirtualNode {
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
