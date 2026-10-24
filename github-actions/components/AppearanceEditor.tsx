import { VStack, HStack, Text, TextField, Toggle, Slider, ColorPicker, Picker, type Color } from 'scripting'
import { updateVisual, visualChoices, visualRange, visualValue, flushVisual } from '../services/visualSettings'
import { describeAppearance, appearanceChoiceLabel } from '../services/appearanceDescriptions'
import { useAccentColor } from '../hooks/useAccentColor'

export function AppearanceEditor({ path, onActivate }: { path: string; onActivate?: () => void }) {
  const accent: Color = useAccentColor()
  const value: string | number | boolean = visualValue(path)
  const range: { min: number; max: number; step: number } = visualRange(path)
  const description: ReturnType<typeof describeAppearance> = describeAppearance(path)
  const choices: string[] | undefined = visualChoices(path)
  function change(next: string | number | boolean): void {
    onActivate?.()
    updateVisual(path, next)
  }
  const color: boolean = path.startsWith('colors/') || /^background\/(light|dark)\//.test(path) || path === 'widget/runColor'
  return (
    <VStack alignment="leading" spacing={8} padding={10} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text font="headline">{description.title}</Text>
      <Text font="subheadline" foregroundStyle="secondaryLabel">{description.description}</Text>
      {typeof value === 'boolean' ? <Toggle title={value ? '已开启' : '已关闭'} value={value} onChanged={(next: boolean) => change(next)} tint={accent} /> :
        typeof value === 'number' ? <VStack>
          <HStack><Text font="caption" monospacedDigit={true}>{String(value)}</Text></HStack>
          <Slider {...range} value={Math.max(range.min, Math.min(range.max, value))} onEditingChanged={(editing: boolean) => { if (!editing) flushVisual() }} onChanged={(next: number) => change(Number(next.toFixed(2)))} label={<Text>{description.title}</Text>} tint={accent} />
        </VStack> : color ? <ColorPicker title={description.title} value={value as Color} onChanged={(next: Color) => { if (typeof next === 'string') change(next) }} /> :
          choices ? <Picker title={description.title} value={value} onChanged={(next: string) => change(next)} pickerStyle="menu" tint={accent}>
            {choices.map((choice: string) => <Text key={choice} tag={choice}>{appearanceChoiceLabel(choice)}</Text>)}
          </Picker> : <TextField title={description.title} value={value} onChanged={(next: string) => change(next)} />}
    </VStack>
  )
}
