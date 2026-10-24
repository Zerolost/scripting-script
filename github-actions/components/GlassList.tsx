import { CompatibleGlassContainer } from './CompatibleGlassContainer'
import { visual } from '../visual.config'
import { ScrollView, LazyVStack, VStack, type VirtualNode, type CommonViewProps, type Color } from 'scripting'
import { useAccentColor } from '../hooks/useAccentColor'

import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'

type GlassListProps = CommonViewProps & { children?: any }

export function GlassList({ children }: GlassListProps) {
  const host: GitHubActionsHost | undefined = useHost()
  const accentColor: Color = useAccentColor()
  return (
    <ScrollView tint={accentColor}>
      <CompatibleGlassContainer spacing={visual.glass.containerSpacing}>
        <LazyVStack alignment="leading" spacing={host?.rowSpacing ?? visual.spacing[6]} padding={{ horizontal: visual.spacing[10], top: visual.spacing[4], bottom: visual.spacing[20] }} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          {children}
        </LazyVStack>
      </CompatibleGlassContainer>
    </ScrollView>
  )
}

export function GlassSection({ header, children }: { header?: VirtualNode; children?: any }) {
  const host: GitHubActionsHost | undefined = useHost()
  return (
    <LazyVStack alignment="leading" spacing={host?.rowSpacing ?? visual.spacing[6]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      {header ? <VStack alignment="leading" padding={{ horizontal: visual.spacing[2], vertical: visual.spacing[2] }}>{header}</VStack> : null}
      {children}
    </LazyVStack>
  )
}
