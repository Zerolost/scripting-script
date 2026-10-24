import { VStack, HStack, Text, Button, Image, Rectangle, Picker, useState, useColorScheme, type Color, type Shape } from 'scripting'
import { visual } from '../visual.config'
import { surface, glassButtonStyle } from '../design/AllPatternDesign'
import { CompatibleGlassContainer } from './CompatibleGlassContainer'
import { useVisualSettings } from '../hooks/useVisualSettings'
import { useAccentColor } from '../hooks/useAccentColor'
import { BrandIcon } from './BrandIcon'
import { RunDetailPreview } from './RunDetailPreview'
import { MotionRow, animateChange, motionTransition } from './Motion'

import { resolveWidgetLayout, type WidgetSize } from '../services/widgetLayout'
import { WidgetContent, type WidgetData } from './WidgetContent'
import type { WidgetFamily, ColorScheme } from 'scripting'

export function OverviewWidget({ size }: { size: WidgetSize; accent: Color }) {
  const scheme: ColorScheme = useColorScheme()
  const family: WidgetFamily = ({ small: 'systemSmall', medium: 'systemMedium', large: 'systemLarge', extraLarge: 'systemExtraLarge', extraLargePortrait: 'systemExtraLargePortrait' } as const)[size]
  const plan: ReturnType<typeof resolveWidgetLayout> = resolveWidgetLayout(family, size === 'extraLarge' ? 4 : size === 'extraLargePortrait' ? 5 : size === 'large' ? 3 : 1, visual.widget)
  const sample: WidgetData = { ok: true, items: Array.from({ length: plan.itemCount }, (_: unknown, index: number) => ({
    target: { owner: 'example', repo: 'actions', workflow: 'build.yml', branch: 'main' },
    workflowName: ['Build', 'Test', 'Release', 'Deploy', 'Check'][index],
    nextRun: new Date(Date.now() + 3600000),
    runs: Array.from({ length: 8 }, (_: unknown, history: number) => ({ id: history + 1, run_number: 128 - history, status: 'completed', conclusion: 'success', event: 'workflow_dispatch', created_at: new Date(Date.now() - (history + 1) * 3600000).toISOString() })),
  })) }
  return <VStack environments={{ colorScheme: scheme }} spacing={0} frame={{ maxWidth: 'infinity', alignment: 'leading' }} clipShape={{ type: 'rect', cornerRadius: visual.radii[22] }}><WidgetContent data={sample} plan={plan} preview /></VStack>
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
                <RunDetailPreview />
                <Button title="播放示例动画" action={play} buttonStyle={glassButtonStyle(true)} tint={accent} />
                <Text foregroundStyle={visual.colors.label} contentTransition={visual.textTransition}>{playing ? `构建完成 · 演示 ${playback}` : '等待播放动画'}</Text>
                {playing ? <MotionRow key={String(playback)}><Image systemName={visual.icons['checkmark.circle.fill']} foregroundStyle={accent} /><Text foregroundStyle={visual.colors.label}>文字与列表入场动画</Text></MotionRow> : null}
                <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>运行记录首次出现播放入场；本页滚回已显示的记录保持完整显示。</Text>
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
