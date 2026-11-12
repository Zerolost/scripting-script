import { HStack, Image, Spacer, Text, VStack, type Color, type VirtualNode } from "scripting"
import { TARGETS } from "../constants/targets"
import { useIconPaths } from "../contexts/IconContext"
import type { ModuleEntry } from "../types"
import { leadingFillFrame, palette, spacing, targetTint } from "../design/AllPatternDesign"
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

/** 模块行 */
export function ModuleRow({ entry }: { entry: ModuleEntry }): VirtualNode {
  const badge = badgeOf(entry)
  const target = TARGETS[entry.target]
  const iconPath = useIconPaths()[entry.target]
  const subtitle = entry.desc || hostOf(entry.subscribedUrl) || entry.fileName
  return (
    <HStack spacing={spacing.md} alignment="center" frame={leadingFillFrame}>
      {iconPath ? (
        <Image filePath={iconPath} resizable={true} frame={{ width: 26, height: 26 }} />
      ) : (
        <Image
          systemName="square.stack.3d.up.fill"
          foregroundStyle={targetTint[entry.target]}
          font="title3"
          frame={{ width: 26, height: 26 }}
        />
      )}
      <VStack alignment="leading" spacing={2}>
        <Text font="headline" lineLimit={1}>{entry.name}</Text>
        <Text font="caption" foregroundStyle={palette.secondaryLabel} lineLimit={1}>{subtitle}</Text>
        <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1}>
          {target.app} {target.kind} · {formatBytes(entry.size)} · {entry.fileName}
        </Text>
      </VStack>
      <Spacer />
      <StatusBadge text={badge.text} color={badge.color} plain />
    </HStack>
  )
}
