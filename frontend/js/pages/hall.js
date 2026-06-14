/* =====================================================
   pages/hall.js  — 竞赛大厅页
===================================================== */
router.register('hall', async (el, params = {}) => {
  let hallPage = 1;
  const perPage = 8;
  let filterCat = params.cat || '';
  let filterLevel = '';
  let filterStatus = '';
  let keyword = params.keyword || '';

  // 回填 sessionStorage 中的筛选状态（首页跳转时传递）
  if (!keyword) keyword = sessionStorage.getItem('searchKeyword') || '';
  if (!filterCat) filterCat = sessionStorage.getItem('filterCategory') || '';
  sessionStorage.removeItem('searchKeyword');
  sessionStorage.removeItem('filterCategory');
  sessionStorage.removeItem('filterLevel');

  el.innerHTML = buildHallLayout();

  try {
    const cats = await API.Category.list();
    window.__categoryNamesById = {};
    if (Array.isArray(cats)) {
      cats.forEach((x) => {
        if (x && x.id != null && x.name != null) {
          const nm = String(x.name).trim();
          if (nm && !isCorruptCategoryLabel(nm)) window.__categoryNamesById[x.id] = nm;
        }
      });
    }
  } catch (e) {
    window.__categoryNamesById = window.__categoryNamesById || {};
  }

  // 回填搜索词
  if (keyword) {
    const inp = document.getElementById('hallSearchInp');
    if (inp) inp.value = keyword;
  }
  // 回填分类
  if (filterCat) {
    document.querySelectorAll('#hallCatFilter .tag-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === filterCat);
    });
  }

  // 尝试从后端加载最新竞赛数据，后端不可用时使用 DB_COMPS 兜底
  let _hallComps = [...DB_COMPS];
  try {
    const result = await API.Competition.list(1, 500);
    if (result && result.records && result.records.length > 0) {
      _hallComps = result.records.map(c => {
        const endRaw = getCompetitionEndDateValue(c);
        const startRaw = getCompetitionStartDateValue(c);
        return {
          ...c,
          catName: getCompetitionCategoryLabel(c),
          endDate: endRaw ? String(endRaw).slice(0, 10) : null,
          startDate: startRaw ? String(startRaw).slice(0, 10) : null,
        };
      }).filter(isHallCompetitionDisplayable);
    }
  } catch (e) {
    // 后端不可用，使用本地数据
  }

  renderHallGrid();

  function getFiltered() {
    let list = [..._hallComps];
    if (keyword)     list = list.filter(c => c.title.includes(keyword) || (c.organizer && c.organizer.includes(keyword)));
    if (filterCat)   list = list.filter(c => (c.catName || c.categoryName) === filterCat);
    if (filterLevel) list = list.filter(c => getCompetitionLevelLabel(c) === filterLevel);
    if (filterStatus === 'open')    list = list.filter(c => {
      const end = getCompetitionEndDateValue(c) || c.endDate;
      return end && daysLeft(end) > 7;
    });
    if (filterStatus === 'closing') list = list.filter(c => {
      const end = getCompetitionEndDateValue(c) || c.endDate;
      if (!end) return false;
      const d = daysLeft(end);
      return d >= 0 && d <= 7;
    });
    if (filterStatus === 'over')    list = list.filter(c => {
      const end = getCompetitionEndDateValue(c) || c.endDate;
      return end && daysLeft(end) < 0;
    });
    return list;
  }

  function renderHallGrid() {
    const list  = getFiltered();
    const total = list.length;
    const slice = list.slice((hallPage - 1) * perPage, hallPage * perPage);
    const grid  = document.getElementById('hallGrid');
    const pager = document.getElementById('hallPager');
    const cnt   = document.getElementById('hallCount');
    if (cnt) cnt.textContent = `共 ${total} 条`;
    if (grid) {
      grid.innerHTML = slice.length
        ? slice.map(CompCard).join('')
        : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">没有找到相关竞赛</div><div class="empty-desc">换个关键词或筛选条件试试</div></div>`;
    }
    if (pager) {
      const pages = Math.ceil(total / perPage);
      let html = '';
      html += `<div class="page-btn" onclick="hallPageFn(${hallPage-1})" ${hallPage===1?'style="opacity:.4"':''}>‹</div>`;
      for (let i = 1; i <= pages; i++) html += `<div class="page-btn${i===hallPage?' active':''}" onclick="hallPageFn(${i})">${i}</div>`;
      html += `<div class="page-btn" onclick="hallPageFn(${hallPage+1})" ${hallPage===pages?'style="opacity:.4"':''}>›</div>`;
      pager.innerHTML = html;
    }
  }

  // 暴露给内联 onclick
  window.hallPageFn = (p) => {
    const pages = Math.ceil(getFiltered().length / perPage);
    if (p < 1 || p > pages) return;
    hallPage = p;
    renderHallGrid();
    document.getElementById('hallGrid')?.scrollIntoView({ behavior:'smooth', block:'start' });
  };
  window.hallSearch = () => {
    keyword = document.getElementById('hallSearchInp')?.value.trim() || '';
    hallPage = 1; renderHallGrid();
  };
  window.hallCatFilter = (el, cat) => {
    filterCat = cat;
    hallPage = 1;
    document.querySelectorAll('#hallCatFilter .tag-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    renderHallGrid();
  };
  window.hallLevelFilter = (el, level) => {
    filterLevel = el.value;
    hallPage = 1; renderHallGrid();
  };
  window.hallStatusFilter = (el, status) => {
    filterStatus = status;
    hallPage = 1;
    document.querySelectorAll('#hallStatusFilter .tag-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    renderHallGrid();
  };
});

function buildHallLayout() {
  return `
  <div class="container">
    <div class="section">
      <!-- Header -->
      <div class="section-header" style="flex-wrap:wrap;gap:12px">
        <div class="section-title">🏆 竞赛大厅</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div class="search-wrap" style="max-width:280px">
            <span class="si">🔍</span>
            <input id="hallSearchInp" class="search-inp" style="height:42px;font-size:13px"
              placeholder="搜索竞赛名称…" onkeydown="if(event.key==='Enter')hallSearch()">
          </div>
          <select class="form-input form-select" style="width:110px;height:42px;font-size:13px"
            onchange="hallLevelFilter(this,this.value)">
            <option value="">全部级别</option>
            <option>国家级</option>
            <option>省级</option>
            <option>校级</option>
            <option>国际级</option>
          </select>
          <button class="btn btn-primary" onclick="hallSearch()">搜索</button>
        </div>
      </div>

      <!-- Cat chips -->
      <div id="hallCatFilter" class="filter-row" style="margin-bottom:10px">
        <span class="tag-chip active" data-cat="" onclick="hallCatFilter(this,'')">全部分类</span>
        ${DB_CATEGORIES.map(c => `<span class="tag-chip" data-cat="${c.name}" onclick="hallCatFilter(this,'${c.name}')">${c.emoji} ${c.name}</span>`).join('')}
      </div>
      <!-- Status chips -->
      <div id="hallStatusFilter" class="filter-row" style="margin-bottom:24px">
        <span class="filter-label">状态：</span>
        <span class="tag-chip active" onclick="hallStatusFilter(this,'')">全部</span>
        <span class="tag-chip" onclick="hallStatusFilter(this,'open')">报名中</span>
        <span class="tag-chip" onclick="hallStatusFilter(this,'closing')">即将截止</span>
        <span class="tag-chip" onclick="hallStatusFilter(this,'over')">已截止</span>
      </div>

      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        <span id="hallCount"></span>
      </div>

      <!-- Grid -->
      <div class="comp-grid" id="hallGrid"></div>

      <!-- Pager -->
      <div style="display:flex;justify-content:center;margin-top:36px">
        <div class="pagination" id="hallPager"></div>
      </div>
    </div>
  </div>`;
}

function isHallCompetitionDisplayable(c) {
  if (!c || !c.title) return false;
  if (!isExternalMergedCompetitionId(c.id)) return true;

  const title = String(c.title).trim();
  if (title.length < 6 || title.length > 120) return false;
  if (/(汇总|合集|资源|导航|入口|目录|列表|平台|频道|专题|官网|官方网站|资料|教程|指南|日历|时间表|更多)/i.test(title)) {
    return false;
  }

  const url = String(c.sourceUrl || c.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return false;
  if (/(\/login|register|signup|signin|lostpwd|password|\/user\/|\/member|\/download\/|\/upload\/|\.(pdf|docx?|xlsx?|zip|rar|7z)(\?|#|$))/i.test(url)) {
    return false;
  }

  const start = getCompetitionStartDateValue(c);
  const end = getCompetitionEndDateValue(c);
  if (!start || !end) return false;
  return new Date(end).getTime() >= new Date(start).getTime();
}
