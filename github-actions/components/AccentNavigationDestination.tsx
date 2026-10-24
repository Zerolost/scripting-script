import { Button, EnvironmentValuesReader, Image, VStack, type Color, type EnvironmentValues, type VirtualNode } from 'scripting'
import { useAccentColor } from '../hooks/useAccentColor'
import { visual } from '../visual.config'

export function AccentBackButton({ action }: { action: () => void }) {
  const accent: Color = useAccentColor()
  return <Button action={action} tint={accent} accessibilityLabel="返回上一页">
    <Image systemName={visual.icons['chevron.left']} foregroundStyle={accent} />
  </Button>
}

export function AccentNavigationDestination({ children }: { children: VirtualNode }) {
  return <EnvironmentValuesReader keys={['dismiss']}>
    {(values: EnvironmentValues): VirtualNode => <VStack
      spacing={0}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      navigationBarBackButtonHidden={true}
      toolbar={{ topBarLeading: <AccentBackButton action={values.dismiss} /> }}
    >
      {children}
    </VStack>}
  </EnvironmentValuesReader>
}
