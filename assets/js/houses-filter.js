/* 房源列表静态筛选：接管 /houses 页面的筛选与排序，全部在前端完成
   注意：该页为静态快照，React 水合会重建 DOM，因此所有节点必须动态获取，并在 DOM 变化后重新应用。 */
(function () {
  var num = function (t) { return parseFloat(String(t).replace(/[^\d.]/g, "")) || 0; };
  var TYPE_MAP = { "全部": "all", "二手房": "sale", "租房": "rent", "新房": "new" };
  var state = { type: "all", district: "", room: "", priceMin: null, priceMax: null, areaMin: null, areaMax: null, sort: "default" };
  var applying = false;

  function page() { return document.querySelector(".houses-page"); }
  function grid() { return document.querySelector(".houses-grid"); }
  function countStrong() { return document.querySelector(".houses-count strong"); }

  function readCards() {
    var g = grid();
    if (!g) return [];
    return Array.prototype.map.call(g.querySelectorAll(".prop-card"), function (el, index) {
      var regionEl = el.querySelector(".prop-title span");
      var metas = Array.prototype.map.call(el.querySelectorAll(".prop-meta li span"), function (s) { return s.textContent.trim(); });
      var roomsText = metas.filter(function (t) { return /室/.test(t); })[0] || "";
      var areaText = metas.filter(function (t) { return /㎡/.test(t); })[0] || "";
      var priceLabel = (el.querySelector(".prop-price span") || {}).textContent || "";
      var priceRaw = (el.querySelector(".prop-price strong") || {}).textContent || "";
      var text = el.textContent || "";
      var isRent = /月租/.test(priceLabel);
      return {
        el: el, index: index,
        region: (regionEl ? regionEl.textContent : "").trim(),
        rooms: parseInt(roomsText, 10) || 0,
        area: num(areaText),
        isRent: isRent,
        priceWan: isRent ? NaN : num(priceRaw),
        type: isRent ? "rent" : (/新房/.test(text) ? "new" : "sale"),
        updated: (function () { var m = text.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? Number(m[1] + m[2] + m[3]) : 0; })()
      };
    });
  }

  function parseRange(label) {
    var nums = (label.match(/\d+/g) || []).map(Number);
    if (/以下/.test(label)) return { min: null, max: nums[0] };
    if (/以上/.test(label)) return { min: nums[0], max: null };
    if (nums.length >= 2) return { min: nums[0], max: nums[1] };
    return { min: null, max: null };
  }

  function ensureEmpty() {
    var g = grid();
    if (!g) return null;
    var el = g.querySelector(".houses-empty");
    if (!el) {
      el = document.createElement("p");
      el.className = "houses-empty";
      el.textContent = "没有符合当前筛选条件的房源，请调整条件后重试。";
      el.style.cssText = "grid-column:1/-1;padding:48px 0;text-align:center;color:#8b8378;";
      g.appendChild(el);
    }
    return el;
  }

  function apply() {
    if (applying) return;
    applying = true;
    var cards = readCards();
    if (!cards.length) { applying = false; return; }

    var shown = 0;
    cards.forEach(function (c) {
      var ok = true;
      if (state.type !== "all" && c.type !== state.type) ok = false;
      if (state.district && c.region !== state.district) ok = false;
      if (state.room) {
        if (state.room === "5+") { if (c.rooms < 5) ok = false; }
        else if (c.rooms !== Number(state.room)) ok = false;
      }
      if (state.priceMin != null || state.priceMax != null) {
        if (c.isRent) ok = false;
        else {
          if (state.priceMin != null && c.priceWan < state.priceMin) ok = false;
          if (state.priceMax != null && c.priceWan > state.priceMax) ok = false;
        }
      }
      if (state.areaMin != null && c.area < state.areaMin) ok = false;
      if (state.areaMax != null && c.area > state.areaMax) ok = false;
      c.el.hidden = !ok;
      if (ok) shown += 1;
    });

    var sorted = cards.slice();
    if (state.sort === "price-asc") sorted.sort(function (a, b) { return (a.isRent ? 1e12 : a.priceWan) - (b.isRent ? 1e12 : b.priceWan); });
    else if (state.sort === "price-desc") sorted.sort(function (a, b) { return (a.isRent ? -1 : a.priceWan) - (b.isRent ? -1 : b.priceWan); });
    else if (state.sort === "area-desc") sorted.sort(function (a, b) { return b.area - a.area; });
    else if (state.sort === "updated-desc") sorted.sort(function (a, b) { return b.updated - a.updated; });
    else sorted.sort(function (a, b) { return a.index - b.index; });

    var g = grid();
    if (g) sorted.forEach(function (c) { g.appendChild(c.el); });

    var empty = ensureEmpty();
    if (empty) empty.hidden = shown !== 0;

    var strong = countStrong();
    if (strong) strong.textContent = String(shown);

    var pag = page() && page().querySelector(".houses-pagination");
    if (pag) pag.style.display = "none";

    setTimeout(function () { applying = false; }, 0);
  }

  function syncChips() {
    var p = page();
    if (!p) return;
    function sameRange(label, min, max) {
      var r = parseRange(label);
      return r.min === min && r.max === max && (min != null || max != null);
    }
    Array.prototype.forEach.call(p.querySelectorAll(".houses-filter-form"), function (form) {
      Array.prototype.forEach.call(form.querySelectorAll(".houses-filter-block"), function (block) {
        var title = (block.querySelector(".houses-filter-title") || {}).textContent || "";
        Array.prototype.forEach.call(block.querySelectorAll(".houses-chip"), function (chip) {
          var label = chip.textContent.trim();
          var on = false;
          if (title.indexOf("类型") >= 0) on = (TYPE_MAP[label] || "all") === state.type;
          else if (title.indexOf("区域") >= 0) on = !!state.district && state.district === label;
          else if (title.indexOf("价格") >= 0) on = sameRange(label, state.priceMin, state.priceMax);
          else if (title.indexOf("面积") >= 0) on = sameRange(label, state.areaMin, state.areaMax);
          else if (title.indexOf("户型") >= 0) {
            if (label === "不限") on = !state.room;
            else if (/及以上/.test(label)) on = state.room === "5+";
            else on = state.room === String(parseInt(label, 10));
          }
          chip.classList.toggle("is-active", on);
          chip.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
      var map = { "price-min": state.priceMin, "price-max": state.priceMax, "area-min": state.areaMin, "area-max": state.areaMax };
      Object.keys(map).forEach(function (k) {
        var input = form.querySelector("input[id$='" + k + "']");
        if (input) input.value = map[k] == null ? "" : String(map[k]);
      });
    });
  }

  function refresh() { syncChips(); apply(); }

  function initFromUrl() {
    var q = new URLSearchParams(location.search);
    var t = q.get("type");
    if (t && TYPE_MAP[["全部", "二手房", "租房", "新房"].filter(function (k) { return TYPE_MAP[k] === t; })[0]]) state.type = t;
    if (q.get("district")) state.district = q.get("district");
    if (q.get("rooms")) state.room = /5\+|50/.test(q.get("rooms")) ? "5+" : q.get("rooms");
    if (q.get("minPrice")) state.priceMin = Number(q.get("minPrice")) / 10000;
    if (q.get("maxPrice")) state.priceMax = Number(q.get("maxPrice")) / 10000;
  }

  document.addEventListener("click", function (e) {
    var p = page();
    if (!p) return;
    var chip = e.target.closest && e.target.closest(".houses-chip");
    if (chip && p.contains(chip)) {
      e.preventDefault(); e.stopPropagation();
      var block = chip.closest(".houses-filter-block");
      var title = (block.querySelector(".houses-filter-title") || {}).textContent || "";
      var label = chip.textContent.trim();
      if (title.indexOf("类型") >= 0) state.type = TYPE_MAP[label] || "all";
      else if (title.indexOf("区域") >= 0) state.district = state.district === label ? "" : label;
      else if (title.indexOf("价格") >= 0) { var pr = parseRange(label); state.priceMin = pr.min; state.priceMax = pr.max; }
      else if (title.indexOf("面积") >= 0) { var ar = parseRange(label); state.areaMin = ar.min; state.areaMax = ar.max; }
      else if (title.indexOf("户型") >= 0) {
        if (label === "不限") state.room = "";
        else if (/及以上/.test(label)) state.room = "5+";
        else state.room = state.room === String(parseInt(label, 10)) ? "" : String(parseInt(label, 10));
      }
      refresh();
      return;
    }

    var applyBtn = e.target.closest && e.target.closest(".houses-filter-form button");
    if (applyBtn && p.contains(applyBtn) && /应用/.test(applyBtn.textContent)) {
      e.preventDefault(); e.stopPropagation();
      var form = applyBtn.closest(".houses-filter-form");
      var isPrice = /价格/.test(applyBtn.textContent);
      var minEl = form.querySelector("input[id$='" + (isPrice ? "price" : "area") + "-min']");
      var maxEl = form.querySelector("input[id$='" + (isPrice ? "price" : "area") + "-max']");
      var min = minEl && minEl.value !== "" ? Number(minEl.value) : null;
      var max = maxEl && maxEl.value !== "" ? Number(maxEl.value) : null;
      if (min != null && max != null && min > max) { var tmp = min; min = max; max = tmp; }
      if (isPrice) { state.priceMin = min; state.priceMax = max; } else { state.areaMin = min; state.areaMax = max; }
      refresh();
    }
  }, true);

  document.addEventListener("change", function (e) {
    var sel = e.target.closest && e.target.closest(".houses-sort__select");
    if (sel && page() && page().contains(sel)) {
      e.stopPropagation();
      state.sort = sel.value;
      apply();
    }
  }, true);

  function boot() {
    initFromUrl();
    refresh();
    // React 水合失败会重建 DOM，稍后重新应用（不使用 MutationObserver，避免自触发循环）
    [300, 1000, 2500, 4000].forEach(function (ms) { setTimeout(refresh, ms); });
    window.addEventListener("load", function () { setTimeout(refresh, 200); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
