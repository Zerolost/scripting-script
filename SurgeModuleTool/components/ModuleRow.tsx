import { HStack, Image, Spacer, Text, VStack, type Color, type VirtualNode } from "scripting"
import type { ModuleEntry } from "../types"
import { leadingFillFrame, palette, spacing } from "../design/AllPatternDesign"
import { formatBytes, hostOf, relativeTime } from "../utils/moduleContent"
import { StatusBadge } from "./StatusBadge"

function badgeOf(entry: ModuleEntry): { text: string; color: Color } {
  switch (entry.status) {
    case "updating": return { text: "更新中", color: palette.accent }
    case "success": return { text: "已更新", color: palette.success }
    case "failed": return { text: "失败", color: palette.danger }
    case "no-url": return { text: "无链接", color: palette.warning }
    default: return {
      text: entry.hasSubscription ? relativeTime(entry.modifiedAt) : "无订阅",
      color: entry.hasSubscription ? palette.accent : palette.warning,
    }
  }
}

/** 模块行：静态文本不绑动画，避免列表每行创建动画对象 */
export function ModuleRow({ entry }: { entry: ModuleEntry }): VirtualNode {
  const badge = badgeOf(entry)
  const subtitle = entry.desc || hostOf(entry.subscribedUrl) || entry.fileName
  return (
    <HStack spacing={spacing.md} alignment="center" frame={leadingFillFrame}>
      <Image
        systemName={entry.hasSubscription ? "square.stack.3d.up.fill" : "doc.text"}
        foregroundStyle={entry.hasSubscription ? palette.accent : palette.secondaryLabel}
        font="title3"
        frame={{ width: 28 }}
        symbolEffect="scale"
        contentTransition="symbolEffect"
      />
      <VStack alignment="leading" spacing={2}>
        <Text font="headline" lineLimit={1} contentTransition="opacity">{entry.name}</Text>
        <Text font="caption" foregroundStyle={palette.secondaryLabel} lineLimit={1} contentTransition="opacity">{subtitle}</Text>
        <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1} contentTransition="opacity">
          {formatBytes(entry.size)} · {entry.fileName}
        </Text>
      </VStack>
      <Spacer />
      <StatusBadge text={badge.text} color={badge.color} />
    </HStack>
  )
}
