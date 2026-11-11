import { VStack, type VirtualNode } from "scripting"
import { glassTextBox, leadingFillFrame, textBoxInsets } from "../design/AllPatternDesign"

type BoxChildren =
  | VirtualNode
  | (VirtualNode | boolean | undefined | null | (VirtualNode | undefined | null | boolean)[])[]

/** 文本承载框：圆角矩形 Liquid Glass，用于路径、错误、代码、状态等文本块 */
export function GlassText({
  children,
  tinted = false,
  spacing = 2,
}: {
  children: BoxChildren
  tinted?: boolean
  spacing?: number
}): VirtualNode {
  return (
    <VStack
      alignment="leading"
      spacing={spacing}
      padding={textBoxInsets}
      frame={leadingFillFrame}
      glassEffect={glassTextBox(tinted)}
    >
      {children}
    </VStack>
  )
}
