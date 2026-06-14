/* =====================================================
   pages/forum.js  — 论坛首页（唯一版本，无重复定义）
===================================================== */

/* 论坛分类按钮样式 */
const FORUM_CATEGORY_STYLES = `
<style>
.forum-categories {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 25px;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.cat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.cat-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
/* 各分类的特殊颜色 */
.cat-btn[data-cat="competition"]:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}
.cat-btn[data-cat="competition"].active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}
.cat-btn[data-cat="experience"]:hover {
  border-color: #10b981;
  color: #10b981;
}
.cat-btn[data-cat="experience"].active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.cat-btn[data-cat="question"]:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}
.cat-btn[data-cat="question"].active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.cat-btn[data-cat="general"]:hover {
  border-color: #6b7280;
  color: #6b7280;
}
.cat-btn[data-cat="general"].active {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}
</style>
`;

/* ---- 全局状态 ---- */
let forumPage    = 1;
let forumKeyword = '';
let forumCategory = 'all';

/* ---- 路由注册 ---- */
router.register('forum', async (el) => {
  el.innerHTML = buildForumPage();
  bindForumEvents();
  await loadForumPosts(1);
});

/* ============================================================
   页面模板
============================================================ */
function buildForumPage() {
  return FORUM_CATEGORY_STYLES + `
  <div class="forum-container">
    <!-- 头部 -->
    <div class="forum-header">
      <div class="container">
        <div class="forum-title">
          <h1>💬 竞赛论坛</h1>
          <p>讨论赛事、分享经验、交流心得</p>
        </div>
        <button class="btn btn-primary btn-publish" onclick="showPublishModal()">
          <span>✏️</span> 发布帖子
        </button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="forum-filter">
      <div class="container">
        <div class="forum-filter-wrap">
          <!-- 分类筛选 -->
          <div class="forum-categories">
            <button class="cat-btn active" data-cat="all" onclick="filterByCategory('all', this)">全部</button>
            <button class="cat-btn" data-cat="competition" onclick="filterByCategory('competition', this)">🏆 赛事讨论</button>
            <button class="cat-btn" data-cat="experience" onclick="filterByCategory('experience', this)">📚 经验分享</button>
            <button class="cat-btn" data-cat="question" onclick="filterByCategory('question', this)">❓ 问题求助</button>
            <button class="cat-btn" data-cat="general" onclick="filterByCategory('general', this)">💬 综合讨论</button>
          </div>
          <!-- 搜索 -->
          <div class="forum-search-wrap">
            <input type="text" id="forumSearchInput" class="forum-search-inp"
                   placeholder="搜索帖子关键词..."
                   onkeydown="if(event.key==='Enter')searchForum()">
            <button class="btn btn-primary" onclick="searchForum()">🔍 搜索</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div class="forum-content">
      <div class="container">
        <div id="forumPostList" class="post-list"></div>
        <div id="forumPagination" class="forum-pagination"></div>
      </div>
    </div>
  </div>

  <!-- 发布帖子弹窗 -->
  <div id="publishModal" class="publish-overlay" style="display:none;">
    <div class="publish-modal">
      <div class="publish-header">
        <h3>✏️ 发布新帖子</h3>
        <button class="publish-close" onclick="closePublishModal()">×</button>
      </div>
      <div class="publish-body">
        <div class="form-group">
          <label class="form-label">分类 <span style="color:#ef4444">*</span></label>
          <select id="postCategory" class="form-input form-select">
            <option value="general">💬 综合讨论</option>
            <option value="competition">🏆 赛事讨论</option>
            <option value="experience">📚 经验分享</option>
            <option value="question">❓ 问题求助</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">标题 <span style="color:#ef4444">*</span></label>
          <input type="text" id="postTitle" class="form-input"
                 placeholder="请输入帖子标题（5-100字）" maxlength="100">
        </div>
        <div class="form-group">
          <label class="form-label">内容 <span style="color:#ef4444">*</span></label>
          <textarea id="postContent" class="form-input form-textarea"
                    rows="8" placeholder="请输入帖子内容…"
                    style="min-height:160px"></textarea>
        </div>
      </div>
      <div class="publish-footer">
        <button class="btn btn-outline" onclick="closePublishModal()">取消</button>
        <button class="btn btn-primary" onclick="submitPost()">发 布</button>
      </div>
    </div>
  </div>
  `;
}

/* ============================================================
   加载 & 渲染帖子
============================================================ */
async function loadForumPosts(page) {
  forumPage = page || 1;
  const listEl = document.getElementById('forumPostList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">加载中…</div>';

  try {
    const result = await API.Forum.getPosts(forumPage, 10, forumCategory, forumKeyword);
    const posts   = result && result.records ? result.records : (Array.isArray(result) ? result : []);
    renderPostList(posts);
    if (result && result.total !== undefined) {
      renderForumPagination(result.total, result.size || 10, result.current || forumPage);
    } else {
      const paginationEl = document.getElementById('forumPagination');
      if (paginationEl) paginationEl.innerHTML = '';
    }
  } catch (e) {
    console.error('加载帖子失败:', e);
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">加载失败</div>
        <div class="empty-desc">${e.message || '请稍后重试'}</div>
      </div>`;
  }
}

/* ============================================================
   分类筛选
============================================================ */
function filterByCategory(category, btn) {
  forumCategory = category;
  // 更新按钮状态
  document.querySelectorAll('.forum-categories .cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // 重置到第一页并加载
  loadForumPosts(1);
}

function renderPostList(posts) {
  const listEl = document.getElementById('forumPostList');
  if (!posts || posts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">暂无帖子</div>
        <div class="empty-desc">快来发布第一个帖子吧！</div>
      </div>`;
    return;
  }

  listEl.innerHTML = posts.map(post => `
    <div class="post-item" onclick="viewPostDetail(${post.id})">
      <div class="post-main">
        <div class="post-title-row">
          ${post.isTop ? '<span class="top-badge">置顶</span>' : ''}
          <span class="post-title-text">${escapeHtml(post.title)}</span>
        </div>
        <div class="post-meta-row">
          <span class="forum-username-clickable"
            onclick="event.stopPropagation();showUserAwards(${post.userId || 0},'${escapeHtml(post.userNickname || post.user_nickname || '匿名用户').replace(/'/g, "\\'")}')"
            style="cursor:pointer;color:#3b82f6;font-weight:500;text-decoration:underline dotted;text-underline-offset:3px">
            👤 ${escapeHtml(post.userNickname || post.user_nickname || '匿名用户')}
          </span>
          <span>🕐 ${formatForumTime(post.createTime || post.create_time)}</span>
          <span>👁 ${post.viewCount || post.view_count || 0}</span>
          <span>💬 ${post.replyCount || post.reply_count || 0}</span>
        </div>
      </div>
      <div class="post-arrow">›</div>
    </div>
  `).join('');
}

/* ============================================================
   点击论坛用户名 → 弹出获奖记录
============================================================ */
async function showUserAwards(userId, nickname) {
  // 删除旧弹窗
  document.getElementById('userAwardsOverlay')?.remove();

  const LEVEL_COLOR = {
    '特等奖':'#ef4444','一等奖':'#f59e0b','二等奖':'#6366f1',
    '三等奖':'#10b981','金奖':'#f59e0b','银奖':'#6366f1','铜奖':'#10b981'
  };

  const overlay = document.createElement('div');
  overlay.id = 'userAwardsOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;width:480px;max-width:92vw;max-height:82vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
        <div>
          <div style="font-size:18px;font-weight:700;color:#1e293b">🏅 ${escapeHtml(nickname)} 的荣誉墙</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px">参赛获奖记录 · 点击用户名可查看</div>
        </div>
        <button onclick="document.getElementById('userAwardsOverlay').remove()"
          style="border:none;background:#f1f5f9;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;color:#64748b;line-height:32px;text-align:center">×</button>
      </div>
      <div id="userAwardsList">
        <div style="text-align:center;padding:32px;color:#94a3b8">
          <div style="font-size:28px;margin-bottom:8px">⏳</div>加载中…
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const listEl = document.getElementById('userAwardsList');
  try {
    let awards = [];
    if (userId) {
      try {
        awards = await API.Award.getUserAwards(userId) || [];
      } catch(e) { /* 后端不可用 */ }

      // 如果后端返回空（或不可用），用本地数据兜底，确保所有用户都能显示
      if (!awards || !awards.length) {
        const fu = (window.DB_USERS || []).find(u => u.id == userId);
        awards = (window.DB_AWARDS || [])
          .filter(a =>
            a.status !== 0 &&  // 只显示已审核的（公开可见）
            (String(a.userId) === String(userId) ||
            String(a.studentId) === String(userId) ||
            (fu && String(a.studentId) === String(fu.studentId)) ||
            (fu && String(a.studentName) === String(fu.realName)))
          )
          .map(a => ({ id: a.id, compName: a.compName, awardLevel: a.awardLevel, awardTime: a.awardTime, photoUrl: a.photoUrl || '', source: a.source || 'self' }));
      }
    }

    if (!awards || !awards.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:32px">
          <div style="font-size:48px;margin-bottom:12px">🎯</div>
          <div style="font-weight:600;color:#475569">暂无获奖记录</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:6px">该用户还没有登记获奖信息</div>
        </div>`;
      return;
    }

    // 将照片缓存，避免在 onclick 中嵌入超长 base64 字符串
    window._forumAwardPhotoMap = window._forumAwardPhotoMap || {};
    awards.forEach(a => {
      const pu = a.photoUrl || a.photo_url || '';
      if (pu && pu.length > 200) {
        window._forumAwardPhotoMap[a.id] = pu;
      }
    });

    listEl.innerHTML = `
      <div style="font-size:13px;color:#64748b;margin-bottom:12px">共 <b>${awards.length}</b> 项荣誉</div>
      ${awards.map(a => {
        const color = LEVEL_COLOR[a.awardLevel] || '#6366f1';
        const photoUrl = a.photoUrl || a.photo_url || '';
        const sourceBadge = (a.source || 'self') === 'admin'
          ? '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#dbeafe;color:#1d4ed8;margin-left:6px">管理员录入</span>'
          : '';
        const photoClick = photoUrl
          ? (photoUrl.length > 200
              ? `event.stopPropagation();viewAwardPhotoForumById(${a.id})`
              : `event.stopPropagation();viewAwardPhotoForum('${photoUrl.replace(/'/g, "\\'")}')`)
          : '';
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:#f8fafc;margin-bottom:8px;border:1px solid #e2e8f0">
          <div style="font-size:26px;flex-shrink:0">🏆</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1e293b">${escapeHtml(a.compName || '')}${sourceBadge}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px">
              📅 ${a.awardTime || '—'}
              ${photoUrl ? `<span style="margin-left:8px;color:#3b82f6;cursor:pointer" onclick="${photoClick}">📷 查看证书</span>` : ''}
            </div>
          </div>
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${color}18;color:${color};border:1px solid ${color}40;flex-shrink:0">${escapeHtml(a.awardLevel || '')}</span>
        </div>`;
      }).join('')}`;
  } catch(e) {
    if (listEl) listEl.innerHTML = `<div style="color:#ef4444;text-align:center;padding:20px">加载失败: ${e.message}</div>`;
  }
}
window.showUserAwards = showUserAwards;

/* 论坛中通过ID查看获奖证书照片（避免base64嵌入onclick） */
window.viewAwardPhotoForumById = function(awardId) {
  const photoUrl = window._forumAwardPhotoMap && window._forumAwardPhotoMap[awardId];
  if (photoUrl) {
    viewAwardPhotoForum(photoUrl);
  } else {
    showToast('照片数据丢失，请刷新后重试', 'error');
  }
};

/* 论坛中查看获奖证书照片 */
window.viewAwardPhotoForum = function(photoUrl) {
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


/* ============================================================
   分页
============================================================ */
function renderForumPagination(total, size, current) {
  const totalPages = Math.ceil(total / size);
  const paginationEl = document.getElementById('forumPagination');
  if (!paginationEl || totalPages <= 1) {
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  let html = '';
  if (current > 1) html += `<button class="page-btn" onclick="loadForumPosts(${current - 1})">上一页</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === current) {
      html += `<button class="page-btn active">${i}</button>`;
    } else if (i === 1 || i === totalPages || Math.abs(i - current) <= 2) {
      html += `<button class="page-btn" onclick="loadForumPosts(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 3) {
      html += `<span style="padding:0 4px">…</span>`;
    }
  }
  if (current < totalPages) html += `<button class="page-btn" onclick="loadForumPosts(${current + 1})">下一页</button>`;
  paginationEl.innerHTML = html;
}

/* ============================================================
   搜索
============================================================ */
function searchForum() {
  forumKeyword = document.getElementById('forumSearchInput')?.value.trim() || '';
  loadForumPosts(1);
}

/* ============================================================
   发布帖子
============================================================ */
function showPublishModal() {
  if (!isLoggedIn()) {
    showToast('请先登录后再发布帖子', 'warning');
    router.go('login');
    return;
  }
  document.getElementById('publishModal').style.display = 'flex';
}

function closePublishModal() {
  document.getElementById('publishModal').style.display = 'none';
  const t = document.getElementById('postTitle');
  const c = document.getElementById('postContent');
  const cat = document.getElementById('postCategory');
  if (t) t.value = '';
  if (c) c.value = '';
  if (cat) cat.value = 'general';
}

async function submitPost() {
  const title    = document.getElementById('postTitle')?.value.trim();
  const content  = document.getElementById('postContent')?.value.trim();
  const category = document.getElementById('postCategory')?.value || 'general';

  if (!title)              { showToast('请输入标题', 'warning'); return; }
  if (title.length < 5)   { showToast('标题至少 5 个字', 'warning'); return; }
  if (!content)            { showToast('请输入内容', 'warning'); return; }
  if (content.length < 10) { showToast('内容至少 10 个字', 'warning'); return; }

  try {
    await API.Forum.createPost({ category, title, content });
    showToast('发布成功！', 'success');
    closePublishModal();
    loadForumPosts(1);
  } catch (e) {
    showToast(e.message || '发布失败，请检查是否已登录', 'error');
  }
}

/* ============================================================
   查看帖子详情
============================================================ */
function viewPostDetail(postId) {
  router.go('forum-detail', { id: postId });
}

/* ============================================================
   事件绑定
============================================================ */
function bindForumEvents() {
  const modal = document.getElementById('publishModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'publishModal') closePublishModal();
    });
  }
}

/* ============================================================
   工具函数
============================================================ */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatForumTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now  = new Date();
  const diff = now - date;
  if (diff < 60000)     return '刚刚';
  if (diff < 3600000)   return Math.floor(diff / 60000)   + '分钟前';
  if (diff < 86400000)  return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000)+ '天前';
  return date.toLocaleDateString('zh-CN');
}
