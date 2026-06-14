/* =====================================================
   forum-detail.js  — 帖子详情页
===================================================== */

// 当前正在查看的帖子 ID（用于点赞/回复后刷新）
let _currentPostId = null;

router.register('forum-detail', (el, params) => {
  const postId = params.id;
  if (!postId) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">帖子ID无效</div></div>';
    return;
  }
  _currentPostId = postId;
  buildForumDetailPage(el, postId);
});

/* ============================================================
   构建帖子详情页
============================================================ */
async function buildForumDetailPage(el, postId) {
  el.innerHTML = `
  <div class="container" style="padding:24px 0">
    <div class="breadcrumb" style="margin-bottom:16px">
      <span class="breadcrumb-item" onclick="router.go('forum')">论坛</span>
      <span class="breadcrumb-separator">›</span>
      <span class="breadcrumb-item active">帖子详情</span>
    </div>
    <div id="postDetailContent">
      <div class="loading-state"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>
    </div>
  </div>`;

  try {
    const data = await API.Forum.getPostDetail(postId);
    console.log('帖子详情返回:', data);

    // 兼容两种返回格式：{post, replies} 或直接返回 post
    const post = data.post || data;
    const replies = data.replies || post.replies || [];

    if (!post) {
      document.getElementById('postDetailContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">帖子不存在或已被删除</div>
          <button class="btn btn-primary" onclick="router.go('forum')" style="margin-top:16px">返回论坛</button>
        </div>`;
      return;
    }

    renderPostDetail(post, replies);
  } catch (e) {
    console.error('加载帖子详情失败:', e);
    document.getElementById('postDetailContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">帖子加载失败</div>
        <div class="empty-desc">${e.message || '请稍后重试'}</div>
        <button class="btn btn-primary" onclick="router.go('forum')" style="margin-top:16px">返回论坛</button>
      </div>`;
  }
}

/* ============================================================
   渲染帖子详情
============================================================ */
function renderPostDetail(post, replies) {
  const container = document.getElementById('postDetailContent');
  if (!container) return;

  // 分类标签映射
  const categoryMap = {
    'competition': '赛事讨论',
    'experience': '经验分享',
    'help': '问题求助',
    'general': '综合讨论'
  };
  const categoryName = categoryMap[post.category] || '综合讨论';
  const categoryColor = {
    'competition': '#3b82f6',
    'experience': '#10b981',
    'help': '#f59e0b',
    'general': '#6b7280'
  }[post.category] || '#6b7280';

  container.innerHTML = `
  <div class="post-detail">
    <!-- 帖子头部 -->
    <div class="post-detail-header">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span class="post-category-tag" style="background:${categoryColor}20;color:${categoryColor};border:1px solid ${categoryColor}40">${categoryName}</span>
        ${post.isTop ? '<span class="post-top-tag">置顶</span>' : ''}
      </div>
      <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
      <div class="post-detail-meta">
        <div class="post-author">
          <div class="post-author-avatar">${(post.userNickname || post.userName || '匿名').charAt(0).toUpperCase()}</div>
          <div class="post-author-info">
            <div class="post-author-name">${escapeHtml(post.userNickname || post.userName || '匿名用户')}</div>
            <div class="post-time">${formatTime(post.createTime)}</div>
          </div>
        </div>
        <div class="post-stats">
          <span class="post-stat">👁 ${post.viewCount || 0} 浏览</span>
          <span class="post-stat">💬 ${post.replyCount || 0} 回复</span>
          <span class="post-stat">👍 ${post.likeCount || 0} 赞</span>
        </div>
      </div>
    </div>

    <!-- 帖子内容 -->
    <div class="post-detail-content">
      ${escapeHtml(post.content).replace(/\n/g, '<br>')}
    </div>

    <!-- 帖子操作 -->
    <div class="post-detail-actions">
      <button class="btn btn-outline" onclick="likePost(${post.id})">
        👍 点赞 (${post.likeCount || 0})
      </button>
      <button class="btn btn-outline" onclick="showReplyForm()">
        💬 回复
      </button>
      ${(post.userId === (window.currentUser?.id)) ? `
      <button class="btn btn-outline btn-danger" onclick="deletePost(${post.id})">
        🗑️ 删除
      </button>` : ''}
    </div>

    <!-- 回复表单 -->
    <div id="replyForm" class="reply-form" style="display:none;margin-top:24px;padding:20px;background:#f8fafc;border-radius:12px">
      <div class="form-group">
        <label class="form-label">发表回复</label>
        <textarea id="replyContent" class="form-input form-textarea" rows="4" placeholder="写下你的回复..."></textarea>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="hideReplyForm()">取消</button>
        <button class="btn btn-primary" onclick="submitReply(${post.id})">发表回复</button>
      </div>
    </div>

    <!-- 回复列表 -->
    <div class="replies-section">
      <div class="replies-header">
        <h3 class="replies-title">全部回复 (${replies.length})</h3>
      </div>
      <div id="repliesList">
        ${replies.length > 0 ? replies.map(reply => renderReplyItem(reply)).join('') : `
          <div class="empty-state" style="padding:40px 0">
            <div class="empty-icon">💬</div>
            <div class="empty-title">暂无回复</div>
            <div class="empty-desc">成为第一个回复的人吧</div>
          </div>
        `}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   渲染单个回复
============================================================ */
function renderReplyItem(reply) {
  return `
  <div class="reply-item" id="reply-${reply.id}">
    <div class="reply-header">
      <div class="reply-author">
        <div class="reply-author-avatar">${(reply.userNickname || reply.userName || '匿名').charAt(0).toUpperCase()}</div>
        <div class="reply-author-info">
          <div class="reply-author-name">${escapeHtml(reply.userNickname || reply.userName || '匿名用户')}</div>
          <div class="reply-time">${formatTime(reply.createTime)}</div>
        </div>
      </div>
    </div>
    <div class="reply-content">
      ${escapeHtml(reply.content).replace(/\n/g, '<br>')}
    </div>
    <div class="reply-actions">
      <button class="reply-action-btn" onclick="likeReply(${reply.id})">
        👍 ${reply.likeCount || 0}
      </button>
      ${(reply.userId === (window.currentUser?.id)) ? `
      <button class="reply-action-btn" onclick="deleteReply(${reply.id}, ${reply.postId})">
        🗑️ 删除
      </button>` : ''}
    </div>
  </div>`;
}

/* ============================================================
   交互功能
============================================================ */
function showReplyForm() {
  if (!isLoggedIn()) {
    showToast('请先登录后再回复', 'warning');
    router.go('login');
    return;
  }
  const form = document.getElementById('replyForm');
  if (form) form.style.display = 'block';
}

function hideReplyForm() {
  const form = document.getElementById('replyForm');
  if (form) form.style.display = 'none';
}

async function submitReply(postId) {
  const content = document.getElementById('replyContent')?.value.trim();
  if (!content) {
    showToast('请输入回复内容', 'warning');
    return;
  }
  if (content.length < 5) {
    showToast('回复内容至少5个字', 'warning');
    return;
  }

  try {
    await API.Forum.createReply({ postId, content });
    showToast('回复成功！', 'success');
    hideReplyForm();
    // 刷新帖子详情
    const data = await API.Forum.getPostDetail(postId);
    const post = data.post || data;
    const replies = data.replies || post.replies || [];
    renderPostDetail(post, replies);
  } catch (e) {
    showToast(e.message || '回复失败', 'error');
  }
}

async function likePost(postId) {
  if (!isLoggedIn()) {
    showToast('请先登录后再点赞', 'warning');
    router.go('login');
    return;
  }

  try {
    await API.Forum.likePost(postId);
    showToast('点赞成功！', 'success');
    // 刷新帖子详情
    const data = await API.Forum.getPostDetail(postId);
    const post = data.post || data;
    const replies = data.replies || post.replies || [];
    renderPostDetail(post, replies);
  } catch (e) {
    showToast(e.message || '点赞失败', 'error');
  }
}

async function likeReply(replyId) {
  if (!isLoggedIn()) {
    showToast('请先登录后再点赞', 'warning');
    router.go('login');
    return;
  }

  try {
    await API.Forum.likeReply(replyId);
    showToast('点赞成功！', 'success');
    // 用存储的当前帖子ID刷新
    if (_currentPostId) {
      const data = await API.Forum.getPostDetail(_currentPostId);
      const post = data.post || data;
      const replies = data.replies || post.replies || [];
      renderPostDetail(post, replies);
    }
  } catch (e) {
    showToast(e.message || '点赞失败', 'error');
  }
}

async function deletePost(postId) {
  if (!confirm('确定要删除这个帖子吗？此操作不可恢复。')) return;

  try {
    await API.Forum.deletePost(postId);
    showToast('帖子已删除', 'success');
    router.go('forum');
  } catch (e) {
    showToast(e.message || '删除失败', 'error');
  }
}

async function deleteReply(replyId, postId) {
  if (!confirm('确定要删除这条回复吗？')) return;

  try {
    await API.Forum.deleteReply(replyId);
    showToast('回复已删除', 'success');
    // 刷新帖子详情
    const data = await API.Forum.getPostDetail(postId);
    const post = data.post || data;
    const replies = data.replies || post.replies || [];
    renderPostDetail(post, replies);
  } catch (e) {
    showToast(e.message || '删除失败', 'error');
  }
}

/* ============================================================
   工具函数
============================================================ */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(time) {
  if (!time) return '未知时间';
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}
