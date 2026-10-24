import { ScrollView, VStack, HStack, Text, Button, NavigationLink, Widget, useState, type Color } from 'scripting'
import { glassButtonStyle } from '../design/AllPatternDesign'
import { AccentNavigationDestination } from '../components/AccentNavigationDestination'
import { visual } from '../visual.config'
import { visualGroups, saveVisual, resetVisual } from '../services/visualSettings'
import { useVisualSettings } from '../hooks/useVisualSettings'
import { useAccentColor } from '../hooks/useAccentColor'
import { AppBackground } from '../components/AppBackground'
import { AppearanceParameterList } from '../components/AppearanceParameterList'
import { AppearanceGroupPreview } from '../components/AppearanceGroupPreview'
import { GlassCard } from '../components/GlassSurface'
import { useHost, type GitHubActionsHost, refreshHostWidgets } from '../integration/HostAdapter'

function AppearanceActions() {
  const host: GitHubActionsHost | undefined = useHost()
  const accent: Color = useAccentColor()
  const [status, setStatus] = useState<string>('调整立即生效；点击保存后下次启动继续使用。')
  function save(): void {
    if (!saveVisual()) { setStatus('保存失败，请重试。当前调整仍然有效。'); return }
    refreshHostWidgets(host, () => Widget.reloadAll())
    setStatus('已保存，小组件已请求刷新。')
  }
  function reset(): void {
    if (!resetVisual()) { setStatus('恢复失败，请重试。'); return }
    refreshHostWidgets(host, () => Widget.reloadAll())
    setStatus('已恢复 visual.config.ts 默认值。')
  }
  return (
    <VStack alignment="leading" spacing={8}>
      <HStack spacing={10}>
        <Button title="保存外观" action={save} buttonStyle={glassButtonStyle(true)} tint={accent} />
        <Button title="恢复默认" action={reset} buttonStyle={glassButtonStyle()} tint={accent} />
      </HStack>
      <Text font="caption" foregroundStyle="secondaryLabel">{status}</Text>
    </VStack>
  )
}

export function AppearancePage({ group }: { group?: string } = {}) {
  useVisualSettings()
  const accent: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()
  const [query, setQuery] = useState<string>('')
  return (
    <ScrollView navigationTitle={group ? visualGroups[group] : '外观调试'} navigationBarTitleDisplayMode="inline" background={<AppBackground />} tint={accent} searchable={{ value: query, onChanged: setQuery, prompt: '搜索用途，例如按钮、文字、背景' }}>
      <VStack spacing={12} padding={12}>
        {group ? <AppearanceGroupPreview group={group} /> : null}
        <GlassCard><AppearanceActions /></GlassCard>
        {host ? <Text font="caption" foregroundStyle="secondaryLabel">宿主显式指定的背景、主题色和布局优先于这里的设置。</Text> : null}
        {visual.background.render ? <Text font="caption" foregroundStyle="secondaryLabel">配置文件启用了自绘背景，渐变颜色只在示例中显示。</Text> : null}
        {group || query.trim() ? <AppearanceParameterList key={group ?? 'all'} group={group} query={query} /> :
          Object.entries(visualGroups).map(([key, title]: [string, string]) => <NavigationLink key={key} destination={<AccentNavigationDestination><AppearancePage group={key} tint={accent} /></AccentNavigationDestination>} buttonStyle="plain" tint={accent}>
            <GlassCard><HStack><Text font="body">{title}</Text><Text foregroundStyle={accent}>›</Text></HStack></GlassCard>
          </NavigationLink>)}
        <Text font="caption" foregroundStyle="secondaryLabel">保存值覆盖配置文件；恢复默认后重新使用文件中的值。自绘背景函数需要在配置文件中编写。</Text>
      </VStack>
    </ScrollView>
  )
}
