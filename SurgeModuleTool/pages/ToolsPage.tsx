import {
  Button,
  HStack,
  Image,
  NavigationStack,
  Rectangle,
  ScrollView,
  Spacer,
  Text,
  TextField,
  VStack,
  ZStack,
  useState,
} from "scripting"
import { GlassCard } from "../components/GlassCard"
import { useLibrary } from "../contexts/LibraryContext"
import { cardTransition, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import type { Navigate, SchemeArtifacts } from "../types"
import { buildSurgeModule, convertSchemeUrl, isScriptingRunUrl, writeSchemeArtifacts } from "../services/schemeService"
import { REMOTE_MODULE_URL, SURGE_INSTALL_MODULE_PREFIX } from "../constants"
import { resolveModuleFolder } from "../services/settingsStore"
import { shareFile } from "../services/moduleService"

/** 工具页：生成 Surge 反劫持模块、Safari 用户脚本，并测试 scheme 转换 */
export function ToolsPage({ go }: { go: Navigate }) {
  const { folderPath, settings, showNotice, reload } = useLibrary()
  const [hostname, setHostname] = useState<string>("*")
  const [artifacts, setArtifacts] = useState<SchemeArtifacts | null>(null)
  const [running, setRunning] = useState<boolean>(false)
  const [testUrl, setTestUrl] = useState<string>(
    "scriptable:///run/SurgeModuleTool?url=https%3A%2F%2Fexample.com%2Fa.sgmodule"
  )

  const converted = convertSchemeUrl(testUrl.trim())

  async function generate() {
    setRunning(true)
    try {
      const target = folderPath || (await resolveModuleFolder(settings))
      const result = await writeSchemeArtifacts(target, hostname.trim() || "*")
      void withAnimation(motion.page, () => setArtifacts(result))
      showNotice("已生成 Surge 反劫持模块与 Safari 用户脚本")
    } catch (error) {
      showNotice(`生成失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <NavigationStack>
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="Scheme 反劫持"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg}>
            <GlassCard>
              <HStack spacing={spacing.sm}>
                <Image systemName="wand.and.stars" font="title2" foregroundStyle={palette.accent} />
                <Text font="title3" fontWeight="semibold">
                  scriptable → scripting
                </Text>
              </HStack>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                iOS 不允许别的 App 抢占 scriptable:// 这个 Scheme，所以只能在链接被打开前改写它。
                这里提供两条路径：Surge 模块（拦 HTTP 响应）；Safari 侧已内置 browser.tsx（拦网页点击）。
              </Text>

              <VStack alignment="leading" spacing={spacing.xs}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  MITM 域名（* 表示全部，建议改成目标站点）
                </Text>
                <TextField
                  title="MITM 域名"
                  prompt="* 或 script.example.com"
                  value={hostname}
                  onChanged={setHostname}
                />
              </VStack>

              <HStack spacing={spacing.sm}>
                <Button
                  buttonStyle="glassProminent"
                  frame={{ maxWidth: "infinity" }}
                  disabled={running}
                  action={() => void generate()}
                >
                  <HStack spacing={6} animation={{ animation: motion.quick, value: running }}>
                    <Image
                      systemName="square.and.arrow.down"
                      symbolEffect={{ effect: "bounce", value: running }}
                    />
                    <Text contentTransition="opacity">{running ? "生成中…" : "生成 Surge 模块"}</Text>
                  </HStack>
                </Button>
                <Button
                  title="重载 Surge"
                  systemImage="bolt.fill"
                  buttonStyle="glass"
                  action={() => void reload()}
                />
              </HStack>
              <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1} truncationMode="middle">
                输出目录：{folderPath || "未就绪"}
              </Text>
            </GlassCard>

            {artifacts ? (
              <GlassCard
                tinted
                transition={cardTransition}
                sensoryFeedback={{ trigger: artifacts.modulePath, feedback: "success" }}
              >
                <Text font="headline" contentTransition="opacity">
                  已生成
                </Text>
                <VStack alignment="leading" spacing={2}>
                  <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                    Surge 模块
                  </Text>
                  <Text font="caption2" monospaced lineLimit={2}>
                    {artifacts.modulePath}
                  </Text>
                </VStack>
                <HStack spacing={spacing.sm}>
                  <Button
                    title="分享模块"
                    systemImage="square.and.arrow.up"
                    buttonStyle="glass"
                    action={() => {
                      void shareFile(artifacts.modulePath).catch(error => showNotice(`分享失败：${error}`))
                    }}
                  />
                  <Button
                    title="复制模块内容"
                    systemImage="doc.on.doc"
                    buttonStyle="glass"
                    action={() => {
                      void Pasteboard.setString(artifacts.moduleContent).then(() =>
                        showNotice("已复制 .sgmodule 内容")
                      )
                    }}
                  />
                </HStack>
              </GlassCard>
            ) : null}

            <GlassCard>
              <Text font="headline">从 GitHub 直接安装</Text>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                模块已发布到仓库，不用先下载文件，交给 Surge 的 URL 安装即可。
              </Text>
              <Text font="caption2" monospaced lineLimit={2} truncationMode="middle" textSelection>
                {REMOTE_MODULE_URL}
              </Text>
              <HStack spacing={spacing.sm}>
                <Button
                  title="安装到 Surge"
                  systemImage="arrow.down.to.line"
                  buttonStyle="glassProminent"
                  action={() => {
                    void Safari.openURL(`${SURGE_INSTALL_MODULE_PREFIX}${encodeURIComponent(REMOTE_MODULE_URL)}`)
                  }}
                />
                <Button
                  title="复制链接"
                  systemImage="doc.on.doc"
                  buttonStyle="glass"
                  action={() => {
                    void Pasteboard.setString(REMOTE_MODULE_URL).then(() => showNotice("已复制模块链接"))
                  }}
                />
              </HStack>
            </GlassCard>

            <GlassCard>
              <Text font="headline">Surge 侧怎么装</Text>
              <StepRow index={1} text="把 .sgmodule 分享到 Surge，或用 Surge 的「模块 → 安装」选择该文件。" />
              <StepRow index={2} text="在 Surge 里开启模块，按需把 hostname 参数改成目标站点（默认 * 表示全部域名）。" />
              <StepRow index={3} text="打开 MITM 主开关，并安装/信任 Surge 的 CA 证书（HTTPS 改写必需）。" />
              <StepRow index={4} text="模块规则：Body Rewrite 把响应体里的 scriptable:// 改成 scripting://；Header Rewrite 处理 302 的 Location。" />
              <StepRow index={5} text="若网页仍是旧内容：关闭代理、杀掉 Surge 后台再重开，然后刷新页面。" />
            </GlassCard>

            <GlassCard>
              <Text font="headline">内置浏览器脚本</Text>
              <StepRow index={1} text="本项目已内置 browser.tsx，无需再导入 .user.js。" />
              <StepRow index={2} text="在 Scripting 的 Safari 扩展里启用本脚本，网页里的 scriptable:// 链接会自动改写。" />
              <StepRow index={3} text="不依赖 VPN 与 MITM；捕获阶段拦截点击，右键复制也能拿到 scripting://。" />
            </GlassCard>

            <GlassCard>
              <Text font="headline">规则预览</Text>
              <Text font="caption" monospaced lineLimit={14} textSelection>
                {buildSurgeModule(hostname.trim() || "*")}
              </Text>
            </GlassCard>

            <GlassCard>
              <Text font="headline">转换测试</Text>
              <TextField title="原始链接" value={testUrl} onChanged={setTestUrl} />
              <HStack spacing={spacing.sm}>
                <Image
                  systemName={isScriptingRunUrl(converted) ? "checkmark.circle.fill" : "exclamationmark.circle"}
                  foregroundStyle={isScriptingRunUrl(converted) ? palette.success : palette.warning}
                />
                <Text font="caption" monospaced lineLimit={3} textSelection>
                  {converted}
                </Text>
              </HStack>
              <Button
                title="复制结果"
                systemImage="doc.on.doc"
                buttonStyle="glass"
                action={() => {
                  void Pasteboard.setString(converted).then(() => showNotice("已复制转换结果"))
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

/** 编号步骤 */
function StepRow({ index, text }: { index: number; text: string }): ReturnType<typeof HStack> {
  return (
    <HStack spacing={spacing.sm} alignment="top">
      <Text
        font="caption2"
        fontWeight="bold"
        foregroundStyle={palette.accent}
        padding={{ horizontal: 6, vertical: 2 }}
        background={{ style: "thinMaterial", shape: "capsule" }}
      >
        {index}
      </Text>
      <Text font="caption" foregroundStyle={palette.secondaryLabel}>
        {text}
      </Text>
      <Spacer />
    </HStack>
  )
}
