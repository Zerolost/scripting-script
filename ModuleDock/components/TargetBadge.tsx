import { HStack, Image, Text, type VirtualNode } from "scripting"
import { TARGETS } from "../constants/targets"
import { useIconPaths } from "../contexts/IconContext"
import { glassTextBox, spacing, targetTint } from "../design/AllPatternDesign"
import type { TargetId } from "../types"

/** 目标 App 徽标 */
export function TargetBadge({
  target,
  showKind = true,
}: {
  target: TargetId
  showKind?: boolean
}): VirtualNode {
  const info = TARGETS[target]
  const tint = targetTint[target]
  const iconPath = useIconPaths()[target]
  return (
    <HStack
      spacing={4}
      padding={{ horizontal: spacing.md, vertical: 3 }}
      glassEffect={glassTextBox()}
    >
      {iconPath ? (
        <Image filePath={iconPath} resizable={true} frame={{ width: 16, height: 16 }} />
      ) : (
        <Image systemName="app.fill" font="caption2" foregroundStyle={tint} frame={{ width: 16, height: 16 }} />
      )}
      <Text font="caption2" fontWeight="semibold" foregroundStyle={tint}>
        {showKind ? `${info.app} ${info.kind}` : info.app}
      </Text>
    </HStack>
  )
}
