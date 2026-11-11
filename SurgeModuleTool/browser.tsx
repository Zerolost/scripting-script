// @ts-nocheck
// ==UserScript==
// @name         Scriptable → Scripting 链接跳转
// @namespace    surge-module-tool
// @version      1.2.0
// @description  精准改写安装/调用页面中的 scriptable:// 链接为 scripting://
// @match        https://github.com/*
// @match        https://raw.githubusercontent.com/*
// @match        https://gist.github.com/*
// @match        https://script-hub.netlify.app/*
// @match        https://*.github.io/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// 精准匹配：只在明确会给出 Scriptable 安装/调用链接的页面生效
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

  // 点击前再改写一次，覆盖未走 MutationObserver 的动态链接
  function onClick(event) {
    var node = event.target
    while (node && node !== document) {
      if (node.tagName === "A" && node.href && String(node.href).indexOf("scriptable:") !== -1) {
        var target = convert(node.getAttribute("href"))
        node.setAttribute("href", target)
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
