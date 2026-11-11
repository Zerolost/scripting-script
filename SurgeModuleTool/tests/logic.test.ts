// 纯逻辑回归检查：不触碰文件系统与网络
import { Script } from "scripting"
import {
  composeUpdatedContent,
  deriveNameFromUrl,
  insertAfterLastDirective,
  isModuleContent,
  isModuleFileName,
  parseModuleHeader,
  toValidFileName,
} from "../utils/moduleContent"
import { buildSurgeModule, convertSchemeUrl, isScriptingRunUrl } from "../services/schemeService"

let passed = 0
const failures: string[] = []

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1
    return
  }
  failures.push(`${name}${detail ? ` → ${detail}` : ""}`)
}

const SAMPLE = [
  "#!name=BoxJs",
  "#!desc=BoxJs rewrite module",
  "#!system=ios",
  "",
  "[Script]",
  "boxjs = type=http-request,pattern=^https?://boxjs",
  "",
  "#SUBSCRIBED https://raw.githubusercontent.com/chavyleung/scripts/master/box/rewrite/boxjs.rewrite.surge.sgmodule",
  "",
].join("\n")

const header = parseModuleHeader(SAMPLE)
check("解析 name", header.name === "BoxJs", header.name)
check("解析 desc", header.desc === "BoxJs rewrite module", header.desc)
check(
  "解析订阅链接",
  header.subscribedUrl ===
    "https://raw.githubusercontent.com/chavyleung/scripts/master/box/rewrite/boxjs.rewrite.surge.sgmodule",
  String(header.subscribedUrl)
)
check("识别合法模块", isModuleContent(SAMPLE))
check("拒绝非法模块", !isModuleContent("hello world"))

const stamped = parseModuleHeader("#!name=A\n#!desc=🔗 [2026/11/11 10:00:00] 描述文本\n")
check("剥离时间戳", stamped.desc === "描述文本", stamped.desc)

const updated = composeUpdatedContent(SAMPLE, "https://example.com/a.sgmodule", new Date(2026, 10, 11, 10, 0, 0))
check("包含新订阅链接", updated.includes("#SUBSCRIBED https://example.com/a.sgmodule"), updated)
check("包含链接区块", updated.includes("# 🔗 模块链接"), updated)
check("描述带时间戳", /^#!desc=🔗 \[.+\] /m.test(updated), updated)
check("不重复旧订阅", (updated.match(/#SUBSCRIBED/g) ?? []).length === 1, updated)
check("保留原有脚本段", updated.includes("boxjs = type=http-request"), updated)
check("结尾单换行", updated.endsWith("\n") && !updated.endsWith("\n\n"), JSON.stringify(updated.slice(-8)))
check("订阅区块在指令之后", updated.indexOf("# 🔗 模块链接") > updated.lastIndexOf("#!system=ios"), updated)
check("脚本段仍在订阅区块之后", updated.indexOf("[Script]") > updated.indexOf("#SUBSCRIBED"), updated)

const noDesc = composeUpdatedContent("#!name=NoDesc\n\n[Rule]\n", "https://example.com/n.sgmodule", new Date(2026, 10, 11, 10, 0, 0))
check("无 desc 时补在 name 之后", noDesc.startsWith("#!name=NoDesc\n#!desc=🔗 "), JSON.stringify(noDesc.slice(0, 60)))

const inserted = insertAfterLastDirective("#!name=A\n#!desc=B\n\n[Rule]\n", "\nEXTRA\n")
const extraIndex = inserted.indexOf("EXTRA")
check(
  "插入到最后一个 #! 之后",
  extraIndex > inserted.indexOf("#!desc=B") && extraIndex < inserted.indexOf("[Rule]"),
  JSON.stringify(inserted)
)

check("文件名清洗", toValidFileName('a/b:c*?"<>|d') === "a_b_c______d", toValidFileName('a/b:c*?"<>|d'))
check("去掉首尾点空格", toValidFileName("  .name.  ") === "name", toValidFileName("  .name.  "))
check(
  "从链接取名",
  deriveNameFromUrl("https://x.com/dir/My%20Module.sgmodule?v=1") === "My Module",
  deriveNameFromUrl("https://x.com/dir/My%20Module.sgmodule?v=1")
)
check("模块文件判定", isModuleFileName("a.sgmodule"))
check("忽略 js 文件", !isModuleFileName("a.js"))
check("忽略隐藏文件", !isModuleFileName(".DS_Store"))

check(
  "转换 run",
  convertSchemeUrl("scriptable:///run/Foo?a=1") === "scripting://run/Foo?a=1",
  convertSchemeUrl("scriptable:///run/Foo?a=1")
)
check(
  "转换 run_single",
  convertSchemeUrl("scriptable:///run_single/Foo") === "scripting://run_single/Foo",
  convertSchemeUrl("scriptable:///run_single/Foo")
)
check(
  "转换 install",
  convertSchemeUrl("scriptable:///install/Foo") === "scripting://install/Foo",
  convertSchemeUrl("scriptable:///install/Foo")
)
check("普通文本不变", convertSchemeUrl("https://example.com") === "https://example.com")
check("识别 scripting run", isScriptingRunUrl("scripting://run/SurgeModuleTool?url=x"))
check("拒绝非 run", !isScriptingRunUrl("scripting://install/Foo"))

const moduleText = buildSurgeModule("*")
check("模块有元数据", moduleText.includes("#!name=") && moduleText.includes("#!desc="))
check("模块有 Body Rewrite", moduleText.includes("[Body Rewrite]") && moduleText.includes("http-response ^https?://"))
check(
  "模块有 Header Rewrite",
  moduleText.includes("[Header Rewrite]") && moduleText.includes("header-replace-regex Location")
)
check("模块有 MITM", moduleText.includes("[MITM]") && moduleText.includes("{{{hostname}}}"))
check("模块含版本要求", moduleText.includes("#!requirement=CORE_VERSION>=20"))

console.log(`\n通过 ${passed} 项`)
if (failures.length > 0) {
  console.log(`失败 ${failures.length} 项：`)
  for (const item of failures) {
    console.log(`  ✗ ${item}`)
  }
  throw new Error("逻辑测试未通过")
}
console.log("✅ 全部逻辑检查通过")
Script.exit({ passed, failed: failures.length })
