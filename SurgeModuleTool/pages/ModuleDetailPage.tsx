import {
  Button,
  HStack,
  Image,
  NavigationStack,
  Rectangle,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useMemo,
} from "scripting"
import { GlassCard } from "../components/GlassCard"
import { StatusBadge } from "../components/StatusBadge"
import { useLibrary } from "../contexts/LibraryContext"
import { motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import { shareFile } from "../services/moduleService"
import type { Navigate } from "../types"
import { formatBytes, hostOf, relativeTime } from "../utils/moduleContent"

/** 模块详情：更新、分享、复制链接与删除 */
export function ModuleDetailPage({ go, path }: { go: Navigate; path: string }) {
  const { modules, busy, updateOne, remove, showNotice } = useLibrary()
  const entry = useMemo(() => modules.find(item => item.path === path), [modules, path])

  if (!entry) {
    return (
      <NavigationStack>
        <ZStack>
          <Rectangle fill={pageGradient} ignoresSafeArea />
          <ScrollView
            navigationTitle="模块详情"
            navigationBarTitleDisplayMode="inline"
            toolbarBackgroundVisibility="hidden"
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          >
            <VStack spacing={spacing.md} padding={spacing.xl}>
              <Image systemName="questionmark.folder" font="title" foregroundStyle={palette.secondaryLabel} />
              <Text font="headline">模块不存在</Text>
              <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                它可能已被删除，返回首页刷新列表即可。
              </Text>
              <Button title="返回" buttonStyle="glass" action={() => go({ name: "home" })} />
            </VStack>
          </ScrollView>
        </ZStack>
      </NavigationStack>
    )
  }

  return (
    <NavigationStack>
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="模块详情"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg}>
            <GlassCard sensoryFeedback={{ trigger: entry.modifiedAt, feedback: "success" }}>
              <HStack spacing={spacing.md} alignment="top">
                <Image
                  systemName={entry.hasSubscription ? "square.stack.3d.up.fill" : "doc.text"}
                  font="title"
                  foregroundStyle={entry.hasSubscription ? palette.accent : palette.secondaryLabel}
                  symbolEffect={{ effect: "bounce", value: entry.hasSubscription }}
                />
                <VStack alignment="leading" spacing={4}>
                  <Text font="title3" fontWeight="semibold" contentTransition="opacity">
                    {entry.name}
                  </Text>
                  <Text
                    font="caption"
                    foregroundStyle={palette.secondaryLabel}
                    lineLimit={4}
                    contentTransition="opacity"
                    animation={{ animation: motion.quick, value: entry.desc }}
                  >
                    {entry.desc || "（模块没有描述）"}
                  </Text>
                </VStack>
                <Spacer />
              </HStack>

              <HStack spacing={spacing.sm}>
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

              <HStack spacing={spacing.sm}>
                <Button
                  buttonStyle="glassProminent"
                  disabled={busy || !entry.hasSubscription}
                  action={() => void updateOne(entry)}
                >
                  <HStack spacing={6} animation={{ animation: motion.quick, value: entry.status }}>
                    <Image
                      systemName="arrow.triangle.2.circlepath"
                      symbolEffect="scale"
                    />
                    <Text contentTransition="opacity">{entry.status === "updating" ? "更新中…" : "更新"}</Text>
                  </HStack>
                </Button>
                <Button
                  title="分享 / 导入 Surge"
                  systemImage="square.and.arrow.up"
                  buttonStyle="glass"
                  action={() => {
                    void shareFile(entry.path).catch(error => showNotice(`分享失败：${error}`))
                  }}
                />
              </HStack>
            </GlassCard>

            <GlassCard>
              <Text font="headline">订阅信息</Text>
              <VStack alignment="leading" spacing={4}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  来源
                </Text>
                <Text font="caption" monospaced lineLimit={4}>
                  {entry.subscribedUrl ?? "无 #SUBSCRIBED"}
                </Text>
                {entry.subscribedUrl ? (
                  <Button
                    title="复制链接"
                    systemImage="doc.on.doc"
                    buttonStyle="glass"
                    action={() => {
                      void Pasteboard.setString(entry.subscribedUrl as string).then(() =>
                        showNotice("已复制订阅链接")
                      )
                    }}
                  />
                ) : null}
              </VStack>

              <VStack alignment="leading" spacing={4}>
                <Text font="caption" foregroundStyle={palette.secondaryLabel}>
                  文件
                </Text>
                <Text font="caption" monospaced lineLimit={2}>
                  {entry.fileName} · {formatBytes(entry.size)}
                </Text>
                <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={2}>
                  {hostOf(entry.subscribedUrl) || entry.path}
                </Text>
              </VStack>
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
                    if (!confirmed) {
                      return
                    }
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

            <Button title="返回模块列表" systemImage="chevron.left" buttonStyle="glass" action={() => go({ name: "home" })} />
          </VStack>
        </ScrollView>
      </ZStack>
    </NavigationStack>
  )
}
