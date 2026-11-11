import { Navigation, Script } from "scripting"
import { App } from "./app"
import { normalizeTarget } from "./utils/targets"

/** 入口 */
async function run(): Promise<void> {
  const params: Record<string, any> = Script.queryParameters ?? {}
  const rawUrl = typeof params.url === "string" ? params.url.trim() : ""
  const rawName = typeof params.name === "string" ? params.name.trim() : ""
  const rawTarget = typeof params.target === "string" ? params.target.trim() : ""
  const target = normalizeTarget(rawTarget)

  try {
    await Navigation.present({
      element: <App initialUrl={rawUrl || undefined} initialName={rawName || undefined} initialTarget={target ?? undefined} />,
      modalPresentationStyle: "pageSheet",
    })
  } catch (error) {
    console.error("SurgeModuleTool 运行失败", error)
    await Dialog.alert({
      title: "运行失败",
      message: error instanceof Error ? error.message : String(error),
    })
  } finally {
    Script.exit()
  }
}

void run()
