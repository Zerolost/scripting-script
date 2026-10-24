# 开发与检查

运行入口保持轻量：页面放在 `pages/`，可复用展示放在 `components/`，状态与计时放在 `hooks/`，请求和业务计算放在 `services/`。新增逻辑尽量与绘制分离，便于单独检查。

## 数据加载

仓库、工作流和运行任务按每页 100 条继续读取，按 ID 去重并保留返回顺序。后续页失败会让本次加载失败，避免将不完整结果写入缓存。运行记录仍只显示最近 50 条。

详情请求串行轮询，每轮结束后等待十秒；运行与已加载任务都结束后停止。空任务继续确认，关闭详情页会清理计时和阻止迟到响应写入。快照未变化时不更新父页面，耗时区域以独立十秒计时刷新。

`MotionText` 保留原生文字属性，直接传入的字号、字重、行数和布局优先于旧 `style` 映射；未指定时继续使用统一文字过渡和动画。宿主的主要与辅助文字颜色仍生效。

## 逻辑检查

在项目根目录执行所需检查：

```sh
scripting-ts run services/githubPagination.check.ts
scripting-ts run services/runDetailContent.check.ts
scripting-ts run services/flowTransfer.check.ts
scripting-ts run services/ActionRepositories.check.ts
scripting-ts run services/widgetTargetStore.test.ts
```

检查输出中的 `passed` 必须为 `true`；脚本退出码为零不代表断言通过。流程几何与时序检查不能证明实机帧率或视觉效果。项目不要求执行页面预览与截图。

当前类型检查仍有七项既有诊断，位于 `AppModel.tsx` 和 `widgetGitHub.ts`，涉及网络 API 声明缺失及回调推断。新增代码不能增加此基线；网络接口实现仍需遵循 Scripting 官方文档。

## 发布

集合仓库将本项目放在 `github-actions/`，根目录 README 维护项目索引。发布只包含脚本、组件、检查和使用文档；钥匙串凭据、备份及本地发布辅助程序保留在项目外。更新现有分支前检查远程版本，保留其他项目目录。
