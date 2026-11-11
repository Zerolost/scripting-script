import { Button, Divider, HStack, Image, LazyVStack, Navigation, Rectangle, ScrollView, Spacer, Text, VStack, ZStack, useMemo } from "scripting"
import { GlassCard } from "../components/GlassCard"
import { GlassText } from "../components/GlassText"
import { ModuleRow } from "../components/ModuleRow"
import { SectionTitle } from "../components/SectionTitle"
import { StatTile } from "../components/StatTile"
import { TargetBadge } from "../components/TargetBadge"
import { rootToolbar } from "../components/TopToolbar"
import { TARGET_LIST } from "../constants/targets"
import { useLibrary } from "../contexts/LibraryContext"
import { fullFillFrame, leadingFillFrame, motion, pageGradient, palette, spacing } from "../design/AllPatternDesign"
import type { Navigate, TargetId } from "../types"

function ToolRow({ icon, title, subtitle, onTap }: { icon: string; title: string; subtitle: string; onTap: () => void }) {
  return (
    <Button buttonStyle="plain" action={onTap}>
      <HStack alignment="top" spacing={spacing.md} padding={{ vertical: 11 }} frame={leadingFillFrame}>
        <Image systemName={icon} font="body" foregroundStyle={palette.accent} frame={{ width: 24 }} />
        <VStack alignment="leading" spacing={2} frame={leadingFillFrame}>
          <Text font="subheadline">{title}</Text>
          <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1}>{subtitle}</Text>
        </VStack>
        <Image systemName="chevron.right" font="caption" foregroundStyle={palette.tertiaryLabel} />
      </HStack>
    </Button>
  )
}

/** 首页 */
export function HomePage({ go }: { go: Navigate }) {
  const { modules, loading, busy, folderPath, settings, refresh, updateAll, reload, showNotice } = useLibrary()
  const dismiss = Navigation.useDismiss()

  const visibleModules = useMemo(
    () => (settings.showModulesWithoutUrl ? modules : modules.filter(item => item.hasSubscription)),
    [modules, settings.showModulesWithoutUrl]
  )
  const stats = useMemo(() => ({
    total: modules.length,
    withUrl: modules.filter(item => item.hasSubscription).length,
    failed: modules.filter(item => item.status === "failed").length,
  }), [modules])
  const targetCounts = useMemo(() => {
    const counts: Record<TargetId, number> = { surge: 0, loon: 0, stash: 0, shadowrocket: 0 }
    for (const item of modules) {
      counts[item.target] += 1
    }
    return counts
  }, [modules])

  return (
    <ZStack>
      <Rectangle fill={pageGradient} ignoresSafeArea />
      <ScrollView
        navigationTitle="模块工具"
        navigationBarTitleDisplayMode="inline"
        toolbarBackgroundVisibility="hidden"
        toolbar={rootToolbar(dismiss, () => void refresh(), busy)}
        frame={fullFillFrame}
      >
        <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg} frame={leadingFillFrame}>
          <GlassCard>
            <HStack alignment="top" spacing={spacing.sm} frame={leadingFillFrame}>
              <StatTile label="模块" value={stats.total} tint={palette.secondaryLabel} />
              <Divider frame={{ height: 28 }} />
              <StatTile label="可更新" value={stats.withUrl} tint={palette.accent} />
              <Divider frame={{ height: 28 }} />
              <StatTile label="失败" value={stats.failed} tint={stats.failed > 0 ? palette.danger : palette.secondaryLabel} />
            </HStack>

            <HStack alignment="top" spacing={spacing.sm} frame={leadingFillFrame}>
              <Button
                buttonStyle="glassProminent"
                disabled={busy || loading}
                action={() => {
                  if (stats.withUrl === 0) {
                    showNotice("当前目录没有带 #SUBSCRIBED 的模块")
                    return
                  }
                  void updateAll()
                }}
              >
                <HStack spacing={6} animation={{ animation: motion.quick, value: busy }}>
                  <Image systemName="arrow.triangle.2.circlepath" symbolEffect={{ effect: "rotate", value: busy }} />
                  <Text contentTransition="opacity">{busy ? "更新中…" : "更新全部"}</Text>
                </HStack>
              </Button>
              <Spacer />
            </HStack>

            <Button
              buttonStyle="plain"
              action={() => {
                if (!folderPath) return
                void Pasteboard.setString(folderPath).then(() => showNotice("已复制模块目录"))
              }}
            >
              <GlassText>
                <HStack spacing={6} frame={leadingFillFrame}>
                  <Image systemName="folder" font="caption" foregroundStyle={palette.tertiaryLabel} />
                  <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1} truncationMode="middle">
                    {folderPath || "正在准备模块目录…"}
                  </Text>
                  <Spacer />
                  <Image systemName="doc.on.doc" font="caption2" foregroundStyle={palette.tertiaryLabel} />
                </HStack>
              </GlassText>
            </Button>
          </GlassCard>

          <SectionTitle title="目标 App" caption="覆写 · 模块 · 插件" />
          <GlassCard>
            {TARGET_LIST.map(item => (
              <HStack key={item.id} spacing={spacing.sm} frame={leadingFillFrame}>
                <TargetBadge target={item.id} />
                <Text font="caption2" monospaced foregroundStyle={palette.tertiaryLabel}>{item.extension}</Text>
                <Spacer />
                <Text font="caption" foregroundStyle={palette.secondaryLabel} contentTransition="numericText">
                  {targetCounts[item.id]} 个
                </Text>
              </HStack>
            ))}
            <Text font="caption2" foregroundStyle={palette.tertiaryLabel}>
              Script-Hub 转换时选择对应目标，本地模块按钮会带上 target 直接打开本脚本。
            </Text>
          </GlassCard>

          <SectionTitle title="模块" caption={`${stats.total} 个文件`} />

          {loading ? (
            <GlassCard>
              <HStack alignment="top" spacing={spacing.sm} frame={leadingFillFrame}>
                <Image systemName="hourglass" foregroundStyle={palette.secondaryLabel} symbolEffect="scale" />
                <Text font="subheadline" foregroundStyle={palette.secondaryLabel} contentTransition="opacity">正在扫描模块目录…</Text>
              </HStack>
            </GlassCard>
          ) : visibleModules.length === 0 ? (
            <GlassCard>
              <VStack alignment="leading" spacing={spacing.sm} frame={leadingFillFrame}>
                <Image systemName="tray" font="title" foregroundStyle={palette.tertiaryLabel} />
                <Text font="headline">目录里还没有模块</Text>
                <Text font="caption" foregroundStyle={palette.secondaryLabel} multilineTextAlignment="leading">
                  把 .sgmodule / .plugin / .stoverride 文件放进模块目录，或从链接安装一个本地模块。
                </Text>
                <Button title="从链接安装" systemImage="link.badge.plus" buttonStyle="glassProminent" action={() => go({ name: "add" })} />
              </VStack>
            </GlassCard>
          ) : (
            <GlassCard spacingValue={0}>
              <LazyVStack spacing={0}>
                {visibleModules.map((entry, index) => (
                  <VStack key={entry.path} alignment="leading" spacing={0} frame={leadingFillFrame}>
                    <Button buttonStyle="plain" action={() => go({ name: "detail", path: entry.path })}>
                      <VStack alignment="leading" padding={{ vertical: spacing.md }} frame={leadingFillFrame}>
                        <ModuleRow entry={entry} />
                      </VStack>
                    </Button>
                    {index < visibleModules.length - 1 ? (
                      <Rectangle fill={palette.hairline} frame={{ height: 0.5, maxWidth: "infinity" }} />
                    ) : null}
                  </VStack>
                ))}
              </LazyVStack>
            </GlassCard>
          )}

          <SectionTitle title="工具" caption="安装 · 设置" />
          <GlassCard spacingValue={0}>
            <ToolRow icon="link.badge.plus" title="从链接安装" subtitle="下载远端模块并记录 #SUBSCRIBED" onTap={() => go({ name: "add" })} />
            <Divider />
            <ToolRow icon="gearshape" title="设置与目录" subtitle="模块文件夹、User-Agent 与更新行为" onTap={() => go({ name: "settings" })} />
            <Divider />
            <ToolRow icon="bolt.fill" title="重载 Surge" subtitle="让 Surge 重新加载本地模块" onTap={() => void reload()} />
          </GlassCard>

          <Text font="caption2" foregroundStyle={palette.tertiaryLabel} multilineTextAlignment="leading">
            v3.4.0 · 对齐 Script-Hub 的 Surge / Loon / Stash / Shadowrocket 四种目标
          </Text>
        </VStack>
      </ScrollView>
    </ZStack>
  )
}
