import { Spacer, Text, VStack, useEffect } from "scripting"
import { useToast } from "../contexts/LibraryContext"
import { fullFillFrame, glassChip, motion, palette, spacing } from "../design/AllPatternDesign"

/** 底部浮层提示 */
export function ToastHost(): ReturnType<typeof VStack> {
  const { notice, showNotice } = useToast()

  useEffect(() => {
    if (!notice) {
      return
    }
    const timer = setTimeout(() => {
      void withAnimation(motion.quick, () => showNotice(null))
    }, 2600)
    return () => clearTimeout(timer)
  }, [notice, showNotice])

  return (
    <VStack
      alignment="leading"
      frame={fullFillFrame}
      padding={{ horizontal: spacing.lg, bottom: spacing.xxl }}
      allowsHitTesting={false}
    >
      <Spacer />
      {notice ? (
        <Text
          font="subheadline"
          foregroundStyle={palette.secondaryLabel}
          padding={{ horizontal: spacing.lg, vertical: spacing.md }}
          glassEffect={glassChip(true)}
          multilineTextAlignment="leading"
          contentTransition="opacity"
          animation={{ animation: motion.quick, value: notice }}
        >
          {notice}
        </Text>
      ) : null}
    </VStack>
  )
}
