# Surge 模块工具（Scripting 版）

Surge 本地模块批量更新器，附带 `scriptable:// → scripting://` 的 Safari 浏览器脚本与精简版 Surge 模块。

## 导入

```text
https://github.com/Zerolost/scripting-script/tree/main/SurgeModuleTool
```

## 功能

- **更新全部**：扫描模块目录，逐个读取 `#SUBSCRIBED` 并回写
- **更新单个**：详情页更新、分享到 Surge、复制订阅链接、删除
- **从链接安装**：下载远端模块并保存为本地 `.sgmodule`；同名不同源自动另存 `-1`
- **URL Scheme**：`scripting://run/SurgeModuleTool?url=&name=`

> `script.json` 的 `name` 与脚本目录名必须一致（本仓库两者都是 `SurgeModuleTool`）。不一致时 `scripting://run/...` 可能只打开 App 而不运行脚本。

- **目录书签**：选一次目录，重启仍可读写
- **重载 Surge**：请求 `http://script.hub/reload`
- **一键导入**：设置页可把反劫持模块直接交给 Surge 或 Egern

更新算法与 Script-Hub 的 `SurgeModuleTool.js` 一致。已用真实网络自测：安装 → 扫描 → 更新 → 同名另存，全部通过。

## Egern

Egern 与 Surge 共用同一份 `.sgmodule`（Script Hub 的「导入 Egern」也是拿 Surge 模块的 URL）。设置页提供：

- **导入 Surge**：`surge:///install-module?url=...`
- **导入 Egern**：`egern:///modules/new?url=...`

两者都指向仓库里的 `Scriptable2Scripting.sgmodule`，装好后在对应 App 里开启模块并信任 MITM 证书。

## 内置浏览器脚本

`browser.tsx` 由 Scripting 构建为 Safari 浏览器脚本，`@match` 覆盖所有站点，但只在本地改写 `<a href>`，不发起任何网络请求：

- 捕获阶段改写点击
- 改写已有链接
- `MutationObserver` 处理动态插入
- 重写 `window.open`

> 它只能改“网页里的链接”。`raw.githubusercontent.com` 这类纯文本响应没有 `<a>`，因此不会也不应该被改写。

## Surge 模块

真正的 Script Hub 是 **`https://scripthub.vercel.app`**（`script.hub` 是它使用的镜像/文件域）。官方页面源码里就是这段：

```html
<a :href="'scriptable:///run/SurgeModuleTool?url=' + encodeURIComponent(result) ...">导入 Surge(本地模块 需配合 Scriptable)</a>
```

模块只对官方站做 MITM，不再碰 `script.hub`（转换结果走的是 `http://script.hub/`，不需要解密）：

```ini
[MITM]
hostname = %APPEND% scripthub.vercel.app
```
- 首次使用必须在 Surge 里安装并信任 MITM 证书，否则 `https_decryption` 会一直是 `not_trusted`

**Surge Body Rewrite 的硬限制：token 用空格分隔，regex 和 replacement 都不能含空格。**

之前写 `需配合 Scriptable 需配合 Scripting` 会被拆成两对：

- `需配合` → `Scriptable`
- `需配合` → `Scripting`

于是 `需配合 Scriptable` 变成 `Scriptable Scriptable` —— 这正是你看到的文案。现改为无空格规则 `Scriptable\)</a>` → `Scripting)</a>`。

**三个真实问题**

1. Safari 扩展里跑的是旧构建（v1.2.0，只匹配 github/raw），改完 `browser.tsx` 必须重新运行项目才会重建。现为 v1.6.0，`@match *://*/*` + `@inject-into content`。
2. Script Hub 的导入链接带 `target="_blank"`，iOS Safari 在新标签页里打开自定义协议直接报「网址无效」。
3. `#!arguments` 用逗号分隔参数，`hosts:scripthub.vercel.app, script.hub` 会被拆成非法参数名 `script.hub`，所以去掉了参数表，直接写死 hostname。

完整规则：

```ini
[Body Rewrite]
http-response ^https?://scripthub\.vercel\.app/ scriptable:///run_single/ scripting://run_single/ scriptable:///run/ scripting://run/ scriptable:/// scripting:// scriptable:// scripting://
http-response ^https?://scripthub\.vercel\.app/ (:href="[^"]*SurgeModuleTool[^"]*")\s+target="_blank" $1
http-response ^https?://scripthub\.vercel\.app/ Scriptable\)</a> Scripting)</a>

[Header Rewrite]
http-response ^https?://scripthub\.vercel\.app/ header-replace-regex Location scriptable:/// scripting://

[MITM]
hostname = %APPEND% scripthub.vercel.app
```

用官方页面真实 HTML 逐条验证：`scriptable://` 1 处 → 0 处，`SurgeModuleTool` 链接的 `target` 被移除，按钮文案变为「需配合 Scripting」。

当前模块状态：`healthy — 3 rewrite(s), 1 MitM host(s)`。

安装：

```text
https://raw.githubusercontent.com/Zerolost/scripting-script/main/SurgeModuleTool/Scriptable2Scripting.sgmodule
```

## 主屏幕 Web App

把站点「添加到主屏幕」后，iOS 会保留一份页面缓存，模块改了也不会立刻生效。处理方式：

1. 长按图标删除
2. 在 Safari 里刷新一次（确认按钮已显示「需配合 Scripting」）
3. 重新「添加到主屏幕」

主屏幕 Web App 同样走系统 VPN，模块能生效；只是它不主动重新拉取 HTML。

## 实测拦截

Script Hub 生成的链接是：

```text
result = http://script.hub/file/_start_/<源链接>/_end_/<文件名>?<参数>
scriptable:///run/SurgeModuleTool?url=<encodeURIComponent(result)>&name=<encodeURIComponent(filename)>
```

这条 `<a>` 带 `target="_blank"`。iOS Safari 在新建标签页里打开自定义协议会直接报「网址无效」，所以模块把 target 去掉。

另外 Script Hub 的 `result` 是 `http://script.hub/...`，下载时必须允许明文请求（`allowInsecureRequest: true`），否则会被 ATS 拦下。

步骤：

1. 在 **Surge** 里安装/更新 `Scriptable2Scripting.sgmodule`
2. 信任 Surge 的 MITM 证书，开启代理与 MITM
3. Safari 打开 `https://scripthub.vercel.app`，选脚本 → 按钮应显示「需配合 Scripting」

> 按钮文案是生效标记：仍是「需配合 Scriptable」= 模块没应用；变成「需配合 Scripting」= 已改写。

也可以不用 Surge：在 Safari 扩展里启用本项目的浏览器脚本 v1.6.0，点击时 `preventDefault` 并跳转，不依赖 VPN。

## 结构

```text
index.tsx                入口
app.tsx                  NavigationStack path 路由
browser.tsx              内置 Safari 浏览器脚本
Scriptable2Scripting.sgmodule  Surge 模块
pages/                   首页 / 添加 / 详情 / 设置
components/              GlassCard、ModuleRow、StatTile、TopToolbar、ToastHost
contexts/                全局状态 + Toast 独立上下文
services/                更新、目录、设置
utils/                   模块解析与格式化
design/AllPatternDesign  Liquid Glass、动效与 frame 令牌
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

## 校验

TypeScript 诊断 0 项。
