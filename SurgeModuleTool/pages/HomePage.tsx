import {
  Button,
  Divider,
  HStack,
  Image,
  LazyVStack,
  Navigation,
  NavigationStack,
  Rectangle,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useMemo,
  useState,
} from "scripting"
import { GlassCard } from "../components/GlassCard"
import { ModuleRow } from "../components/ModuleRow"
import { SectionTitle } from "../components/SectionTitle"
import { StatTile } from "../components/StatTile"
import { useLibrary } from "../contexts/LibraryContext"
import { cardTransition, motion, pageGradient, pageTransition, palette, spacing } from "../design/AllPatternDesign"
import type { Navigate } from "../types"

/** 工具列表里的一行 */
function ToolRow({
  icon,
  title,
  subtitle,
  onTap,
}: {
  icon: string
  title: string
  subtitle: string
  onTap: () => void
}): ReturnType<typeof Button> {
  return (
    <Button buttonStyle="plain" action={onTap}>
      <HStack spacing={spacing.md} padding={{ vertical: 11 }} frame={{ maxWidth: "infinity" }}>
        <Image systemName={icon} font="body" foregroundStyle={palette.accent} frame={{ width: 24 }} />
        <VStack alignment="leading" spacing={2}>
          <Text font="subheadline">{title}</Text>
          <Text font="caption2" foregroundStyle={palette.tertiaryLabel} lineLimit={1}>
            {subtitle}
          </Text>
        </VStack>
        <Spacer />
        <Image systemName="chevron.right" font="caption" foregroundStyle={palette.tertiaryLabel} />
      </HStack>
    </Button>
  )
}

/** 首页：概览、模块列表与工具入口 */
export function HomePage({ go }: { go: Navigate }) {
  const { modules, loading, busy, folderPath, settings, refresh, updateAll, reload, showNotice } = useLibrary()
  const dismiss = Navigation.useDismiss()
  const [haptic, setHaptic] = useState<number>(0)

  const visibleModules = useMemo(
    () => (settings.showModulesWithoutUrl ? modules : modules.filter(item => item.hasSubscription)),
    [modules, settings.showModulesWithoutUrl]
  )

  const stats = useMemo(() => {
    const withUrl = modules.filter(item => item.hasSubscription).length
    const failed = modules.filter(item => item.status === "failed").length
    return { total: modules.length, withUrl, failed }
  }, [modules])

  function bump(): void {
    setHaptic(current => current + 1)
  }

  return (
    <NavigationStack transition={pageTransition}>
      <ZStack>
        <Rectangle fill={pageGradient} ignoresSafeArea />
        <ScrollView
          navigationTitle="Surge 模块工具"
          navigationBarTitleDisplayMode="inline"
          toolbarBackgroundVisibility="hidden"
          toolbar={{ topBarLeading: <Button title="关闭" action={dismiss} /> }}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        >
          <VStack alignment="leading" spacing={spacing.lg} padding={spacing.lg}>
            <GlassCard sensoryFeedback={{ trigger: haptic, feedback: "impactSoft" }}>
              <HStack alignment="center" spacing={spacing.sm}>
                <StatTile label="模块" value={stats.total} tint={palette.secondaryLabel} />
                <Divider frame={{ height: 28 }} />
                <StatTile label="可更新" value={stats.withUrl} tint={palette.accent} />
                <Divider frame={{ height: 28 }} />
                <StatTile
                  label="失败"
                  value={stats.failed}
                  tint={stats.failed > 0 ? palette.danger : palette.secondaryLabel}
                />
              </HStack>

              <HStack spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                <Button
                  buttonStyle="glassProminent"
                  frame={{ maxWidth: "infinity", height: 44 }}
                  disabled={busy || loading}
                  action={() => {
                    bump()
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
                <Button
                  buttonStyle="glass"
                  frame={{ width: 44, height: 44 }}
                  disabled={busy}
                  action={() => {
                    bump()
                    void refresh()
                  }}
                >
                  <Image systemName="arrow.clockwise" symbolEffect="scale" />
                </Button>
              </HStack>

              <Button
                buttonStyle="plain"
                action={() => {
                  if (!folderPath) {
                    return
                  }
                  void Pasteboard.setString(folderPath).then(() => showNotice("已复制模块目录"))
                }}
              >
                <HStack spacing={6} padding={{ vertical: 2 }} frame={{ maxWidth: "infinity" }}>
                  <Image systemName="folder" font="caption" foregroundStyle={palette.tertiaryLabel} />
                  <Text
                    font="caption2"
                    foregroundStyle={palette.tertiaryLabel}
                    lineLimit={1}
                    truncationMode="middle"
                  >
                    {folderPath || "正在准备模块目录…"}
                  </Text>
                  <Spacer />
                  <Image systemName="doc.on.doc" font="caption2" foregroundStyle={palette.tertiaryLabel} />
                </HStack>
              </Button>
            </GlassCard>

            <SectionTitle title="模块" caption={`${stats.total} 个文件`} />

            {loading ? (
              <GlassCard>
                <HStack spacing={spacing.sm}>
                  <Image systemName="hourglass" foregroundStyle={palette.secondaryLabel} />
                  <Text font="subheadline" foregroundStyle={palette.secondaryLabel} contentTransition="opacity">
                    正在扫描模块目录…
                  </Text>
                </HStack>
              </GlassCard>
            ) : visibleModules.length === 0 ? (
              <GlassCard>
                <VStack alignment="center" spacing={spacing.sm} frame={{ maxWidth: "infinity" }}>
                  <Image systemName="tray" font="title" foregroundStyle={palette.tertiaryLabel} />
                  <Text font="headline">目录里还没有模块</Text>
                  <Text font="caption" foregroundStyle={palette.secondaryLabel} multilineTextAlignment="center">
                    把 .sgmodule 文件放进模块目录，或从链接安装一个本地模块。
                  </Text>
                  <Button
                    title="从链接安装"
                    systemImage="link.badge.plus"
                    buttonStyle="glassProminent"
                    action={() => {
                      bump()
                      go({ name: "add" })
                    }}
                  />
                </VStack>
              </GlassCard>
            ) : (
              <GlassCard padding={0} spacingValue={0}>
                <LazyVStack spacing={0} animation={{ animation: motion.page, value: visibleModules.length }}>
                  {visibleModules.map((entry, index) => (
                    <VStack key={entry.path} alignment="leading" spacing={0} transition={cardTransition}>
                      <Button buttonStyle="plain" action={() => go({ name: "detail", path: entry.path })}>
                        <VStack alignment="leading" padding={{ horizontal: spacing.lg, vertical: spacing.md }}>
                          <ModuleRow entry={entry} />
                        </VStack>
                      </Button>
                      {index < visibleModules.length - 1 ? (
                        <VStack padding={{ horizontal: spacing.lg }}>
                          <Rectangle fill={palette.hairline} frame={{ height: 0.5 }} />
                        </VStack>
                      ) : null}
                    </VStack>
                  ))}
                </LazyVStack>
              </GlassCard>
            )}

            <SectionTitle title="工具" caption="安装 · 跳转 · 设置" />
            <GlassCard padding={{ horizontal: spacing.lg, vertical: 2 }} spacingValue={0}>
              <ToolRow
                icon="link.badge.plus"
                title="从链接安装"
                subtitle="下载远端模块并记录 #SUBSCRIBED"
                onTap={() => {
                  bump()
                  go({ name: "add" })
                }}
              />
              <Divider />
              <ToolRow
                icon="wand.and.stars"
                title="Scheme 反劫持"
                subtitle="scriptable:// → scripting://（Surge + 内置浏览器脚本）"
                onTap={() => {
                  bump()
                  go({ name: "tools" })
                }}
              />
              <Divider />
              <ToolRow
                icon="gearshape"
                title="设置与目录"
                subtitle="模块文件夹、User-Agent 与更新行为"
                onTap={() => {
                  bump()
                  go({ name: "settings" })
                }}
              />
              <Divider />
              <ToolRow
                icon="bolt.fill"
                title="重载 Surge"
                subtitle="让 Surge 重新加载本地模块"
                onTap={() => {
                  bump()
                  void reload()
                }}
              />
            </GlassCard>

            <Text font="caption2" foregroundStyle={palette.tertiaryLabel} multilineTextAlignment="center">
              v3.1.0 · 更新逻辑与 Script-Hub 的 SurgeModuleTool 一致
            </Text>
          </VStack>
        </ScrollView>
      </ZStack>
    </NavigationStack>
  )
}
