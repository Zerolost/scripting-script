import { surface, glassTransition } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import { HStack, VStack, type CommonViewProps } from 'scripting'
import { motionTransition } from './Motion'
import { glassTokens } from '../design/glassTokens'
import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'

export const glassListRow = {
  listRowBackground: <HStack background="clear" />,
  listRowSeparator: 'hidden',
  listRowInsets: { top: 3, bottom: 3, leading: 12, trailing: 12 },
} as const

export const glassRowSurface = {
  frame: { maxWidth: 'infinity', alignment: 'leading' },
  get glassEffect(): CommonViewProps['glassEffect'] { return surface(visual.glass.row, glassTokens.rowShape, visual.glass.rowInteractive).glassEffect },
  get background(): CommonViewProps['background'] { return surface(visual.glass.row, glassTokens.rowShape, visual.glass.rowInteractive).background },
  get glassEffectTransition(): CommonViewProps['glassEffectTransition'] { return glassTransition(visual.glass.transition).glassEffectTransition },
} as const

export function GlassCard({ children }: { children: any }) {
  const host: GitHubActionsHost | undefined = useHost()
  return (
    <VStack
      alignment="leading"
      transition={motionTransition}
      spacing={visual.spacing[6]}
      padding={visual.spacing[10]}
      frame={{ maxWidth: 'infinity', alignment: 'leading' }}
      {...surface(visual.glass.card, { ...glassTokens.cardShape, cornerRadius: host?.rowCornerRadius ?? visual.radii[22] })}
      {...glassTransition(visual.glass.transition)}
    >
      {children}
    </VStack>
  )
}
