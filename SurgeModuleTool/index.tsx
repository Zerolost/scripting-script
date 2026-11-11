import { Navigation, Script } from "scripting"
import { App } from "./app"

/**
 * 入口：
 * - 直接运行 → 打开主页
 * - scripting://run/SurgeModuleTool?url=<模块链接>&name=<可选名称> → 自动安装
 */
async function run(): Promise<void> {
  const params: Record<string, any> = Script.queryParameters ?? {}
  const rawUrl = typeof params.url === "string" ? params.url.trim() : ""
  const rawName = typeof params.name === "string" ? params.name.trim() : ""

  try {
    await Navigation.present({
      element: <App initialUrl={rawUrl || undefined} initialName={rawName || undefined} />,
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
