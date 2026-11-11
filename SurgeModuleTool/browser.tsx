// @ts-nocheck
// ==UserScript==
// @name         Scriptable → Scripting 链接跳转
// @namespace    surge-module-tool
// @version      1.4.0
// @description  把 Script Hub 等页面里的 scriptable:// 安装链接改写为 scripting://
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// 用户脚本只在本地改写 <a>，不发起网络请求。
(function () {
  "use strict"

  var RULES = [
    ["scriptable:///run_single/", "scripting://run_single/"],
    ["scriptable:///run/", "scripting://run/"],
    ["scriptable:///", "scripting://"],
    ["scriptable://", "scripting://"]
  ]

  function convert(value) {
    if (!value || typeof value !== "string" || value.indexOf("scriptable:") === -1) return value
    var result = value
    for (var i = 0; i < RULES.length; i++) result = result.split(RULES[i][0]).join(RULES[i][1])
    return result
  }

  function rewriteOne(el) {
    if (!el || el.tagName !== "A") return
    var raw = el.getAttribute("href")
    if (!raw || raw.indexOf("scriptable:") === -1) return
    el.setAttribute("href", convert(raw))
  }

  function rewrite(root) {
    if (!root || !root.querySelectorAll) return
    var list = root.querySelectorAll('a[href*="scriptable:"], area[href*="scriptable:"]')
    for (var i = 0; i < list.length; i++) rewriteOne(list[i])
  }

  // 捕获阶段兜底：Script Hub 是 Vue 绑定 href，可能在渲染后才写入
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
        continue
      }
      var added = record.addedNodes
      for (var j = 0; j < added.length; j++) {
        var node = added[j]
        if (node.nodeType === 1) {
          rewriteOne(node)
          rewrite(node)
        }
      }
    }
  })

  var rawOpen = window.open
  window.open = function (url) {
    var args = Array.prototype.slice.call(arguments)
    if (typeof url === "string") args[0] = convert(url)
    return rawOpen.apply(window, args)
  }

  function start() {
    rewrite(document)
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
