# 模块工具（Scripting 版）

Script-Hub 本地模块批量更新器，支持 **Surge / Loon / Stash / Shadowrocket** 四种目标，附带 `scriptable:// → scripting://` 的 Safari 浏览器脚本与四份反劫持模块。

## 导入

```text
https://github.com/Zerolost/scripting-script/tree/main/SurgeModuleTool
```

## 支持的目标

| App | 叫法 | 后缀 | Script-Hub target | 远程导入 Scheme |
| --- | --- | --- | --- | --- |
| Surge | 模块 | `.sgmodule` | `surge-module` | `surge:///install-module?url=` |
| Loon | 插件 | `.plugin` | `loon-plugin` | `loon://import?plugin=` |
| Stash | 覆写 | `.stoverride` | `stash-stoverride` | `stash://install-override?url=` |
| Shadowrocket | 模块 | `.sgmodule` | `shadowrocket-module` | `shadowrocket://install?module=` |

Script-Hub 的 `target` 取值与后缀来自其页面源码：`surge-module(.sgmodule)`、`loon-plugin(.plugin)`、`stash-stoverride(.stoverride)`、`shadowrocket-module(.sgmodule)`。

## 功能

- **更新全部**：扫描模块目录，逐个读取 `#SUBSCRIBED` 并回写
- **更新单个**：详情页更新、远程导入、分享本地文件、复制订阅链接、删除
- **从链接安装**：下载远端内容并保存为对应目标的本地文件；同名不同源自动另存 `-1`
- **目标识别**：`target` 参数 → 路径后缀 → 文件内容（`# @target` / YAML），也支持直接粘贴四个 App 的导入链接
- **URL Scheme**：`scripting://run/SurgeModuleTool?url=&name=&target=`
- **目录书签**：选一次目录，重启仍可读写
- **重载 Surge**：请求 `http://script.hub/reload`

> `script.json` 的 `name` 与脚本目录名必须一致（本仓库两者都是 `SurgeModuleTool`）。不一致时 `scripting://run/...` 可能只打开 App 而不运行脚本。

## 本地文件的订阅标记

三种格式都能安全携带订阅信息：

- Surge / Loon / Shadowrocket：在最后一条 `#!` 指令后写 `#SUBSCRIBED`、`# @target`
- Stash：YAML 不允许乱改字段，只在文件顶部写同样的注释

更新时会先移除旧标记再重新写入，所以反复更新不会堆叠。

## 反劫持模块

四份等价实现，装好后在对应 App 里开启模块并信任 MITM 证书：

| App | 文件 |
| --- | --- |
| Surge / Egern | `Scriptable2Scripting.sgmodule` |
| Shadowrocket | `Scriptable2Scripting.shadowrocket.sgmodule` |
| Loon | `Scriptable2Scripting.plugin` |
| Stash | `Scriptable2Scripting.stoverride` |

它们都做三件事：

1. 把 `scriptable://` 安装链接改写为 `scripting://`
2. 去掉 `target="_blank"`，避免 iOS Safari 在新标签页里打开自定义协议时报「网址无效」
3. **追加** Loon / Stash / Shadowrocket 的「本地模块」按钮，原有远程导入按钮保持不变

### 为什么用响应脚本而不是 Body Rewrite

Surge 的 `[Body Rewrite]` token 用空格分隔，正则和替换文本都不能含空格；要新增一个带 `style`、`v-if`、`:href` 的 `<a>`，替换文本必然含空格。所以改用各 App 都支持的 `http-response` 脚本：

- Surge / Shadowrocket：`[Script]` + `script-path=.../local-module.js`
- Loon：`[Script]` + `http-response ... requires-body=true`
- Stash：`script-providers` + `http.script`（`type: response`、`require-body: true`）

`local-module.js` 只在响应体里插入 Vue 锚点，不发起网络请求。注入后的结构：

```html
<a v-if="result && target === 'loon-plugin' " :href=" 'https://www.nsloon.com/openloon/import?plugin=' + encodeURIComponent(result) " target="_blank">导入(Loon)</a>
<a v-if="result && target === 'loon-plugin'" :href="'scripting://run/SurgeModuleTool?target=loon-plugin&url=' + encodeURIComponent(result) + '&name=' + encodeURIComponent(filename)" style="margin: 0 0.5rem 0 0; font-weight: 600;">导入 Loon(本地插件 需配合 Scripting)</a>
```

已用线上 `https://scripthub.vercel.app` 的 HTML 验证：三个远程锚点全部保留，注入后各自多出一个紧跟其后的本地锚点。

> `local-module.js` 与四份模块文件都需要发布到上面的 raw 地址后才会生效。

## 内置浏览器脚本

`browser.tsx` 由 Scripting 构建为 Safari 浏览器脚本，`@match` 覆盖所有站点，但只在本地改写 `<a href>`，不发起任何网络请求：

- 捕获阶段改写点击
- 改写已有链接
- 去掉三个远程导入按钮的 `target="_blank"`
- `MutationObserver` 处理动态插入
- 为三个远程导入按钮注入「本地模块」兄弟节点（保留原按钮；若响应脚本已注入则自动跳过，避免重复）
- 重写 `window.open`

> 它只能改“网页里的链接”。`raw.githubusercontent.com` 这类纯文本响应没有 `<a>`，因此不会也不应该被改写。

## 结构

```text
index.tsx                入口（解析 url / name / target）
app.tsx                  NavigationStack path 路由
browser.tsx              内置 Safari 浏览器脚本
local-module.js          反劫持模块的响应脚本（追加本地模块按钮）
Scriptable2Scripting.sgmodule              Surge / Egern
Scriptable2Scripting.shadowrocket.sgmodule Shadowrocket
Scriptable2Scripting.plugin                Loon
Scriptable2Scripting.stoverride            Stash
pages/                   首页 / 添加 / 详情 / 设置
components/              GlassCard、GlassText、ModuleRow、TargetBadge、StatTile、TopToolbar、ToastHost
contexts/                全局状态 + Toast 独立上下文
services/                更新、目录、设置
utils/                   模块解析、目标识别与格式化
design/AllPatternDesign  Liquid Glass、动效与 frame 令牌
constants/targets.ts     四个目标的元信息
```

## 设计

- iOS 26 Liquid Glass；玻璃实例与 `{glass, shape}` 均模块级缓存
- 卡片用 `GlassCard`（圆角 22）；路径、错误、代码、来源等**文本承载框**统一用 `GlassText`（圆角 12 的玻璃矩形）
- 页面切换使用系统 `NavigationStack` push/pop，返回/关闭天然带转场
- ToolBar：根页左侧 `xmark`，子页左侧系统返回，右侧统一刷新
- 所有卡片同一内边距、同一 `leadingFillFrame`，左对齐不居中
- 动画：数字 `numericText`、文本 `opacity`、图标 `symbolEffect`、列表状态
- 震动：只用 SwiftUI `sensoryFeedback`，不放在高频点击上

## 修复记录

- `stat.type` 运行时返回 `NSFileTypeRegular`（不是文档里的 `file`），旧代码把所有文件都跳过，导致「下载成功但详情页提示模块不存在」。已兼容两种写法，并给详情页加了读盘回退。
- Surge `[Body Rewrite]` 的 token 用空格分隔，正则与替换文本都不能含空格。
- Stash 覆写的 `name` / `desc` 是 YAML 块标量（`name: |-`），不能按 `#!name` 解析。
- Shadowrocket 的 `[MITM]` 必须写 `%APPEND%`，否则会覆盖配置文件里的 hostname。

## 校验

- TypeScript 诊断 0 项
- 用 Script-Hub 线上转换结果验证：三种目标的后缀、`#!name` / YAML `name`、`#SUBSCRIBED` 回写、目标标记往返全部通过
- 用线上页面 HTML 跑 `local-module.js`：三个本地按钮各注入 1 次，均紧跟对应远程按钮
