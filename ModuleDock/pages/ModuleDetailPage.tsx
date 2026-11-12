import { Button, HStack, Image, Rectangle, ScrollView, Spacer, Text, VStack, ZStack, useEffect, useMemo, useState } from "scripting"
import { GlassCard } from "../components/GlassCard"
import { GlassText } from "../components/GlassText"
import { StatusBadge } from "../components/StatusBadge"
import { TargetBadge } from "../components/TargetBadge"
import { childToolbar } from "../components/TopToolbar"
import { TARGETS } from "../constants/targets"
import { useLibrary } from "../contexts/LibraryContext"
import { useIconPaths } from "../contexts/IconContext"
import { fullFillFrame, leadingFillFrame, motion, pageGradient, palette, spacing, targetTint } from "../design/AllPatternDesign"
import { readLocalModuleEntry, shareFile } from "../services/moduleService"
import type { ModuleEntry, Navigate } from "../types"
import { formatBytes, hostOf, relativeTime } from "../utils/moduleContent"

/** 各 App 本地文件的导入提示 */
const IMPORT_HINT: Record<string, string> = {
  surge: "Surge：远程模块用 surge:///install-module 导入；本地文件可分享给 Surge。",
  loon: "Loon：远程插件用 loon://import?plugin=；本地插件用页面上的「导入 Loon(本地插件)」，或分享本地文件后在插件页导入。",
  stash: "Stash：远程覆写用 stash://install-override；本地覆写用页面上的「导入 Stash(本地覆写)」，或分享本地文件安装。",
  shadowrocket: "Shadowrocket：远程模块用 shadowrocket://install?module=；本地模块用页面上的「导入 Shadowrocket(本地模块)」，或在「配置 > 模块」新建并粘贴内容。",
}

/** 模块详情 */
export function ModuleDetailPage({ go, path }: { go: Navigate; path: string }) {
  const { modules, busy, refresh, updateOne, importOne, remove, showNotice } = useLibrary()
  const iconPath = useIconPaths()
  // 列表里找不到时，延迟一拍再读盘，避免阻塞页面推入动画
  const listEntry = useMemo(() => modules.find(item => item.path === path) ?? null, [modules, path])
  const [fallback, setFallback] = useState<ModuleEntry | null>(null)

  useEffect(() => {
    if (listEntry) {
      setFallback(null)
      return
    }
    const timer = setTimeout(() => {
      setFallback(readLocalModuleEntry(path))
    }, 0)
    return () => clearTimeout(timer)
  }, [listEntry, path])

  const entry = listEntry ?? fallback

  if (!entry) {
    return (
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="模块详情"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          toolbar={childToolbar(() => void refresh())}
          frame={fullFillFrame}
        >
          <VStack alignment="leading" spacing={spacing.md} padding={spacing.xl} frame={leadingFillFrame}>
            <Image systemName="questionmark.folder" font="title" foregroundStyle={palette.secondaryLabel} />
            <Text font="headline">模块不存在</Text>
            <Text font="caption" foregroundStyle={palette.secondaryLabel}>文件可能已被删除，返回首页刷新列表。</Text>
          </VStack>
        </ScrollView>
      </ZStack>
    )
  }

  const info = TARGETS[entry.target]

  return (
    <ZStack>
      <Rectangle fill={pageGradient} ignoresSafeArea />
      <ScrollView
        navigationTitle="模块详情"
        navigationBarTitleDisplayMode="inline"
        toolbarBackgroundVisibility="hidden"
        toolbar={childToolbar(() => void refresh(), busy)}
        frame={fullFillFrame}
      >
        <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg} frame={leadingFillFrame}>
          <GlassCard sensoryFeedback={{ trigger: entry.modifiedAt, feedback: "success" }}>
            <HStack spacing={spacing.md} alignment="top" frame={leadingFillFrame}>
              {iconPath[entry.target] ? (
                <Image
                  filePath={iconPath[entry.target] as string}
                  resizable={true}
                  frame={{ width: 30, height: 30 }}
                />
              ) : (
                <Image
                  systemName="square.stack.3d.up.fill"
                  font="title"
                  foregroundStyle={targetTint[entry.target]}
                  frame={{ width: 30, height: 30 }}
                />
              )}
              <VStack alignment="leading" spacing={4} frame={leadingFillFrame}>
                <Text font="title3" fontWeight="semibold" contentTransition="opacity">{entry.name}</Text>
                <Text
                  font="caption"
                  foregroundStyle={palette.secondaryLabel}
                  lineLimit={4}
                  contentTransition="opacity"
                  animation={{ animation: motion.quick, value: entry.desc }}
                >
                  {entry.desc || `（${info.app} ${info.kind}没有描述）`}
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <TargetBadge target={entry.target} />
              {entry.status === "updating" ? (
                <StatusBadge text="更新中…" color={palette.accent} />
              ) : entry.status === "failed" ? (
                <StatusBadge text="上次失败" color={palette.danger} />
              ) : entry.hasSubscription ? (
                <StatusBadge text="可更新" color={palette.success} />
              ) : (
                <StatusBadge text="无订阅链接" color={palette.warning} />
              )}
              <StatusBadge text={relativeTime(entry.modifiedAt)} color={palette.secondaryLabel} />
            </HStack>

            <HStack spacing={spacing.sm} frame={leadingFillFrame}>
              <Button
                buttonStyle="glassProminent"
                disabled={busy || !entry.hasSubscription}
                action={() => void updateOne(entry)}
              >
                <HStack spacing={6} animation={{ animation: motion.quick, value: entry.status }}>
                  <Image systemName="arrow.triangle.2.circlepath" symbolEffect="scale" />
                  <Text contentTransition="opacity">{entry.status === "updating" ? "更新中…" : "更新"}</Text>
                </HStack>
              </Button>
              <Button
                title={`远程导入 ${info.app}`}
                systemImage="arrow.down.to.line"
                buttonStyle="glass"
                disabled={busy || !entry.hasSubscription}
                action={() => void importOne(entry)}
              />
            </HStack>

            <Button
              title={`分享本地${info.kind}`}
              systemImage="square.and.arrow.up"
              buttonStyle="glass"
              action={() => {
                void shareFile(entry.path).catch(error => showNotice(`分享失败：${error}`))
              }}
            />

            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              {IMPORT_HINT[entry.target]}
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">订阅信息</Text>
            <GlassText>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>来源</Text>
              <Text font="caption" monospaced lineLimit={4}>{entry.subscribedUrl ?? "无 #SUBSCRIBED"}</Text>
            </GlassText>
            {entry.subscribedUrl ? (
              <Button
                title="复制链接"
                systemImage="doc.on.doc"
                buttonStyle="glass"
                action={() => {
                  void Pasteboard.setString(entry.subscribedUrl as string).then(() => showNotice("已复制订阅链接"))
                }}
              />
            ) : null}
            <GlassText>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>文件</Text>
              <Text font="caption" monospaced lineLimit={2}>{entry.fileName} · {formatBytes(entry.size)}</Text>
              <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={2}>{hostOf(entry.subscribedUrl) || entry.path}</Text>
            </GlassText>
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              {info.app} 的{info.kind}格式，后缀 {info.extension}，target={info.scriptHubTarget}
            </Text>
          </GlassCard>

          <GlassCard>
            <Text font="headline">危险操作</Text>
            <Button
              title="删除本地模块文件"
              systemImage="trash"
              role="destructive"
              buttonStyle="glass"
              action={() => {
                void (async () => {
                  const confirmed = await Dialog.confirm({
                    title: "删除模块",
                    message: `确定删除 ${entry.fileName}？该文件会从模块目录移除。`,
                    confirmLabel: "删除",
                    cancelLabel: "取消",
                  })
                  if (!confirmed) return
                  try {
                    await remove(entry)
                    go({ name: "home" })
                  } catch (error) {
                    showNotice(`删除失败：${error instanceof Error ? error.message : String(error)}`)
                  }
                })()
              }}
            />
          </GlassCard>
        </VStack>
      </ScrollView>
    </ZStack>
  )
}
