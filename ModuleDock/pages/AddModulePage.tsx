import { Button, HStack, Image, Picker, Rectangle, ScrollView, Spacer, Text, TextField, VStack, ZStack, useEffect, useMemo, useState } from "scripting"
import { GlassCard } from "../components/GlassCard"
import { GlassText } from "../components/GlassText"
import { TargetBadge } from "../components/TargetBadge"
import { childToolbar } from "../components/TopToolbar"
import { TARGET_LIST, TARGETS } from "../constants/targets"
import { useLibrary } from "../contexts/LibraryContext"
import { useIconPaths } from "../contexts/IconContext"
import { fullFillFrame, leadingFillFrame, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import type { ModuleEntry, Navigate, TargetId } from "../types"
import { formatBytes } from "../utils/moduleContent"
import { parseModuleInput } from "../utils/targets"

/** 从链接创建本地模块 */
export function AddModulePage({
  go,
  initialUrl,
  initialName,
  initialTarget,
}: {
  go: Navigate
  initialUrl?: string
  initialName?: string
  initialTarget?: TargetId
}) {
  const { addFromURL, folderPath, chooseFolder, refresh, busy } = useLibrary()
  const iconPaths = useIconPaths()
  const [url, setUrl] = useState<string>(initialUrl ?? "")
  const [name, setName] = useState<string>(initialName ?? "")
  const [target, setTarget] = useState<TargetId | "auto">(initialTarget ?? "auto")
  const [running, setRunning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ModuleEntry | null>(null)

  const parsed = useMemo(() => parseModuleInput(url), [url])
  const detected = target === "auto" ? parsed.target : target
  const detectedInfo = detected ? TARGETS[detected] : null

  async function submit() {
    if (!url.trim()) {
      setError("请填写模块链接")
      return
    }
    setRunning(true)
    setError(null)
    try {
      const entry = await addFromURL(url, name, target === "auto" ? null : target)
      setResult(entry)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    if (initialUrl) {
      void submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ZStack>
      <Rectangle fill={pageGradient} ignoresSafeArea />
      <ScrollView
        navigationTitle="从链接安装"
        navigationBarTitleDisplayMode="inline"
        toolbarBackgroundVisibility="hidden"
        toolbar={childToolbar(() => void refresh(), running)}
        frame={fullFillFrame}
      >
        <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg} frame={leadingFillFrame}>
          <GlassCard>
            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Image systemName="link.badge.plus" font="title2" foregroundStyle={palette.accent} />
              <Text font="title3" fontWeight="semibold">从链接创建模块</Text>
            </HStack>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>
              会下载远端内容并按目标 App 写入对应后缀，同时记录 #SUBSCRIBED，之后可一键更新。
            </Text>

            <Text font="caption" foregroundStyle={palette.secondaryLabel}>模块链接</Text>
            <TextField
              title="模块链接"
              prompt="https://example.com/foo.sgmodule"
              value={url}
              onChanged={setUrl}
              disabled={running}
            />
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              也可直接粘贴 Surge / Loon / Stash / Shadowrocket 的导入链接，会自动取出真正的资源地址。
            </Text>

            <Text font="caption" foregroundStyle={palette.secondaryLabel}>目标 App</Text>
            <Picker
              title="目标 App"
              systemImage="app.badge"
              pickerStyle="menu"
              value={target}
              onChanged={(value: string | number) => setTarget(value as TargetId | "auto")}
            >
              <Text tag="auto">自动识别</Text>
              {TARGET_LIST.map(item => (
                <Text key={item.id} tag={item.id}>{`${item.app} ${item.kind}`}</Text>
              ))}
            </Picker>

            {detectedInfo ? (
              <GlassText>
                <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                  <TargetBadge target={detectedInfo.id} />
                  <Text font="caption2" monospaced foregroundStyle={palette.tertiaryLabel}>
                    {detectedInfo.extension}
                  </Text>
                  <Spacer />
                </HStack>
                <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
                  {target === "auto" ? "已根据链接自动识别" : "已手动指定"}，文件会保存为 {detectedInfo.app} 的{detectedInfo.kind}。
                </Text>
              </GlassText>
            ) : (
              <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
                链接里没有 target 参数时按 Surge 模块保存，可手动指定目标 App。
              </Text>
            )}

            <Text font="caption" foregroundStyle={palette.secondaryLabel}>文件名称（选填，默认取模块名）</Text>
            <TextField
              title="名称"
              prompt="MyModule"
              value={name}
              onChanged={setName}
              disabled={running}
            />

            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Button
                buttonStyle="glassProminent"
                frame={leadingFillFrame}
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
              <GlassText>
                <Text font="caption" foregroundStyle={palette.danger} contentTransition="opacity">{error}</Text>
              </GlassText>
            ) : null}
          </GlassCard>

          {result ? (
            <GlassCard tinted sensoryFeedback={{ trigger: result.path, feedback: "success" }} animationValue={result ? 1 : 0}>
              <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                <Image
                  systemName="checkmark.circle.fill"
                  font="title2"
                  foregroundStyle={palette.success}
                  symbolEffect={{ effect: "bounce", value: result.path }}
                />
                <VStack alignment="leading" spacing={2}>
                  <Text font="headline" contentTransition="opacity">{result.name}</Text>
                  <Text font="caption" foregroundStyle={palette.secondaryLabel} contentTransition="opacity">
                    {result.fileName} · {formatBytes(result.size)}
                  </Text>
                </VStack>
                <Spacer />
                <TargetBadge target={result.target} showKind={false} />
              </HStack>
              <HStack spacing={spacing.sm} frame={leadingFillFrame}>
                <Button title="查看详情" buttonStyle="glass" action={() => go({ name: "detail", path: result.path })} />
                <Button
                  title="再装一个"
                  buttonStyle="glass"
                  action={() => {
                    setResult(null)
                    setUrl("")
                    setName("")
                  }}
                />
              </HStack>
            </GlassCard>
          ) : null}

          <GlassCard>
            <Text font="headline">支持的目标</Text>
            {TARGET_LIST.map(item => (
              <HStack key={item.id} spacing={spacing.sm} frame={leadingFillFrame}>
                {iconPaths[item.id] ? (
                  <Image filePath={iconPaths[item.id] as string} resizable={true} frame={{ width: 18, height: 18 }} />
                ) : (
                  <Image systemName="app.fill" font="caption" foregroundStyle={palette.secondaryLabel} frame={{ width: 18, height: 18 }} />
                )}
                <Text font="caption" foregroundStyle={palette.secondaryLabel} frame={leadingFillFrame}>
                  {item.app} {item.kind}
                </Text>
                <Text font="caption2" monospaced foregroundStyle={palette.tertiaryLabel}>{item.extension}</Text>
              </HStack>
            ))}
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              target 参数取值：{TARGET_LIST.map(item => item.scriptHubTarget).join(" / ")}
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">URL Scheme 调用</Text>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>
              Script-Hub 的本地模块按钮会带上 target，直接打开本脚本：
            </Text>
            <GlassText>
              <Text font="caption" monospaced lineLimit={3} textSelection>
                scripting://run/ModuleDock?url=&name=&target=
              </Text>
            </GlassText>
            <Button
              title="复制调用链接"
              systemImage="doc.on.doc"
              buttonStyle="glass"
              action={() => {
                void Pasteboard.setString("scripting://run/ModuleDock?url=&name=&target=")
              }}
            />
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              配合内置 browser.tsx 与四个 App 的本地模块，网页里的导入链接会被自动改写。
            </Text>
          </GlassCard>
        </VStack>
      </ScrollView>
    </ZStack>
  )
}
