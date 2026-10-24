import { AccentNavigationDestination } from '../components/AccentNavigationDestination'
import { NavigationLink, type Color } from 'scripting'
import { AccountProfileCard } from '../components/AccountProfileCard'
import { FlowVisibilitySetting } from '../components/RunDetailFlow'
import { AppearancePage } from './AppearancePage'
import { visual } from '../visual.config'
import { GlassList, GlassSection } from '../components/GlassList'
import { AppBackground } from '../components/AppBackground'
import { MotionRow, MotionText as Text } from '../components/Motion'
import { GitHubAPI } from '../services/AppModel'
import { WidgetSetupPage } from './WidgetSetupPage'
import { ActionPreferences } from '../components/ActionPreferences'
import { useAccentColor } from '../hooks/useAccentColor'
import { SettingsLinkContent } from '../components/SettingsLinkContent'
import { LogoutButton } from '../components/SessionControls'

export function SettingsPage({ api, onLogout }: { api: GitHubAPI; onLogout: () => void }) {
  const accentColor: Color = useAccentColor()
  return (
    <GlassList tint={accentColor} navigationTitle={visual.text['设置']} navigationBarTitleDisplayMode={visual.navigationTitleMode} background={<AppBackground />}>
      <GlassSection header={<Text style={{ fontSize: visual.fontSizes[13] }} foregroundStyle={visual.colors.secondaryLabel}>GitHub 账户</Text>}>
        <AccountProfileCard api={api} />
      </GlassSection>
      <GlassSection header={<Text style={{ fontSize: visual.fontSizes[13] }} foregroundStyle={visual.colors.secondaryLabel}>工作流与运行记录</Text>}>
        <MotionRow><FlowVisibilitySetting /></MotionRow>
        <MotionRow><ActionPreferences /></MotionRow>
      </GlassSection>
      <GlassSection header={<Text style={{ fontSize: visual.fontSizes[13] }} foregroundStyle={visual.colors.secondaryLabel}>小组件与外观</Text>}>
        <NavigationLink buttonStyle="plain" tint={accentColor} destination={<AccentNavigationDestination><WidgetSetupPage api={api} tint={accentColor} /></AccentNavigationDestination>}>
          <SettingsLinkContent icon={visual.icons['widget.small']} title={visual.text['小组件设置']} subtitle="点选桌面工作流，无需填写参数" />
        </NavigationLink>
        <NavigationLink buttonStyle="plain" tint={accentColor} destination={<AccentNavigationDestination><AppearancePage tint={accentColor} /></AccentNavigationDestination>}>
          <SettingsLinkContent icon="slider.horizontal.3" title="外观调试" subtitle="实时调整背景、玻璃、动画与小组件" />
        </NavigationLink>
      </GlassSection>
      <GlassSection header={<Text style={{ fontSize: visual.fontSizes[13] }} foregroundStyle={visual.colors.secondaryLabel}>登录管理</Text>}>
        <LogoutButton onLogout={onLogout} />
      </GlassSection>
    </GlassList>
  )
}
