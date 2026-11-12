import { Button, HStack, Image, Rectangle, ScrollView, Spacer, Text, TextField, Toggle, VStack, ZStack, useMemo, useState } from "scripting"
import { GlassCard } from "../components/GlassCard"
import { GlassText } from "../components/GlassText"
import { TargetBadge } from "../components/TargetBadge"
import { childToolbar } from "../components/TopToolbar"
import {
  EGERN_INSTALL_PREFIX,
  LOON_INSTALL_PREFIX,
  REMOTE_MODULE_URLS,
  SHADOWROCKET_INSTALL_PREFIX,
  STASH_INSTALL_PREFIX,
  SURGE_INSTALL_PREFIX,
  SURGE_MODULE_STORE_URL,
  TOOL_VERSION,
} from "../constants"
import { TARGET_LIST, TARGETS } from "../constants/targets"
import { useIconPaths } from "../contexts/IconContext"
import { useLibrary } from "../contexts/LibraryContext"
import { fullFillFrame, leadingFillFrame, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import { candidateFolders } from "../services/settingsStore"
import type { Navigate, TargetId } from "../types"

/** 拼出目标 App 的远程安装链接 */
function installUrl(target: TargetId, url: string): string {
  const encoded = encodeURIComponent(url)
  switch (target) {
    case "loon": return `${LOON_INSTALL_PREFIX}${encoded}`
    case "stash": return `${STASH_INSTALL_PREFIX}${encoded}`
    case "shadowrocket": return `${SHADOWROCKET_INSTALL_PREFIX}${encoded}`
    default: return `${SURGE_INSTALL_PREFIX}${encoded}`
  }
}

/** 设置页 */
export function SettingsPage({ go }: { go: Navigate }) {
  const { settings, folderPath, updateSettings, chooseFolder, refresh, showNotice } = useLibrary()
  const [ua, setUa] = useState<string>(settings.userAgent)
  const folders = useMemo(() => candidateFolders(), [])
  const icons = useIconPaths()

  return (
    <ZStack>
      <Rectangle fill={pageGradient} ignoresSafeArea />
      <ScrollView
        navigationTitle="设置"
        navigationBarTitleDisplayMode="inline"
        toolbarBackgroundVisibility="hidden"
        toolbar={childToolbar(() => void refresh())}
        frame={fullFillFrame}
      >
        <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg} frame={leadingFillFrame}>
          <GlassCard>
            <Text font="headline">模块目录</Text>
            <GlassText>
              <Text
                font="caption"
                foregroundStyle={palette.secondaryLabel}
                lineLimit={2}
                truncationMode="middle"
                contentTransition="opacity"
                animation={{ animation: motion.quick, value: folderPath }}
              >
                {folderPath || "尚未选择目录"}
              </Text>
            </GlassText>
            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Button title="选择目录" systemImage="folder.badge.plus" buttonStyle="glassProminent" action={() => void chooseFolder()} />
              <Button
                title="复制路径"
                systemImage="doc.on.doc"
                buttonStyle="glass"
                action={() => {
                  void Pasteboard.setString(folderPath).then(() => showNotice("已复制目录路径"))
                }}
              />
            </HStack>
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              通过文件选择器授权后，路径会保存为书签，重启脚本仍可读写。四种目标 App 的文件都放在同一目录，按后缀区分。
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">推荐位置</Text>
            {folders.map(item => (
              <Button key={item.path} buttonStyle="plain" action={() => void copyPath(item.path)}>
                <GlassText>
                  <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                    <Image systemName="folder" foregroundStyle={palette.accent} />
                    <VStack alignment="leading" spacing={2} frame={leadingFillFrame}>
                      <Text font="subheadline">{item.title}</Text>
                      <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={2}>{item.path}</Text>
                    </VStack>
                  </HStack>
                </GlassText>
              </Button>
            ))}
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              点按可复制路径，在「文件」App 中长按即可快速定位。
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">下载</Text>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>User-Agent（部分模块会校验来源）</Text>
            <TextField title="User-Agent" value={ua} onChanged={setUa} prompt="script-hub/1.0.0" />
            <Button
              title="保存 User-Agent"
              systemImage="checkmark"
              buttonStyle="glass"
              action={() => {
                void updateSettings({ userAgent: ua.trim() || "script-hub/1.0.0" }).then(() =>
                  showNotice("已保存 User-Agent")
                )
              }}
            />
          </GlassCard>

          <GlassCard>
            <Text font="headline">行为</Text>
            <Toggle
              title="更新完成后重载 Surge"
              value={settings.reloadAfterUpdate}
              onChanged={value => void updateSettings({ reloadAfterUpdate: value })}
              toggleStyle="switch"
              sensoryFeedback={{ trigger: settings.reloadAfterUpdate ? 1 : 0, feedback: "selection" }}
            />
            <Toggle
              title="显示没有订阅链接的模块"
              value={settings.showModulesWithoutUrl}
              onChanged={value => void updateSettings({ showModulesWithoutUrl: value })}
              toggleStyle="switch"
              sensoryFeedback={{ trigger: settings.showModulesWithoutUrl ? 1 : 0, feedback: "selection" }}
            />
          </GlassCard>

          <GlassCard>
            <Text font="headline">反劫持模块</Text>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>
              四个 App 各一份等价实现，装好后在对应 App 里开启模块并信任 MITM 证书。
            </Text>
            {TARGET_LIST.map(item => (
              <VStack key={item.id} alignment="leading" spacing={spacing.sm} frame={leadingFillFrame}>
                <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                  <TargetBadge target={item.id} />
                  <Spacer />
                </HStack>
                <GlassText>
                  <Text font="caption2" monospaced lineLimit={2} truncationMode="middle">
                    {REMOTE_MODULE_URLS[item.id]}
                  </Text>
                </GlassText>
                <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                  <Button
                    title={`导入 ${item.app}`}
                    systemImage="arrow.down.to.line"
                    buttonStyle="glassProminent"
                    action={() => void Safari.openURL(installUrl(item.id, REMOTE_MODULE_URLS[item.id]))}
                  />
                  <Button
                    title="复制"
                    systemImage="doc.on.doc"
                    buttonStyle="glass"
                    action={() => {
                      void Pasteboard.setString(REMOTE_MODULE_URLS[item.id]).then(() => showNotice(`已复制 ${TARGETS[item.id].app} 模块链接`))
                    }}
                  />
                </HStack>
              </VStack>
            ))}
            <Button
              buttonStyle="glass"
              action={() => void Safari.openURL(`${EGERN_INSTALL_PREFIX}${encodeURIComponent(REMOTE_MODULE_URLS.surge)}`)}
            >
              <HStack spacing={6}>
                {icons.egern ? (
                  <Image filePath={icons.egern} resizable={true} frame={{ width: 18, height: 18 }} />
                ) : (
                  <Image systemName="app.fill" font="caption" foregroundStyle={palette.secondaryLabel} frame={{ width: 18, height: 18 }} />
                )}
                <Text>导入 Egern</Text>
              </HStack>
            </Button>
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              Egern 与 Surge 共用同一份 .sgmodule。Loon 本地插件、Stash 本地覆写、Shadowrocket 本地模块都可以在详情页「分享本地文件」导入。
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">关于</Text>
            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Image systemName="info.circle" foregroundStyle={palette.secondaryLabel} />
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                ModuleDock for Scripting v{TOOL_VERSION}
              </Text>
            </HStack>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>
              功能对齐 Script-Hub 的 ModuleDock.js，并扩展到 Loon 插件、Stash 覆写与 Shadowrocket 模块。
            </Text>
            <Button
              title="打开原项目"
              systemImage="safari"
              buttonStyle="glass"
              action={() => void Safari.openURL(SURGE_MODULE_STORE_URL)}
            />
          </GlassCard>
        </VStack>
      </ScrollView>
    </ZStack>
  )
}

async function copyPath(path: string): Promise<void> {
  await Pasteboard.setString(path)
}
