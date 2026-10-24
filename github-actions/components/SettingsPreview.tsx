import { AccentBackButton } from './AccentNavigationDestination'
import { animateChange } from './Motion'
import { VStack, HStack, Text, useState } from 'scripting'
import { visual } from '../visual.config'
import { SettingsLinkContent } from './SettingsLinkContent'
import { ExitScriptButton, LogoutButton } from './SessionControls'
import { FlowVisibilitySetting } from './RunDetailFlow'
import { ActionPreferences } from './ActionPreferences'

export function SettingsPreview() {
  const [returned, setReturned] = useState<boolean>(false)
  return <VStack alignment="leading" spacing={visual.spacing[10]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <HStack><ExitScriptButton preview /><Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>工具栏退出 · 强调色</Text></HStack>
    <HStack><AccentBackButton action={() => animateChange(() => setReturned(!returned))} /><Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{returned ? '已演示返回' : '返回箭头 · 强调色'}</Text></HStack>
    <FlowVisibilitySetting preview />
    <ActionPreferences preview />
    <SettingsLinkContent icon={visual.icons['widget.small']} title="小组件设置" subtitle="点选桌面工作流，无需填写参数" />
    <SettingsLinkContent icon="slider.horizontal.3" title="外观调试" subtitle="实时调整背景、玻璃、动画与小组件" />
    <LogoutButton preview />
  </VStack>
}
