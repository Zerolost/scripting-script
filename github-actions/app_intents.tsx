import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"
import { getStoredAuth, ghRequest, recordWidgetTrigger } from "./services/widgetGitHub"

export const RunWorkflowIntent = AppIntentManager.register<string>({
  name: "RunWorkflowIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (payload: string) => {
    try {
      const { owner, repo, workflowId, branch } = JSON.parse(payload)
      const auth = getStoredAuth()
      if (!auth || !owner || !repo || !workflowId) return
      await ghRequest(
        `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
        auth.token,
        { method: 'POST', body: JSON.stringify({ ref: branch || 'main', inputs: {} }) }
      )
      recordWidgetTrigger(owner, repo, workflowId)
    } catch (_) {
    }
    Widget.reloadAll()
  },
})
