# Surge 模块工具（Scripting 版）

Surge 本地模块批量更新器，附带 `scriptable:// → scripting://` 的 Safari 浏览器脚本与精简版 Surge 模块。

## 导入

```text
https://github.com/Zerolost/scripting-script/tree/main/SurgeModuleTool
```

## 功能

- **更新全部**：扫描模块目录，逐个读取 `#SUBSCRIBED` 并回写
- **更新单个**：详情页更新、分享到 Surge、复制订阅链接、删除
- **从链接安装**：下载远端模块并保存为本地 `.sgmodule`
- **URL Scheme**：`scripting://run/SurgeModuleTool?url=&name=`

> 真正决定 URL Scheme 的是 `script.json` 里的 `name`，必须为 `SurgeModuleTool`（目录名可以不同）。否则 `scripting://run/...` 会提示找不到脚本。
- **目录书签**：选一次目录，重启仍可读写
- **重载 Surge**：请求 `http://script.hub/reload`

更新算法与 Script-Hub 的 `SurgeModuleTool.js` 一致。

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

**三个真实问题**

1. Safari 扩展里跑的是旧构建（v1.2.0，只匹配 github/raw），改完 `browser.tsx` 必须重新运行项目才会重建。现为 v1.6.0，`@match *://*/*` + `@inject-into content`。
2. Script Hub 的导入链接带 `target="_blank"`，iOS Safari 在新标签页里打开自定义协议直接报「网址无效」。
3. `#!arguments` 用逗号分隔参数，`hosts:scripthub.vercel.app, script.hub` 会被拆成非法参数名 `script.hub`，所以去掉了参数表，直接写死 hostname。

完整规则：

```ini
[Body Rewrite]
http-response ^https?://scripthub\.vercel\.app/ scriptable:///run_single/ scripting://run_single/ scriptable:///run/ scripting://run/ scriptable:/// scripting:// scriptable:// scripting://
http-response ^https?://scripthub\.vercel\.app/ (:href="[^"]*SurgeModuleTool[^"]*")\s+target="_blank" $1
http-response ^https?://scripthub\.vercel\.app/ 需配合 Scriptable 需配合 Scripting

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

## 实测拦截

Script Hub 生成的链接是：

```text
result = http://script.hub/file/_start_/<源链接>/_end_/<文件名>?<参数>
scriptable:///run/SurgeModuleTool?url=<encodeURIComponent(result)>&name=<encodeURIComponent(filename)>
```

这条 `<a>` 带 `target="_blank"`。iOS Safari 在新建标签页里打开自定义协议会直接报「网址无效」，所以模块必须把 target 去掉（v3 已包含）。

1. 在 **Surge** 里安装/更新 `Scriptable2Scripting.sgmodule`（不是 Scripting 内置代理）
2. 信任 Surge 的 MITM 证书，开启代理与 MITM
**怎么判断模块有没有生效**：v5 会把页面里的大写 `Scriptable` 改成 `Scripting`。如果按钮还是「需配合 Scriptable」，说明模块根本没被应用（没装、没开、没解密）；如果变成「需配合 Scripting」但点击仍报错，那就是链接本身的问题。

3. Safari 打开 `https://scripthub.vercel.app`，选脚本 → 「导入 Surge(本地模块 需配合 Scripting)」

也可以不用 Surge：在 Safari 扩展里启用本项目的浏览器脚本 v1.5.0，它会在点击时 `preventDefault` 并跳转，不依赖 VPN。

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
- 页面切换使用系统 `NavigationStack` push/pop，返回/关闭天然带转场
- ToolBar：根页左侧 `xmark`，子页左侧系统返回，右侧统一刷新
- 所有卡片同一内边距、同一 `leadingFillFrame`，左对齐不居中
- 动画：数字 `numericText`、文本 `opacity`、图标 `symbolEffect`、列表状态
- 震动：只用 SwiftUI `sensoryFeedback`，不放在高频点击上

## 校验

TypeScript 诊断 0 项。
