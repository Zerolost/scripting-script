import { HStack, Image, Text, type VirtualNode } from "scripting"
import { TARGETS } from "../constants/targets"
import { glassTextBox, spacing, targetTint } from "../design/AllPatternDesign"
import type { TargetId } from "../types"

/** 目标 App 徽标：图标 + “Loon 插件”这样的完整叫法 */
export function TargetBadge({
  target,
  showKind = true,
}: {
  target: TargetId
  showKind?: boolean
}): VirtualNode {
  const info = TARGETS[target]
  const tint = targetTint[target]
  return (
    <HStack
      spacing={4}
      padding={{ horizontal: spacing.md, vertical: 3 }}
      glassEffect={glassTextBox()}
    >
      <Image
        imageUrl={info.iconUrl}
        resizable={true}
        frame={{ width: 16, height: 16 }}
      />
      <Text font="caption2" fontWeight="semibold" foregroundStyle={tint}>
        {showKind ? `${info.app} ${info.kind}` : info.app}
      </Text>
    </HStack>
  )
}
