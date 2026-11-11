# Surge 模块工具（Scripting 版）

Surge 本地模块批量更新器，内置 `scriptable:// → scripting://` 的 Safari 浏览器脚本。

## 导入

在 Scripting 中导入项目目录：

```text
https://github.com/Zerolost/scripting-script/tree/main/SurgeModuleTool
```

## 功能

| 功能 | 说明 |
| --- | --- |
| 更新全部 | 扫描模块目录，逐个读取 `#SUBSCRIBED` 并回写最新内容 |
| 更新单个 | 模块详情页单独更新，可分享到 Surge |
| 从链接安装 | 下载远端模块并保存为本地 `.sgmodule` |
| URL Scheme | `scripting://run/SurgeModuleTool?url=&name=` 直接安装 |
| 目录书签 | 选一次目录，之后跨启动可读写 |
| 重载 Surge | 请求 `http://script.hub/reload` |

更新算法与 Script-Hub 的 `SurgeModuleTool.js` 一致：

1. 读取 `#SUBSCRIBED <url>`
2. 下载远端内容并校验 `#!name`
3. 移除旧的 `#SUBSCRIBED` 与 `# 🔗 模块链接` 区块
4. 在最后一条 `#!` 指令后插入新的链接区块
5. `#!desc` 写入 `🔗 [时间] 原描述`
6. 回写文件；扫描跳过 `.conf / .txt / .js / .list`

## 内置浏览器脚本

项目自带 `browser.tsx`，Scripting 会把它构建为 Safari 浏览器脚本。在 Safari 扩展里启用即可：

- 捕获阶段拦截 `scriptable://` 点击并改写为 `scripting://`
- 改写页面内已有链接，右键复制也是 `scripting://`
- `MutationObserver` 处理动态插入
- 重写 `window.open`

> 原生 App 直接调用 `UIApplication.open("scriptable://")` 无法拦截（非越狱限制）。

## 结构

```
index.tsx                入口：解析 queryParameters
app.tsx                  内部路由与全局提示
browser.tsx              内置 Safari 浏览器脚本
pages/                   首页 / 添加 / 详情 / 设置
components/              GlassCard、ModuleRow、StatusBadge、StatTile、ToastHost
contexts/                全局状态 + Toast 独立上下文
services/                更新、目录、设置
utils/                   模块解析与格式化（纯函数）
design/AllPatternDesign  Liquid Glass 与动效令牌
tests/logic.test.ts      逻辑回归
```

## 设计

- iOS 26 Liquid Glass（`UIGlass.regular()` + `glassEffect`），实例已缓存
- 全屏渐变背景，导航栏背景隐藏
- 顶部 ToolBar：父页左侧关闭，子页左侧返回，右侧固定刷新
- 卡片统一铺满并左对齐；按钮与文本不使用居中排版
- 文本、数字、图标、卡片和列表均有动画
- 列表 `LazyVStack`、目录扫描 4 路并发、Toast 独立 Context

## 校验

- TypeScript 诊断：0 项
- `scripting-ts run tests/logic.test.ts`：22 项通过
