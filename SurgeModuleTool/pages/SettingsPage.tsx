import { Button, HStack, Image, Rectangle, ScrollView, Text, TextField, Toggle, VStack, ZStack, useState } from "scripting"
import { GlassCard } from "../components/GlassCard"
import { GlassText } from "../components/GlassText"
import { childToolbar } from "../components/TopToolbar"
import { useLibrary } from "../contexts/LibraryContext"
import { fullFillFrame, leadingFillFrame, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import { EGERN_INSTALL_PREFIX, REMOTE_MODULE_URL, SURGE_INSTALL_PREFIX, TOOL_VERSION, SURGE_MODULE_STORE_URL } from "../constants"
import { candidateFolders } from "../services/settingsStore"
import type { Navigate } from "../types"

/** 设置页 */
export function SettingsPage({ go }: { go: Navigate }) {
  const { settings, folderPath, updateSettings, chooseFolder, refresh, showNotice } = useLibrary()
  const [ua, setUa] = useState<string>(settings.userAgent)
  const folders = candidateFolders()

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
              通过文件选择器授权后，路径会保存为书签，重启脚本仍可读写。
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
            <GlassText>
              <Text font="caption2" monospaced lineLimit={2} truncationMode="middle">{REMOTE_MODULE_URL}</Text>
            </GlassText>
            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Button
                title="导入 Surge"
                systemImage="arrow.down.to.line"
                buttonStyle="glassProminent"
                action={() => void Safari.openURL(`${SURGE_INSTALL_PREFIX}${encodeURIComponent(REMOTE_MODULE_URL)}`)}
              />
              <Button
                title="导入 Egern"
                systemImage="arrow.down.to.line"
                buttonStyle="glass"
                action={() => void Safari.openURL(`${EGERN_INSTALL_PREFIX}${encodeURIComponent(REMOTE_MODULE_URL)}`)}
              />
            </HStack>
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              Egern 与 Surge 使用同一份模块（Script Hub 的 Egern 导入也是这个 scheme），需先信任 MITM 证书。
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">关于</Text>
            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Image systemName="info.circle" foregroundStyle={palette.secondaryLabel} />
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                SurgeModuleTool for Scripting v{TOOL_VERSION}
              </Text>
            </HStack>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>
              功能对齐 Script-Hub 的 SurgeModuleTool.js，内置 scriptable:// → scripting:// 的浏览器脚本。
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
