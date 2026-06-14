/* =====================================================
   app.js - 应用启动入口
===================================================== */

router.register('notice', async (el) => {
  el.innerHTML = buildNoticePage();
  await loadNotices();
});

function buildNoticePage() {
  return `
  <div class="container" style="padding:40px 28px;max-width:860px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:24px;font-weight:700;margin:0">系统公告</h2>
        <p style="color:var(--text-muted);font-size:13px;margin:4px 0 0">最新通知与平台消息</p>
      </div>
    </div>
    <div id="noticeList">
      <div style="text-align:center;padding:40px;color:#94a3b8">加载中...</div>
    </div>
  </div>`;
}

async function loadNotices() {
  const el = document.getElementById('noticeList');
  if (!el) return;

  try {
    const list = await request('/notice/list');
    renderNoticeList(el, list || []);
  } catch (e) {
    renderNoticeList(el, getMockNotices());
  }
}

function getMockNotices() {
  return (window._mockNotices || [
    {
      id: 1,
      title: '欢迎使用竞赛通',
      content: '平台已上线，可浏览竞赛信息、收藏项目并体验演示功能。',
      type: 1,
      createTime: '2026-04-20T09:00:00',
      isRead: 0
    },
    {
      id: 2,
      title: 'GitHub Pages 演示说明',
      content: '当前网页版本运行在静态演示模式下，数据会保存在浏览器本地。',
      type: 3,
      createTime: '2026-06-14T18:00:00',
      isRead: 0
    }
  ]);
}

function renderNoticeList(el, list) {
  if (!list || list.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:52px;margin-bottom:12px">📭</div>
        <div style="font-weight:600;color:#475569;font-size:16px">暂无公告</div>
        <div style="color:#94a3b8;font-size:13px;margin-top:6px">管理员尚未发布任何通知</div>
      </div>`;
    return;
  }

  const TYPE_ICON = { 1: '📢', 2: '✅', 3: '⚠️' };
  const TYPE_COLOR = { 1: '#3b82f6', 2: '#10b981', 3: '#f59e0b' };

  el.innerHTML = list.map((n) => {
    const icon = TYPE_ICON[n.type] || '📄';
    const color = TYPE_COLOR[n.type] || '#6366f1';
    const unread = !n.isRead;

    return `
    <div id="notice-item-${n.id}" onclick="markNoticeRead(${n.id}, this)"
      style="background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:14px;
             border:1px solid ${unread ? color + '60' : '#e2e8f0'};
             box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;
             transition:box-shadow .2s;position:relative;overflow:hidden">
      ${unread ? `<div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${color};border-radius:4px 0 0 4px"></div>` : ''}
      <div style="display:flex;align-items:flex-start;gap:14px">
        <div style="font-size:28px;flex-shrink:0;line-height:1.2">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:15px;font-weight:${unread ? 700 : 600};color:#1e293b">${escapeHtml(n.title)}</span>
            ${unread ? `<span style="font-size:10px;padding:2px 7px;background:${color};color:#fff;border-radius:10px;flex-shrink:0">NEW</span>` : ''}
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.6">${escapeHtml(n.content || '')}</p>
          <span style="font-size:12px;color:#94a3b8">🕒 ${formatNoticeTime(n.createTime)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function formatNoticeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date)
    ? value
    : date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
}

async function markNoticeRead(id, itemEl) {
  try {
    await request('/notice/' + id + '/read', { method: 'PUT' });
  } catch (e) {
    // ignore
  }

  if (!itemEl) return;
  itemEl.style.borderColor = '#e2e8f0';

  const bar = itemEl.querySelector('div[style*="position:absolute"]');
  if (bar) bar.remove();

  const badge = Array.from(itemEl.querySelectorAll('span')).find((node) => node.textContent === 'NEW');
  if (badge) badge.remove();

  const title = itemEl.querySelector('span');
  if (title) title.style.fontWeight = '600';
}
window.markNoticeRead = markNoticeRead;

/* ---- 启动：恢复登录状态并进入首页 ---- */
(async function init() {
  const token = localStorage.getItem('token');

  if (!token) {
    localStorage.removeItem('user');
    window.currentUser = null;
    window._mockCurrentUser = null;
    updateNavbar();
    router.go('home');
    return;
  }

  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      window.currentUser = user;
      window._mockCurrentUser = user;
      if (window._rebuildFavSet) window._rebuildFavSet(user.id);
      updateNavbar();
    } catch (e) {
      // ignore cached parse failure
    }
  }

  try {
    const fetched = await API.User.getInfo();
    if (fetched && fetched.id) {
      window.currentUser = fetched;
      window._mockCurrentUser = fetched;
      localStorage.setItem('user', JSON.stringify(fetched));
      updateNavbar();
    }
  } catch (e) {
    if (e.message && (e.message.includes('401') || e.message.includes('Unauthorized')) && !token.startsWith('mock_')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.currentUser = null;
      window._mockCurrentUser = null;
      updateNavbar();
    }
  }

  router.go('home');
})();
