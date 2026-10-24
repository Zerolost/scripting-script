import { VStack, HStack, Text, Button, Image, Rectangle, useState, type Color } from 'scripting'
import { surface, glassTransition, glassButtonStyle, liquidGlassAvailable } from '../design/AllPatternDesign'
import { CompatibleGlassContainer } from './CompatibleGlassContainer'
import { visual } from '../visual.config'
import { visualValue } from '../services/visualSettings'
import { describeAppearance } from '../services/appearanceDescriptions'
import { useAccentColor } from '../hooks/useAccentColor'
import { MotionRow, animateChange } from './Motion'
import { BrandIcon } from './BrandIcon'

function numericValue(value: string | number | boolean): number {
  return typeof value === 'number' ? value : 0
}

export function AppearancePreview({ path }: { path: string }) {
  const accent: Color = useAccentColor()
  const [dark, setDark] = useState<boolean>(path.startsWith('background/dark'))
  const [expanded, setExpanded] = useState<boolean>(false)
  const value: string | number | boolean = visualValue(path)
  const parts: string[] = path.split('/').map((part: string) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
  const group: string = parts[0]
  const field: string = parts[1]
  const description: ReturnType<typeof describeAppearance> = describeAppearance(path)
  const inactive: boolean = /未使用|未接入|没有引用/.test(description.description)
  const widget: boolean = group === 'widget' || path === 'glass/widget'
  const family: 'small' | 'medium' | 'large' = field === 'medium' || field === 'large' ? field : 'small'
  const layout: typeof visual.widget.small = visual.widget[family]
  const widgetField: string = parts[2] ?? field
  const widgetTitle: boolean = path === 'widget/title' || widgetField === 'titleFont' || widgetField === 'headerIcon' || path === 'glass/widget'
  const widgetRun: boolean = field === 'runColor' || widgetField === 'runIcon' || widgetField === 'runPad'
  const widgetHistory: boolean = field === 'showHistory' || field === 'history' || widgetField === 'historyFont'
  const widgetNext: boolean = field === 'showNext' || field === 'nextVisibleMaxLargeTargets'
  const widgetLayout: boolean = widget && !widgetTitle && !widgetRun && !widgetHistory && !widgetNext
  const historyCount: number = field === 'history' ? Math.min(8, Math.max(0, numericValue(value))) : 1
  const background: boolean = group === 'background'
  const animation: boolean = group === 'animation' || group === 'textTransition'
  const brand: boolean = group === 'brand' || path === 'glass/brand'
  const glass: boolean = group === 'glass' && !widget && !brand
  const numeric: number = typeof value === 'number' ? value : 0
  return (
    <VStack spacing={8} padding={10}>
      <HStack>
        <Text font="caption" foregroundStyle="secondaryLabel">{`${description.title} · 局部效果`}</Text>
        <Button title={dark ? '深色' : '浅色'} action={() => animateChange(() => setDark(!dark))} buttonStyle={glassButtonStyle()} tint={accent} />
      </HStack>
      <VStack environments={{ colorScheme: dark ? 'dark' : 'light' }}>
        <VStack spacing={8} padding={12} frame={{ maxWidth: 'infinity', minHeight: background ? 110 : 44, alignment: 'leading' }} background={visual.background.enabled ? <Rectangle fill={{ colors: dark ? visual.background.dark : visual.background.light, startPoint: visual.background.startPoint, endPoint: visual.background.endPoint }} /> : (dark ? '#1c1c1e' : '#f5f5f7')} clipShape={{ type: 'rect', cornerRadius: 18 }}>
          {inactive ? <Text font="caption" foregroundStyle="secondaryLabel">当前页面尚未引用此项，调整不会改变实际界面。</Text> :
            background ? <VStack alignment="leading" spacing={4}><Text foregroundStyle={visual.colors.label}>主要文字</Text><Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>辅助文字与背景对比</Text></VStack> :
            brand ? <BrandIcon /> :
            widget ? <VStack alignment="leading" spacing={layout.outerSpacing} padding={layout.outerPad} {...surface(visual.glass.widget, { type: 'rect', cornerRadius: visual.radii[22] })}>
              {widgetTitle || widgetLayout ? <HStack spacing={layout.rowSpacing}><Image systemName={visual.icons['bolt.fill']} font={layout.headerIcon} foregroundStyle={accent} /><Text font={layout.titleFont} foregroundStyle={visual.colors.label}>{visual.widget.title}</Text></HStack> : null}
              {widgetLayout ? <VStack spacing={layout.itemSpacing}><Text font={layout.bodyFont} foregroundStyle={visual.colors.secondaryLabel}>example / build</Text><Text font={layout.bodyFont} foregroundStyle={visual.colors.secondaryLabel}>最近运行 · 成功</Text></VStack> : null}
              {widgetHistory ? visual.widget.showHistory ? Array.from({ length: historyCount }, (_: unknown, index: number) => <Text key={String(index)} font={layout.historyFont} foregroundStyle={visual.colors.secondaryLabel}>{`✓ 运行 #${128 - index} · 成功`}</Text>) : <Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>历史记录已隐藏</Text> : null}
              {widgetNext ? <Text font={layout.historyFont} foregroundStyle={visual.colors.secondaryLabel}>{!visual.widget.showNext || (field === 'nextVisibleMaxLargeTargets' && numericValue(value) < 3) ? '下次运行已隐藏（示例为 3 个目标）' : '下次运行 · 今天 18:00'}</Text> : null}
              {widgetRun ? <HStack {...surface('regular', { type: 'capsule', style: 'continuous' }, true, visual.widget.runColor)}><Image systemName={visual.icons['play.fill']} font={layout.runIcon} tint={liquidGlassAvailable ? visual.colors['#FFFFFF'] : visual.widget.runColor} padding={{ horizontal: visual.spacing[layout.runPad.horizontal], vertical: visual.spacing[layout.runPad.vertical] }} /></HStack> : null}
            </VStack> :
            animation ? <VStack spacing={8}>
              <Button title={expanded ? '收起动画' : '播放动画'} action={() => animateChange(() => setExpanded(!expanded))} buttonStyle={glassButtonStyle(true)} tint={accent} />
              {group === 'textTransition' ? <Text contentTransition={visual.textTransition} foregroundStyle={visual.colors.label}>{expanded ? '构建完成' : '正在构建'}</Text> : expanded ? <MotionRow><Text font={visual.fontSizes[16]} foregroundStyle={visual.colors.label}>文字与列表入场效果</Text></MotionRow> : null}
            </VStack> :
            glass && field === 'containerSpacing' ? <CompatibleGlassContainer spacing={visual.glass.containerSpacing}><HStack spacing={8}>{['bolt.fill', 'play.fill'].map((icon: string) => <Image key={icon} systemName={icon} padding={12} foregroundStyle={accent} {...surface(visual.glass.row, { type: 'capsule', style: 'continuous' })} />)}</HStack></CompatibleGlassContainer> :
            glass ? <VStack spacing={visual.glass.containerSpacing} padding={12} {...glassTransition(visual.glass.transition)} {...surface(field === 'input' ? visual.glass.input : field === 'card' ? visual.glass.card : visual.glass.row, { type: 'rect', cornerRadius: visual.radii[18] }, field === 'row' || field === 'rowInteractive' ? visual.glass.rowInteractive : false)}>
              <Text foregroundStyle={visual.colors.label}>{field === 'input' ? '用户名输入区域' : '玻璃内容区域'}</Text>
              <Text font="caption" foregroundStyle={visual.colors.secondaryLabel}>主要与辅助文字</Text>
            </VStack> :
            group === 'icons' ? <Image systemName={String(value)} font={32} foregroundStyle={accent} /> :
            group === 'colors' ? <VStack alignment="leading" spacing={6}><Text foregroundStyle={value as Color}>文字颜色示例</Text><Rectangle fill={value as Color} frame={{ width: 72, height: 24 }} /></VStack> :
            group === 'shadow' ? <HStack padding={12} {...surface(visual.glass.input, { type: 'rect', cornerRadius: visual.radii[18] }, true)} shadow={{ color: dark ? visual.colors['rgba(0,0,0,0.42)'] : visual.colors['rgba(72,88,120,0.18)'], radius: visual.shadow.radius, y: visual.shadow.y }}><Text foregroundStyle={visual.colors.secondaryLabel}>用户名输入框</Text></HStack> :
            group === 'radii' || group === 'sizes' ? <VStack padding={group === 'radii' ? 16 : 0} frame={group === 'sizes' ? { width: Math.max(1, numeric), height: Math.max(1, numeric) } : { width: 100, height: 60 }} {...surface(visual.glass.card, { type: 'rect', cornerRadius: group === 'radii' ? numeric : visual.radii[18] })}><Image systemName="bolt.fill" foregroundStyle={accent} /></VStack> :
            group === 'spacing' ? <HStack spacing={numeric}><Image systemName="bolt.fill" foregroundStyle={accent} /><Text foregroundStyle={visual.colors.label}>内容间距</Text></HStack> :
            <Text font={group === 'fontSizes' ? numeric : visual.fontSizes[16]} fontWeight={group === 'typography' ? visual.typography[field as keyof typeof visual.typography] : visual.typography.normal} foregroundStyle={visual.colors.label} lineLimit={group === 'lineLimits' ? numeric : undefined}>{group === 'text' || group === 'login' ? String(value) : group === 'lineLimits' ? '这是用于观察文字截断行数的较长示例。工作流构建、测试与发布状态将在此显示，超过指定行数后截断。' : 'GitHub Actions · 文字示例'}</Text>}
        </VStack>
      </VStack>
      {widget ? <Text font="caption" foregroundStyle="secondaryLabel">示例数据；桌面排布以系统小组件为准。</Text> : null}
    </VStack>
  )
}
