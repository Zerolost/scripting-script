import { Text as NativeText, HStack, VStack, useState, type FontWeight, type Color } from 'scripting'
import { surface, glassTransition } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import { glassTokens } from '../design/glassTokens'
import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'
import { subscribeVisual } from '../services/visualSettings'

export let motion: Animation = Animation.snappy({ duration: visual.animation.enabled ? visual.animation.duration : 0, extraBounce: visual.animation.extraBounce })
export let motionTransition: Transition = Transition.opacity().combined(Transition.scale(visual.animation.enabled ? visual.animation.transitionScale : 1)).animation(motion)

let animationSignature: string = JSON.stringify(visual.animation)

export function refreshMotion(): void {
  const signature: string = JSON.stringify(visual.animation)
  if (signature === animationSignature) return
  animationSignature = signature
  motion = Animation.snappy({ duration: visual.animation.enabled ? visual.animation.duration : 0, extraBounce: visual.animation.extraBounce })
  motionTransition = Transition.opacity().combined(Transition.scale(visual.animation.enabled ? visual.animation.transitionScale : 1)).animation(motion)
}

subscribeVisual(refreshMotion)

export function animateChange(update: () => void): void {
  void withAnimation(motion, update)
}

export function MotionText(props: any) {
  const { children, style, numberOfLines, foregroundStyle }: any = props
  const host: GitHubActionsHost | undefined = useHost()
  const originalColor: Color | undefined = style?.color ?? foregroundStyle
  const secondary: boolean = originalColor === 'secondaryLabel' || originalColor === '#8e8e93' || originalColor === visual.colors.secondaryLabel || originalColor === visual.colors['#8e8e93']
  const primary: boolean = originalColor === 'label' || originalColor === visual.colors.label || originalColor === undefined
  const color: Color | undefined = secondary ? host?.secondaryTextColor ?? originalColor : primary ? host?.textColor ?? originalColor : originalColor
  const weight: string | undefined = style?.fontWeight
  const mappedWeight: FontWeight | undefined = weight === '500' ? visual.typography.medium : weight === '600' ? visual.typography.semibold : weight === '700' || weight === 'bold' ? visual.typography.bold : style?.fontWeight
  const value: string = typeof children === 'string' || typeof children === 'number' ? String(children) : ''
  return (
    <NativeText
      font={style?.fontSize}
      fontWeight={mappedWeight}
      foregroundStyle={color}
      lineLimit={numberOfLines}
      frame={style?.flex ? { maxWidth: 'infinity', alignment: 'leading' } : undefined}
      contentTransition={visual.textTransition}
      transition={motionTransition}
      animation={{ animation: motion, value }}
    >
      {children}
    </NativeText>
  )
}

export function MotionRow({ children, spacing, alignment }: any) {
  const host: GitHubActionsHost | undefined = useHost()
  const [visible, setVisible] = useState<boolean>(false)
  return (
    <HStack
      spacing={spacing ?? visual.spacing[8]}
      alignment={alignment}
      padding={{ horizontal: visual.spacing[12], vertical: host?.rowPadding ?? visual.spacing[8] }}
      frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      {...surface(visual.glass.row, { ...glassTokens.rowShape, cornerRadius: host?.rowCornerRadius ?? visual.radii[18] }, visual.glass.rowInteractive)}
      {...glassTransition(visual.glass.transition)}
      opacity={visible || !visual.animation.enabled ? 1 : visual.animation.rowOpacity}
      scaleEffect={visible || !visual.animation.enabled ? 1 : visual.animation.rowScale}
      onAppear={() => { if (!visible) animateChange(() => setVisible(true)) }}
      transition={motionTransition}
      animation={{ animation: motion, value: visible }}
    >
      {children}
    </HStack>
  )
}

export function MotionGroup({ children, value = '' }: any) {
  return <VStack transition={motionTransition} animation={{ animation: motion, value: String(value) }}>{children}</VStack>
}
