import { VStack, Image, type Color } from 'scripting'
import { visual } from '../visual.config'
import { useAccentColor } from '../hooks/useAccentColor'
import { MotionRow, MotionText as Text } from './Motion'

export function SettingsLinkContent({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  const accent: Color = useAccentColor()
  return <MotionRow spacing={visual.spacing[10]}>
    <Image systemName={icon} font={visual.fontSizes[22]} foregroundStyle={accent} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} />
    <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text style={{ fontSize: visual.fontSizes[16], fontWeight: visual.typography.semibold }} foregroundStyle={visual.colors.label}>{title}</Text>
      <Text style={{ fontSize: visual.fontSizes[12] }} foregroundStyle={visual.colors.secondaryLabel}>{subtitle}</Text>
    </VStack>
  </MotionRow>
}
