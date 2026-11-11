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

真正的 Script Hub 在 **`script.hub`**（不是 `script-hub.netlify.app`）。它的源码里就是这一段：

```html
<a :href="'scriptable:///run/SurgeModuleTool?url=' + encodeURIComponent(result) ...">导入 Surge(本地模块 需配合 Scriptable)</a>
```

模块只对这个域名做 MITM：

```ini
#!arguments=hosts:script.hub

[MITM]
hostname = %APPEND% {{{hosts}}}
skip-server-cert-verify = %APPEND% script.hub
```

- `script.hub` 的上游证书是自签的，所以需要 `skip-server-cert-verify`
- 只有 `hosts` 里列出的域名会被解密，不会抓其他流量
- 首次使用必须在 Surge 里安装并信任 MITM 证书，否则 `https_decryption` 会一直是 `not_trusted`

**实测发现的两个真实问题**

1. Safari 扩展里一直跑的是旧构建：`.build/1/browser.js` 还是 v1.2.0，`@match` 只有 github/raw/script-hub，所以根本不会在 `script.hub` 上执行。改完 `browser.tsx` 必须重新运行一次项目才会重建。
2. Script Hub 的导入链接带 `target="_blank"`，iOS Safari 在新建标签页里打开自定义协议会直接报“网址无效”。模块里加了一条规则把它去掉：

```ini
http-response ^https?:// (:href="[^"]*SurgeModuleTool[^"]*")\s+target="_blank" $1
```

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
3. Safari 打开 `https://script.hub`，选脚本 → 「导入 Surge(本地模块 需配合 Scriptable)」

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
