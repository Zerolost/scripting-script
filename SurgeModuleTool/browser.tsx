// @ts-nocheck
// ==UserScript==
// @name         Scriptable → Scripting 链接跳转
// @namespace    surge-module-tool
// @version      1.3.0
// @description  把网页里的 scriptable:// 安装/调用链接改写为 scripting://
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// 用户脚本只在本地改写 <a>，不发起任何网络请求；@match 放宽以保证任意站点都能生效。
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

  function rewrite(root) {
    if (!root || !root.querySelectorAll) return
    var list = root.querySelectorAll('a[href*="scriptable:"], area[href*="scriptable:"]')
    for (var i = 0; i < list.length; i++) {
      var raw = list[i].getAttribute("href")
      var next = convert(raw)
      if (next !== raw) list[i].setAttribute("href", next)
    }
  }

  // 点击前兜底改写一次
  function onClick(event) {
    var node = event.target
    while (node && node !== document) {
      if (node.tagName === "A" && node.href && String(node.href).indexOf("scriptable:") !== -1) {
        node.setAttribute("href", convert(node.getAttribute("href")))
        return
      }
      node = node.parentNode
    }
  }

  var observer = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes
      for (var j = 0; j < added.length; j++) {
        if (added[j].nodeType === 1) rewrite(added[j])
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
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true })
    document.addEventListener("click", onClick, true)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true })
  } else {
    start()
  }
})()
