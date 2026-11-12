import { HStack, Spacer, Text, type VirtualNode } from "scripting"
import { leadingFillFrame, palette, spacing } from "../design/AllPatternDesign"

/** 分组标题 */
export function SectionTitle({
  title,
  caption,
  trailing,
}: {
  title: string
  caption?: string
  trailing?: VirtualNode
}): VirtualNode {
  return (
    <HStack spacing={spacing.sm} alignment="firstTextBaseline" padding={{ horizontal: spacing.xs }}>
      <Text font="headline">{title}</Text>
      {caption ? (
        <Text font="caption" foregroundStyle={palette.secondaryLabel}>
          {caption}
        </Text>
      ) : null}
      <Spacer />
      {trailing ?? null}
    </HStack>
  )
}
