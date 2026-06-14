/* =====================================================
   pages/home.js  — 首页
===================================================== */
router.register('home', async (el) => {
  el.innerHTML = buildHomePage();
  initCarousel();
  // 页面渲染后异步加载热度榜和月份筛选
  setTimeout(() => filterHomeByMonth(), 100);
});

/* ---- 首页模板 ---- */
function buildHomePage() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  // 生成月份选项（前2个月 ~ 后9个月）
  const monthOptions = [];
  for (let i = -2; i <= 9; i++) {
    const d = new Date(curYear, curMonth - 1 + i, 1);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const label = `${y}年${m}月`;
    const selected = (y === curYear && m === curMonth) ? 'selected' : '';
    monthOptions.push(`<option value="${y}-${m}" ${selected}>${label}</option>`);
  }

  return `
  <!-- ===== CAROUSEL ===== -->
  <div class="hero">
    <div class="carousel-track" id="carouselTrack">${buildSlides()}</div>
    <button class="c-arrow c-arrow-l" onclick="carouselMove(-1)">&#8249;</button>
    <button class="c-arrow c-arrow-r" onclick="carouselMove(1)">&#8250;</button>
    <div class="carousel-dots" id="carouselDots">${buildDots()}</div>
  </div>

  <!-- ===== SEARCH ===== -->
  <div class="search-section">
    <div class="container">
      <div class="search-box-center">
        <div class="search-wrap">
          <span class="si">🔍</span>
          <input id="homeSearchInp" class="search-inp" type="text"
            placeholder="搜索竞赛名称、主办方、关键词…"
            onkeydown="if(event.key==='Enter')doHomeSearch()">
        </div>
        <button class="btn btn-primary search-btn-main" onclick="doHomeSearch()">搜 索</button>
      </div>
      <div class="filter-row">
        <span class="filter-label">热门：</span>
        <span class="tag-chip active" onclick="homeFilterTag(this,'')">全部</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'数学建模')">数学建模</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'程序设计')">程序设计</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'创新创业')">创新创业</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'电子设计')">电子设计</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'机器人')">机器人</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'数据科学')">数据科学</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'国家级','level')">🏆 国家级</span>
        <span class="tag-chip" onclick="homeFilterTag(this,'省级','level')">省级</span>
      </div>
    </div>
  </div>

  <!-- ===== HOT & MONTHLY ===== -->
  <div style="background:#f8fafc;padding:48px 0">
    <div class="container">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">

        <!-- 热度竞赛榜 -->
        <div style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <span style="font-size:22px">🔥</span>
            <span style="font-size:17px;font-weight:700;color:#1e293b">热度竞赛榜</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:auto">按热门程度排名</span>
          </div>
          <div id="homeHotList">
            ${(() => {
              const hotList = DB_COMPS.slice().sort((a,b) => (b.hot?1:0)-(a.hot?1:0)).slice(0,6);
              return hotList.map((c,i) => {
                const rankColors = [
                  'linear-gradient(135deg,#f59e0b,#ef4444)',
                  'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  'linear-gradient(135deg,#10b981,#059669)'
                ];
                const rankBg = i < 3 ? rankColors[i] : '#e2e8f0';
                const rankColor = i < 3 ? '#fff' : '#64748b';
                return `
                <div onclick="openCompDetail(${c.id})" style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background=''">
                  <div style="width:28px;height:28px;border-radius:50%;background:${rankBg};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${rankColor};flex-shrink:0">${i+1}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1e293b">${escHtml(c.title)}</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:2px">🏛️ ${escHtml(c.organizer)} · ${c.level || '—'}</div>
                  </div>
                  <span style="font-size:20px;flex-shrink:0">${c.emoji || '🏆'}</span>
                </div>`;
              }).join('');
            })()}
          </div>
          <button class="btn btn-outline" style="width:100%;margin-top:16px;font-size:13px" onclick="router.go('hall')">查看全部竞赛 →</button>
        </div>

        <!-- 按月查找竞赛 -->
        <div style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <span style="font-size:22px">📅</span>
            <span style="font-size:17px;font-weight:700;color:#1e293b">按月查找竞赛</span>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <select id="homeMonthSel" class="form-input form-select" style="flex:1;height:40px" onchange="filterHomeByMonth()">
              ${monthOptions.join('')}
            </select>
            <button class="btn btn-primary" style="height:40px;padding:0 18px;flex-shrink:0" onclick="filterHomeByMonth()">查找</button>
          </div>
          <div id="homeMonthList" style="max-height:330px;overflow-y:auto">
            <div style="text-align:center;color:#94a3b8;padding:24px">
              <div style="font-size:28px;margin-bottom:8px">📋</div>
              正在加载本月竞赛…
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ===== FORUM SECTION ===== -->
  <div class="section forum-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 0; color: white;">
    <div class="container">
      <div class="forum-promo">
        <div class="forum-promo-content">
          <h2>💬 竞赛论坛</h2>
          <p>与志同道合的同学一起讨论赛事、分享经验、交流心得</p>
          <div class="forum-features">
            <span class="feature-tag">🏆 赛事讨论</span>
            <span class="feature-tag">📚 经验分享</span>
            <span class="feature-tag">❓ 问题求助</span>
          </div>
        </div>
        <button class="btn btn-white btn-large" onclick="router.go('forum')">
          进入论坛 →
        </button>
      </div>
    </div>
  </div>

  <!-- ===== FOOTER ===== -->
  <footer style="background:#1e293b;color:rgba(255,255,255,.6);text-align:center;padding:24px;font-size:13px">
    © 2026 竞赛通 大学生竞赛管理系统 &nbsp;|&nbsp; 技术支持：SpringBoot + MySQL
  </footer>`;
}

const SLIDES = [
  { badge:'🔥 热门推荐', title:'第十届全国大学生数学建模竞赛', info:['📅 2026年09月05日截止','🏛️ 教育部高等教育司','🥇 国家级'], color:'linear-gradient(135deg,#4f46e5,#7c3aed)', emoji:'📐', compId:1 },
  { badge:'💡 创新创业', title:'第九届中国国际"互联网+"大学生创新创业大赛', info:['📅 报名截止 2026年09月30日','🏛️ 教育部','🥇 国家级'], color:'linear-gradient(135deg,#0891b2,#0e7490)', emoji:'🚀', compId:3 },
  { badge:'💻 程序设计', title:'第十五届蓝桥杯全国软件和信息技术大赛', info:['📅 2026年06月15日截止','🏛️ 工业和信息化部','🥇 国家级'], color:'linear-gradient(135deg,#059669,#047857)', emoji:'💻', compId:2 },
];

function buildSlides() {
  return SLIDES.map(s => `
  <div class="carousel-slide" style="background:${s.color}">
    <div class="slide-bg-circle" style="width:300px;height:300px;right:-60px;top:-80px"></div>
    <div class="slide-bg-circle" style="width:200px;height:200px;right:200px;bottom:-80px"></div>
    <div class="carousel-content">
      <div class="carousel-badge">${s.badge}</div>
      <div class="carousel-title">${s.title}</div>
      <div class="carousel-info">${s.info.map(i=>`<span>${i}</span>`).join('')}</div>
      <div class="carousel-btns">
        <button class="btn btn-white" onclick="openEnrollModal(${s.compId})">立即报名</button>
        <button class="btn btn-trans" onclick="openCompDetail(${s.compId})">查看详情</button>
      </div>
    </div>
    <div class="carousel-graphic">${s.emoji}</div>
  </div>`).join('');
}

function buildDots() {
  return SLIDES.map((_, i) => `<div class="c-dot ${i===0?'active':''}" onclick="carouselGo(${i})"></div>`).join('');
}

/* 轮播逻辑 */
let _slideIdx = 0;
let _slideTimer;

function initCarousel() {
  clearInterval(_slideTimer);
  _slideTimer = setInterval(() => carouselMove(1), 5000);
}
function carouselMove(dir) {
  _slideIdx = (_slideIdx + dir + SLIDES.length) % SLIDES.length;
  applyCarousel();
}
function carouselGo(idx) {
  _slideIdx = idx;
  applyCarousel();
}
function applyCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots = document.getElementById('carouselDots');
  if (track) track.style.transform = `translateX(-${_slideIdx*100}%)`;
  if (dots) {
    Array.from(dots.children).forEach((d,i)=>d.classList.toggle('active', i===_slideIdx));
  }
}

/* 分类点击 */
function bindCategoryClick() {
  // 已由 onclick 处理
}

/* 搜索 */
function doHomeSearch() {
  const kw = document.getElementById('homeSearchInp').value.trim();
  if (!kw) return;
  sessionStorage.setItem('searchKeyword', kw);
  router.go('hall');
}

/* 标签筛选 */
function homeFilterTag(el, val, type='category') {
  document.querySelectorAll('.filter-row .tag-chip').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if (type === 'level') {
    sessionStorage.setItem('filterLevel', val);
  } else {
    sessionStorage.setItem('filterCategory', val);
  }
  router.go('hall');
}

/* ============================================================
   按月份筛选竞赛
============================================================ */
async function filterHomeByMonth() {
  const sel = document.getElementById('homeMonthSel');
  const listEl = document.getElementById('homeMonthList');
  if (!sel || !listEl) return;

  const parts = sel.value.split('-');
  const year  = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  listEl.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:16px">⏳ 加载中…</div>';

  try {
    let comps = [];
    try {
      comps = await API.Competition.byMonth(year, month) || [];
    } catch(e) { /* 后端不可用 */ }
    // 后端返回空时用本地数据兜底
    if (!comps || !comps.length) {
      comps = DB_COMPS.filter(c => {
        const d = new Date(c.startDate || c.endDate);
        return !isNaN(d) && d.getFullYear() === year && (d.getMonth() + 1) === month;
      });
    }

    if (!comps.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:28px">
          <div style="font-size:32px;margin-bottom:8px">🗓️</div>
          <div style="color:#475569;font-weight:500">${year}年${month}月暂无开放报名竞赛</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:4px">可切换月份继续查找</div>
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div style="font-size:12px;color:#64748b;margin-bottom:10px;padding:0 2px">${year}年${month}月 · 共 <b>${comps.length}</b> 个竞赛开放报名</div>
      ${comps.map(c => `
      <div onclick="openCompDetail(${c.id})" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;border:1px solid #e2e8f0;margin-bottom:8px;transition:all .15s" onmouseover="this.style.background='#f1f5f9';this.style.borderColor='#3b82f6'" onmouseout="this.style.background='';this.style.borderColor='#e2e8f0'">
        <div style="font-size:20px;flex-shrink:0;padding-top:2px">${c.emoji || '🏆'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(c.title)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;align-items:center">
            <span style="font-size:11px;color:#64748b">📅 ${c.startDate || c.startTime || '—'} 起报名</span>
            <span style="font-size:11px;padding:1px 7px;border-radius:10px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">${c.level || c.levelName || '—'}</span>
          </div>
        </div>
        <span style="font-size:16px;color:#cbd5e1;flex-shrink:0;padding-top:4px">›</span>
      </div>`).join('')}`;
  } catch(e) {
    listEl.innerHTML = `<div style="color:#ef4444;text-align:center;padding:16px">加载失败，请重试</div>`;
  }
}
window.filterHomeByMonth = filterHomeByMonth;
