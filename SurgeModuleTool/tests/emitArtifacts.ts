// 生成一份 Surge 反劫持模块到 Documents，便于人工检查产物
import { Script } from "scripting"
import { buildSurgeModule } from "../services/schemeService"

async function run(): Promise<void> {
  const dir = `${FileManager.documentsDirectory}/SurgeModuleTool-preview`
  await FileManager.createDirectory(dir, true)
  await FileManager.writeAsString(`${dir}/Scriptable2Scripting.sgmodule`, buildSurgeModule("*"))
  Script.exit(dir)
}

void run()
