import { VStack, Text, Picker, Widget, useState, type Color } from 'scripting'
import { getActionPreferences, saveActionPreferences, type ActionPreferences as Preferences } from '../services/actionPreferences'
import { visual } from '../visual.config'
import { animateChange } from './Motion'
import { useAccentColor } from '../hooks/useAccentColor'

export function ActionPreferences({ preview = false }: { preview?: boolean }) {
  const [value, setValue] = useState<Preferences>(() => preview ? { widgetOrder: 'recent', runFilter: 'attention', branchScope: 'all' } : getActionPreferences())
  const [status, setStatus] = useState<string>('选择后自动保存，重新进入运行记录时使用。')
  const accent: Color = useAccentColor()
  function change(patch: Partial<Preferences>): void {
    const next: Preferences = { ...value, ...patch }
    if (!preview && !saveActionPreferences(next)) {
      animateChange(() => setStatus('保存失败，请重试。'))
      return
    }
    animateChange(() => { setValue(next); setStatus(preview ? '预览已更新，未保存实际设置。' : '已保存 Actions 偏好。') })
    if (!preview && patch.widgetOrder) Widget.reloadAll()
  }
  return <VStack alignment="leading" spacing={visual.spacing[10]} padding={visual.spacing[12]} tint={accent}>
    <Text font={visual.fontSizes[16]} fontWeight={visual.typography.semibold}>工作流关注策略</Text>
    <Picker title="小组件优先目标" value={value.widgetOrder} onChanged={(choice: string) => change({ widgetOrder: choice === 'selection' ? 'selection' : 'recent' })} pickerStyle="menu"><Text tag="recent">最近触发优先</Text><Text tag="selection">按点选顺序固定</Text></Picker>
    <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>小、中号展示第一项；固定顺序可把最常关注的工作流一直放在桌面。</Text>
    <Picker title="运行记录默认视角" value={value.runFilter} onChanged={(choice: string) => change({ runFilter: choice === 'attention' || choice === 'active' ? choice : 'all' })} pickerStyle="menu"><Text tag="all">全部运行</Text><Text tag="attention">待关注：进行中与异常</Text><Text tag="active">仅进行中的任务</Text></Picker>
    <Picker title="分支范围" value={value.branchScope} onChanged={(choice: string) => change({ branchScope: choice === 'default' ? 'default' : 'all' })} pickerStyle="menu"><Text tag="all">所有分支</Text><Text tag="default">仅仓库默认分支</Text></Picker>
    <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>筛选仅作用于已加载的最近记录，不修改 GitHub 工作流；运行页可以随时切换查看全部。</Text>
    {visual.settings.showGuide ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>定时任务按 GitHub 的 UTC 时间计算，桌面显示自动转换为当地时间。进入详情可持续查看任务进展。</Text> : null}
    <Text font={visual.fontSizes[12]} foregroundStyle={accent} contentTransition={visual.textTransition}>{status}</Text>
  </VStack>
}
