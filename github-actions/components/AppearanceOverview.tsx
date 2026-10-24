import { VStack, HStack, Text, Button, Image, Rectangle, Picker, useState, type Color, type Shape } from 'scripting'
import { visual } from '../visual.config'
import { surface, glassButtonStyle, liquidGlassAvailable } from '../design/AllPatternDesign'
import { CompatibleGlassContainer } from './CompatibleGlassContainer'
import { useVisualSettings } from '../hooks/useVisualSettings'
import { useAccentColor } from '../hooks/useAccentColor'
import { BrandIcon } from './BrandIcon'
import { GlassCard } from './GlassSurface'
import { MotionRow, animateChange, motionTransition } from './Motion'

type WidgetSize = 'small' | 'medium' | 'large'

export function OverviewWidget({ size, accent }: { size: WidgetSize; accent: Color }) {
  const layout: typeof visual.widget.small = visual.widget[size]
  const count: number = size === 'large' ? 3 : 1
  const historyCount: number = Math.min(3, Math.max(0, size === 'large' ? visual.widget.history.largeThree : visual.widget.history.compact))
  const showNext: boolean = visual.widget.showNext && (size !== 'large' || count <= visual.widget.nextVisibleMaxLargeTargets)
  return (
    <VStack alignment="leading" spacing={layout.outerSpacing} padding={layout.outerPad}
      frame={{ maxWidth: size === 'small' ? 180 : 'infinity', alignment: 'leading' }}
      {...surface(visual.glass.widget, { type: 'rect', cornerRadius: visual.radii[22], style: 'continuous' })}>
      <Text font={layout.titleFont} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.label}>{visual.widget.title}</Text>
      {Array.from({ length: count }, (_: unknown, index: number) => (
        <VStack key={String(index)} alignment="leading" spacing={layout.itemSpacing}>
          <HStack spacing={layout.rowSpacing}>
            <Image systemName={visual.icons['bolt.fill']} font={layout.headerIcon} foregroundStyle={accent} />
            <Text font={layout.titleFont} foregroundStyle={visual.colors.label} lineLimit={visual.lineLimits[1]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{['Build', 'Test', 'Release'][index]}</Text>
            <HStack padding={{ horizontal: visual.spacing[layout.runPad.horizontal], vertical: visual.spacing[layout.runPad.vertical] }} {...surface('regular', 'capsule', false, visual.widget.runColor)}>
              <Image systemName={visual.icons['play.fill']} font={layout.runIcon} foregroundStyle={liquidGlassAvailable ? visual.colors['#FFFFFF'] : visual.widget.runColor} />
            </HStack>
          </HStack>
          <Text font={layout.bodyFont} foregroundStyle={visual.colors.secondaryLabel}>example / actions · 成功</Text>
          {showNext ? <Text font={layout.historyFont} foregroundStyle={visual.colors.secondaryLabel}>下次运行 · 今天 18:00</Text> : null}
          {visual.widget.showHistory ? Array.from({ length: historyCount }, (_: unknown, history: number) => <Text key={String(history)} font={layout.historyFont} foregroundStyle={visual.colors.secondaryLabel}>{`✓ #${128 - history} · 构建成功`}</Text>) : null}
        </VStack>
      ))}
    </VStack>
  )
}

export function AppearanceOverview() {
  useVisualSettings()
  const accent: Color = useAccentColor()
  const [expanded, setExpanded] = useState<boolean>(true)
  const [dark, setDark] = useState<boolean>(false)
  const [size, setSize] = useState<WidgetSize>('medium')
  const [playing, setPlaying] = useState<boolean>(false)
  const [playback, setPlayback] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('按钮仅演示交互反馈')
  const inputShape: Shape = { type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' }
  function play(): void {
    animateChange(() => { setPlaying(true); setPlayback(playback + 1); setFeedback('已播放示例动画') })
  }
  return (
    <VStack alignment="leading" spacing={visual.spacing[10]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Button action={() => animateChange(() => setExpanded(!expanded))} buttonStyle={glassButtonStyle()} tint={accent}>
        <HStack><Text fontWeight={visual.typography.semibold}>总实时效果</Text><Image systemName={expanded ? 'chevron.up' : 'chevron.down'} /></HStack>
      </Button>
      {expanded ? <VStack alignment="leading" spacing={visual.spacing[8]} transition={motionTransition}>
        <Text font="caption" foregroundStyle="secondaryLabel">综合示例，联动当前配置；不逐项复现全部 244 个参数。所有数据和操作均为演示。</Text>
        <VStack environments={{ colorScheme: dark ? 'dark' : 'light' }}>
          <VStack alignment="leading" spacing={visual.spacing[14]} padding={visual.spacing[12]}
            frame={{ maxWidth: 'infinity', alignment: 'leading' }}
            background={visual.background.enabled ? <Rectangle fill={{ colors: dark ? visual.background.dark : visual.background.light, startPoint: visual.background.startPoint, endPoint: visual.background.endPoint }} /> : (dark ? visual.colors['#1c1c1e'] : visual.colors['#f5f5f7'])}
            clipShape={{ type: 'rect', cornerRadius: visual.radii[22], style: 'continuous' }}>
            <HStack>
              <Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>当前示例 · {dark ? '深色' : '浅色'}</Text>
              <Button title={dark ? '切换浅色' : '切换深色'} action={() => animateChange(() => setDark(!dark))} buttonStyle={glassButtonStyle()} tint={accent} />
            </HStack>
            <CompatibleGlassContainer spacing={visual.glass.containerSpacing}>
              <VStack alignment="leading" spacing={visual.spacing[10]}>
                <HStack spacing={visual.spacing[12]}>
                  <BrandIcon />
                  <VStack alignment="leading" spacing={visual.spacing[4]}>
                    <Text font={visual.fontSizes[24]} fontWeight={visual.typography.bold} foregroundStyle={visual.colors.label}>{visual.login.title}</Text>
                    <Text font={visual.fontSizes[14]} foregroundStyle={visual.colors.secondaryLabel}>{visual.login.subtitle}</Text>
                  </VStack>
                </HStack>
                <Text font={visual.fontSizes[15]} foregroundStyle={visual.colors.secondaryLabel}>{visual.text['用户名']}</Text>
                <HStack padding={visual.spacing[12]} frame={{ maxWidth: 'infinity', minHeight: visual.sizes[52], alignment: 'leading' }} {...surface(visual.glass.input, inputShape, true)}>
                  <Text font={visual.fontSizes[16]} foregroundStyle={visual.colors.label}>octocat · 示例账号</Text>
                </HStack>
                <Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>{visual.login.permission}</Text>
                <HStack spacing={visual.spacing[8]}>
                  <Button title={visual.login.help} action={() => animateChange(() => setFeedback('示例帮助按钮已点击'))} buttonStyle={glassButtonStyle()} tint={accent} />
                  <Button title={visual.text['绑定账号']} action={() => animateChange(() => setFeedback('示例绑定完成'))} buttonStyle={glassButtonStyle(true)} tint={accent} />
                </HStack>
                <Text font="caption" foregroundStyle={visual.colors.secondaryLabel} contentTransition={visual.textTransition}>{feedback}</Text>
                <Text font="headline" foregroundStyle={visual.colors.label}>{visual.text['仓库、工作流与运行记录']}</Text>
                <MotionRow>
                  <Image systemName={visual.icons['bolt.fill']} font={visual.fontSizes[20]} foregroundStyle={accent} />
                  <VStack alignment="leading" spacing={visual.spacing[4]}>
                    <Text font={visual.fontSizes[16]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.label} lineLimit={visual.lineLimits[1]}>example / actions</Text>
                    <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.secondaryLabel}>Build · main · #128</Text>
                  </VStack>
                  <Image systemName={visual.icons['checkmark.circle.fill']} foregroundStyle={visual.colors['#34C759']} />
                </MotionRow>
                <GlassCard>
                  <Text font={visual.fontSizes[22]} fontWeight={visual.typography.bold} foregroundStyle={visual.colors.label}>{visual.text['运行详情']}</Text>
                  <Text font={visual.fontSizes[16]} foregroundStyle={visual.colors.label}>Build #128 · 构建成功</Text>
                  <Text font={visual.fontSizes[14]} foregroundStyle={visual.colors.secondaryLabel}>main · octocat · 耗时 42 秒</Text>
                  <Text font={visual.fontSizes[14]} foregroundStyle={visual.colors.secondaryLabel}>✓ Checkout　✓ Test　✓ Build</Text>
                </GlassCard>
                <Button title="播放示例动画" action={play} buttonStyle={glassButtonStyle(true)} tint={accent} />
                <Text foregroundStyle={visual.colors.label} contentTransition={visual.textTransition}>{playing ? `构建完成 · 演示 ${playback}` : '等待播放动画'}</Text>
                {playing ? <MotionRow key={String(playback)}><Image systemName={visual.icons['checkmark.circle.fill']} foregroundStyle={accent} /><Text foregroundStyle={visual.colors.label}>文字与列表入场动画</Text></MotionRow> : null}
              </VStack>
            </CompatibleGlassContainer>
            <Text font="headline" foregroundStyle={visual.colors.label}>{visual.text['桌面小组件']}</Text>
            <Picker title="示例尺寸" value={size} onChanged={(value: string) => { if (value === 'small' || value === 'medium' || value === 'large') animateChange(() => setSize(value)) }} pickerStyle="segmented">
              <Text tag="small">小号</Text><Text tag="medium">中号</Text><Text tag="large">大号</Text>
            </Picker>
            <OverviewWidget size={size} accent={accent} />
            <Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>尺寸切换用于比较配置排版，桌面实际效果以系统为准。</Text>
          </VStack>
        </VStack>
      </VStack> : null}
    </VStack>
  )
}
