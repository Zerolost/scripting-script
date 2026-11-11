import {
  Button,
  HStack,
  Image,
  NavigationStack,
  Rectangle,
  ScrollView,
  Text,
  TextField,
  Toggle,
  VStack,
  ZStack,
  useState,
} from "scripting"
import { GlassCard } from "../components/GlassCard"
import { useLibrary } from "../contexts/LibraryContext"
import { motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import { TOOL_VERSION, SURGE_MODULE_STORE_URL } from "../constants"
import { candidateFolders } from "../services/settingsStore"
import type { Navigate } from "../types"

/** 设置页：模块目录、请求头与更新行为 */
export function SettingsPage({ go }: { go: Navigate }) {
  const { settings, folderPath, updateSettings, chooseFolder, showNotice } = useLibrary()
  const [ua, setUa] = useState<string>(settings.userAgent)
  const folders = candidateFolders()

  return (
    <NavigationStack>
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="设置"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg}>
            <GlassCard>
              <Text font="headline">模块目录</Text>
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
              <HStack spacing={spacing.sm}>
                <Button
                  title="选择目录"
                  systemImage="folder.badge.plus"
                  buttonStyle="glassProminent"
                  action={() => void chooseFolder()}
                />
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
                <Button
                  key={item.path}
                  buttonStyle="plain"
                  action={() => {
                    void copyPath(item.path)
                  }}
                >
                  <HStack spacing={spacing.sm} padding={{ vertical: 6 }}>
                    <Image systemName="folder" foregroundStyle={palette.accent} />
                    <VStack alignment="leading" spacing={2}>
                      <Text font="subheadline">{item.title}</Text>
                      <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={2}>
                        {item.path}
                      </Text>
                    </VStack>
                  </HStack>
                </Button>
              ))}
              <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
                点按可复制路径，在「文件」App 中长按即可快速定位。
              </Text>
            </GlassCard>

            <GlassCard>
              <Text font="headline">下载</Text>
              <VStack alignment="leading" spacing={spacing.xs}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  User-Agent（部分模块会校验来源）
                </Text>
                <TextField title="User-Agent" value={ua} onChanged={setUa} prompt="script-hub/1.0.0" />
              </VStack>
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
                onChanged={value => {
                  void updateSettings({ reloadAfterUpdate: value })
                }}
                toggleStyle="switch"
              />
              <Toggle
                title="显示没有订阅链接的模块"
                value={settings.showModulesWithoutUrl}
                onChanged={value => {
                  void updateSettings({ showModulesWithoutUrl: value })
                }}
                toggleStyle="switch"
              />
            </GlassCard>

            <GlassCard>
              <Text font="headline">关于</Text>
              <HStack spacing={spacing.sm}>
                <Image systemName="info.circle" foregroundStyle={palette.secondaryLabel} />
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  SurgeModuleTool for Scripting v{TOOL_VERSION}
                </Text>
              </HStack>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                功能对齐 Script-Hub 的 SurgeModuleTool.js，并额外提供 scriptable:// → scripting:// 的 Surge 反劫持模块生成。
              </Text>
              <Button
                title="打开原项目"
                systemImage="safari"
                buttonStyle="glass"
                action={() => {
                  void Safari.openURL(SURGE_MODULE_STORE_URL)
                }}
              />
            </GlassCard>

            <Button title="返回首页" systemImage="chevron.left" buttonStyle="glass" action={() => go({ name: "home" })} />
          </VStack>
          </ScrollView>
      </ZStack>
    </NavigationStack>
  )
}

/** 复制路径的小工具（避免在每个按钮里写重复逻辑） */
async function copyPath(path: string): Promise<void> {
  await Pasteboard.setString(path)
}
