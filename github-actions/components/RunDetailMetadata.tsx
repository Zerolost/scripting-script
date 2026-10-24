import { VStack, HStack, Image, type Color } from 'scripting'
import { MotionText as Text } from './Motion'
import { GlassCard } from './GlassSurface'
import { InfoRow, formatTime, timeAgoText, durationText, type Run } from '../services/AppModel'
import type { RunDetailContent } from '../services/runDetailContent'
import { useAccentColor } from '../hooks/useAccentColor'
import { useRunElapsed } from '../hooks/useRunElapsed'
import { visual } from '../visual.config'

export function RunDetailMetadata({ run, content, owner, repo }: { run: Run; content: RunDetailContent; owner: string; repo: string }) {
  const accent: Color = useAccentColor()
  const now: number = useRunElapsed(run.status === 'in_progress')
  const duration: string | null = durationText(content.durationStart, content.end)
  const elapsed: string | null = run.status !== 'completed' && run.run_started_at ? durationText(run.run_started_at, new Date(now).toISOString()) : ''
  const trigger: string | undefined = run.triggering_actor?.login !== run.actor.login ? run.triggering_actor?.login : undefined
  return <VStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <GlassCard>
      <HStack spacing={6}><Image systemName={visual.icons['clock.fill']} foregroundStyle={accent} font={14} /><Text font={visual.fontSizes[13]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.secondaryLabel}>运行时间</Text></HStack>
      <InfoRow label="创建" value={formatTime(run.created_at)} subtitle={timeAgoText(run.created_at)} />
      <InfoRow label="开始" value={formatTime(run.run_started_at)} />
      <InfoRow label={content.inferredEnd ? '最后任务结束' : '完成'} value={content.end ? formatTime(content.end) : run.status === 'completed' ? '未提供' : run.status === 'in_progress' ? '进行中' : '尚未开始'} />
      <InfoRow label={content.inferredEnd ? '任务时间跨度' : '耗时'} value={duration || (elapsed ? `已运行约 ${elapsed}` : '未提供')} />
      {content.inferredEnd ? <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.secondaryLabel}>运行接口未提供完成时间；以上按已加载任务的起止时间计算。</Text> : null}
      <InfoRow label="更新" value={formatTime(run.updated_at)} subtitle={timeAgoText(run.updated_at)} />
    </GlassCard>
    <GlassCard>
      <HStack spacing={6}><Image systemName={visual.icons['info.circle.fill']} foregroundStyle={accent} font={14} /><Text font={visual.fontSizes[13]} fontWeight={visual.typography.semibold} foregroundStyle={visual.colors.secondaryLabel}>工作流与来源</Text></HStack>
      <InfoRow label="工作流" value={run.name || String(run.workflow_id)} />
      <InfoRow label="仓库" value={run.repository?.full_name || `${owner}/${repo}`} />
      {run.repository?.default_branch ? <InfoRow label="默认分支" value={run.repository.default_branch} /> : null}
      {run.path ? <InfoRow label="文件" value={run.path} /> : null}
      {trigger ? <InfoRow label="实际触发" value={trigger} /> : null}
      {run.check_suite_id ? <InfoRow label="Check Suite" value={`#${run.check_suite_id}`} /> : null}
      {run.pull_requests?.length ? <InfoRow label="关联 PR" value={run.pull_requests.map((pr: { number: number }): string => `#${pr.number}`).join(', ')} /> : null}
    </GlassCard>
  </VStack>
}
