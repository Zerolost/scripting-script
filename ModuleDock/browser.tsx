// ==UserScript==
// @name         Scriptable → Scripting 链接跳转
// @namespace    module-tool
// @version      1.7.0
// @description  把 Script Hub 页面里的 scriptable:// 安装链接改写为 scripting://，并为 Loon / Stash / Shadowrocket 补上“本地模块”入口
// @match        *://*/*
// @run-at       document-start
// @inject-into  content
// @grant        none
// ==/UserScript==

// @ts-nocheck
// 注意：@ts-nocheck 必须放在元数据块之后，否则 userscript 无法识别 @match。

// 用户脚本只在本地改写 <a>，不发起网络请求。
(function () {
  "use strict"

  var SCRIPT_URL = "scripting://run/ModuleDock?"

  var RULES = [
    ["scriptable:///run_single/", "scripting://run_single/"],
    ["scriptable:///run/", "scripting://run/"],
    ["scriptable:///", "scripting://"],
    ["scriptable://", "scripting://"]
  ]

  // 本脚本的本地模块入口
  var LOCAL_RULES = [
    {
      match: "https://www.nsloon.com/openloon/import?plugin=",
      target: "loon-plugin",
      label: "导入 Loon(本地插件 需配合 Scripting)"
    },
    {
      match: "stash://install-override?url=",
      target: "stash-stoverride",
      label: "导入 Stash(本地覆写 需配合 Scripting)"
    },
    {
      match: "https://api.boxjs.app/shadowrocket/install?module=",
      target: "shadowrocket-module",
      label: "导入 Shadowrocket(本地模块 需配合 Scripting)"
    }
  ]

  /** 已注入的本地模块链接 */
  var injected = []

  function convert(value) {
    if (!value || typeof value !== "string" || value.indexOf("scriptable:") === -1) return value
    var result = value
    for (var i = 0; i < RULES.length; i++) result = result.split(RULES[i][0]).join(RULES[i][1])
    return result
  }

  /** 注脚：去掉远程导入按钮的 target="_blank"，否则 iOS Safari 会在新标签页里打开自定义协议 */
  function fixTarget(el) {
    if (!el || el.tagName !== "A") return
    var href = el.getAttribute("href") || ""
    if (!/^(https?:\/\/(www\.nsloon\.com\/openloon\/import|api\.boxjs\.app\/shadowrocket\/install)|stash:\/\/install-override)/i.test(href)) return
    if (el.getAttribute("target") === "_blank") el.removeAttribute("target")
  }

  function rewriteOne(el) {
    if (!el || el.tagName !== "A") return
    fixTarget(el)
    var raw = el.getAttribute("href")
    if (!raw || raw.indexOf("scriptable:") === -1) return
    el.setAttribute("href", convert(raw))
  }

  function rewrite(root) {
    if (!root || !root.querySelectorAll) return
    var list = root.querySelectorAll('a[href*="scriptable:"], area[href*="scriptable:"]')
    for (var i = 0; i < list.length; i++) rewriteOne(list[i])
  }

  /** 修正三个远程导入按钮的 target */
  function fixTargets(root) {
    if (!root || !root.querySelectorAll) return
    var list = root.querySelectorAll("a[href]")
    for (var i = 0; i < list.length; i++) fixTarget(list[i])
  }

  /** 从转换结果里取出文件名主干 */
  function fileNameOf(payload) {
    try {
      var decoded = decodeURIComponent(payload)
      var parts = decoded.split("/_end_/")
      if (parts.length < 2) return ""
      var name = parts[1].split("?")[0]
      return name.replace(/\.(sgmodule|plugin|stoverride|module|list)$/i, "")
    } catch (error) {
      return ""
    }
  }

  /** 拼出带 target 的本地模块调用链接 */
  function buildLocalHref(payload, rule) {
    if (!payload) return ""
    var decoded
    try {
      decoded = decodeURIComponent(payload)
    } catch (error) {
      return ""
    }
    if (!/^https?:\/\//i.test(decoded)) return ""
    var query = "url=" + payload + "&target=" + rule.target
    var name = fileNameOf(payload)
    if (name) query += "&name=" + encodeURIComponent(name)
    return SCRIPT_URL + query
  }

  function findInjected(anchor) {
    for (var i = 0; i < injected.length; i++) {
      if (injected[i].anchor === anchor) return injected[i]
    }
    return null
  }

  function removeInjected(anchor) {
    for (var i = injected.length - 1; i >= 0; i--) {
      if (injected[i].anchor === anchor) {
        var node = injected[i].node
        if (node && node.parentNode) node.parentNode.removeChild(node)
        injected.splice(i, 1)
      }
    }
  }

  /** 注脚：页面已经由响应脚本注入过同名按钮时，不再重复注入 */
  function pageAlreadyInjected(rule) {
    var list = document.querySelectorAll('a[href^="scripting://run/ModuleDock?target=' + rule.target + '"]')
    for (var i = 0; i < list.length; i++) {
      if (list[i].getAttribute("data-smt-local") !== "1") return true
    }
    return false
  }

  /** Loon / Stash / Shadowrocket 远程导入按钮旁的本地模块链接 */
  function syncLocal(anchor) {
    if (!anchor || anchor.tagName !== "A") return
    fixTarget(anchor)
    if (anchor.getAttribute("data-smt-local") === "1") return
    var href = anchor.getAttribute("href") || ""
    var rule = null
    for (var i = 0; i < LOCAL_RULES.length; i++) {
      if (href.indexOf(LOCAL_RULES[i].match) === 0) {
        rule = LOCAL_RULES[i]
        break
      }
    }
    if (!rule) {
      removeInjected(anchor)
      return
    }
    if (pageAlreadyInjected(rule)) {
      removeInjected(anchor)
      return
    }
    var target = buildLocalHref(href.slice(rule.match.length), rule)
    if (!target) {
      removeInjected(anchor)
      return
    }

    var entry = findInjected(anchor)
    if (!entry) {
      var node = document.createElement("a")
      node.setAttribute("data-smt-local", "1")
      node.textContent = rule.label
      node.style.cssText = "margin: 0 0.5rem 0 0; font-weight: 600;"
      anchor.insertAdjacentElement("afterend", node)
      entry = { anchor: anchor, node: node }
      injected.push(entry)
    }
    if (entry.node.getAttribute("href") !== target) {
      entry.node.setAttribute("href", target)
    }
  }

  function syncLocalTree(root) {
    if (!root || !root.querySelectorAll) return
    if (root.tagName === "A") syncLocal(root)
    var list = root.querySelectorAll("a[href]")
    for (var i = 0; i < list.length; i++) syncLocal(list[i])
  }

  /** 页面重新渲染后，清掉已经没有宿主按钮的注入链接 */
  function cleanupOrphans() {
    for (var i = injected.length - 1; i >= 0; i--) {
      if (!injected[i].anchor.isConnected) {
        var node = injected[i].node
        if (node && node.parentNode) node.parentNode.removeChild(node)
        injected.splice(i, 1)
      }
    }
  }

  /** 响应脚本已经注入同文案按钮时，移除浏览器脚本的重复节点 */
  function dedupeLocal() {
    for (var i = injected.length - 1; i >= 0; i--) {
      var node = injected[i].node
      if (!node || !node.parentNode) {
        injected.splice(i, 1)
        continue
      }
      var label = node.textContent
      var list = node.parentNode.querySelectorAll("a")
      var count = 0
      for (var j = 0; j < list.length; j++) {
        if (list[j].textContent === label) count += 1
      }
      if (count > 1) {
        node.parentNode.removeChild(node)
        injected.splice(i, 1)
      }
    }
  }

  // 捕获阶段兜底 + 注脚：Script Hub 是 Vue 绑定 href，可能在渲染后才写入
  function onClick(event) {
    var node = event.target
    while (node && node !== document) {
      if (node.tagName === "A") {
        var href = node.getAttribute("href")
        if (href && href.indexOf("scriptable:") !== -1) {
          event.preventDefault()
          event.stopPropagation()
          window.location.href = convert(href)
          return
        }
      }
      node = node.parentNode
    }
  }

  var observer = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var record = records[i]
      if (record.type === "attributes") {
        rewriteOne(record.target)
        syncLocal(record.target)
        continue
      }
      var added = record.addedNodes
      for (var j = 0; j < added.length; j++) {
        var node = added[j]
        if (node.nodeType === 1) {
          rewriteOne(node)
          rewrite(node)
          fixTargets(node)
          syncLocalTree(node)
        }
      }
    }
    cleanupOrphans()
    dedupeLocal()
  })

  var rawOpen = window.open
  window.open = function (url) {
    var args = Array.prototype.slice.call(arguments)
    if (typeof url === "string") args[0] = convert(url)
    return rawOpen.apply(window, args)
  }

  function start() {
    rewrite(document)
    fixTargets(document)
    syncLocalTree(document)
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href"]
      })
    }
    document.addEventListener("click", onClick, true)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true })
  } else {
    start()
  }
})()
