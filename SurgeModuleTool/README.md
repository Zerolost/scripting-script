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

`browser.tsx` 由 Scripting 构建为 Safari 浏览器脚本，`@match` 只覆盖脚本分发站点：

- `github.com` / `gist.github.com`
- `raw.githubusercontent.com` / `gist.githubusercontent.com`
- `script-hub.netlify.app`
- `*.github.io`

仅改写页面里的 `scriptable://` 链接，不注入 UI。

## Surge 模块

仓库内附带 `Scriptable2Scripting.sgmodule`，MITM 只针对上述站点，不使用全局 `*`：

```ini
[MITM]
hostname = %APPEND% script-hub.netlify.app, raw.githubusercontent.com, gist.githubusercontent.com, github.com, gist.github.com, *.github.io
```

安装：

```text
https://raw.githubusercontent.com/Zerolost/scripting-script/main/SurgeModuleTool/Scriptable2Scripting.sgmodule
```

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
