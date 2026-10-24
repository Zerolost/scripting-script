import { Script } from 'scripting'
import type { Run, Job } from './AppModel'
import { describeRunDetail, type RunDetailContent } from './runDetailContent'
import { createTransferPlan, advanceTransferPlayback, transferFrame, type TransferPlayback, type TransferPlan } from './flowTransfer'

let checks: number = 0
function assert(value: boolean, message: string): void {
  checks += 1
  if (!value) throw new Error(message)
}
const run: Run = { id: 1, name: 'Build', display_title: '修复构建', status: 'completed', conclusion: 'failure', created_at: '2026-10-24T10:00:00Z', updated_at: '2026-10-24T11:00:00Z', run_started_at: '2026-10-24T10:00:01Z', run_attempt: 1, head_branch: 'main', head_sha: 'abc', actor: { login: 'test' }, event: 'push', workflow_id: 1, run_number: 1, url: '', html_url: '', head_commit: { message: '修复构建\n\n保留提交正文' } }
const jobs: Job[] = [{ id: 1, name: '构建', status: 'completed', conclusion: 'failure', started_at: '2026-10-24T10:00:02Z', completed_at: '2026-10-24T10:01:00Z', steps: [{ number: 1, name: '编译', status: 'completed', conclusion: 'failure', started_at: '2026-10-24T10:00:02Z', completed_at: '2026-10-24T10:01:00Z' }] }]
try {
  const content: RunDetailContent = describeRunDetail(run, jobs)
  assert(content.commit === '保留提交正文', '重复首行只删除首行且保留正文')
  assert(content.focus.lines[0] === '构建 · 编译' && content.failed === 1, '失败位置与数量来自接口')
  assert(content.inferredEnd && Date.parse(content.end ?? '') === Date.parse(jobs[0].completed_at ?? '') && Date.parse(content.durationStart ?? '') === Date.parse(jobs[0].started_at), '缺运行完成时间采用任务跨度并明确来源')
  assert(content.end !== run.updated_at, '更新时间不作为结束时间')
  assert(!describeRunDetail(run, [{ ...jobs[0], completed_at: null }]).end, '任务结束时间缺失不回退')
  assert(!describeRunDetail(run, [{ ...jobs[0], completed_at: 'invalid' }]).end, '非法任务时间不回退')
  assert(!describeRunDetail(run, [{ ...jobs[0], status: 'in_progress' }]).end, '任务未全部结束不回退')
  assert(!describeRunDetail(run, []).end, '空任务不推断完成时间')
  assert(!describeRunDetail(run, [{ ...jobs[0], started_at: '' }]).durationStart, '缺任务开始时间不计算任务跨度')
  assert(describeRunDetail({ ...run, head_commit: { message: '修复构建' } }, jobs).commit === '', '完全重复单行隐藏')
  assert(describeRunDetail({ ...run, head_commit: { message: '另一条提交\n正文' } }, jobs).commit === '另一条提交\n正文', '不同提交保留完整文本')
  const exact: RunDetailContent = describeRunDetail({ ...run, completed_at: '2026-10-24T10:02:00Z' }, jobs)
  assert(!exact.inferredEnd && exact.end === '2026-10-24T10:02:00Z', '运行完成时间优先')
  const active: Job[] = [1, 2].map((id: number): Job => ({ ...jobs[0], id, name: `任务${id}`, status: 'in_progress', conclusion: null, steps: [{ ...jobs[0].steps![0], status: 'in_progress', conclusion: null }] }))
  assert(describeRunDetail({ ...run, status: 'in_progress', conclusion: null }, active).focus.lines.length === 2, '并行进行中分别展示')
  assert(describeRunDetail(run, []).focus.lines[0].includes('暂无失败步骤明细'), '失败但无明细不推测原因')
  assert(describeRunDetail({ ...run, conclusion: 'cancelled' }, []).focus.lines[0].includes('取消'), '取消独立表达')
  const oldPlan: TransferPlan = createTransferPlan([true, false, true], 1.4, true)
  const nextPlan: TransferPlan = createTransferPlan([true, true, true], 1.4, true)
  let playback: TransferPlayback = advanceTransferPlayback(null, oldPlan, 0)
  for (let frame: number = 1; frame <= 900; frame += 1) {
    const elapsed: number = frame / 30
    playback = advanceTransferPlayback(playback, oldPlan, elapsed)
    assert(playback.plan === oldPlan && elapsed - playback.origin >= 0 && elapsed - playback.origin < oldPlan.period + 1e-8, '长时间播放维护当前周期起点')
  }
  const updateTime: number = playback.origin + oldPlan.period * 0.5
  const before: ReturnType<typeof transferFrame> = transferFrame(playback.plan, updateTime - playback.origin, 0.64)
  const waiting: TransferPlayback = advanceTransferPlayback(playback, nextPlan, updateTime)
  assert(waiting === playback && before.index === transferFrame(waiting.plan, updateTime - waiting.origin, 0.64).index, '周期中更新不跳换焦点')
  const boundary: number = playback.origin + oldPlan.period
  const switched: TransferPlayback = advanceTransferPlayback(waiting, nextPlan, boundary + 1e-6)
  assert(switched.plan === nextPlan && Math.abs(switched.origin - boundary) < 1e-5, '周期结束采用新计划并保留少量时间余量')
  const changedCount: TransferPlayback = advanceTransferPlayback(waiting, createTransferPlan([true], 1.4, true), updateTime)
  assert(changedCount.origin === updateTime && changedCount.plan.slots.length === 1, '节点数量变化安全重启')
  assert(Number.isFinite(transferFrame(oldPlan, 0.1, NaN).phase), '非法抵达时间使用默认值')
  console.log(JSON.stringify({ checks, passed: true }))
  Script.exit()
} catch (error: unknown) {
  console.log(JSON.stringify({ checks, passed: false, error: String(error) }))
  Script.exit()
}
