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
  useEffect,
  useState,
} from "scripting"
import { GlassCard } from "../components/GlassCard"
import { useLibrary } from "../contexts/LibraryContext"
import { cardTransition, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import type { ModuleEntry, Navigate } from "../types"
import { formatBytes } from "../utils/moduleContent"

/** 从链接创建本地模块（等价于原版的「从链接创建」） */
export function AddModulePage({
  go,
  initialUrl,
  initialName,
}: {
  go: Navigate
  initialUrl?: string
  initialName?: string
}) {
  const { addFromURL, folderPath, chooseFolder, refresh, busy } = useLibrary()
  const [url, setUrl] = useState<string>(initialUrl ?? "")
  const [name, setName] = useState<string>(initialName ?? "")
  const [running, setRunning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ModuleEntry | null>(null)

  async function submit() {
    if (!url.trim()) {
      setError("请填写模块链接")
      return
    }
    setRunning(true)
    setError(null)
    try {
      const entry = await addFromURL(url, name)
      void withAnimation(motion.page, () => setResult(entry))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      void withAnimation(motion.quick, () => setError(message))
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    if (initialUrl) {
      void submit()
    }
    // 仅在进入页面时自动执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NavigationStack>
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="从链接安装"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          toolbar={{
            topBarLeading: <Button title="返回" action={() => go({ name: "home" })} />,
            topBarTrailing: (
              <Button action={() => void refresh()} buttonStyle="plain">
                <Image systemName="arrow.clockwise" />
              </Button>
            ),
          }}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg} frame={{ maxWidth: "infinity" }}>
            <GlassCard>
              <HStack spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                <Image systemName="link.badge.plus" font="title2" foregroundStyle={palette.accent} />
                <Text font="title3" fontWeight="semibold">
                  从链接创建模块
                </Text>
              </HStack>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                会下载远端内容并写入模块目录，同时记录 #SUBSCRIBED，之后可一键更新。
              </Text>

              <VStack alignment="leading" spacing={spacing.xs}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  模块链接
                </Text>
                <TextField
                  title="模块链接"
                  prompt="https://example.com/foo.sgmodule"
                  value={url}
                  onChanged={setUrl}
                  disabled={running}
                />
              </VStack>

              <VStack alignment="leading" spacing={spacing.xs}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  文件名称（选填，默认取模块名）
                </Text>
                <TextField
                  title="名称"
                  prompt="MyModule"
                  value={name}
                  onChanged={setName}
                  disabled={running}
                />
              </VStack>

              <HStack spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                <Button
                  buttonStyle="glassProminent"
                  frame={{ maxWidth: "infinity" }}
                  disabled={running || busy}
                  action={() => void submit()}
                >
                  <HStack spacing={6} animation={{ animation: motion.quick, value: running }}>
                    <Image systemName="arrow.down.circle" symbolEffect={{ effect: "bounce", value: running }} />
                    <Text contentTransition="opacity">{running ? "下载中…" : "下载并保存"}</Text>
                  </HStack>
                </Button>
                <Button
                  title="选择目录"
                  systemImage="folder"
                  buttonStyle="glass"
                  disabled={running}
                  action={() => void chooseFolder()}
                />
              </HStack>

              <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1} truncationMode="middle">
                保存到：{folderPath || "未就绪"}
              </Text>

              {error ? (
                <VStack
                  alignment="leading"
                  spacing={spacing.xs}
                  padding={spacing.md}
                  background={palette.dangerSoft}
                  transition={Transition.opacity().combined(Transition.move("top"))}
                  animation={{ animation: motion.quick, value: error }}
                >
                  <Text font="caption" foregroundStyle={palette.danger} contentTransition="opacity">
                    {error}
                  </Text>
                </VStack>
              ) : null}
            </GlassCard>

            {result ? (
              <GlassCard
                tinted
                transition={cardTransition}
                sensoryFeedback={{ trigger: result.path, feedback: "success" }}
              >
                <HStack spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                  <Image
                    systemName="checkmark.circle.fill"
                    font="title2"
                    foregroundStyle={palette.success}
                    symbolEffect={{ effect: "bounce", value: result.path }}
                  />
                  <VStack alignment="leading" spacing={2}>
                    <Text font="headline" contentTransition="opacity">
                      {result.name}
                    </Text>
                    <Text font="caption" foregroundStyle={palette.secondaryLabel} contentTransition="opacity">
                      {result.fileName} · {formatBytes(result.size)}
                    </Text>
                  </VStack>
                  <Spacer />
                </HStack>
                <HStack spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                  <Button
                    title="查看详情"
                    buttonStyle="glass"
                    action={() => go({ name: "detail", path: result.path })}
                  />
                  <Button
                    title="再装一个"
                    buttonStyle="glass"
                    action={() => {
                      void withAnimation(motion.page, () => {
                        setResult(null)
                        setUrl("")
                        setName("")
                      })
                    }}
                  />
                </HStack>
              </GlassCard>
            ) : null}

            <GlassCard>
              <Text font="headline">URL Scheme 调用</Text>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                原版使用 scriptable:///run/SurgeModuleTool?url=&name=。在 Scripting 中改用下面的链接即可：
              </Text>
              <Text font="caption" monospaced lineLimit={3} textSelection>
                scripting://run/SurgeModuleTool?url=&name=
              </Text>
              <Button
                title="复制调用链接"
                systemImage="doc.on.doc"
                buttonStyle="glass"
                action={() => {
                  void Pasteboard.setString("scripting://run/SurgeModuleTool?url=&name=")
                }}
              />
              <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
                配合「反劫持工具」生成的 Surge 模块或内置 browser.tsx，网页里的 scriptable:// 会被自动改写。
              </Text>
            </GlassCard>
          </VStack>
        </ScrollView>
      </ZStack>
    </NavigationStack>
  )
}
