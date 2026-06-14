/* =====================================================
   pages/admin.js  — 管理员后台
===================================================== */
router.register('admin', (el) => {
  el.innerHTML = buildAdminLayout();
  showAdminPanel('dashboard');
});

function buildAdminLayout() {
  return `
  <div class="admin-layout">
    <!-- ===== ADMIN SIDEBAR ===== -->
    <div class="admin-sidebar">
      <div class="admin-sidebar-logo">
        <div class="admin-sidebar-name">🏆 竞赛通</div>
        <div class="admin-sidebar-sub">管理后台 v1.0</div>
      </div>
      <nav class="admin-nav">
        <div class="admin-group">概览</div>
        <div class="admin-item active" onclick="showAdminPanel('dashboard',this)">📊 数据概览</div>
        <div class="admin-group">内容管理</div>
        <div class="admin-item" onclick="showAdminPanel('compManage',this)">🏆 竞赛管理</div>
        <div class="admin-item" onclick="showAdminPanel('catManage',this)">📂 分类管理</div>
        <div class="admin-item" onclick="showAdminPanel('forumManage',this)">💬 论坛帖子</div>
        <div class="admin-group">用户管理</div>
        <div class="admin-item" onclick="showAdminPanel('userManage',this)">👥 用户列表</div>
        <div class="admin-item" onclick="showAdminPanel('enrollManage',this)">📝 报名管理</div>
        <div class="admin-group">获奖管理</div>
        <div class="admin-item" onclick="showAdminPanel('awardManage',this)">🏅 学生获奖记录</div>
        <div class="admin-group">系统</div>
        <div class="admin-item" onclick="showAdminPanel('notice',this)">🔔 公告管理</div>
        <div class="admin-item" onclick="showAdminPanel('log',this)">📜 操作日志</div>
        <div class="admin-item" onclick="showAdminPanel('settings',this)">⚙️ 系统设置</div>
      </nav>
    </div>

    <!-- ===== ADMIN MAIN ===== -->
    <div class="admin-main">
      <div class="admin-topbar">
        <div class="admin-breadcrumb">管理后台 / <span id="adminBreadcrumb">数据概览</span></div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:13px;color:var(--text-muted)">👋 ${escHtml(currentUser?.nickname||'管理员')}</span>
          <button class="btn btn-outline btn-sm" onclick="router.go('home')">← 返回前台</button>
          <button class="btn btn-danger btn-sm" onclick="doLogout()">🚪 退出登录</button>
        </div>
      </div>
      <div class="admin-content" id="adminContent"></div>
    </div>
  </div>`;
}

/* ---- 面板切换 ---- */
const PANEL_NAMES = { dashboard:'数据概览', compManage:'竞赛管理', catManage:'分类管理', forumManage:'论坛帖子', userManage:'用户列表', enrollManage:'报名管理', awardManage:'学生获奖记录', notice:'公告管理', log:'操作日志', settings:'系统设置' };

window.showAdminPanel = (name, itemEl) => {
  document.querySelectorAll('.admin-item').forEach(i => i.classList.remove('active'));
  if (itemEl) itemEl.classList.add('active');
  const bc = document.getElementById('adminBreadcrumb');
  if (bc) bc.textContent = PANEL_NAMES[name] || name;
  const content = document.getElementById('adminContent');
  if (!content) return;
  const renders = { dashboard: renderDashboard, compManage: renderCompManage, catManage: renderCatManage, forumManage: renderForumManage, userManage: renderUserManage, enrollManage: renderEnrollManage, awardManage: renderAwardManage, notice: renderNotice, log: renderLog, settings: renderSettings };
  if (renders[name]) content.innerHTML = renders[name]();
  if (name === 'compManage') refreshAdminCompetitionList();
};

/* ============================================================
   DASHBOARD
============================================================ */
function renderDashboard() {
  return `
  <div class="dash-grid">
    <div class="dash-card">
      <div class="dash-icon" style="background:#ede9fe">🏆</div>
      <div><div class="dash-num">1,248</div><div class="dash-lbl">竞赛总数</div><div class="dash-trend">↑ 本月新增 86 条</div></div>
    </div>
    <div class="dash-card">
      <div class="dash-icon" style="background:#d1fae5">👥</div>
      <div><div class="dash-num">5,632</div><div class="dash-lbl">注册用户</div><div class="dash-trend">↑ 今日新增 23 人</div></div>
    </div>
    <div class="dash-card">
      <div class="dash-icon" style="background:#fef3c7">📝</div>
      <div><div class="dash-num">3,891</div><div class="dash-lbl">报名总次数</div><div class="dash-trend">↑ 今日 156 次</div></div>
    </div>
    <div class="dash-card">
      <div class="dash-icon" style="background:#fce7f3">🏅</div>
      <div><div class="dash-num">128</div><div class="dash-lbl">获奖记录</div><div class="dash-trend">↑ 本月新增 12 条</div></div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr;gap:20px">
    <div class="table-card">
      <div class="table-toolbar"><span class="table-toolbar-title">📋 最新报名</span></div>
      <table>
        <thead><tr><th>用户</th><th>竞赛</th><th>时间</th><th>状态</th></tr></thead>
        <tbody>
          <tr><td>张三</td><td>数学建模竞赛</td><td>10分钟前</td><td><span class="status-dot"><span class="dot dot-yellow"></span>待审核</span></td></tr>
          <tr><td>李四</td><td>蓝桥杯</td><td>32分钟前</td><td><span class="status-dot"><span class="dot dot-green"></span>已通过</span></td></tr>
          <tr><td>王五</td><td>互联网+</td><td>1小时前</td><td><span class="status-dot"><span class="dot dot-green"></span>已通过</span></td></tr>
          <tr><td>赵六</td><td>电子设计大赛</td><td>2小时前</td><td><span class="status-dot"><span class="dot dot-red"></span>已拒绝</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ============================================================
   竞赛管理
============================================================ */
function renderCompManage() {
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">竞赛管理</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="search-wrap" style="max-width:220px">
          <span class="si" style="font-size:14px">🔍</span>
          <input class="search-inp" style="height:38px;font-size:13px" placeholder="搜索竞赛名称…" id="adminCompSearch" onkeydown="if(event.key==='Enter')filterAdminComp()">
        </div>
        <select class="form-input form-select" style="width:110px;height:38px;font-size:13px" id="adminCompCatFilter" onchange="filterAdminComp()">
          <option value="">全部分类</option>
          ${DB_CATEGORIES.map(c=>`<option>${c.name}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="openAddCompModal()">+ 添加竞赛</button>
      </div>
    </div>
    <table>
      <thead><tr><th>ID</th><th>竞赛名称</th><th>分类</th><th>级别</th><th>主办方</th><th>截止时间</th><th>操作</th></tr></thead>
      <tbody id="adminCompTbody">${renderAdminCompRows(DB_COMPS)}</tbody>
    </table>
    <div class="table-pagination"><div class="pagination">${pagerHtml(1,2)}</div></div>
  </div>`;
}

async function refreshAdminCompetitionList() {
  const tbody = document.getElementById('adminCompTbody');
  if (!tbody) return;
  try {
    const result = await API.Competition.list(1, 1000, null, null, null, false);
    if (result && Array.isArray(result.records)) {
      DB_COMPS.splice(0, DB_COMPS.length, ...result.records.map(toAdminCompetitionRow));
      tbody.innerHTML = renderAdminCompRows(DB_COMPS);
    }
  } catch (e) {
    // 后端不可用时保留本地 DB_COMPS 兜底
  }
}

function toAdminCompetitionRow(c) {
  const startRaw = getCompetitionStartDateValue(c);
  const endRaw = getCompetitionEndDateValue(c);
  const catName = getCompetitionCategoryLabel(c);
  const levelLabel = getCompetitionLevelLabel(c);
  const emoji = (DB_CATEGORIES.find(x => x.name === catName) || {}).emoji || '🏆';
  return {
    ...c,
    catId: c.categoryId || c.catId,
    catName,
    level: levelLabel,
    startDate: startRaw ? String(startRaw).slice(0, 10) : '',
    endDate: endRaw ? String(endRaw).slice(0, 10) : '',
    desc: c.description || c.desc || '',
    url: c.url || c.sourceUrl || '',
    emoji,
    hot: !!c.hot
  };
}

function toApiLocalDateTime(date, endOfDay = false) {
  if (!date) return null;
  return `${date}T${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function renderAdminCompRows(list) {
  return list.map(c=>`
  <tr>
    <td>${c.id}</td>
    <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(c.title)}">
      ${c.emoji} ${escHtml(c.title)}
      ${(c.url || c.sourceUrl) ? `<a href="${escHtml(c.url||c.sourceUrl)}" target="_blank" onclick="event.stopPropagation()" style="margin-left:6px;font-size:11px;color:#3b82f6;font-weight:normal">🔗官网</a>` : ''}
    </td>

    <td>${c.catName}</td>
    <td><span class="badge ${levelBadge(c.level)}">${c.level}</span></td>
    <td>${escHtml(c.organizer)}</td>
    <td>${fmtDate(c.endDate)}</td>
    <td>
      <button class="btn btn-outline btn-sm" onclick="openEditCompModal(${c.id})">编辑</button>
      <button class="btn btn-danger btn-sm" onclick="adminDelComp(${c.id})">删除</button>
    </td>
  </tr>`).join('');
}

window.filterAdminComp = () => {
  const kw  = document.getElementById('adminCompSearch')?.value.toLowerCase();
  const cat = document.getElementById('adminCompCatFilter')?.value;
  let list = DB_COMPS.filter(c => {
    return (!kw || c.title.toLowerCase().includes(kw)) && (!cat || c.catName === cat);
  });
  const tbody = document.getElementById('adminCompTbody');
  if (tbody) tbody.innerHTML = renderAdminCompRows(list);
};

function openAddCompModal() {
  showModal(`
  <div class="modal modal-lg">
    <div class="modal-header"><div class="modal-title">+ 添加竞赛</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">竞赛标题 *</label><input class="form-input" id="ac_title" placeholder="请输入竞赛完整名称"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">分类 *</label><select class="form-input form-select" id="ac_cat">${DB_CATEGORIES.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">级别 *</label><select class="form-input form-select" id="ac_level"><option>国家级</option><option>省级</option><option>校级</option><option>国际级</option></select></div>
      <div class="form-group"><label class="form-label">报名开始</label><input class="form-input" type="date" id="ac_start"></div>
      <div class="form-group"><label class="form-label">报名截止</label><input class="form-input" type="date" id="ac_end"></div>
    </div>
    <div class="form-group"><label class="form-label">主办方</label><input class="form-input" id="ac_org" placeholder="主办方名称"></div>
    <div class="form-group"><label class="form-label">原始链接</label><input class="form-input" type="url" id="ac_url" placeholder="https://..."></div>
    <div class="form-group"><label class="form-label">竞赛简介</label><textarea class="form-input form-textarea" id="ac_desc" placeholder="简要介绍…"></textarea></div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveNewComp()">保存</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

async function saveNewComp() {
  const title = document.getElementById('ac_title')?.value.trim();
  if (!title) { showToast('请填写竞赛标题', 'warning'); return; }
  const cat = DB_CATEGORIES.find(c=>c.name===document.getElementById('ac_cat')?.value);
  const data = {
    title,
    categoryId: cat?.id||1,
    level: document.getElementById('ac_level')?.value==='国家级' ? 3 : document.getElementById('ac_level')?.value==='省级' ? 2 : document.getElementById('ac_level')?.value==='国际级' ? 4 : 1,
    levelName: document.getElementById('ac_level')?.value||'国家级',
    organizer: document.getElementById('ac_org')?.value.trim()||'',
    startTime: toApiLocalDateTime(document.getElementById('ac_start')?.value),
    endTime:   toApiLocalDateTime(document.getElementById('ac_end')?.value, true),
    description: document.getElementById('ac_desc')?.value.trim()||'',
    url: document.getElementById('ac_url')?.value.trim() || '',
    status: 1
  };
  
  try {
    const saved = await API.Competition.create(data);
    // 同步更新内存
    DB_COMPS.unshift(toAdminCompetitionRow(saved || data));
  } catch (e) {
    // 后端失败时仍写入内存（离线模式）
    DB_COMPS.unshift({
      id: uid(), title, catId: cat?.id||1, catName: cat?.name||'其他',
      organizer: data.organizer, level: data.levelName,
      startDate: document.getElementById('ac_start')?.value || '',
      endDate: document.getElementById('ac_end')?.value || '',
      desc: data.description, url: data.url, emoji:'🏆', hot:false
    });
  }
  closeModal();
  showToast('竞赛添加成功 ✓');
  showAdminPanel('compManage');
}

function openEditCompModal(id) {
  const c = DB_COMPS.find(x=>x.id===id);
  if (!c) return;
  showModal(`
  <div class="modal modal-lg">
    <div class="modal-header"><div class="modal-title">编辑竞赛</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">竞赛标题</label><input class="form-input" id="ec_title" value="${escHtml(c.title)}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">分类</label><select class="form-input form-select" id="ec_cat">${DB_CATEGORIES.map(cat=>`<option${cat.name===c.catName?' selected':''}>${cat.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">级别</label><select class="form-input form-select" id="ec_level">${['国家级','省级','校级','国际级'].map(l=>`<option${l===c.level?' selected':''}>${l}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">报名开始</label><input class="form-input" type="date" id="ec_start" value="${fmtDate(c.startDate)}"></div>
      <div class="form-group"><label class="form-label">报名截止</label><input class="form-input" type="date" id="ec_end" value="${fmtDate(c.endDate)}"></div>
    </div>
    <div class="form-group"><label class="form-label">主办方</label><input class="form-input" id="ec_org" value="${escHtml(c.organizer)}"></div>
    <div class="form-group"><label class="form-label">官网链接</label><input class="form-input" type="url" id="ec_url" value="${escHtml(c.url||c.sourceUrl||'')}" placeholder="https://…"></div>
    <div class="form-group"><label class="form-label">简介</label><textarea class="form-input form-textarea" id="ec_desc">${escHtml(c.desc||'')}</textarea></div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="updateComp(${id})">保存</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

async function updateComp(id) {
  const c = DB_COMPS.find(x=>x.id===id); if (!c) return;
  const updatedTitle = document.getElementById('ec_title')?.value.trim()||c.title;
  const updatedCatName = document.getElementById('ec_cat')?.value||c.catName;
  const updatedLevel = document.getElementById('ec_level')?.value||c.level;
  const updatedStartDate = document.getElementById('ec_start')?.value||c.startDate;
  const updatedEndDate = document.getElementById('ec_end')?.value||c.endDate;
  const updatedOrganizer = document.getElementById('ec_org')?.value.trim()||c.organizer;
  const updatedDesc = document.getElementById('ec_desc')?.value.trim()||c.desc;
  const updatedUrl = document.getElementById('ec_url')?.value.trim() || c.url || '';
  
  // 更新内存数据
  c.title      = updatedTitle;
  c.catName    = updatedCatName;
  c.level      = updatedLevel;
  c.startDate  = updatedStartDate;
  c.endDate    = updatedEndDate;
  c.organizer  = updatedOrganizer;
  c.desc       = updatedDesc;
  c.url        = updatedUrl;

  // 尝试同步到后端
  try {
    const cat = DB_CATEGORIES.find(x=>x.name===updatedCatName);
    await API.Competition.update(id, {
      title: updatedTitle,
      categoryId: cat?.id || c.catId,
      level: updatedLevel === '国家级' ? 3 : updatedLevel === '省级' ? 2 : updatedLevel === '国际级' ? 4 : 1,
      levelName: updatedLevel,
      organizer: updatedOrganizer,
      startTime: toApiLocalDateTime(updatedStartDate),
      endTime: toApiLocalDateTime(updatedEndDate, true),
      description: updatedDesc,
      url: updatedUrl,
      status: 1
    });
  } catch (e) {
    console.warn('同步后端失败，仅更新本地:', e.message);
  }
  
  closeModal(); showToast('竞赛信息已更新 ✓'); showAdminPanel('compManage');
}

async function adminDelComp(id) {
  if (!confirm('确认删除该竞赛吗？')) return;
  try {
    await API.Competition.delete(id);
  } catch (e) {
    console.warn('后端删除失败，仅删除本地:', e.message);
  }
  const idx = DB_COMPS.findIndex(c=>c.id===id);
  if (idx>-1) DB_COMPS.splice(idx,1);
  showToast('竞赛已删除', 'info');
  showAdminPanel('compManage');
}

/* ============================================================
   分类管理
============================================================ */
function renderCatManage() {
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">分类管理</span>
      <button class="btn btn-primary btn-sm" onclick="showToast('添加分类功能','info')">+ 添加分类</button>
    </div>
    <table>
      <thead><tr><th>ID</th><th>图标</th><th>名称</th><th>竞赛数</th><th>排序</th><th>操作</th></tr></thead>
      <tbody>
        ${DB_CATEGORIES.map(c=>`
        <tr>
          <td>${c.id}</td><td style="font-size:22px">${c.emoji}</td><td>${c.name}</td><td>${c.count}</td><td>${c.id}</td>
          <td><button class="btn btn-outline btn-sm">编辑</button> <button class="btn btn-danger btn-sm" onclick="showToast('请先迁移该分类下的竞赛','warning')">删除</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ============================================================
   用户管理
============================================================ */
function renderUserManage() {
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">用户管理</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="search-wrap" style="max-width:200px">
          <span class="si" style="font-size:14px">🔍</span>
          <input class="search-inp" style="height:38px;font-size:13px" placeholder="搜索账号/姓名…">
        </div>
        <select class="form-input form-select" style="width:120px;height:38px;font-size:13px">
          <option>全部角色</option><option>高级管理员</option><option>管理员</option><option>认证用户</option><option>普通用户</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="showToast('导出用户数据…','info')">📥 导出</button>
      </div>
    </div>
    <table>
      <thead><tr><th>ID</th><th>账号</th><th>姓名</th><th>学院</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
      <tbody>
        ${DB_USERS.map(u=>`
        <tr>
          <td>${u.id}</td><td>${escHtml(u.username)}</td><td>${escHtml(u.realName||u.nickname||'—')}</td>
          <td>${escHtml(u.college)}</td>
          <td><span class="badge ${['','badge-hot','badge-national','badge-province','badge-school'][u.role]}">${['','高级管理员','管理员','认证用户','普通用户'][u.role]}</span></td>
          <td><span class="status-dot"><span class="dot dot-green"></span>正常</span></td>
          <td>2026-01-01</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openEditUserModal(${u.id})">编辑</button>
            ${u.id===1?'':`<button class="btn btn-danger btn-sm" onclick="showToast('已禁用用户 ${escHtml(u.username)}','warning')">禁用</button>`}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="table-pagination"><div class="pagination">${pagerHtml(1,2)}</div></div>
  </div>`;
}

function openEditUserModal(id) {
  const u = DB_USERS.find(x=>x.id===id); if (!u) return;
  showModal(`
  <div class="modal">
    <div class="modal-header"><div class="modal-title">编辑用户</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">账号（不可修改）</label><input class="form-input" value="${escHtml(u.username)}" readonly></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">昵称</label><input class="form-input" value="${escHtml(u.nickname||'')}"></div>
      <div class="form-group">
        <label class="form-label">角色</label>
        <select class="form-input form-select">
          ${[1,2,3,4].map(r=>`<option value="${r}"${u.role===r?' selected':''}>${['','高级管理员','管理员','认证用户','普通用户'][r]}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">学院</label><input class="form-input" value="${escHtml(u.college||'')}"></div>
      <div class="form-group"><label class="form-label">专业</label><input class="form-input" value="${escHtml(u.major||'')}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal();showToast('用户信息已更新 ✓')">保存</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

/* ============================================================
   报名管理
============================================================ */

/* 报名数据（从后端 API 获取） */
let _enrollData = [];
window._adminEnrollData = _enrollData;

/** 导出报名数据为 Excel —— 使用 SheetJS */
window.exportEnrollExcel = function(statusFilter) {
  const data = statusFilter ? _enrollData.filter(e => e.status === statusFilter) : _enrollData;
  const rows = data.map(e => ({
    '报名ID':    e.id,
    '姓名':      e.user,
    '学号':      e.studentId,
    '学院':      e.college,
    '专业':      e.major,
    '联系方式':  e.phone,
    '竞赛名称':  e.comp,
    '团队名称':  e.team  || '—',
    '团队成员':  e.members || '—',
    '备注':      e.remark  || '—',
    '报名时间':  e.time,
    '审核状态':  e.status,
  }));

  if (!rows.length) { showToast('暂无数据可导出', 'warning'); return; }

  if (typeof XLSX === 'undefined') {
    showToast('Excel 库加载中，请稍后重试', 'warning'); return;
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  /* 设置列宽 */
  ws['!cols'] = [
    {wch:10},{wch:8},{wch:14},{wch:12},{wch:12},{wch:14},
    {wch:30},{wch:14},{wch:18},{wch:16},{wch:18},{wch:10}
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '报名信息');

  const filename = `报名数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'-')}.xlsx`;
  XLSX.writeFile(wb, filename);
  showToast(`已导出 ${rows.length} 条记录 ✓`);
};

function renderEnrollManage() {
  // 先返回骨架 HTML，异步加载数据
  setTimeout(() => _loadEnrollData(), 0);
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">报名管理</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="search-wrap" style="max-width:200px">
          <span class="si" style="font-size:14px">🔍</span>
          <input class="search-inp" style="height:38px;font-size:13px" placeholder="搜索用户/竞赛名…" id="enrollSearch" onkeyup="filterEnrollTable()">
        </div>
        <select class="form-input form-select" style="width:110px;height:38px;font-size:13px" id="enrollStatusFilter" onchange="filterEnrollTable()">
          <option value="">全部状态</option><option value="0">待审核</option><option value="1">已通过</option><option value="2">已拒绝</option>
        </select>
        <button class="btn btn-success btn-sm" onclick="exportEnrollExcel()">📥 导出全部 Excel</button>
        <button class="btn btn-outline btn-sm" onclick="exportEnrollExcel(document.getElementById('enrollStatusFilter').value||null)">📥 导出筛选结果</button>
      </div>
    </div>
    <table>
      <thead><tr><th>ID</th><th>姓名</th><th>学号</th><th>学院/专业</th><th>联系方式</th><th>竞赛名称</th><th>备注</th><th>报名时间</th><th>状态</th><th>操作</th></tr></thead>
      <tbody id="enrollTbody"><tr><td colspan="10" style="text-align:center;padding:30px;color:#94a3b8">加载中...</td></tr></tbody>
    </table>
    <div class="table-pagination"><div class="pagination">${pagerHtml(1,3)}</div></div>
  </div>`;
}

async function _loadEnrollData() {
  try {
    const result = await API.Enrollment.list(1, 200);
    // 兼容多种返回结构：Result<Page> → data.records，直接Page → records，直接数组
    let raw = result;
    if (raw && raw.data) raw = raw.data;  // Result包装
    const records = (raw && raw.records) ? raw.records : (Array.isArray(raw) ? raw : []);
    _enrollData = records.map(r => ({
      id:         r.id,
      userId:     r.userId || null,
      user:       r.realName || r.username || '—',
      studentId:  r.studentId || '—',
      college:    r.college || '—',
      major:      r.major || '—',
      phone:      r.phone || '—',
      comp:       r.competitionTitle || '—',
      team:       r.teamName || '',
      members:    r.teamMembers || '',
      remark:     r.remark || '',
      time:       r.enrollTime ? new Date(r.enrollTime).toLocaleString('zh-CN') : '—',
      status:     r.status === 0 ? '待审核' : r.status === 1 ? '已通过' : r.status === 2 ? '已拒绝' : '未知',
      statusNum:  r.status
    }));
  } catch (e) {
    console.warn('加载报名数据失败:', e);
    _enrollData = [];
  }
  window._adminEnrollData = _enrollData;
  const tbody = document.getElementById('enrollTbody');
  if (tbody) {
    if (_enrollData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#94a3b8">📝 暂无报名记录</td></tr>';
    } else {
      tbody.innerHTML = renderEnrollRows(_enrollData);
    }
  }
}

function renderEnrollRows(list) {
  const scMap = {'待审核':'dot-yellow','已通过':'dot-green','已拒绝':'dot-red'};
  return list.map(e=>`
  <tr id="enrow-${e.id}">
    <td>${e.id}</td><td>${escHtml(e.user)}</td><td>${escHtml(e.studentId)}</td>
    <td>${escHtml(e.college)}/${escHtml(e.major)}</td><td>${escHtml(e.phone)}</td>
    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(e.comp)}">${escHtml(e.comp)}</td>
    <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(e.remark || '')}">${escHtml(e.remark || '—')}</td>
    <td>${e.time}</td>
    <td>
      <span class="status-dot"><span class="dot ${scMap[e.status]||'dot-yellow'}"></span>${e.status}</span>
      ${e.awardLevel ? `<br><span style="font-size:11px;color:#f59e0b;font-weight:600">🏅 ${escHtml(e.awardLevel)}</span>` : ''}
    </td>
    <td>
      <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
      ${e.status==='待审核'
        ? `<button class="btn btn-success btn-sm" onclick="enrollApprove(${e.id},this)">通过</button>
           <button class="btn btn-danger btn-sm"  onclick="enrollReject(${e.id},this)">拒绝</button>`
        : e.status==='已通过'
          ? `<button class="btn btn-primary btn-sm" onclick="openAwardEntryModal(${e.id})" title="为该学生录入获奖信息">🏅 录入奖项</button>`
          : `<button class="btn btn-outline btn-sm" onclick="showToast('ID: ${e.id} — ${escHtml(e.status)}','info')">查看</button>`}
      <button type="button" class="btn btn-danger btn-sm" onclick="adminDeleteEnrollment(${e.id})">删除</button>
      </div>
    </td>
  </tr>`).join('');
}

window.filterEnrollTable = function() {
  const kw     = (document.getElementById('enrollSearch')?.value||'').toLowerCase();
  const status = document.getElementById('enrollStatusFilter')?.value||'';
  const list   = _enrollData.filter(e => {
    const kwMatch = (!kw || e.user.toLowerCase().includes(kw) || e.comp.toLowerCase().includes(kw));
    const stMatch = !status || (status === String(e.statusNum)) || e.status === {0:'待审核',1:'已通过',2:'已拒绝'}[parseInt(status)];
    return kwMatch && stMatch;
  });
  const tbody = document.getElementById('enrollTbody');
  if (tbody) tbody.innerHTML = renderEnrollRows(list);
};

window.enrollApprove = async function(id) {
  const e = _enrollData.find(x=>x.id===id); if (!e) return;
  try {
    await API.Enrollment.approve(id);
    e.status = '已通过';
    e.statusNum = 1;
    // 同步更新 DB_ENROLLMENTS 并持久化
    const dbEntry = DB_ENROLLMENTS.find(x => x.id === id);
    if (dbEntry) { dbEntry.status = '已通过'; dbEntry.statusClass = 'dot-green'; }
    if (window._persistEnrollments) window._persistEnrollments();
    showToast(`已通过 ${e.user} 的报名 ✓`);
    filterEnrollTable();
  } catch(err) {
    showToast('审核失败: ' + (err.message || ''), 'error');
  }
};

window.enrollReject = async function(id) {
  const e = _enrollData.find(x=>x.id===id); if (!e) return;
  try {
    await API.Enrollment.reject(id, '不符合要求');
    e.status = '已拒绝';
    e.statusNum = 2;
    const dbEntry = DB_ENROLLMENTS.find(x => x.id === id);
    if (dbEntry) { dbEntry.status = '已拒绝'; dbEntry.statusClass = 'dot-red'; }
    if (window._persistEnrollments) window._persistEnrollments();
    showToast(`已拒绝 ${e.user} 的报名`, 'warning');
    filterEnrollTable();
  } catch(err) {
    showToast('拒绝失败: ' + (err.message || ''), 'error');
  }
};

window.adminDeleteEnrollment = async function(id) {
  if (!confirm('确定删除该报名记录？删除后不可恢复。')) return;
  try {
    await API.Enrollment.adminDelete(id);
    showToast('报名记录已删除', 'success');
    await _loadEnrollData();
    filterEnrollTable();
  } catch (err) {
    showToast('删除失败: ' + (err.message || ''), 'error');
  }
};

/* ============================================================
   论坛帖子管理（管理员可删除任意帖子）
============================================================ */
function renderForumManage() {
  setTimeout(() => _loadAdminForumPosts(), 0);
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">💬 论坛帖子管理</span>
      <span style="font-size:12px;color:var(--text-muted)">删除后前台论坛列表将同步更新</span>
    </div>
    <table>
      <thead><tr><th>ID</th><th>标题</th><th>作者</th><th>分类</th><th>时间</th><th>操作</th></tr></thead>
      <tbody id="forumAdminTbody"><tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8">加载中...</td></tr></tbody>
    </table>
  </div>`;
}

async function _loadAdminForumPosts() {
  const tbody = document.getElementById('forumAdminTbody');
  if (!tbody) return;
  try {
    const res = await API.Forum.getPosts(1, 200);
    const records = (res && res.records) ? res.records : [];
    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8">暂无帖子</td></tr>';
      return;
    }
    tbody.innerHTML = records.map(p => {
      const t = p.createTime || p.create_time || '';
      const timeStr = t ? (typeof t === 'string' ? t.replace('T', ' ').slice(0, 19) : String(t)) : '—';
      return `
      <tr id="forumpost-row-${p.id}">
        <td>${p.id}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(p.title || '')}">${escHtml(p.title || '—')}</td>
        <td>${escHtml(p.userNickname || p.user_nickname || '—')}</td>
        <td>${escHtml(p.category || '—')}</td>
        <td style="font-size:12px;color:#64748b">${timeStr}</td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="adminDeleteForumPost(${p.id})">删除</button></td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444">加载失败: ${escHtml(e.message || '')}</td></tr>`;
  }
}

window.adminDeleteForumPost = async function(postId) {
  if (!confirm('确定删除该帖子？删除后用户端不再显示。')) return;
  try {
    await API.Forum.deletePost(postId);
    showToast('帖子已删除', 'success');
    const row = document.getElementById('forumpost-row-' + postId);
    if (row) row.remove();
    const tbody = document.getElementById('forumAdminTbody');
    if (tbody && !tbody.querySelector('tr[id^="forumpost-row-"]')) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8">暂无帖子</td></tr>';
    }
  } catch (e) {
    showToast(e.message || '删除失败', 'error');
  }
};

/* ============================================================
   录入奖项（管理员在报名管理中为已通过的学生录入获奖信息）
============================================================ */
window.openAwardEntryModal = function(enrollId) {
  const e = _enrollData.find(x => x.id === enrollId);
  if (!e) return;

  showModal(`
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">🏅 录入获奖信息</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">学生姓名（只读）</label>
      <input class="form-input" value="${escHtml(e.user)}" readonly style="background:#f8fafc">
    </div>
    <div class="form-group">
      <label class="form-label">竞赛名称（只读）</label>
      <input class="form-input" value="${escHtml(e.comp)}" readonly style="background:#f8fafc">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">获奖等级 <span style="color:#ef4444">*</span></label>
        <select class="form-input form-select" id="ae_level">
          <option value="">— 请选择 —</option>
          ${['特等奖','一等奖','二等奖','三等奖','优秀奖','最佳创新奖','金奖','银奖','铜奖']
            .map(l=>`<option value="${l}"${e.awardLevel===l?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">获奖时间 <span style="color:#ef4444">*</span></label>
        <input class="form-input" type="date" id="ae_date" value="${e.awardTime||new Date().toISOString().split('T')[0]}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">证书图片链接（选填）</label>
      <input class="form-input" type="url" id="ae_cert" value="${e.certificate||''}" placeholder="https://…">
    </div>
    <div class="form-group">
      <label class="form-label">备注说明</label>
      <textarea class="form-input form-textarea" id="ae_remark" rows="3" placeholder="如：省级赛区一等奖，代表学校参加国赛">${e.awardRemark||''}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveAwardEntry(${enrollId})">保存奖项</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
};

window.saveAwardEntry = async function(enrollId) {
  const e = _enrollData.find(x => x.id === enrollId);
  if (!e) return;

  const level  = document.getElementById('ae_level')?.value;
  const date   = document.getElementById('ae_date')?.value;
  const cert   = document.getElementById('ae_cert')?.value.trim();
  const remark = document.getElementById('ae_remark')?.value.trim();

  if (!level) { showToast('请选择获奖等级', 'warning'); return; }
  if (!date)  { showToast('请填写获奖时间', 'warning'); return; }

  // 构建后端API数据
  const apiData = {
    compName: e.comp,
    awardLevel: level,
    awardTime: date,
    certificate: cert,
    description: remark,
    source: 'admin',
    targetUserId: e.userId || null
  };

  // 尝试通过后端API保存
  try {
    await API.Award.add(apiData);
  } catch (apiErr) {
    console.warn('后端保存获奖记录失败，仅更新本地:', apiErr.message);
  }

  // 更新报名记录中的奖项信息
  e.awardLevel   = level;
  e.awardTime    = date;
  e.certificate  = cert;
  e.awardRemark  = remark;

  // 同步到 DB_AWARDS（学生个人中心也能看到，离线模式兜底）
  const existing = DB_AWARDS.findIndex(a => a.enrollId === enrollId);
  const awardRecord = {
    id:          existing >= 0 ? DB_AWARDS[existing].id : Date.now(),
    enrollId:    enrollId,
    compName:    e.comp,
    awardLevel:  level,
    awardTime:   date,
    certificate: cert,
    description: remark,
    source:      'admin',
    studentId:   e.studentId || '',
    studentName: e.user || ''
  };
  if (existing >= 0) {
    DB_AWARDS[existing] = awardRecord;
  } else {
    DB_AWARDS.push(awardRecord);
  }
  if (window._persistAwards) window._persistAwards();

  closeModal();
  showToast(`已为 ${e.user} 录入 ${level} ✓`, 'success');
  filterEnrollTable();
};

/* ============================================================
   通知 / 日志 / 设置
============================================================ */
function renderNotice() {
  // 异步渲染，先返回骨架
  setTimeout(() => _loadAdminNotices(), 0);
  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">🔔 公告管理</span>
      <button class="btn btn-primary btn-sm" onclick="openNoticeModal()">+ 发布公告</button>
    </div>
    <div id="adminNoticeBody">
      <div style="text-align:center;padding:32px;color:#94a3b8">加载中…</div>
    </div>
  </div>`;
}

async function _loadAdminNotices() {
  const el = document.getElementById('adminNoticeBody');
  if (!el) return;
  try {
    const list = await request('/notice/list');
    _renderAdminNoticeTable(el, list || []);
  } catch(e) {
    const mock = window._mockNotices || [];
    _renderAdminNoticeTable(el, mock);
  }
}

function _renderAdminNoticeTable(el, list) {
  const TYPE_LABEL = { 1:'系统通知', 2:'报名状态', 3:'竞赛提醒' };
  if (!list || list.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:#94a3b8">暂无公告，点击右上角发布第一条公告</div>';
    return;
  }
  el.innerHTML = `
  <table>
    <thead><tr><th>ID</th><th>标题</th><th>类型</th><th>目标</th><th>发布时间</th><th>操作</th></tr></thead>
    <tbody>
      ${list.map(n => `
      <tr id="admin-notice-row-${n.id}">
        <td>${n.id}</td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(n.title)}">${escHtml(n.title)}</td>
        <td>${TYPE_LABEL[n.type] || '系统通知'}</td>
        <td>${n.userId ? '指定用户 #' + n.userId : '全体用户'}</td>
        <td style="font-size:12px;color:#64748b">${n.createTime ? new Date(n.createTime).toLocaleString('zh-CN') : '—'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteNotice(${n.id})">删除</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

window.adminDeleteNotice = async (id) => {
  if (!confirm('确认删除该公告吗？')) return;
  try {
    await request('/notice/' + id, { method: 'DELETE' });
    const row = document.getElementById('admin-notice-row-' + id);
    if (row) row.remove();
    showToast('公告已删除', 'info');
  } catch(e) {
    showToast('删除失败: ' + (e.message || ''), 'error');
  }
};

function openNoticeModal() {
  showModal(`
  <div class="modal">
    <div class="modal-header"><div class="modal-title">🔔 发布公告</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="form-group">
      <label class="form-label">公告标题 <span style="color:#ef4444">*</span></label>
      <input class="form-input" id="nc_title" placeholder="请输入公告标题">
    </div>
    <div class="form-group">
      <label class="form-label">类型</label>
      <select class="form-input form-select" id="nc_type">
        <option value="1">🔔 系统通知</option>
        <option value="3">⏰ 竞赛提醒</option>
        <option value="2">📋 报名状态</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">目标用户</label>
      <select class="form-input form-select" id="nc_target">
        <option value="">全体用户</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">公告内容 <span style="color:#ef4444">*</span></label>
      <textarea class="form-input form-textarea" id="nc_content" rows="5" placeholder="请输入公告内容…"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="submitNotice()">发 布</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

window.submitNotice = async () => {
  const title   = document.getElementById('nc_title')?.value.trim();
  const content = document.getElementById('nc_content')?.value.trim();
  const type    = parseInt(document.getElementById('nc_type')?.value || '1');
  const target  = document.getElementById('nc_target')?.value || '';
  if (!title)   { showToast('请输入公告标题', 'warning'); return; }
  if (!content) { showToast('请输入公告内容', 'warning'); return; }
  try {
    await request('/notice', {
      method: 'POST',
      body: JSON.stringify({ title, content, type, userId: target ? parseInt(target) : null })
    });
    closeModal();
    showToast('公告发布成功 ✓', 'success');
    showAdminPanel('notice');
  } catch(e) {
    showToast('发布失败: ' + (e.message || ''), 'error');
  }
};

function renderLog() {
  const logs = [
    { time:'2026-04-11 19:22', user:'admin',     type:'登录',  content:'管理员登录系统',           ip:'192.168.1.1' },
    { time:'2026-04-11 18:45', user:'admin',     type:'爬虫',  content:'启动数学建模竞赛爬虫任务', ip:'192.168.1.1' },
    { time:'2026-04-11 17:30', user:'teacher01', type:'审核',  content:'通过用户张三的报名申请',   ip:'10.0.0.1'    },
    { time:'2026-04-11 15:20', user:'admin',     type:'新增',  content:'添加竞赛：第十五届蓝桥杯', ip:'192.168.1.1' },
    { time:'2026-04-11 14:10', user:'teacher01', type:'删除',  content:'删除竞赛 ID=99',           ip:'10.0.0.1'    },
  ];
  return `
  <div class="table-card">
    <div class="table-toolbar"><span class="table-toolbar-title">📜 操作日志</span></div>
    <table>
      <thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>内容</th><th>IP</th></tr></thead>
      <tbody>${logs.map(l=>`<tr><td>${l.time}</td><td>${l.user}</td><td>${l.type}</td><td>${l.content}</td><td>${l.ip}</td></tr>`).join('')}</tbody>
    </table>
  </div>`;
}

function renderSettings() {
  return `
  <div class="table-card" style="padding:28px;max-width:640px">
    <div style="font-weight:700;font-size:18px;margin-bottom:22px">⚙️ 系统设置</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">系统名称</label><input class="form-input" value="竞赛通 - 大学生竞赛管理系统"></div>
      <div class="form-group"><label class="form-label">系统 Logo</label><input class="form-input" value="🏆"></div>
      <div class="form-group"><label class="form-label">每页显示条数</label><select class="form-input form-select"><option>10</option><option selected>20</option><option>50</option></select></div>
    </div>
    <button class="btn btn-primary" onclick="showToast('设置保存成功 ✓')">保存设置</button>
  </div>`;
}

/* ---- 辅助：分页按钮 ---- */
function pagerHtml(cur, total) {
  let h = `<div class="page-btn">‹</div>`;
  for (let i = 1; i <= total; i++) h += `<div class="page-btn${i===cur?' active':''}">${i}</div>`;
  h += `<div class="page-btn">›</div>`;
  return h;
}

/* ============================================================
/* ============================================================
   学生获奖记录管理（汇总所有来源：学生自填 + 管理员录入）
============================================================ */
let _adminAwardList = [];  // 存储从后端获取的获奖记录

function renderAwardManage() {
  // 先返回初始 HTML，显示加载中
  // 然后异步加载数据
  
  setTimeout(async () => {
    // 从后端获取所有获奖记录
    try {
      const awards = await API.Award.listAll();
      _adminAwardList = awards || [];
    } catch (e) {
      console.error('获取获奖记录失败:', e);
      _adminAwardList = [];
    }
    
    // 更新表格
    const tbody = document.getElementById('awardAdminTbody');
    if (tbody) {
      tbody.innerHTML = renderAwardRows(_adminAwardList);
    }
    
    // 更新分页
    const pagination = document.querySelector('.table-pagination .pagination');
    if (pagination) {
      pagination.innerHTML = pagerHtml(1, Math.max(1, Math.ceil(_adminAwardList.length / 10)));
    }
  }, 0);

  const sourceLabel = (a) => {
    if (a.source === 'admin') return '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#dbeafe;color:#1d4ed8">管理员录入</span>';
    return '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#d1fae5;color:#065f46">学生自填</span>';
  };

  const LEVEL_CLASS = {'一等奖':'level-1st','二等奖':'level-2nd','三等奖':'level-3rd','特等奖':'level-special','金奖':'level-1st','银奖':'level-2nd','铜奖':'level-3rd'};

  return `
  <div class="table-card">
    <div class="table-toolbar">
      <span class="table-toolbar-title">🏅 学生获奖记录</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="search-wrap" style="max-width:200px">
          <span class="si" style="font-size:14px">🔍</span>
          <input class="search-inp" style="height:38px;font-size:13px" placeholder="搜索学号/姓名/竞赛…" id="awardSearch" onkeyup="filterAwardTable()">
        </div>
        <select class="form-input form-select" style="width:120px;height:38px;font-size:13px" id="awardSourceFilter" onchange="filterAwardTable()">
          <option value="">全部来源</option>
          <option value="admin">管理员录入</option>
          <option value="self">学生自填</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="exportAwardExcel()">📥 导出 Excel</button>
      </div>
    </div>
    <table>
      <thead><tr><th>学号</th><th>姓名</th><th>竞赛名称</th><th>获奖等级</th><th>获奖时间</th><th>来源</th><th>照片</th><th>备注</th><th>操作</th></tr></thead>
      <tbody id="awardAdminTbody"><tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">加载中...</td></tr></tbody>
    </table>
    <div class="table-pagination"><div class="pagination">${pagerHtml(1, 1)}</div></div>
  </div>`;
}


// 照片缓存：避免在 onclick 中嵌入超长 base64 字符串
window._awardPhotoMap = window._awardPhotoMap || {};

function renderAwardRows(list) {
  const LEVEL_CLASS = {'一等奖':'level-1st','二等奖':'level-2nd','三等奖':'level-3rd','特等奖':'level-special','金奖':'level-1st','银奖':'level-2nd','铜奖':'level-3rd'};
  if (!list.length) return `<tr><td colspan="9" style="text-align:center;padding:30px;color:#94a3b8">暂无获奖记录</td></tr>`;
  return list.map(a => {
    const photoUrl = a.photoUrl || a.photo_url;
    // 将照片存到全局 map，onclick 只用 ID 引用（避免 base64 撑爆 HTML）
    if (photoUrl && photoUrl.length > 200) {
      window._awardPhotoMap[a.id] = photoUrl;
    }
    const photoClick = photoUrl
      ? (photoUrl.length > 200
          ? `viewAwardPhotoById(${a.id})`
          : `viewAwardPhoto('${photoUrl.replace(/'/g, "\\'")}')`)
      : '';
    const verified = window._verifiedAwards && window._verifiedAwards.has(a.id);
    const rowStyle = verified ? 'opacity:0.45;background:#f1f5f9' : '';
    return `
  <tr data-award-id="${a.id}" style="${rowStyle}">
    <td>${escHtml(a.studentId || a.student_id || '—')}</td>
    <td>${escHtml(a.studentName || a.student_name || a.nickname || '—')}</td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(a.compName || a.comp_name)}">${escHtml(a.compName || a.comp_name)}</td>
    <td><span class="award-level-badge ${LEVEL_CLASS[a.awardLevel || a.award_level]||'level-2nd'}">${escHtml((a.awardLevel || a.award_level) || '—')}</span></td>
    <td>${fmtDate(a.awardTime || a.award_time)}</td>
    <td>${(a.source || 'self') === 'admin'
      ? '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#dbeafe;color:#1d4ed8">管理员录入</span>'
      : '<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:#d1fae5;color:#065f46">学生自填</span>'}
      ${(a.status === 0 || a.status === '0') ? ' <span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#fef3c7;color:#d97706">待审核</span>' : ''}</td>
    <td>${photoUrl
      ? `<button class="btn btn-outline btn-sm" onclick="${photoClick}">📷 查看</button>`
      : '<span style="color:#94a3b8">—</span>'}</td>
    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(a.description || '')}">
      ${escHtml(a.description || '—')}
    </td>
    <td>
      ${verified
        ? '<button class="btn btn-outline btn-sm" disabled style="color:#16a34a">已核实 ✓</button>'
        : `<button class="btn btn-outline btn-sm" onclick="adminVerifyAward(${a.id})">核实</button>`}
      <button class="btn btn-danger btn-sm" onclick="adminDeleteAward(${a.id})">删除</button>
    </td>
  </tr>`}).join('');
}

/** 通过 ID 从缓存中取照片查看（避免 base64 直接在 onclick 中传递） */
window.viewAwardPhotoById = function(awardId) {
  const photoUrl = window._awardPhotoMap && window._awardPhotoMap[awardId];
  if (photoUrl) {
    window.viewAwardPhoto(photoUrl);
  } else {
    showToast('照片数据丢失，请刷新页面后重试', 'error');
  }
};

// 查看获奖照片函数（添加到 admin.js 中）
window.viewAwardPhoto = function(photoUrl) {
  const fullUrl = (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) ? photoUrl : 'http://localhost:8080/api' + photoUrl;
  showModal(`
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">获奖证书照片</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div style="text-align:center;padding:20px;">
      <img src="${fullUrl}" style="max-width:100%;max-height:500px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" onerror="this.src='';this.alt='图片加载失败';this.style.padding='40px';this.style.background='#f1f5f9';">
      <div style="margin-top:16px;">
        <a href="${fullUrl}" target="_blank" class="btn btn-outline">在新窗口打开</a>
        <button class="btn btn-primary" onclick="closeModal()" style="margin-left:8px;">关闭</button>
      </div>
    </div>
  </div>`);
};

window.filterAwardTable = function() {
  const kw     = (document.getElementById('awardSearch')?.value || '').toLowerCase();
  const source = document.getElementById('awardSourceFilter')?.value || '';
  const list = _adminAwardList.filter(a =>
    (!kw || ((a.studentId || a.student_id || '').includes(kw)) || 
            ((a.studentName || a.student_name || a.nickname || '').toLowerCase().includes(kw)) || 
            ((a.compName || a.comp_name || '').toLowerCase().includes(kw))) &&
    (!source || (a.source || 'self') === source)
  );
  const tbody = document.getElementById('awardAdminTbody');
  if (tbody) tbody.innerHTML = renderAwardRows(list);
};

// 已核实的获奖记录ID集合（持久化到localStorage）
window._verifiedAwards = (() => {
  try { return new Set(JSON.parse(localStorage.getItem('verified_awards') || '[]')); }
  catch(e) { return new Set(); }
})();

window.adminVerifyAward = async function(id) {
  const a = _adminAwardList.find(x => x.id === id);
  if (!a) return;

  try {
    // 调用后端 API 审核通过
    await API.Award.approve(id);
  } catch (e) {
    console.warn('后端审核接口调用失败，仅更新本地状态:', e.message);
  }

  // 更新内存中的状态
  if (a) a.status = 1;
  window._verifiedAwards.add(id);
  try { localStorage.setItem('verified_awards', JSON.stringify([...window._verifiedAwards])); } catch(e) {}
  // 同步更新本地 DB_AWARDS
  const dbAward = DB_AWARDS.find(x => x.id === id);
  if (dbAward) { dbAward.status = 1; }
  if (window._persistAwards) window._persistAwards();
  // 更新行样式
  const row = document.querySelector(`tr[data-award-id="${id}"]`);
  if (row) {
    row.style.opacity = '0.45';
    row.style.background = '#f1f5f9';
    const btn = row.querySelector('button.btn-outline:not([disabled])');
    if (btn) { btn.disabled = true; btn.textContent = '已核实 ✓'; btn.style.color = '#16a34a'; }
    // 移除"待审核"标签
    const pendingBadge = row.querySelector('span[style*="fef3c7"]');
    if (pendingBadge) pendingBadge.remove();
  }
  showToast(`已审核通过：${a.compName || a.comp_name} — ${a.awardLevel || a.award_level}，论坛现可公开展示`, 'success');
};

window.adminDeleteAward = async function(id) {
  if (!confirm('确定删除该获奖记录吗？')) return;
  try {
    await API.Award.delete(id);
    // 直接从内存数组中移除，避免重新加载导致 fallback 到 mock 数据
    const idx = _adminAwardList.findIndex(x => x.id === id);
    if (idx > -1) _adminAwardList.splice(idx, 1);
    const tbody = document.getElementById('awardAdminTbody');
    if (tbody) tbody.innerHTML = renderAwardRows(_adminAwardList);
    showToast('已删除', 'info');
  } catch (e) {
    showToast('删除失败: ' + e.message, 'error');
  }
};

window.exportAwardExcel = function() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库加载中，请稍后重试', 'warning'); return;
  }
  const rows = _adminAwardList.map(a => {
    return {
      '学号':     a.studentId || a.student_id || '—',
      '姓名':     a.studentName || a.student_name || a.nickname || '—',
      '竞赛名称': a.compName || a.comp_name,
      '获奖等级': a.awardLevel || a.award_level,
      '获奖时间': fmtDate(a.awardTime || a.award_time),
      '来源':     (a.source || 'self') === 'admin' ? '管理员录入' : '学生自填',
      '备注':     a.description || '—'
    };
  });
  if (!rows.length) { showToast('暂无数据可导出', 'warning'); return; }
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:14},{wch:10},{wch:30},{wch:10},{wch:12},{wch:10},{wch:20}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '获奖记录');
  XLSX.writeFile(wb, `获奖记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'-')}.xlsx`);
  showToast(`已导出 ${rows.length} 条获奖记录 ✓`);
};
