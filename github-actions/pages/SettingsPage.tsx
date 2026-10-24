import { AppearancePage } from './AppearancePage'
import { visual } from '../visual.config'
import { NavigationLink, VStack, Image, type Color } from 'scripting'
import { GlassList, GlassSection } from '../components/GlassList'
import { AppBackground } from '../components/AppBackground'
import { MotionRow, MotionText as Text } from '../components/Motion'
import { GitHubAPI } from '../services/AppModel'
import { WidgetSetupPage } from './WidgetSetupPage'
import { useAccentColor } from '../hooks/useAccentColor'

export function SettingsPage({ api }: { api: GitHubAPI }) {
  const accentColor: Color = useAccentColor()
  return (
    <GlassList navigationTitle={visual.text['设置']} navigationBarTitleDisplayMode={visual.navigationTitleMode} background={<AppBackground />}>
      <NavigationLink buttonStyle="plain" tint={accentColor} destination={<AppearancePage />}>
        <MotionRow spacing={visual.spacing[10]}>
          <Image systemName="slider.horizontal.3" font={visual.fontSizes[22]} foregroundStyle={accentColor} />
          <VStack alignment="leading" spacing={visual.spacing[4]}>
            <Text font={visual.fontSizes[16]} fontWeight={visual.typography.semibold}>外观调试</Text>
            <Text font={visual.fontSizes[12]} foregroundStyle="secondaryLabel">实时调整背景、玻璃、动画与小组件</Text>
          </VStack>
        </MotionRow>
      </NavigationLink>
      <GlassSection header={<Text font={visual.fontSizes[13]} foregroundStyle={visual.colors['secondaryLabel']}>{visual.text['桌面小组件']}</Text>}>
        <NavigationLink buttonStyle="plain" tint={accentColor} destination={<WidgetSetupPage api={api} />}>
          <MotionRow spacing={visual.spacing[10]}>
            <Image systemName={visual.icons['widget.small']} font={visual.fontSizes[22]} foregroundStyle={accentColor} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} />
            <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
              <Text font={visual.fontSizes[16]} fontWeight={visual.typography.semibold}>{visual.text['小组件设置']}</Text>
              <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors['secondaryLabel']}>{visual.text['选择需要在桌面显示的工作流']}</Text>
            </VStack>
          </MotionRow>
        </NavigationLink>
      </GlassSection>
    </GlassList>
  )
}
