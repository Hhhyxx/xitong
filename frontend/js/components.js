/* =====================================================
   components.js  — 可复用 UI 组件
===================================================== */

/** 竞赛卡片 HTML - 适配后端数据格式和模拟数据 */
function CompCard(c) {
  // 兼容后端数据格式和模拟数据格式
  const { text, cls } = deadlineTextForComp(c);
  const isFav = favoriteSet.has(c.id);
  const levelLabel = getCompetitionLevelLabel(c);
  const catName = getCompetitionCategoryLabel(c);
  const organizer = c.organizer || '未知主办方';
  return `
  <div class="comp-card" onclick="openCompDetail(${c.id})">
    <div class="comp-cover">
      <span style="position:relative;z-index:1">🏆</span>
    </div>
    <div class="comp-body">
      <div class="comp-tags">
        <span class="badge ${levelBadge(levelLabel)}">${escHtml(levelLabel)}</span>
        <span class="badge" style="background:#f0fdf4;color:#16a34a">${escHtml(catName)}</span>
      </div>
      <div class="comp-title" title="${escHtml(c.title)}">${escHtml(c.title)}</div>
      <div class="comp-meta">
        <div class="comp-meta-row">🏛️ ${escHtml(organizer)}</div>
        <div class="comp-meta-row">📅 ${formatCompCardCalendarLine(c)}</div>
      </div>
    </div>
    <div class="comp-footer">
      <span class="deadline ${cls}">${text}</span>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="icon-btn ${isFav?'liked':''}" title="${isFav?'取消收藏':'收藏'}"
          onclick="toggleFavorite(${c.id},this)">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <button class="icon-btn" title="报名" onclick="openEnrollModal(${c.id})">📝</button>
      </div>
    </div>
  </div>`;
}

/** 收藏/取消收藏 - 调用后端 API */
async function toggleFavorite(compId, btn) {
  if (!currentUser) { showToast('请先登录', 'warning'); router.go('login'); return; }
  if (isExternalMergedCompetitionId(compId)) {
    showToast('请通过竞赛详情中的官网链接参与该赛事', 'info');
    return;
  }

  try {
    if (favoriteSet.has(compId)) {
      await API.Favorite.remove(compId);
      favoriteSet.delete(compId);
      btn.innerHTML = '🤍'; btn.classList.remove('liked');
      showToast('已取消收藏', 'info');
    } else {
      await API.Favorite.add(compId);
      favoriteSet.add(compId);
      btn.innerHTML = '❤️'; btn.classList.add('liked');
      showToast('已加入收藏 ❤️');
    }
  } catch (e) {
    showToast(e.message || '操作失败', 'error');
  }
}

/** 打开报名弹窗 */
function openEnrollModal(compId) {
  if (!currentUser) { showToast('请先登录', 'warning'); router.go('login'); return; }
  if (isExternalMergedCompetitionId(compId)) {
    (async () => {
      try {
        const d = await API.Competition.detail(compId);
        const u = d && (d.sourceUrl || d.url);
        if (u) {
          window.open(u, '_blank', 'noopener');
          showToast('已打开官方网站，请按官网说明报名', 'success');
          return;
        }
      } catch (e) { /* ignore */ }
      showToast('暂时无法获取官网链接', 'warning');
    })();
    return;
  }
  const c = DB_COMPS.find(x => x.id === compId);
  if (!c) return;
  const u = currentUser;
  showModal(`
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">📝 竞赛报名</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="info-note">ℹ️ 您的信息将提交给管理员审核，请确认信息准确无误。</div>
    <div class="comp-detail-hero" style="margin-bottom:18px">
      <div style="opacity:.75;font-size:12px;margin-bottom:4px">报名竞赛</div>
      <div style="font-size:15px;font-weight:700">${escHtml(c.title)}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input class="form-input" value="${escHtml(u.realName||u.nickname||'')}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">学号</label>
        <input class="form-input" value="${escHtml(u.studentId||'')}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">学院</label>
        <input class="form-input" value="${escHtml(u.college||'')}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">专业</label>
        <input class="form-input" value="${escHtml(u.major||'')}" readonly>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">联系方式</label>
      <input class="form-input" id="enroll_phone" value="${escHtml(u.phone||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">团队名称（选填）</label>
      <input class="form-input" id="enroll_team" placeholder="如为团队参赛请填写">
    </div>
    <div class="form-group">
      <label class="form-label">团队成员（选填）</label>
      <input class="form-input" id="enroll_members" placeholder="如：李四、王五">
    </div>
    <div class="form-group">
      <label class="form-label">备注</label>
      <textarea class="form-input form-textarea" id="enroll_remark" placeholder="其他说明…" rows="3"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="submitEnroll(${c.id})">提交报名</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

/** 提交报名 */
async function submitEnroll(compId) {
  const c = DB_COMPS.find(x => x.id === compId);
  if (!c) { showToast('竞赛信息不存在', 'error'); return; }

  // 从当前用户获取报名时的个人信息快照
  const user = window.currentUser || {};
  const enrollData = {
    competitionId: compId,
    teamName: document.getElementById('enroll_team')?.value.trim() || '',
    teamMembers: document.getElementById('enroll_members')?.value.trim() || '',
    remark: document.getElementById('enroll_remark')?.value.trim() || '',
    // 附带用户信息快照，确保管理员端能看到学号姓名等
    studentId: user.studentId || '',
    realName: user.realName || user.nickname || '',
    college: user.college || '',
    major: user.major || '',
    phone: user.phone || ''
  };

  try {
    await API.Enrollment.enroll(enrollData);
    // 同步到本地数组（包含完整用户信息，管理员端离线时也能显示）
    DB_ENROLLMENTS.push({
      id: uid(), compId, compTitle: c.title,
      status:'待审核', statusClass:'dot-yellow',
      enrollTime: new Date().toLocaleString('zh-CN'),
      userId: user.id,
      realName: user.realName || user.nickname || '',
      studentId: user.studentId || '',
      college: user.college || '',
      major: user.major || '',
      phone: user.phone || '',
      teamName: enrollData.teamName,
      teamMembers: enrollData.teamMembers,
      remark: enrollData.remark
    });
    closeModal();
    // 持久化报名数据到 localStorage
    if (window._persistEnrollments) window._persistEnrollments();
    showToast('报名提交成功，等待审核 ✓');
  } catch (e) {
    showToast('报名失败: ' + (e.message || ''), 'error');
  }
}

/** 打开竞赛详情弹窗 */
async function openCompDetail(compId) {
  // 先从本地找，找不到再请求后端
  let c = DB_COMPS.find(x => x.id === compId || x.id == compId);
  if (!c) {
    try {
      c = await API.Competition.detail(compId);
    } catch(e) {}
  }
  if (!c) { showToast('获取竞赛信息失败', 'error'); return; }

  const isFav = favoriteSet.has(c.id);
  const startRaw = getCompetitionStartDateValue(c);
  const endRaw = getCompetitionEndDateValue(c);
  const startDate = startRaw ? String(startRaw).slice(0, 10) : '';
  const endDate   = endRaw ? String(endRaw).slice(0, 10) : '';
  const catName   = getCompetitionCategoryLabel(c);
  const levelLabel = getCompetitionLevelLabel(c);
  const url       = c.url       || c.sourceUrl    || '';
  const desc      = c.desc      || c.description  || '暂无描述';

  showModal(`
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title">竞赛详情</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="comp-detail-hero">
      <div class="comp-detail-hero-title">${escHtml(c.title)}</div>
      <div class="comp-detail-meta">
        <span>📅 报名：${startDate || '待定'} — ${endDate || '待定'}</span>
        <span>🏛️ ${escHtml(c.organizer || '未知主办方')}</span>
        <span>🥇 ${escHtml(levelLabel)}</span>
        <span>📂 ${escHtml(catName)}</span>
      </div>
    </div>
    <p class="comp-detail-desc">${escHtml(desc)}</p>
    ${url ? `
    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">🏆 官方网站地址</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="compUrl" class="form-input" value="${escHtml(url)}" readonly style="flex:1;font-size:13px;background:#fff">
        <button class="btn btn-outline" onclick="copyCompUrl()" style="white-space:nowrap">📋 复制</button>
      </div>
    </div>` : ''}
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="closeModal();openEnrollModal(${c.id})">📝 立即报名</button>
      <button class="btn btn-outline" id="detailFavBtn" onclick="detailToggleFav(${c.id},this)">
        ${isFav ? '❤️ 已收藏' : '🤍 收藏'}
      </button>
    </div>
  </div>`);
}

async function detailToggleFav(compId, btn) {
  if (!currentUser) { showToast('请先登录', 'warning'); return; }
  if (isExternalMergedCompetitionId(compId)) {
    showToast('请通过官网链接关注该赛事', 'info');
    return;
  }
  try {
    if (favoriteSet.has(compId)) {
      await API.Favorite.remove(compId);
      favoriteSet.delete(compId);
      const userId = currentUser.id;
      DB_FAVORITES = DB_FAVORITES.filter(f => !(f.compId === compId && f.userId === userId));
      if (window._persistFavorites) window._persistFavorites();
      btn.innerHTML = '🤍 收藏';
      showToast('已取消收藏', 'info');
    } else {
      await API.Favorite.add(compId);
      favoriteSet.add(compId);
      const userId = currentUser.id;
      DB_FAVORITES.push({ id: uid(), compId, userId, addTime: new Date().toLocaleString('zh-CN') });
      if (window._persistFavorites) window._persistFavorites();
      btn.innerHTML = '❤️ 已收藏';
      showToast('已加入收藏 ❤️');
    }
  } catch (e) {
    showToast(e.message || '操作失败', 'error');
  }
}

/** 复制竞赛官网地址 */
function copyCompUrl() {
  const urlInput = document.getElementById('compUrl');
  if (urlInput) {
    urlInput.select();
    document.execCommand('copy');
    showToast('官网地址已复制到剪贴板 ✓', 'success');
  }
}

/** 渲染分页 */
function renderPagination(total, current, perPage, onPage) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return '';
  let html = '<div class="pagination">';
  html += `<div class="page-btn" onclick="(${onPage})(${current - 1})">‹</div>`;
  for (let i = 1; i <= pages; i++) {
    html += `<div class="page-btn${i===current?' active':''}" onclick="(${onPage})(${i})">${i}</div>`;
  }
  html += `<div class="page-btn" onclick="(${onPage})(${current + 1})">›</div>`;
  html += '</div>';
  return html;
}

/** 检查用户是否已登录 */
function isLoggedIn() {
  return !!window.currentUser;
}

/** 更新导航栏显示 */
function updateNavbar() {
  const navGuest = document.getElementById('navGuest');
  const navUser = document.getElementById('navUser');
  const navNickname = document.getElementById('navNickname');
  const navAdminBtn = document.getElementById('navAdminBtn');

  if (!navGuest || !navUser) return;

  if (window.currentUser) {
    navGuest.style.display = 'none';
    navUser.style.display = 'flex';
    if (navNickname) {
      navNickname.textContent = window.currentUser.nickname || window.currentUser.username || '';
    }
    // 管理员显示管理后台按钮
    if (navAdminBtn && window.currentUser.role <= 2) {
      navAdminBtn.style.display = 'inline-block';
    } else if (navAdminBtn) {
      navAdminBtn.style.display = 'none';
    }
  } else {
    navGuest.style.display = 'flex';
    navUser.style.display = 'none';
  }
}

/** 渲染竞赛网格 */
function renderCompGrid(containerId, comps) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!comps || comps.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">暂无竞赛</div></div>';
    return;
  }

  container.innerHTML = comps.map(c => CompCard(c)).join('');
}
