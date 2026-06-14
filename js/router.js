/* =====================================================
   router.js  — 单页路由
===================================================== */
const router = (() => {
  const pages = {};
  let cur = null;

  function register(name, renderFn) { pages[name] = renderFn; }

  function go(name, params = {}) {
    const container = document.getElementById('appContainer');
    if (!container) return;

    // 鉴权守卫：需要登录才能访问的页面
    const authRequired = ['user', 'admin', 'forum', 'forum-detail'];
    if (authRequired.includes(name) && !window.currentUser) {
      showToast('请先登录后再访问', 'warning');
      go('login');
      return;
    }
    if (name === 'admin' && currentUser && currentUser.role > 2) {
      showToast('权限不足', 'error');
      return;
    }

    if (!pages[name]) { console.warn('未知页面:', name); return; }

    container.innerHTML = '';
    const pageEl = document.createElement('div');
    pageEl.id = `page-${name}`;
    pageEl.className = 'page';
    container.appendChild(pageEl);

    pages[name](pageEl, params);
    cur = name;

    // 更新导航高亮
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === name);
    });

    // 导航链接点击绑定（只需绑定一次，用事件委托）
    window.scrollTo(0, 0);
  }

  function current() { return cur; }

  return { register, go, current };
})();

// 导航链接统一跳转
document.getElementById('navLinks').addEventListener('click', e => {
  const btn = e.target.closest('.nav-link');
  if (btn && btn.dataset.page) router.go(btn.dataset.page);
});
