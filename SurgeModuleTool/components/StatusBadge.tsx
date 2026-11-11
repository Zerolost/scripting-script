import { Text, type Color, type VirtualNode } from "scripting"
import { motion, palette } from "../design/AllPatternDesign"

/** 小号状态胶囊 */
export function StatusBadge({ text, color = palette.accent }: { text: string; color?: Color }): VirtualNode {
  return (
    <Text
      font="caption2"
      fontWeight="semibold"
      foregroundStyle={color}
      padding={{ horizontal: 7, vertical: 2 }}
      background={{ style: "thinMaterial", shape: "capsule" }}
      contentTransition="opacity"
      animation={{ animation: motion.quick, value: text }}
    >
      {text}
    </Text>
  )
}
