import { VStack, HStack, Text, Image, Button, Rectangle, Picker, useState, type Color, type FontWeight } from 'scripting'
import { visual } from '../visual.config'
import { visualEntries, visualGroups } from '../services/visualSettings'
import { describeAppearance } from '../services/appearanceDescriptions'
import { surface, glassButtonStyle } from '../design/AllPatternDesign'
import { useVisualSettings } from '../hooks/useVisualSettings'
import { useAccentColor } from '../hooks/useAccentColor'
import { usePreviewAppearance } from '../hooks/usePreviewAppearance'
import { BrandIcon } from './BrandIcon'
import { AccountProfileContent } from './AccountProfileCard'
import type { WidgetSize } from '../services/widgetLayout'
import { RunDetailPreview } from './RunDetailPreview'
import { RunDetailFlowPreview } from './RunDetailFlow'
import { SettingsPreview } from './SettingsPreview'
import { OverviewWidget } from './AppearanceOverview'
import { CompatibleGlassContainer } from './CompatibleGlassContainer'
import { MotionRow, animateChange } from './Motion'

type Entry = { path: string; value: string | number | boolean }

export function AppearanceGroupPreview({ group }: { group: string }) {
  useVisualSettings()
  const accent: Color = useAccentColor()
  const { mode, scheme, dark, changeMode } = usePreviewAppearance()
  const [playing, setPlaying] = useState<boolean>(false)
  const [size, setSize] = useState<WidgetSize>('medium')
  const entries: Entry[] = visualEntries(group)
  return (
    <VStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text font="headline">{`${visualGroups[group]} · 总实时预览`}</Text>
      <Picker title="预览外观" value={mode} onChanged={changeMode} pickerStyle="segmented" tint={accent}>
        <Text tag="system">跟随系统</Text>
        <Text tag="light">浅色</Text>
        <Text tag="dark">深色</Text>
      </Picker>
      <VStack environments={{ colorScheme: scheme }}>
          <VStack alignment="leading" spacing={12} padding={12} frame={{ maxWidth: 'infinity', alignment: 'leading' }} background={visual.background.enabled ? <Rectangle fill={{ colors: dark ? visual.background.dark : visual.background.light, startPoint: visual.background.startPoint, endPoint: visual.background.endPoint }} /> : (dark ? '#1c1c1e' : '#f5f5f7')} clipShape={{ type: 'rect', cornerRadius: 18 }}>
            {group === 'background' ? <VStack spacing={8}><Text foregroundStyle={visual.colors.label}>主要文字与背景渐变</Text><Text foregroundStyle={visual.colors.secondaryLabel}>辅助文字 · 切换明暗比较配色与方向</Text></VStack> :
              group === 'widget' ? <VStack spacing={8}><Picker title="示例尺寸" value={size} onChanged={(next: string) => { if (next === 'small' || next === 'medium' || next === 'large' || next === 'extraLarge' || next === 'extraLargePortrait') animateChange(() => setSize(next)) }} pickerStyle="menu"><Text tag="small">小号</Text><Text tag="medium">中号</Text><Text tag="large">大号</Text><Text tag="extraLarge">超大横向</Text><Text tag="extraLargePortrait">超大竖向</Text></Picker><OverviewWidget size={size} accent={accent} /></VStack> :
              group === 'detail' ? <RunDetailPreview /> :
              group === 'flow' ? <RunDetailFlowPreview /> :
              group === 'settings' ? <SettingsPreview /> :
              group === 'account' ? <AccountProfileContent profile={{ login: 'octocat', name: '示例账户', bio: '比较账户资料的字号、头像与间距。', location: '上海', public_repos: 12, followers: 24, following: 8 }} /> :
              group === 'brand' ? <BrandIcon /> :
              group === 'login' ? <VStack spacing={8}><BrandIcon /><Text font={visual.fontSizes[28]} fontWeight={visual.typography.bold} foregroundStyle={visual.colors.label}>{visual.login.title}</Text><Text foregroundStyle={visual.colors.secondaryLabel}>{visual.login.subtitle}</Text><Text foregroundStyle={accent}>{visual.login.help}</Text><Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>{visual.login.permission}</Text></VStack> :
              group === 'animation' || group === 'textTransition' ? <VStack spacing={8}><Button title={playing ? '再次切换' : '播放效果'} action={() => animateChange(() => setPlaying(!playing))} buttonStyle={glassButtonStyle(true)} tint={accent} /><Text contentTransition={visual.textTransition} foregroundStyle={visual.colors.label}>{playing ? '构建完成' : '正在构建'}</Text>{playing ? <MotionRow><Image systemName={visual.icons['bolt.fill']} foregroundStyle={accent} /><Text foregroundStyle={visual.colors.label}>列表入场与文字过渡</Text></MotionRow> : null}</VStack> :
              group === 'glass' ? <CompatibleGlassContainer spacing={visual.glass.containerSpacing}><VStack spacing={10}>{(['row', 'card', 'input', 'brand', 'widget'] as const).map((kind: 'row' | 'card' | 'input' | 'brand' | 'widget') => <HStack key={kind} padding={12} {...surface(visual.glass[kind], { type: 'rect', cornerRadius: visual.radii[18] }, kind === 'row' ? visual.glass.rowInteractive : kind === 'input')}><Text foregroundStyle={visual.colors.label}>{({ row: '列表行', card: '固定详情', input: '输入区域', brand: '品牌区域', widget: '小组件' })[kind]}</Text></HStack>)}</VStack></CompatibleGlassContainer> :
              group === 'shadow' ? <HStack padding={14} {...surface(visual.glass.input, { type: 'rect', cornerRadius: visual.radii[18] }, true)} shadow={{ color: dark ? visual.colors['rgba(0,0,0,0.42)'] : visual.colors['rgba(72,88,120,0.18)'], radius: visual.shadow.radius, y: visual.shadow.y }}><Text foregroundStyle={visual.colors.secondaryLabel}>用户名输入区域</Text></HStack> :
              group === 'navigationTitleMode' ? <VStack alignment="leading"><Text font={visual.navigationTitleMode === 'large' ? 'largeTitle' : 'headline'} foregroundStyle={visual.colors.label}>{visual.text['运行记录']}</Text><Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>{`当前模式：${visual.navigationTitleMode}，实际导航栏随页面同步更新`}</Text></VStack> :
              entries.map((entry: Entry) => <HStack key={entry.path} spacing={group === 'spacing' ? Number(entry.value) : 8}>
                {group === 'colors' ? <Rectangle fill={entry.value as Color} frame={{ width: 28, height: 20 }} /> :
                  group === 'icons' ? <Image systemName={String(entry.value)} font={24} foregroundStyle={accent} /> :
                  group === 'sizes' ? <Image systemName={visual.icons['bolt.fill']} font={Math.min(40, Number(entry.value))} frame={{ width: Number(entry.value), height: Number(entry.value) }} foregroundStyle={accent} /> :
                  group === 'radii' ? <Image systemName="bolt.fill" padding={12} foregroundStyle={accent} {...surface(visual.glass.card, { type: 'rect', cornerRadius: Number(entry.value) })} /> :
                  group === 'spacing' ? <Image systemName="bolt.fill" foregroundStyle={accent} /> : null}
                <Text font={group === 'fontSizes' ? Number(entry.value) : 14} fontWeight={group === 'typography' ? entry.value as FontWeight : undefined} foregroundStyle={group === 'colors' ? entry.value as Color : visual.colors.label} lineLimit={group === 'lineLimits' ? Number(entry.value) : undefined}>{group === 'text' ? String(entry.value) : group === 'lineLimits' ? `最多 ${entry.value} 行：这是用于比较工作流描述截断效果的长文字。构建、测试与发布任务的运行状态将在这里显示，超过设置行数时截断。` : `${describeAppearance(entry.path).title} · ${entry.value}`}</Text>
              </HStack>)}
          </VStack>
      </VStack>
      <Text font="caption" foregroundStyle="secondaryLabel">本分组效果完整展开，调整即时联动；翻页只切换下方参数。</Text>
    </VStack>
  )
}
