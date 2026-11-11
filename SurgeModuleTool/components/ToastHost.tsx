import { Spacer, Text, VStack, useEffect } from "scripting"
import { useToast } from "../contexts/LibraryContext"
import { glassChip, motion, palette, spacing } from "../design/AllPatternDesign"

/** 底部浮层提示：出现/消失与文字变化都带动画 */
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
      alignment="center"
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
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
          transition={Transition.opacity().combined(Transition.move("bottom"))}
          animation={{ animation: motion.quick, value: notice }}
        >
          {notice}
        </Text>
      ) : null}
    </VStack>
  )
}
