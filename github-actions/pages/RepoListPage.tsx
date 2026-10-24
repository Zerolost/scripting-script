import { AccentNavigationDestination } from '../components/AccentNavigationDestination'
import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { visual } from '../visual.config'
import { Button, VStack, Image, NavigationLink, Toolbar, ToolbarItem, ToolbarItemGroup } from "scripting"
import { GlassList as List, GlassSection as Section } from "../components/GlassList"
import { AppBackground } from "../components/AppBackground"
import { glassListRow } from "../components/GlassSurface"
import { GitHubAPI } from "../services/AppModel"
import { useActionRepositories } from "../hooks/useActionRepositories"

import { MotionText as Text, MotionRow, motion } from '../components/Motion'
import { WorkflowListPage } from "./WorkflowListPage"
import { SettingsPage } from './SettingsPage'
import { ExitScriptButton } from '../components/SessionControls'

export function RepoListPage({ api, onLogout }: { api: GitHubAPI; onLogout: () => void }) {
  const accentColor: Color = useAccentColor()
  const { data: repos, loading, errorMsg, noticeMsg, load } = useActionRepositories(api)
  return (
    <List tint={accentColor}
      navigationBarTitleDisplayMode={visual.navigationTitleMode}
      background={<AppBackground />}
      animation={{ animation: motion, value: `${loading}:${repos.length}:${errorMsg}:${noticeMsg}` }}
      navigationTitle={visual.text['仓库']}
      toolbar={
        <Toolbar>
          <ToolbarItem placement="topBarLeading">
            <ExitScriptButton />
          </ToolbarItem>
          <ToolbarItemGroup placement="topBarTrailing">
            <NavigationLink tint={accentColor} destination={<AccentNavigationDestination><SettingsPage api={api} onLogout={onLogout} tint={accentColor} /></AccentNavigationDestination>}>
              <Image systemName={visual.icons['gearshape']} accessibilityLabel={visual.text['设置']} />
            </NavigationLink>
            <Button tint={accentColor} title={visual.text['刷新']} systemImage={visual.icons['arrow.clockwise']} action={load} disabled={loading} />
          </ToolbarItemGroup>
        </Toolbar>
      }
    >
      {loading ? <Text {...glassListRow}>{visual.text['加载中...']}</Text> : null}
      {!loading && noticeMsg ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors['secondaryLabel']}>{noticeMsg}</Text> : null}
      {errorMsg ? <Text {...glassListRow} style={{ color: visual.colors['red'] }}>{errorMsg}</Text> : null}
      {!loading && !errorMsg && repos.length === 0 ? <Text {...glassListRow}>{visual.text['没有可读取的 GitHub Actions 工作流仓库']}</Text> : null}
      <Section header={<Text style={{ fontWeight: '600', color: visual.colors['label'] }}>{visual.text['有工作流的仓库']} ({repos.length})</Text>}>
        {repos.map(repo => (
          <NavigationLink {...glassListRow} tint={accentColor} buttonStyle="plain"
            key={repo.id}
            destination={
              <AccentNavigationDestination><WorkflowListPage
                tint={accentColor}
                api={api}
                owner={repo.owner.login}
                repo={repo.name}
                defaultBranch={repo.default_branch}
              /></AccentNavigationDestination>
            }
          >
            <MotionRow spacing={visual.spacing[8]}>
              <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }}>
                <Image systemName={repo.private ? visual.icons['lock.fill'] : visual.icons['globe.americas.fill']} frame={{ width: visual.sizes[18], height: visual.sizes[18] }} foregroundStyle={repo.private ? visual.colors['#b54708'] : accentColor} />
              </VStack>
              <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[16], fontWeight: '600', color: visual.colors['label'] }}>{repo.full_name}</Text>
                <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors['secondaryLabel'] }}>{visual.text['默认分支: ']}{repo.default_branch}</Text>
              </VStack>
            </MotionRow>
          </NavigationLink>
        ))}
      </Section>
    </List>
  )
}
