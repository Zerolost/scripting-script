import { VStack } from 'scripting'
import type { Run } from '../services/AppModel'
import { describeRunDetail, type RunDetailContent } from '../services/runDetailContent'
import { RunDetailHeader } from './RunDetailHeader'
import { RunDetailMetadata } from './RunDetailMetadata'
import { previewJobs } from './RunDetailFlow'

const run: Run = {
  id: -2, name: '构建与测试', display_title: '修复构建缓存并验证发布流程', status: 'completed', conclusion: 'failure',
  created_at: '2026-10-24T09:59:50Z', updated_at: '2026-10-24T10:01:05Z', run_started_at: '2026-10-24T10:00:00Z',
  run_attempt: 2, head_branch: 'main', head_sha: 'a14b8c29e00', actor: { login: 'octocat' }, triggering_actor: { login: 'reviewer' },
  event: 'workflow_dispatch', workflow_id: 12, run_number: 128, path: '.github/workflows/build.yml',
  head_commit: { message: '修复构建缓存并验证发布流程\n\n调整依赖缓存路径，保留构建结束后的清理步骤。\n此处用于比较多行提交说明。', author: { name: '示例作者' }, timestamp: '2026-10-24T09:58:00Z' },
  repository: { full_name: 'octocat/demo', default_branch: 'main' }, pull_requests: [{ number: 42 }], url: '', html_url: '',
}

export function RunDetailPreview() {
  const content: RunDetailContent = describeRunDetail(run, previewJobs)
  return <VStack spacing={8} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <RunDetailHeader run={run} jobs={previewJobs} content={content} loading={false} error="" owner="octocat" repo="demo" />
    <RunDetailMetadata run={run} content={content} owner="octocat" repo="demo" />
  </VStack>
}
