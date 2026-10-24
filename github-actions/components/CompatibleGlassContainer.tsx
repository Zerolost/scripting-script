import { GlassEffectContainer, VStack, type VirtualNode } from 'scripting'
import { liquidGlassAvailable } from '../design/AllPatternDesign'

export function CompatibleGlassContainer({ children, spacing }: { children?: VirtualNode | VirtualNode[]; spacing?: number }) {
  if (liquidGlassAvailable && typeof GlassEffectContainer !== 'undefined') {
    return <GlassEffectContainer spacing={spacing}>{children}</GlassEffectContainer>
  }
  return <VStack spacing={0}>{children}</VStack>
}
