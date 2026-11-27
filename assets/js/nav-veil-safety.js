/* 页面切换遮罩兜底：防止 .page-veil 在客户端导航失败时无限残留。
 *
 * 背景：站内点击链接时 SiteChrome 给 <html> 加 veil-in 显示切换遮罩，
 * 正常情况下 pathname 变化后会加 veil-out 并在约 1.1s 后移除。
 * 但在静态托管（GitHub Pages）上，Next.js 的客户端 RSC 拉取可能失败/挂起，
 * 导致 pathname 不变、收起逻辑永不触发，遮罩一直卡在「只有图标、没有进度条」。
 *
 * 本脚本只做兜底，不改变正常导航行为：
 *   1. 捕获阶段记录最近一次站内跳转目标；
 *   2. 轮询：若 veil-in 超过阈值仍未消失，清除遮罩并在已知目标时回退为整页跳转；
 *   3. 页面从 bfcache 恢复或初次载入时清理任何残留遮罩状态。
 */
(function () {
  var MAX_MS = 3000;      // 软导航最长等待，超过则判定卡住
  var FALLBACK_MS = 4200; // 无条件兜底：veil-in 存在超过此时长必定清除

  var pending = null;     // { dest: string, ts: number }
  var veilSince = 0;

  function htmlEl() { return document.documentElement; }

  function clearVeil() {
    var h = htmlEl();
    h.classList.remove("veil-in");
    h.classList.remove("veil-out");
  }

  function currentPath() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  // 捕获阶段记录最近一次站内跳转目标（先于 SiteChrome 的冒泡监听）
  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a) return;
    var raw = a.getAttribute("href");
    if (!raw || raw.charAt(0) === "#" || raw.indexOf("tel:") === 0 || raw.indexOf("mailto:") === 0 ||
        a.target === "_blank" || a.hasAttribute("download")) return;
    var url;
    try { url = new URL(raw, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;
    pending = { dest: url.pathname + url.search + url.hash, ts: Date.now() };
  }, true);

  function tick() {
    var h = htmlEl();
    var stuck = h.classList.contains("veil-in");
    if (!stuck) {
      veilSince = 0;
      pending = null;
      return;
    }
    var now = Date.now();
    if (!veilSince) veilSince = now;

    // 1) 已知目标且超时未到达 → 清除遮罩并整页跳转，确保用户到达目标页
    if (pending && now - pending.ts >= MAX_MS) {
      var dest = pending.dest;
      pending = null;
      clearVeil();
      if (currentPath() !== dest) {
        window.location.href = dest;
      }
      return;
    }
    // 2) 无条件兜底，避免任何残留遮罩
    if (now - veilSince >= FALLBACK_MS) {
      clearVeil();
      veilSince = 0;
    }
  }
  setInterval(tick, 500);

  // 初次载入 / 从 bfcache 恢复时，清理可能残留的遮罩状态
  function reset() { pending = null; veilSince = 0; clearVeil(); }
  window.addEventListener("pageshow", reset);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reset);
  } else {
    reset();
  }
})();
