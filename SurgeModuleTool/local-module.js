/**
 * Script-Hub 页面增强：给 Loon / Stash / Shadowrocket 的远程导入按钮
 * 各补一个“本地模块（需配合 Scripting）”按钮。
 *
 * 由 Surge / Loon / Stash / Shadowrocket 的 http-response 脚本调用，
 * 只改响应体里的 Vue 模板，不发起任何网络请求。
 */
(function () {
  var RULES = [
    {
      key: "openloon/import?plugin=' + encodeURIComponent(result)",
      condition: "result && target === 'loon-plugin'",
      target: "loon-plugin",
      label: "导入 Loon(本地插件 需配合 Scripting)"
    },
    {
      key: "stash://install-override?url=' + encodeURIComponent(result)",
      condition: "result && target === 'stash-stoverride'",
      target: "stash-stoverride",
      label: "导入 Stash(本地覆写 需配合 Scripting)"
    },
    {
      key: "shadowrocket/install?module=' + encodeURIComponent(result)",
      condition: "result && target === 'shadowrocket-module'",
      target: "shadowrocket-module",
      label: "导入 Shadowrocket(本地模块 需配合 Scripting)"
    }
  ]

  /** 生成与页面同风格的 Vue 锚点 */
  function buildAnchor(rule) {
    var href =
      "'scripting://run/SurgeModuleTool?target=" +
      rule.target +
      "&url=' + encodeURIComponent(result) + '&name=' + encodeURIComponent(filename)"
    return (
      '<a v-if="' +
      rule.condition +
      '" :href="' +
      href +
      '" style="margin: 0 0.5rem 0 0; font-weight: 600;">' +
      rule.label +
      "</a>"
    )
  }

  /** 在远程导入按钮后面插入本地模块按钮 */
  function inject(html, rule) {
    if (html.indexOf(rule.label) !== -1) {
      return html
    }
    var start = html.indexOf(rule.key)
    if (start < 0) {
      return html
    }
    var close = html.indexOf("</a>", start)
    if (close < 0) {
      return html
    }
    var end = close + 4
    return html.slice(0, end) + buildAnchor(rule) + html.slice(end)
  }

  var body = typeof $response !== "undefined" && $response ? $response.body : null
  if (!body || typeof body !== "string") {
    $done({})
    return
  }

  var output = body
  for (var i = 0; i < RULES.length; i++) {
    output = inject(output, RULES[i])
  }

  if (output === body) {
    $done({})
    return
  }
  $done({ body: output })
})()
