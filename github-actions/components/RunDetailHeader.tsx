import { VStack, HStack, Image, type Color } from 'scripting'
import { MotionText as Text } from './Motion'
import { GlassCard } from './GlassSurface'
import { runStatusIcon, runStatusInfo, formatShortTime, type Run, type Job } from '../services/AppModel'
import type { RunDetailContent } from '../services/runDetailContent'
import { visual } from '../visual.config'
import { useAccentColor } from '../hooks/useAccentColor'

export function RunDetailHeader({ run, jobs, content, loading, error, owner, repo }: { run: Run; jobs: Job[]; content: RunDetailContent; loading: boolean; error: string; owner: string; repo: string }) {
  const accent: Color = useAccentColor()
  const icon: ReturnType<typeof runStatusIcon> = runStatusIcon(run)
  const info: ReturnType<typeof runStatusInfo> = runStatusInfo(run)
  const focusColor: Color = content.focus.tone === 'failure' ? visual.colors['#ff3b30'] : accent
  const author: string | undefined = run.head_commit?.author?.name || run.head_commit?.committer?.name
  return <GlassCard>
    <HStack spacing={8}>
      <Image systemName={icon.systemName} font={22} foregroundStyle={icon.color} />
      <Text font={visual.fontSizes[22]} fontWeight={visual.typography.bold} foregroundStyle={visual.colors.label} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{`运行 #${run.run_number}`}</Text>
      <Text font={visual.fontSizes[13]} fontWeight={visual.typography.semibold} foregroundStyle={icon.color}>{info.text}</Text>
    </HStack>
    <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{run.repository?.full_name || `${owner}/${repo}`}</Text>
    <Text font={visual.fontSizes[16]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.label} lineLimit={visual.detail.titleLines}>{run.display_title || run.name}</Text>
    <HStack spacing={6}>
      <Image systemName={visual.icons['arrow.triangle.branch']} foregroundStyle={accent} font={13} />
      <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.label} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{run.head_branch || visual.text['未知分支']}</Text>
      <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{run.head_sha?.slice(0, 7) || ''}</Text>
    </HStack>
    <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{`${run.actor.login} · ${run.event} · 第 ${run.run_attempt} 次尝试`}</Text>
    {visual.detail.showCommit && content.commit ? <Text font={visual.fontSizes[13]} foregroundStyle={visual.colors.secondaryLabel} lineLimit={visual.detail.commitLines}>{content.commit}</Text> : null}
    {author ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{`${author}${run.head_commit?.timestamp ? ` · ${formatShortTime(run.head_commit.timestamp)}` : ''}`}</Text> : null}
    {loading ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>正在读取任务与步骤…</Text> : jobs.length ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{`已加载 ${jobs.length} 个任务 · 已结束 ${content.completedJobs} · ${content.steps} 个步骤`}</Text> : null}
    {!loading && content.steps > 0 ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>{`步骤：成功 ${content.success} · 失败或需关注 ${content.failed} · 跳过 ${content.skipped}`}</Text> : null}
    {visual.detail.showFocus && !loading ? <VStack alignment="leading" spacing={4} padding={{ top: 4 }} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text font={visual.fontSizes[12]} fontWeight={visual.typography.semibold} foregroundStyle={focusColor}>{content.focus.title}</Text>
      {content.focus.lines.map((line: string, index: number) => <Text key={index} font={visual.fontSizes[13]} foregroundStyle={content.focus.tone === 'neutral' ? visual.colors.secondaryLabel : visual.colors.label}>{line}</Text>)}
    </VStack> : null}
    {error ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors['#ff3b30']}>{`刷新未完成：${error}${jobs.length ? '；任务内容保留上次数据' : ''}`}</Text> : null}
  </GlassCard>
}
