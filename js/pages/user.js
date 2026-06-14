/* =====================================================
   pages/user.js  — 用户个人中心
===================================================== */

// 全局状态
let _activePanel = 'info';

// 暴露菜单点击函数到全局
window.showUserPanel = async (panel, liEl) => {
  _activePanel = panel;
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  if (liEl) liEl.classList.add('active');
  const panels = ['info','favorites','awards','enrollment','security','tags'];
  panels.forEach(p => {
    const el = document.getElementById(`up-${p}`);
    if (el) el.style.display = p === panel ? '' : 'none';
  });
  if (panel === 'favorites')  await renderFavorites();
  if (panel === 'awards')     await renderAwards();
  if (panel === 'enrollment') await renderEnrollments();
};

router.register('user', async (el) => {
  // 确保有用户信息
  if (!window.currentUser) {
    try {
      const fetched = await API.User.getInfo();
      if (fetched && fetched.id) {
        window.currentUser = fetched;
        window._mockCurrentUser = fetched;
      } else {
        showToast('请先登录', 'warning');
        router.go('login');
        return;
      }
    } catch (e) {
      showToast('请先登录', 'warning');
      router.go('login');
      return;
    }
  }

  // 二次确认：currentUser 仍为空则跳登录
  if (!window.currentUser) {
    router.go('login');
    return;
  }

  el.innerHTML = buildUserLayout();

  // 初始化显示个人信息面板
  _activePanel = 'info';
  const panels = ['info','favorites','awards','enrollment','security','tags'];
  panels.forEach(p => {
    const panelEl = document.getElementById(`up-${p}`);
    if (panelEl) panelEl.style.display = p === 'info' ? '' : 'none';
  });

  // 异步加载统计数据
  loadUserStats();
});

/* 异步加载并更新顶部统计数字 */
async function loadUserStats() {
  try {
    // 并发获取三项统计数据
    const [enrollList, awardList, favList] = await Promise.allSettled([
      API.Enrollment.myList(),
      API.Award.list(),
      API.Favorite.list()
    ]);

    const enrollData = enrollList.status === 'fulfilled' ? (enrollList.value || []) : [];
    const awardData  = awardList.status  === 'fulfilled' ? (awardList.value  || []) : [];
    const favData    = favList.status    === 'fulfilled' ? (favList.value    || []) : [];

    // 参赛次数 = 已通过的报名数
    const enrollCount = enrollData.filter(e => e.status === 1 || e.statusName === '已通过').length;

    const statEnroll = document.getElementById('statEnroll');
    const statAward  = document.getElementById('statAward');
    const statFav    = document.getElementById('statFav');
    if (statEnroll) statEnroll.textContent = enrollCount;
    if (statAward)  statAward.textContent  = awardData.length;
    if (statFav)    statFav.textContent    = favData.length;
  } catch (e) {
    // 加载失败时回退到本地数据
    const u = window.currentUser;
    if (!u) return;
    const statEnroll = document.getElementById('statEnroll');
    const statAward  = document.getElementById('statAward');
    const statFav    = document.getElementById('statFav');
    if (statEnroll) statEnroll.textContent = DB_ENROLLMENTS.filter(e=>e.userId===u.id&&e.status==='已通过').length;
    if (statAward)  statAward.textContent  = DB_AWARDS.filter(a=>a.userId===u.id).length;
    if (statFav)    statFav.textContent    = DB_FAVORITES.filter(f=>f.userId===u.id).length;
  }
}

function buildUserLayout() {
  const u = window.currentUser;
  return `
  <div class="sidebar-layout">
    <!-- ===== SIDEBAR ===== -->
    <div class="sidebar">
      <div class="sidebar-card">
        <div class="user-sidebar-profile">
          <div class="user-avatar">${u.avatar ? `<img src="${u.avatar}">` : '👤'}</div>
          <div class="user-name">${escHtml(u.nickname || u.username)}</div>
          <div class="user-role-badge">${['','高级管理员','管理员','认证用户','普通用户'][u.role]}</div>
        </div>
        <ul class="sidebar-menu">
          <li class="sidebar-item active" onclick="showUserPanel('info',this)">📋 个人信息</li>
          <li class="sidebar-item" onclick="showUserPanel('favorites',this)">❤️ 我的收藏</li>
          <li class="sidebar-item" onclick="showUserPanel('awards',this)">🏅 获奖记录</li>
          <li class="sidebar-item" onclick="showUserPanel('enrollment',this)">📝 我的报名</li>
          <li class="sidebar-item" onclick="showUserPanel('security',this)">🔒 账号安全</li>
          <li class="sidebar-item" onclick="showUserPanel('tags',this)">🏷️ 兴趣标签</li>
          ${u.role <= 2 ? '<li class="sidebar-item" onclick="router.go(\'admin\')">⚙️ 管理后台</li>' : ''}
          <li class="sidebar-item danger" onclick="doLogout()">🚪 退出登录</li>
        </ul>
      </div>
    </div>

    <!-- ===== MAIN ===== -->
    <div class="main-panel">
      <!-- stats -->
      <div class="mini-stats">
        <div class="mini-stat"><div class="mini-stat-num" id="statEnroll">—</div><div class="mini-stat-lbl">参赛次数</div></div>
        <div class="mini-stat"><div class="mini-stat-num" id="statAward">—</div><div class="mini-stat-lbl">获奖次数</div></div>
        <div class="mini-stat"><div class="mini-stat-num" id="statFav">—</div><div class="mini-stat-lbl">收藏竞赛</div></div>
      </div>

      <!-- ====== PANEL: 个人信息 ====== -->
      <div id="up-info" class="panel-card">
        <div class="panel-header"><div class="panel-title">📋 个人信息</div><div class="panel-desc">管理您的基本资料</div></div>
        <div class="info-note">ℹ️ 账号和权限级别不可修改，如需变更请联系管理员。</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">账号（不可修改）</label>
            <input class="form-input" value="${escHtml(u.username)}" readonly onclick="readonlyAlert()">
          </div>
          <div class="form-group">
            <label class="form-label">权限级别（不可修改）</label>
            <input class="form-input" value="${['','高级管理员','管理员','认证用户','普通用户'][u.role]}" readonly onclick="readonlyAlert()">
          </div>
          <div class="form-group">
            <label class="form-label">真实姓名</label>
            <input class="form-input" id="fi_realname" value="${escHtml(u.realName||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input class="form-input" id="fi_nickname" value="${escHtml(u.nickname||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">学号</label>
            <input class="form-input" id="fi_sid" value="${escHtml(u.studentId||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">年级</label>
            <select class="form-input form-select" id="fi_grade">
              ${['大一','大二','大三','大四','研一','研二','研三'].map(g=>`<option${u.grade===g?' selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">学院</label>
            <input class="form-input" id="fi_college" value="${escHtml(u.college||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">专业</label>
            <input class="form-input" id="fi_major" value="${escHtml(u.major||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input class="form-input" id="fi_email" type="email" value="${escHtml(u.email||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input class="form-input" id="fi_phone" type="tel" value="${escHtml(u.phone||'')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">头像</label>
          <div style="display:flex;align-items:center;gap:16px">
            <div class="user-avatar" style="width:60px;height:60px;font-size:22px">${u.avatar?`<img src="${u.avatar}">`:'👤'}</div>
            <div>
              <button class="btn btn-outline btn-sm" onclick="showToast('头像上传功能对接后端后启用','info')">更换头像</button>
              <div class="form-hint">支持 JPG / PNG，最大 2MB</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveUserInfo()">保存更改</button>
      </div>

      <!-- ====== PANEL: 我的收藏 ====== -->
      <div id="up-favorites" class="panel-card" style="display:none">
        <div class="panel-header">
          <div class="panel-title">❤️ 我的收藏</div>
          <div class="panel-desc" id="fav-count-desc">按收藏时间排序</div>
        </div>
        <div class="fav-list" id="favListEl"></div>
      </div>

      <!-- ====== PANEL: 获奖记录 ====== -->
      <div id="up-awards" class="panel-card" style="display:none">
        <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div class="panel-title">🏅 获奖记录</div>
            <div class="panel-desc">记录每一个属于你的荣誉时刻</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openAwardModal()">+ 添加记录</button>
        </div>
        <div class="award-list" id="awardListEl"></div>
      </div>

      <!-- ====== PANEL: 我的报名 ====== -->
      <div id="up-enrollment" class="panel-card" style="display:none">
        <div class="panel-header"><div class="panel-title">📝 我的报名</div><div class="panel-desc">管理竞赛报名记录</div></div>
        <div class="tabs" id="enrollTabs">
          <div class="tab active" onclick="enrollTabSwitch(this,'')">全部</div>
          <div class="tab" onclick="enrollTabSwitch(this,'待审核')">待审核</div>
          <div class="tab" onclick="enrollTabSwitch(this,'已通过')">已通过</div>
          <div class="tab" onclick="enrollTabSwitch(this,'已拒绝')">已拒绝</div>
        </div>
        <div class="fav-list" id="enrollListEl"></div>
      </div>

      <!-- ====== PANEL: 账号安全 ====== -->
      <div id="up-security" class="panel-card" style="display:none">
        <div class="panel-header"><div class="panel-title">🔒 账号安全</div><div class="panel-desc">修改登录密码</div></div>
        <div style="max-width:420px">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input class="form-input" type="password" id="oldPwd" placeholder="请输入当前密码">
          </div>
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input class="form-input" type="password" id="newPwd" placeholder="至少 8 位，含字母+数字">
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input class="form-input" type="password" id="confirmPwd" placeholder="再次输入新密码">
          </div>
          <button class="btn btn-primary" onclick="changePwd()">修改密码</button>
        </div>
      </div>

      <!-- ====== PANEL: 兴趣标签 ====== -->
      <div id="up-tags" class="panel-card" style="display:none">
        <div class="panel-header"><div class="panel-title">🏷️ 兴趣标签</div><div class="panel-desc">设置兴趣标签，获取个性化竞赛推荐</div></div>
        <div class="form-group">
          <label class="form-label">我的标签</label>
          <div class="tag-input-wrap" id="myTagsWrap">
            <div class="tag-pill">数学建模 <span class="tag-pill-x" onclick="removeTagPill(this)">×</span></div>
            <div class="tag-pill">程序设计 <span class="tag-pill-x" onclick="removeTagPill(this)">×</span></div>
            <div class="tag-pill">数据科学 <span class="tag-pill-x" onclick="removeTagPill(this)">×</span></div>
            <input type="text" class="tag-input-field" placeholder="输入后 Enter 添加" onkeydown="addTagPill(event,this)">
          </div>
          <div class="form-hint">按 Enter 添加，点 × 删除</div>
        </div>
        <div class="form-group">
          <label class="form-label">推荐标签（点击快速添加）</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['创新创业','电子设计','机器人','人工智能','区块链','网络安全','艺术设计','英语演讲','市场营销','数理统计']
              .map(t=>`<span class="tag-chip" onclick="quickAddTag('${t}')">${t}</span>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary" onclick="showToast('兴趣标签保存成功 ✓')">保存标签</button>
      </div>
    </div>
  </div>`;
}

/* ---- 保存个人信息 ---- */
async function saveUserInfo() {
  try {
    if (!window.currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) {
        window.currentUser = JSON.parse(stored);
      } else {
        showToast('请先登录', 'warning');
        return;
      }
    }

    const data = {
      realName:  document.getElementById('fi_realname')?.value.trim(),
      nickname:  document.getElementById('fi_nickname')?.value.trim(),
      studentId: document.getElementById('fi_sid')?.value.trim(),
      grade:     document.getElementById('fi_grade')?.value,
      college:   document.getElementById('fi_college')?.value.trim(),
      major:     document.getElementById('fi_major')?.value.trim(),
      email:     document.getElementById('fi_email')?.value.trim(),
      phone:     document.getElementById('fi_phone')?.value.trim()
    };

    // 过滤掉 undefined/null 值
    Object.keys(data).forEach(k => { if (data[k] == null) delete data[k]; });

    // 调用 API 保存
    const updated = await API.User.updateInfo(data);

    // 确保本地状态同步
    Object.assign(window.currentUser, data);
    localStorage.setItem('user', JSON.stringify(window.currentUser));

    // 更新导航栏昵称
    const navNickname = document.getElementById('navNickname');
    if (navNickname && window.currentUser.nickname) {
      navNickname.textContent = window.currentUser.nickname;
    }
    // 更新左侧名字显示
    const sideNick = document.querySelector('.user-name');
    if (sideNick && window.currentUser.nickname) {
      sideNick.textContent = window.currentUser.nickname;
    }

    showToast('个人信息保存成功 ✓');
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络连接'), 'error');
  }
}

/* ---- 收藏列表 ---- */
async function renderFavorites() {
  const el = document.getElementById('favListEl');
  const desc = document.getElementById('fav-count-desc');
  if (!el) return;

  // 检查用户登录状态
  let user = window.currentUser;
  if (!user) {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        user = JSON.parse(stored);
        window.currentUser = user;
      } catch (e) { /* 忽略 */ }
    }
  }
  if (!user) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">请先登录</div><div class="empty-desc">登录后查看您的收藏</div></div>`;
    if (desc) desc.textContent = '请先登录';
    return;
  }

  try {
    const list = await API.Favorite.list();
    if (desc) desc.textContent = `按收藏时间排序，共 ${list.length} 条`;
    if (!list.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">❤️</div><div class="empty-title">还没有收藏</div><div class="empty-desc">去发现感兴趣的竞赛吧</div></div>`; return; }

    // 更新收藏集合
    favoriteSet = new Set(list.map(f => f.competitionId));

    el.innerHTML = list.map(f => {
      return `
      <div class="fav-item">
        <div class="fav-thumb">🏆</div>
        <div class="fav-body">
          <div class="fav-title">${escHtml(f.title)}</div>
          <div class="fav-meta">
            <span>🏛️ ${escHtml(f.organizer || '未知主办方')}</span>
            <span>📅 截止 ${fmtDate(f.endTime)}</span>
            <span class="badge ${levelBadge(f.levelName)}">${f.levelName}</span>
          </div>
          <div class="fav-time">收藏于 ${fmtDate(f.createTime)}</div>
        </div>
        <div class="fav-actions">
          <button class="btn btn-outline btn-sm" onclick="openCompDetail(${f.competitionId})">查看详情</button>
          <button class="btn btn-danger btn-sm" onclick="cancelFav(${f.competitionId},this)">取消收藏</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    console.error('加载收藏失败:', e);
    console.error('错误堆栈:', e.stack);
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">加载失败</div><div class="empty-desc">${e.message || '请稍后重试'}</div></div>`;
    showToast('加载收藏失败: ' + (e.message || '未知错误'), 'error');
  }
}

async function cancelFav(compId, btn) {
  try {
    await API.Favorite.remove(compId);
    favoriteSet.delete(compId);
    // 同步清理本地数据
    const uid = window.currentUser ? window.currentUser.id : null;
    if (uid) DB_FAVORITES = DB_FAVORITES.filter(f => !(f.compId === compId && f.userId === uid));
    if (window._persistFavorites) window._persistFavorites();
    renderFavorites();
    showToast('已取消收藏', 'info');
  } catch (e) {
    showToast(e.message || '操作失败', 'error');
  }
}

/* ---- 获奖记录 ---- */
let _awardList = [];

async function renderAwards() {
  const el = document.getElementById('awardListEl');
  if (!el) return;

  // 检查用户登录状态
  let user = window.currentUser;
  if (!user) {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        user = JSON.parse(stored);
        window.currentUser = user;
      } catch (e) { /* 忽略 */ }
    }
  }
  if (!user) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">请先登录</div><div class="empty-desc">登录后查看您的获奖记录</div></div>`;
    return;
  }

  try {
    let list = null;
    let backendError = false;
    try {
      list = await API.Award.list();
    } catch (apiErr) {
      // 后端请求失败（网络错误等），标记以便后续 mock 兜底
      backendError = true;
      list = [];
    }
    // 后端请求本身成功但数据为空 → 真实意义上"无记录"，不做 mock 兜底
    // 只有后端完全不可用（backendError=true）时才用 mock 数据
    if (backendError && (!list || !list.length)) {
      list = (typeof getMockData === 'function' ? getMockData('/award/list') : null) || [];
    }
    if (!list) list = [];
    _awardList = list;
    // 将照片缓存到全局 map，避免在 onclick 中嵌入超长 base64 字符串
    window._userAwardPhotoMap = window._userAwardPhotoMap || {};
    list.forEach(a => {
      if (a.photoUrl && a.photoUrl.length > 200) {
        window._userAwardPhotoMap[a.id] = a.photoUrl;
      }
    });
    if (!list.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏅</div><div class="empty-title">还没有获奖记录</div><div class="empty-desc">点击右上角添加你的第一个荣誉</div></div>`; return; }


    const LEVEL_CLASS = {'一等奖':'level-1st','二等奖':'level-2nd','三等奖':'level-3rd','特等奖':'level-special','金奖':'level-1st','银奖':'level-2nd','铜奖':'level-3rd'};

    el.innerHTML = list.map(a => `
    <div class="award-item" id="award-${a.id}">
      <div class="award-icon">🏆</div>
      <div class="award-info">
        <div class="award-name">${escHtml(a.compName)}</div>
        <div class="award-meta">
          <span class="award-level-badge ${LEVEL_CLASS[a.awardLevel]||'level-2nd'}">${a.awardLevel || '获奖'}</span>
          ${(a.status === 0) ? '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:#fef3c7;color:#d97706;margin-left:4px">待审核</span>' : (a.status === 1 ? '<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:#d1fae5;color:#065f46;margin-left:4px">已审核</span>' : '')}
          <span>📅 ${fmtDate(a.awardTime)}</span>
          ${a.photoUrl ? `<span>📷 <a href="javascript:void(0)" onclick="viewAwardPhotoUserById(${a.id})" style="color:#3b82f6">查看照片</a></span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-outline btn-sm" onclick="openAwardModal(${a.id})">编辑</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAward(${a.id})">删除</button>
      </div>
    </div>`).join('');
  } catch (e) {
    console.error('加载获奖记录失败:', e);
    console.error('错误堆栈:', e.stack);
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">加载失败</div><div class="empty-desc">${e.message || '请稍后重试'}</div></div>`;
    showToast('加载获奖记录失败: ' + (e.message || '未知错误'), 'error');
  }
}

function openAwardModal(id) {
  const a = id ? _awardList.find(x => x.id === id) : null;
  // 如果有已上传的照片，显示照片预览
  const hasExistingPhoto = a && a.photoUrl;
  showModal(`
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">${a ? '编辑' : '+ 添加'}获奖记录</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="form-group">
      <label class="form-label">竞赛名称 *</label>
      <input class="form-input" id="am_name" value="${a?escHtml(a.compName):''}" placeholder="请输入参赛竞赛名称">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">获奖等级 *</label>
        <select class="form-input form-select" id="am_level">
          ${['一等奖','二等奖','三等奖','特等奖','优秀奖','最佳创新奖','金奖','银奖','铜奖']
            .map(l=>`<option${a&&a.awardLevel===l?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">获奖时间 *</label>
        <input class="form-input" type="date" id="am_date" value="${a&&a.awardTime?a.awardTime:''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">证书图片链接（选填）</label>
      <input class="form-input" id="am_cert" type="url" value="${a&&a.certificate?escHtml(a.certificate):''}" placeholder="https://…">
    </div>
    <div class="form-group">
      <label class="form-label">备注</label>
      <textarea class="form-input form-textarea" id="am_remark" rows="3" placeholder="其他说明…">${a&&a.description?escHtml(a.description):''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">获奖证书/照片${hasExistingPhoto ? '（已上传，可选择替换）' : ''}</label>
      <div class="upload-area" id="awardPhotoUpload" onclick="document.getElementById('awardPhotoInput').click()">
        <input type="file" id="awardPhotoInput" accept="image/*" style="display:none" onchange="previewAwardPhoto(this)">
        <div class="upload-placeholder" id="awardPhotoPlaceholder" style="${hasExistingPhoto ? 'display:none' : ''}">
          <span class="upload-icon">📷</span>
          <span class="upload-text">点击上传证书照片</span>
          <span class="upload-hint">支持 JPG、PNG 格式，最大 2MB</span>
        </div>
        <img id="awardPhotoPreview" class="upload-preview"
          src="${hasExistingPhoto ? a.photoUrl : ''}"
          style="display:${hasExistingPhoto ? 'block' : 'none'};max-width:100%;max-height:200px;border-radius:8px;"
          onerror="this.style.display='none';document.getElementById('awardPhotoPlaceholder').style.display='flex';"
        >
      </div>
      <button type="button" class="btn btn-outline btn-sm" id="removePhotoBtn"
        style="display:${hasExistingPhoto ? 'inline-block' : 'none'};margin-top:8px;"
        onclick="removeAwardPhoto()">删除照片</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveAward(${id||'null'})">保存</button>
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
    </div>
  </div>`);
}

// 预览获奖照片
window.previewAwardPhoto = function(input) {
  const file = input.files[0];
  if (!file) return;
  
  // 检查文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    showToast('照片大小不能超过 2MB', 'error');
    input.value = '';
    return;
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请上传图片文件', 'error');
    input.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('awardPhotoPreview').src = e.target.result;
    document.getElementById('awardPhotoPreview').style.display = 'block';
    document.getElementById('awardPhotoPlaceholder').style.display = 'none';
    document.getElementById('removePhotoBtn').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
};

// 删除获奖照片
window.removeAwardPhoto = function() {
  document.getElementById('awardPhotoInput').value = '';
  document.getElementById('awardPhotoPreview').src = '';
  document.getElementById('awardPhotoPreview').style.display = 'none';
  document.getElementById('awardPhotoPlaceholder').style.display = 'flex';
  document.getElementById('removePhotoBtn').style.display = 'none';
};

// 用户端查看获奖照片
window.viewAwardPhotoUser = function(photoUrl) {
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
    </div>
  `);
};

// 通过 ID 查看获奖照片（避免 base64 直接嵌入 onclick）
window.viewAwardPhotoUserById = function(awardId) {
  const photoUrl = (window._userAwardPhotoMap && window._userAwardPhotoMap[awardId])
    || (_awardList.find(a => a.id === awardId) || {}).photoUrl;
  if (photoUrl) {
    window.viewAwardPhotoUser(photoUrl);
  } else {
    showToast('照片数据丢失，请刷新后重试', 'error');
  }
};

async function saveAward(id) {
  const name  = document.getElementById('am_name')?.value.trim();
  const level = document.getElementById('am_level')?.value;
  const date  = document.getElementById('am_date')?.value;
  const cert  = document.getElementById('am_cert')?.value.trim();
  const remark = document.getElementById('am_remark')?.value.trim();

  // 获取照片文件和状态
  const photoInput = document.getElementById('awardPhotoInput');
  const photoFile = photoInput?.files[0];
  const photoPreview = document.getElementById('awardPhotoPreview');
  const hasPhotoVisible = photoPreview && photoPreview.style.display !== 'none';

  if (!name) { showToast('请填写竞赛名称', 'error'); return; }
  if (!level){ showToast('请选择获奖等级', 'error'); return; }
  if (!date) { showToast('请选择获奖时间', 'error'); return; }

  // 构建数据对象
  const data = {
    compName: name,
    awardLevel: level,
    awardTime: date,
    certificate: cert,
    description: remark,
    source: 'self'
  };

  // 处理照片：将图片文件转为 base64 编码存入数据库
  // 这样无需依赖后端文件服务器，存到数据库后任何端都能直接读取显示
  if (photoFile) {
    // 情况1：选择了新照片 → 转为 base64
    try {
      data.photoUrl = await readFileAsBase64(photoFile);
    } catch (e) {
      console.error('照片读取失败:', e);
      showToast('照片读取失败，请重试', 'error');
      return;
    }
  } else if (id && id !== 'null') {
    // 情况2：编辑模式，没有选择新照片
    const existingRecord = _awardList.find(x => x.id === id);
    if (!hasPhotoVisible) {
      // 照片预览被隐藏，说明用户删除了照片
      data.photoUrl = null;
    } else if (existingRecord && existingRecord.photoUrl) {
      // 保持原有照片
      data.photoUrl = existingRecord.photoUrl;
    }
  }

  try {
    if (id && id !== 'null') {
      await API.Award.update(id, data);
      showToast('获奖记录已更新 ✓');
    } else {
      await API.Award.add(data);
      showToast('获奖记录添加成功，已同步至管理员端 ✓');
    }
    closeModal();
    renderAwards();
  } catch (e) {
    showToast('保存失败：' + (e.message || '未知错误'), 'error');
  }
}


async function deleteAward(id) {
  try {
    await API.Award.delete(id);
    renderAwards();
    showToast('已删除', 'info');
  } catch (e) {
    showToast(e.message || '删除失败', 'error');
  }
}

/* ---- 报名记录 ---- */
let _enrollFilter = '';
async function renderEnrollments() {
  const el = document.getElementById('enrollListEl');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:32px;color:#94a3b8">加载中…</div>';

  try {
    // 调用后端 /enrollment/my，只返回当前登录用户的报名记录
    let allList = await API.Enrollment.myList();

    // 如果后端返回空（或不可用时 mock 回退）
    if (!allList || !allList.length) {
      const user = window.currentUser;
      const uid = user ? user.id : null;
      allList = DB_ENROLLMENTS
        .filter(e => e.userId === uid)
        .map(e => ({
          id: e.id,
          competitionId: e.compId,
          competitionTitle: e.compTitle || '—',
          status: e.status === '已通过' ? 1 : e.status === '已拒绝' ? 2 : 0,
          statusName: e.status || '待审核',
          enrollTime: e.enrollTime || null
        }));
    }

    // 根据筛选条件过滤（_enrollFilter 为空字符串=全部）
    const STATUS_MAP = { '待审核': 0, '已通过': 1, '已拒绝': 2 };
    let list = allList;
    if (_enrollFilter) {
      const filterCode = STATUS_MAP[_enrollFilter];
      list = allList.filter(e => e.status === filterCode || e.statusName === _enrollFilter);
    }

    if (!list.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">暂无报名记录</div></div>`;
      return;
    }

    const STATUS_CLASS = { 0: 'dot-yellow', 1: 'dot-green', 2: 'dot-red' };
    el.innerHTML = list.map(e => {
      const statusName = e.statusName || (e.status === 1 ? '已通过' : e.status === 2 ? '已拒绝' : '待审核');
      const statusClass = STATUS_CLASS[e.status] || 'dot-yellow';
      const enrollTime = e.enrollTime ? fmtDate(e.enrollTime) : '—';
      return `
      <div class="fav-item">
        <div class="fav-thumb">🏆</div>
        <div class="fav-body">
          <div class="fav-title">${escHtml(e.competitionTitle || e.compTitle || '—')}</div>
          <div class="fav-meta">
            <span class="status-dot"><span class="dot ${statusClass}"></span>${statusName}</span>
            <span>📅 ${enrollTime}</span>
          </div>
        </div>
        <div class="fav-actions">
          <button class="btn btn-outline btn-sm" onclick="openCompDetail(${e.competitionId || e.compId})">查看竞赛</button>
        </div>
      </div>`;
    }).join('');

    // 同步更新参赛次数统计
    const passedCount = allList.filter(e => e.status === 1 || e.statusName === '已通过').length;
    const statEnroll = document.getElementById('statEnroll');
    if (statEnroll) statEnroll.textContent = passedCount;

  } catch (e) {
    console.error('加载报名记录失败:', e);
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">加载失败</div><div class="empty-desc">${e.message||'请稍后重试'}</div></div>`;
  }
}

window.enrollTabSwitch = (el, status) => {
  _enrollFilter = status;
  document.querySelectorAll('#enrollTabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEnrollments();
};

/* ---- 密码修改 ---- */
async function changePwd() {
  const old = document.getElementById('oldPwd')?.value;
  const n1  = document.getElementById('newPwd')?.value;
  const n2  = document.getElementById('confirmPwd')?.value;
  if (!old || !n1 || !n2) { showToast('请填写所有密码字段', 'warning'); return; }
  if (n1.length < 6) { showToast('新密码至少需要 6 位', 'warning'); return; }
  if (n1 !== n2) { showToast('两次输入的密码不一致', 'error'); return; }

  try {
    await API.User.changePassword({
      oldPassword: old,
      newPassword: n1,
      confirmPassword: n2
    });
    showToast('密码修改成功，请重新登录 ✓');
    setTimeout(() => doLogout(), 1500);
  } catch (e) {
    showToast(e.message || '修改失败', 'error');
  }
}

/* ---- 标签操作 ---- */
function addTagPill(e, input) {
  if (e.key !== 'Enter') return;
  const val = input.value.trim();
  if (!val) return;
  const wrap = document.getElementById('myTagsWrap');
  const pill = document.createElement('div');
  pill.className = 'tag-pill';
  pill.innerHTML = `${escHtml(val)} <span class="tag-pill-x" onclick="removeTagPill(this)">×</span>`;
  wrap.insertBefore(pill, input);
  input.value = '';
}
function removeTagPill(x) { x.closest('.tag-pill').remove(); }
function quickAddTag(name) {
  const wrap = document.getElementById('myTagsWrap');
  if (!wrap) return;
  const input = wrap.querySelector('.tag-input-field');
  const pill = document.createElement('div');
  pill.className = 'tag-pill';
  pill.innerHTML = `${name} <span class="tag-pill-x" onclick="removeTagPill(this)">×</span>`;
  wrap.insertBefore(pill, input);
  showToast(`已添加标签「${name}」`);
}



