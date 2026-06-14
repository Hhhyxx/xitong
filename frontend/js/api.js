/**
 * API 接口层 - 调用后端 SpringBoot 服务
 * 基础 URL: http://localhost:8080/api
 *
 * 设计原则：
 *  - 后端不可用时，除了登录/注册/修改密码，其余全部回退到模拟数据
 *  - 论坛发帖、获奖添加等写操作在后端不可用时写入本地模拟数据
 */

const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
const STATIC_DEMO_MODE = IS_GITHUB_PAGES || window.location.search.includes('demo=1');
const API_BASE = STATIC_DEMO_MODE ? '/api' : 'http://localhost:8080/api';

// 获取 token
function getToken() {
  return localStorage.getItem('token') || '';
}

// 后端可用状态（null=未检测，true=可用，false=不可用）
let backendAvailable = null;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 30000; // 30秒后重新检测

async function checkBackend() {
  if (STATIC_DEMO_MODE) {
    backendAvailable = false;
    lastBackendCheck = Date.now();
    return false;
  }

  const now = Date.now();
  // 如果超过30秒，重新检测
  if (backendAvailable !== null && (now - lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(API_BASE + '/competition/list?page=1&size=1', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    lastBackendCheck = now;
    return backendAvailable;
  } catch (e) {
    backendAvailable = false;
    lastBackendCheck = now;
    console.log('后端不可用，将使用模拟数据');
    return false;
  }
}


// 只有登录/注册/修改密码 这三类操作必须走真实后端（不回退）
const FORCE_REAL_PATHS = ['/auth/login', '/auth/register', '/auth/send-email-code', '/user/password'];

// 通用请求封装
// 核心原则：始终优先尝试后端，仅在后端确认不可用时回退模拟数据
async function request(url, options = {}) {
  const allowStaticMock = STATIC_DEMO_MODE && (
    url.startsWith('/auth/register') ||
    url.startsWith('/auth/send-email-code') ||
    url.startsWith('/user/password')
  );
  const forceReal = FORCE_REAL_PATHS.some(path => url.startsWith(path)) && !allowStaticMock;
  // 文件上传必须走真实后端，mock 模式无法处理文件
  const isFileUpload = options.body instanceof FormData;

  const token = getToken();
  // 如果是 FormData 上传，不设置 Content-Type，让浏览器自动设置 multipart/form-data
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  // 始终先尝试后端
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(API_BASE + url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.message || '请求失败');
    }

    // 后端成功响应 → 标记可用
    backendAvailable = true;
    lastBackendCheck = Date.now();
    const result = data.data;

    // 论坛帖子列表成功拉取后缓存到 localStorage，用于后端短暂不可用时的兜底
    const method2 = (options.method || 'GET').toUpperCase();
    if (url.includes('/forum/posts') && method2 === 'GET' && result && result.records) {
      try { localStorage.setItem('forum_posts_cache', JSON.stringify(result)); } catch(e) { /* 忽略 */ }
    }

    return result;
  } catch (error) {
    // 登录/注册/修改密码/文件上传 → 必须抛出错误，不走模拟数据
    if (forceReal || isFileUpload) {
      throw error;
    }
    // 后端请求失败 → 回退到模拟数据
    console.warn('后端请求失败，使用模拟数据:', url, error.message);
    backendAvailable = false;
    lastBackendCheck = Date.now();
    return getMockData(url, options);
  }
}

/* ============================================================
   模拟数据返回（后端不可用时的回退）
============================================================ */
function getMockData(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // ---------- 演示模式验证码 ----------
  if (url.startsWith('/auth/send-email-code') && method === 'POST') {
    try { localStorage.setItem('mock_email_code', '123456'); } catch (e) { /* ignore */ }
    return { success: true, code: '123456' };
  }

  if (url.startsWith('/auth/send-code') && method === 'POST') {
    try { localStorage.setItem('mock_sms_code', '123456'); } catch (e) { /* ignore */ }
    return { success: true, code: '123456' };
  }

  if (url === '/auth/login' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const username = body.username || '';
    const password = body.password || '';
    const user = DB_USERS.find(u =>
      (u.username === username || u.email === username) && u.password === password
    );
    if (!user) {
      throw new Error('邮箱或密码错误（演示模式）');
    }
    const mockToken = 'mock_token_' + user.id + '_' + Date.now();
    window._mockCurrentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    return mockToken;
  }

  // ---------- 注册 ----------
  if (url === '/auth/register' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const email = body.email || '';
    // 检查邮箱是否已注册
    if (DB_USERS.find(u => u.email === email)) {
      throw new Error('该邮箱已被注册');
    }
    if (DB_USERS.find(u => u.username === email)) {
      throw new Error('该邮箱已被注册');
    }
    // 创建新用户（ID自增，角色为普通用户）
    const maxId = DB_USERS.reduce((max, u) => Math.max(max, u.id), 0);
    const newUser = {
      id: maxId + 1,
      username: email,  // 用邮箱作为登录账号
      password: body.password,
      nickname: body.nickname || email.split('@')[0],
      realName: body.nickname || email.split('@')[0],
      role: 4,  // 普通用户
      college: body.college || '',
      major: body.major || '',
      studentId: body.studentId || '',
      email: email,
      phone: '',
      avatar: '',
      grade: '',
      status: 1
    };
    DB_USERS.push(newUser);
    // 也持久化到 localStorage
    try { localStorage.setItem('db_users_extra', JSON.stringify(DB_USERS.filter(u => u.id > 4))); } catch(e) {}
    return { success: true, userId: newUser.id };
  }

  if (url === '/user/password' && method === 'PUT') {
    const body = JSON.parse(options.body || '{}');
    let user = window.currentUser;
    if (!user) {
      try { user = JSON.parse(localStorage.getItem('user')); } catch (e) { /* ignore */ }
    }
    if (!user) {
      throw new Error('请先登录');
    }

    const dbUser = DB_USERS.find(u => u.id === user.id);
    if (!dbUser) {
      throw new Error('用户不存在');
    }
    if (body.oldPassword && dbUser.password !== body.oldPassword) {
      throw new Error('旧密码不正确');
    }

    dbUser.password = body.newPassword || body.password || dbUser.password;
    return { success: true };
  }

  // ---------- 竞赛 ----------
  if (url.includes('/competition/list')) {
    return { records: DB_COMPS, total: DB_COMPS.length, size: 10, current: 1, pages: 1 };
  }
  if (url.includes('/competition/latest')) {
    return DB_COMPS.slice(0, 6);
  }
  if (url.includes('/competition/hot')) {
    return DB_COMPS.slice(0, 6);
  }
  const detailMatch = url.match(/\/competition\/(\d+)$/);
  if (detailMatch) {
    return DB_COMPS.find(c => c.id == detailMatch[1]) || null;
  }

  // ---------- 分类 ----------
  if (url.includes('/category/list')) {
    return DB_CATEGORIES;
  }

  // ---------- 收藏 ----------
  if (url.includes('/favorite/list')) {
    // 获取当前用户
    let user = window.currentUser;
    if (!user) { try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {} }
    const uid = user ? user.id : null;
    // 只返回当前登录用户的收藏，未登录时返回空列表
    if (!uid) return [];
    return DB_FAVORITES
      .filter(f => f.userId === uid)
      .map(f => {
        const comp = DB_COMPS.find(c => c.id === f.compId);
        if (!comp) return f;
        return {
          id:            f.id,
          competitionId: f.compId,
          title:         comp.title,
          organizer:     comp.organizer,
          levelName:     comp.level,
          endTime:       comp.endDate,
          createTime:    f.addTime
        };
      });
  }
  if (url.includes('/favorite/') && method === 'POST') {
    const compId = parseInt(url.split('/favorite/')[1]);
    let user = window.currentUser;
    if (!user) { try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {} }
    const favUserId = user ? user.id : 0;
    if (!DB_FAVORITES.find(f => f.compId === compId && f.userId === favUserId)) {
      DB_FAVORITES.push({ id: uid(), compId, userId: favUserId, addTime: new Date().toISOString().slice(0,16).replace('T',' ') });
      favoriteSet.add(compId);
    }
    if (window._persistFavorites) window._persistFavorites();
    return { success: true };
  }
  if (url.includes('/favorite/') && method === 'DELETE') {
    const compId = parseInt(url.split('/favorite/')[1]);
    let user = window.currentUser;
    if (!user) { try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {} }
    const uid = user ? user.id : 0;
    const idx = DB_FAVORITES.findIndex(f => f.compId === compId && f.userId === uid);
    if (idx > -1) DB_FAVORITES.splice(idx, 1);
    favoriteSet.delete(compId);
    if (window._persistFavorites) window._persistFavorites();
    return { success: true };
  }
  if (url.includes('/favorite/check/')) {
    const compId = parseInt(url.split('/favorite/check/')[1]);
    return favoriteSet.has(compId);
  }

  // ---------- 获奖记录 ----------
  // 获奖记录现在通过真实后端API处理，数据持久化到数据库
  // 不再使用内存模拟数据，确保重启后数据不丢失

  // ---------- 用户信息 ----------
  if (url.includes('/user/info') && method === 'GET') {
    // 无 token → 未登录，不返回任何用户
    const token = localStorage.getItem('token');
    if (!token) return null;
    // 优先从 localStorage 读取
    const stored = localStorage.getItem('user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* 忽略 */ }
    }
    // localStorage 里没有但有 token（mock token 流程）：从 _mockCurrentUser 取
    return window._mockCurrentUser || null;
  }
  if (url.includes('/user/info') && method === 'PUT') {
    const body = JSON.parse(options.body || '{}');
    if (!window.currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) window.currentUser = JSON.parse(stored);
    }
    if (window.currentUser) {
      // 合并更新
      Object.assign(window.currentUser, body);
      // 持久化到 localStorage
      localStorage.setItem('user', JSON.stringify(window.currentUser));
      window._mockCurrentUser = window.currentUser;
    }
    return window.currentUser;
  }
  if (url.includes('/auth/logout')) {
    return { success: true };
  }

  // ---------- 论坛 ----------
  if (url.includes('/forum/posts')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const page     = parseInt(params.get('page')) || 1;
    const size     = parseInt(params.get('size')) || 10;
    const keyword  = params.get('keyword') || '';
    const category = params.get('category') || '';

    // 优先使用 localStorage 缓存的真实数据（上次后端成功返回的快照）
    // 只在无筛选条件的第一页请求时直接返回缓存（筛选/翻页走本地过滤）
    const cached = (() => { try { const s = localStorage.getItem('forum_posts_cache'); return s ? JSON.parse(s) : null; } catch(e){ return null; } })();
    // 合并缓存帖子和本地新发帖子（DB_FORUM_POSTS 只保留本会话内新发的）
    const cachedRecords = cached && cached.records ? cached.records : [];
    // 把本地 mock 里 id > 某个阈值（用户本会话新发的帖子，id 是 Date.now()）合并进去
    const localNew = DB_FORUM_POSTS.filter(p => typeof p.id === 'number' && p.id > 1000000000000);
    let allPosts = [...localNew, ...cachedRecords];
    // 去重（以 id 为 key）
    const seen = new Set();
    allPosts = allPosts.filter(p => { if(seen.has(p.id)) return false; seen.add(p.id); return true; });
    // 如果缓存和本地新帖都没有，返回空（不再退回硬编码 mock）
    if (!allPosts.length) allPosts = [];

    if (keyword)  allPosts = allPosts.filter(p => p.title.includes(keyword) || p.content.includes(keyword));
    if (category && category !== 'all') allPosts = allPosts.filter(p => p.category === category);
    const total  = allPosts.length;
    const start  = (page - 1) * size;
    const records = allPosts.slice(start, start + size);
    return { records, total, size, current: page, pages: Math.ceil(total / size) };
  }
  if (url.match(/\/forum\/post\/\d+$/) && method === 'GET') {
    const id = url.split('/').pop();
    // 用 == 宽松比较，兼容字符串/数字 ID
    // eslint-disable-next-line eqeqeq
    const post = DB_FORUM_POSTS.find(p => p.id == id);
    if (post) {
      post.viewCount = (post.viewCount || 0) + 1;
      return {
        post: post,
        replies: post.replies || []
      };
    }
    return null;
  }
  if (url === '/forum/post' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    // 优先使用 window.currentUser，如果没有则尝试从 localStorage 恢复
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
    if (!user) throw new Error('请先登录后再发布帖子');
    const newPost = {
      id:           Date.now(),
      title:        body.title,
      content:      body.content,
      category:     body.category || 'general',
      userId:       user.id,
      userNickname: user.nickname || user.username,
      createTime:   new Date().toISOString(),
      viewCount:    0,
      replyCount:   0,
      isTop:        false,
      replies:      []
    };
    DB_FORUM_POSTS.unshift(newPost);
    _saveForumPosts();
    return newPost;
  }
  if (url.match(/\/forum\/post\/\d+$/) && method === 'DELETE') {
    const id = parseInt(url.split('/').pop(), 10);
    const idx = DB_FORUM_POSTS.findIndex(p => p.id === id);
    if (idx > -1) DB_FORUM_POSTS.splice(idx, 1);
    try {
      const s = localStorage.getItem('forum_posts_cache');
      if (s) {
        const cache = JSON.parse(s);
        if (cache && Array.isArray(cache.records)) {
          cache.records = cache.records.filter(p => Number(p.id) !== id);
          if (typeof cache.total === 'number') cache.total = cache.records.length;
          localStorage.setItem('forum_posts_cache', JSON.stringify(cache));
        }
      }
    } catch (e) { /* 忽略 */ }
    _saveForumPosts();
    return { success: true };
  }
  if (url === '/forum/reply' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    // 优先使用 window.currentUser，如果没有则尝试从 localStorage 恢复
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
    if (!user) throw new Error('请先登录后再回复');
    // 用 == 宽松比较，兼容字符串/数字 ID
    // eslint-disable-next-line eqeqeq
    const post = DB_FORUM_POSTS.find(p => p.id == body.postId);
    if (!post) throw new Error('帖子不存在');
    const reply = {
      id:           Date.now(),
      postId:       body.postId,
      content:      body.content,
      userId:       user.id,
      userNickname: user.nickname || user.username,
      createTime:   new Date().toISOString(),
      likeCount:    0
    };
    if (!post.replies) post.replies = [];
    post.replies.push(reply);
    post.replyCount = post.replies.length;
    _saveForumPosts();
    return reply;
  }
  // 帖子点赞（用 == 宽松比较，兼容字符串/数字 ID）
  const postLikeMatch = url.match(/\/forum\/post\/(\d+)\/like$/);
  if (postLikeMatch && method === 'POST') {
    const id = postLikeMatch[1];
    // eslint-disable-next-line eqeqeq
    const post = DB_FORUM_POSTS.find(p => p.id == id);
    if (!post) throw new Error('帖子不存在');
    post.likeCount = (post.likeCount || 0) + 1;
    _saveForumPosts();
    return { success: true, likeCount: post.likeCount };
  }
  // 回复点赞（用 == 宽松比较）
  const replyLikeMatch = url.match(/\/forum\/reply\/(\d+)\/like$/);
  if (replyLikeMatch && method === 'POST') {
    const replyId = replyLikeMatch[1];
    for (const post of DB_FORUM_POSTS) {
      if (post.replies) {
        // eslint-disable-next-line eqeqeq
        const reply = post.replies.find(r => r.id == replyId);
        if (reply) {
          reply.likeCount = (reply.likeCount || 0) + 1;
          _saveForumPosts();
          return { success: true, likeCount: reply.likeCount };
        }
      }
    }
    throw new Error('回复不存在');
  }

  // ---------- 管理员删除报名（离线 mock）----------
  const enrollAdminDeleteMatch = typeof url === 'string' ? url.match(/\/enrollment\/admin\/(\d+)$/) : null;
  if (enrollAdminDeleteMatch && method === 'DELETE') {
    const eid = parseInt(enrollAdminDeleteMatch[1], 10);
    if (typeof DB_ENROLLMENTS !== 'undefined') {
      const idx = DB_ENROLLMENTS.findIndex(e => e.id === eid);
      if (idx > -1) {
        DB_ENROLLMENTS.splice(idx, 1);
        if (window._persistEnrollments) window._persistEnrollments();
      }
    }
    return { success: true };
  }

  // ---------- 当前用户自己的报名记录 ----------
  if (url.includes('/enrollment/my')) {
    let user = window.currentUser;
    if (!user) { try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {} }
    const uid = user ? user.id : null;
    if (!uid) return [];
    const params = new URLSearchParams(url.split('?')[1] || '');
    const statusParam = params.get('status');
    return DB_ENROLLMENTS
      .filter(e => e.userId === uid && (statusParam === null || statusParam === undefined || statusParam === '' || String(e.statusCode) === statusParam))
      .map(e => ({
        id: e.id,
        competitionId: e.compId,
        competitionTitle: e.compTitle || '—',
        userId: e.userId,
        teamName: e.teamName || '',
        teamMembers: e.teamMembers || '',
        remark: e.remark || '',
        status: e.status === '待审核' ? 0 : e.status === '已通过' ? 1 : 2,
        statusName: e.status || '待审核',
        enrollTime: e.enrollTime || null,
        realName: e.realName || '',
        studentId: e.studentId || '',
        college: e.college || '',
        major: e.major || '',
        phone: e.phone || ''
      }));
  }

  // ---------- 报名 ----------
  if (url.includes('/enrollment/list')) {
    // 使用 DB_ENROLLMENTS 模拟数据（后端不可用时的回退）
    const enrollMock = (typeof DB_ENROLLMENTS !== 'undefined' && DB_ENROLLMENTS.length > 0)
      ? DB_ENROLLMENTS.map(e => ({
          id: e.id,
          competitionId: e.compId,
          userId: e.userId || 3,
          teamName: e.teamName || '',
          teamMembers: e.teamMembers || '',
          remark: e.remark || '',
          status: e.status === '待审核' ? 0 : e.status === '已通过' ? 1 : 2,
          enrollTime: e.enrollTime || e.createTime || null,
          competitionTitle: e.compTitle || '—',
          realName: e.realName || e.studentName || '—',
          studentId: e.studentId || '—',
          college: e.college || '—',
          major: e.major || '—',
          phone: e.phone || '—',
          username: e.username || '—'
        }))
      : [];
    return { records: enrollMock, total: enrollMock.length, size: 10, current: 1, pages: 1 };
  }

  // ---------- 获奖记录 ----------
  if (url.includes('/award/all')) {
    return DB_AWARDS.map(a => ({
      id: a.id,
      compName: a.compName,
      comp_name: a.compName,
      awardLevel: a.awardLevel,
      award_level: a.awardLevel,
      awardTime: a.awardTime,
      award_time: a.awardTime,
      description: a.description,
      source: a.source || 'self',
      photoUrl: a.photoUrl || '',
      photo_url: a.photoUrl || '',
      studentId: a.studentId,
      student_id: a.studentId,
      studentName: a.studentName,
      student_name: a.studentName,
      nickname: a.studentName
    }));
  }
  if (url.includes('/award/list')) {
    // 获取当前登录用户：window.currentUser → localStorage → _mockCurrentUser
    console.log('[Mock /award/list] 进入mock分支');
    let user = window.currentUser;
    if (!user) { try { const s = localStorage.getItem('user'); if (s) user = JSON.parse(s); } catch(e) {} }
    if (!user) user = window._mockCurrentUser;
    if (!user) return [];
    // 同时按 id 和 studentId 做字符串化匹配，兼容模拟数据和真实数据
    const uid = String(user.id || '');
    const sid = String(user.studentId || '');
    return DB_AWARDS.filter(a => {
      const aUid = String(a.userId || '');
      const aSid = String(a.studentId || '');
      return aUid === uid || aUid === sid || aSid === uid || aSid === sid;
    }).map(a => ({
      id: a.id, compName: a.compName, awardLevel: a.awardLevel,
      awardTime: a.awardTime, certificate: a.certificate || '',
      description: a.description || '', source: a.source || 'self',
      photoUrl: a.photoUrl || ''
    }));
  }
  
    // PUT /award/{id}/approve - 审核通过获奖记录
  const awardApproveMatch = url.match(/\/award\/(\d+)\/approve$/);
  if (awardApproveMatch && method === 'PUT') {
    const awardId = parseInt(awardApproveMatch[1]);
    const award = DB_AWARDS.find(a => a.id === awardId);
    if (award) {
      award.status = 1;
      if (window._persistAwards) window._persistAwards();
    }
    return award || { id: awardId, status: 1 };
  }

  // DELETE /award/{id} - 删除获奖记录
  const awardDeleteMatch = url.match(/\/award\/(\d+)$/);
  if (awardDeleteMatch && method === 'DELETE') {
    const awardId = parseInt(awardDeleteMatch[1]);
    const idx = DB_AWARDS.findIndex(a => a.id === awardId);
    if (idx > -1) DB_AWARDS.splice(idx, 1);
    if (window._persistAwards) window._persistAwards();
    return { success: true };
  }

  // PUT /award/{id} - 更新获奖记录
  const awardUpdateMatch = url.match(/\/award\/(\d+)$/);
  if (awardUpdateMatch && method === 'PUT') {
    const awardId = parseInt(awardUpdateMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const idx = DB_AWARDS.findIndex(a => a.id === awardId);
    if (idx > -1) {
      DB_AWARDS[idx] = { ...DB_AWARDS[idx], ...body, id: awardId };
    }
    if (window._persistAwards) window._persistAwards();
    return DB_AWARDS[idx] || null;
  }

  // 论坛用：按userId查询公开获奖记录
  const userAwardsMatch = url.match(/\/award\/user\/(\d+)$/);
  if (userAwardsMatch) {
    const uid = parseInt(userAwardsMatch[1]);
    // 先通过 DB_USERS 找到该 userId 对应的 studentId
    const user = (typeof DB_USERS !== 'undefined' ? DB_USERS : []).find(u => u.id === uid);
    return DB_AWARDS
      .filter(a =>
        a.status !== 0 &&  // 只显示已审核通过的（公开可见）
        (String(a.userId) === String(uid) ||
        String(a.studentId) === String(uid) ||
        (user && String(a.studentId) === String(user.studentId)) ||
        (user && String(a.studentName) === String(user.realName)))
      )
      .map(a => ({ id: a.id, compName: a.compName, awardLevel: a.awardLevel, awardTime: a.awardTime, photoUrl: a.photoUrl || '', source: a.source || 'self' }));
  }

  // ---------- 公告 ----------
  if (!window._mockNotices) {
    window._mockNotices = [
      { id:1, title:'欢迎使用竞赛通管理系统', content:'竞赛通系统正式上线，欢迎广大同学积极参与各类竞赛活动！', type:1, createTime:'2026-04-20T09:00:00', isRead:0 },
      { id:2, title:'关于五月竞赛报名截止提醒', content:'蓝桥杯、数学建模等多项竞赛将于5月底截止报名，请同学们尽快完成报名。', type:3, createTime:'2026-04-18T10:30:00', isRead:0 }
    ];
  }
  if (url.includes('/notice/list')) {
    return window._mockNotices.slice().reverse();
  }
  if (url === '/notice' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const n = { id: Date.now(), title: body.title, content: body.content, type: body.type || 1, userId: body.userId || null, createTime: new Date().toISOString(), isRead: 0 };
    if (!window._mockNotices) window._mockNotices = [];
    window._mockNotices.unshift(n);
    return n;
  }
  const noticeDeleteMatch = url.match(/\/notice\/(\d+)$/);
  if (noticeDeleteMatch && method === 'DELETE') {
    const nid = parseInt(noticeDeleteMatch[1]);
    if (window._mockNotices) {
      const idx = window._mockNotices.findIndex(n => n.id === nid);
      if (idx > -1) window._mockNotices.splice(idx, 1);
    }
    return { success: true };
  }
  const noticeReadMatch = url.match(/\/notice\/(\d+)\/read$/);
  if (noticeReadMatch && method === 'PUT') {
    const nid = parseInt(noticeReadMatch[1]);
    if (window._mockNotices) {
      const n = window._mockNotices.find(x => x.id === nid);
      if (n) n.isRead = 1;
    }
    return { success: true };
  }

  // 首页按月查询竞赛
  if (url.includes('/competition/by-month')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const year  = parseInt(params.get('year'))  || new Date().getFullYear();
    const month = parseInt(params.get('month')) || (new Date().getMonth() + 1);
    return DB_COMPS.filter(c => {
      const d = new Date(c.startDate || c.endDate);
      return !isNaN(d) && d.getFullYear() === year && (d.getMonth() + 1) === month;
    });
  }

  
    // POST /award - 添加获奖记录
  if (url === '/award' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const isAdmin = body.source === 'admin';
    const newAward = {
      id: Date.now(),
      compName: body.compName,
      awardLevel: body.awardLevel,
      awardTime: body.awardTime,
      certificate: body.certificate || '',
      description: body.description || '',
      source: body.source || 'self',
      photoUrl: body.photoUrl || '',
      studentId: body.studentId || currentUser?.studentId || '',
      studentName: body.studentName || currentUser?.nickname || '',
      status: isAdmin ? 1 : 0  // 管理员录入直接通过，学生自填待审核
    };
    DB_AWARDS.push(newAward);
    if (window._persistAwards) window._persistAwards();
    return newAward;
  }


  // ---------- 爬虫任务 ----------
  if (url.includes('/crawler/tasks') && method === 'GET') {
    return DB_CRAWLERS.map(c => ({
      id: c.id,
      name: c.name,
      targetUrl: c.targetUrl || 'https://' + c.site,
      siteName: c.siteName || c.site,
      cronExpr: c.cron,
      crawlCount: c.count,
      lastRun: c.lastRun,
      status: c.status === 'running' ? 1 : (c.status === 'waiting' ? 0 : 0)
    }));
  }
  if (url.includes('/crawler/tasks') && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const newTask = {
      id: Date.now(),
      name: body.name,
      targetUrl: body.targetUrl,
      siteName: body.siteName,
      cronExpr: body.cronExpr,
      crawlCount: 0,
      lastRun: null,
      status: 0
    };
    DB_CRAWLERS.push({
      id: newTask.id,
      name: newTask.name,
      site: newTask.siteName,
      siteName: newTask.siteName,
      targetUrl: newTask.targetUrl,
      cron: newTask.cronExpr,
      count: 0,
      status: 'stopped',
      lastRun: '—'
    });
    return newTask;
  }
  const crawlerRunMatch = url.match(/\/crawler\/tasks\/(\d+)\/run$/);
  if (crawlerRunMatch && method === 'POST') {
    const id = parseInt(crawlerRunMatch[1]);
    const task = DB_CRAWLERS.find(c => c.id === id);
    if (task) {
      task.status = 'running';
      task.lastRun = '刚刚';
    }
    return { success: true };
  }
  const crawlerStartMatch = url.match(/\/crawler\/tasks\/(\d+)\/start$/);
  if (crawlerStartMatch && method === 'PUT') {
    const id = parseInt(crawlerStartMatch[1]);
    const task = DB_CRAWLERS.find(c => c.id === id);
    if (task) task.status = 'running';
    return { success: true };
  }
  const crawlerStopMatch = url.match(/\/crawler\/tasks\/(\d+)\/stop$/);
  if (crawlerStopMatch && method === 'PUT') {
    const id = parseInt(crawlerStopMatch[1]);
    const task = DB_CRAWLERS.find(c => c.id === id);
    if (task) task.status = 'stopped';
    return { success: true };
  }
  const crawlerDeleteMatch = url.match(/\/crawler\/tasks\/(\d+)$/);
  if (crawlerDeleteMatch && method === 'DELETE') {
    const id = parseInt(crawlerDeleteMatch[1]);
    const idx = DB_CRAWLERS.findIndex(c => c.id === id);
    if (idx > -1) DB_CRAWLERS.splice(idx, 1);
    return { success: true };
  }
  const crawlerProgressMatch = url.match(/\/crawler\/tasks\/(\d+)\/progress$/);
  if (crawlerProgressMatch && method === 'GET') {
    const id = parseInt(crawlerProgressMatch[1]);
    // 模拟进度
    const task = DB_CRAWLERS.find(c => c.id === id);
    const progress = task && task.status === 'running' ? Math.floor(Math.random() * 100) : 100;
    return { taskId: id, progress: progress };
  }
  // 爬虫任务结果
  const crawlerResultMatch = url.match(/\/crawler\/tasks\/(\d+)\/competitions$/);
  if (crawlerResultMatch && method === 'GET') {
    // 模拟返回空结果（真实数据需后端执行爬虫后才有）
    return [];
  }

  // ---------- 默认返回空 ----------
  return null;
}

/* ============================================================
   学生录入获奖 → 同步到管理员报名数据
   按学号匹配
============================================================ */
function _syncAwardToAdmin(award) {
  if (!window.currentUser) return;
  const sid = window.currentUser.studentId;
  if (!sid) return;
  // 通过 window._adminEnrollData 访问管理员报名数据（admin.js 初始化时挂载）
  const enrollArr = window._adminEnrollData;
  if (!Array.isArray(enrollArr)) return;
  const enrolled = enrollArr.filter(e => e.studentId === sid);
  enrolled.forEach(e => {
    // 如果该条报名的竞赛名和获奖记录相符（或者没有奖项），则更新
    if (!e.awardLevel && (e.comp === award.compName || !award.compName)) {
      e.awardLevel   = award.awardLevel;
      e.awardTime    = award.awardTime;
      e.certificate  = award.certificate;
      e.awardRemark  = award.description;
      e.awardSource  = 'student';  // 标记来源为学生自填
    }
  });
}

/* ============================================================
   论坛模拟数据 - 使用 localStorage 持久化，刷新不丢失
============================================================ */
function _loadForumPosts() {
  // 优先从 localStorage 加载（后端缓存或用户本会话新发）
  try {
    const saved = localStorage.getItem('forum_posts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) { /* 忠除 */ }
  // 不再提供硬编码示例帖子，只保留数据库真实数据和用户新发的
  return [];
}
function _saveForumPosts() {
  try {
    localStorage.setItem('forum_posts', JSON.stringify(window.DB_FORUM_POSTS));
  } catch (e) { /* 忽略 */ }
}
if (typeof DB_FORUM_POSTS === 'undefined' || !window.DB_FORUM_POSTS) {
  window.DB_FORUM_POSTS = _loadForumPosts();
}

// ==================== 认证接口 ====================
const AuthAPI = {
  login: async (username, password) => {
    // 先尝试真实后端
    try {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    } catch (e) {
      // 如果是后端明确返回的认证错误（密码错误/账号不存在等），直接抛出，不走模拟
      // 判断依据：错误信息包含"密码"或"用户名"或"账号"或"禁用"
      const msg = e.message || '';
      const isAuthError = msg.includes('密码') || msg.includes('用户名') || msg.includes('账号') 
                       || msg.includes('禁用') || msg.includes('用户不存在') || msg.includes('password')
                       || msg.includes('401') || msg.includes('400');
      if (isAuthError) {
        throw e; // 后端明确拒绝，不走模拟
      }
      // 后端不可用（网络超时等）时，走本地模拟登录
      console.warn('后端连接失败，尝试模拟登录');
      // 支持用户名或邮箱登录
      const user = DB_USERS.find(u =>
        (u.username === username || u.email === username) && u.password === password
      );
      if (!user) throw new Error('邮箱或密码错误（离线模式）');
      const mockToken = 'mock_token_' + user.id + '_' + Date.now();
      window._mockCurrentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      backendAvailable = false;
      return mockToken;
    }
  },

  loginByPhone: async (phone, code) => {
    // 先尝试真实后端
    try {
      // 后端使用@RequestParam，通过query string发送参数
      const params = new URLSearchParams({ phone, code });
      return await request('/auth/login-phone?' + params.toString(), {
        method: 'POST'
      });
    } catch (e) {
      const msg = e.message || '';
      const isAuthError = msg.includes('验证码') || msg.includes('手机号') || msg.includes('禁用')
                       || msg.includes('401') || msg.includes('400');
      if (isAuthError) {
        throw e; // 后端明确拒绝，不走模拟
      }
      // 后端不可用时，走本地模拟登录
      console.warn('后端连接失败，尝试模拟手机号登录');
      const user = DB_USERS[2]; // zhangsan
      const mockToken = 'mock_token_' + user.id + '_' + Date.now();
      window._mockCurrentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      backendAvailable = false;
      return mockToken;
    }
  },

  loginByEmail: async (email, code) => {
    // 先尝试真实后端
    try {
      // 后端使用@RequestParam，通过query string发送参数
      const params = new URLSearchParams({ email, code });
      return await request('/auth/login-email?' + params.toString(), {
        method: 'POST'
      });
    } catch (e) {
      const msg = e.message || '';
      const isAuthError = msg.includes('验证码') || msg.includes('邮箱') || msg.includes('禁用')
                       || msg.includes('401') || msg.includes('400');
      if (isAuthError) {
        throw e; // 后端明确拒绝，不走模拟
      }
      // 后端不可用时，走本地模拟登录
      console.warn('后端连接失败，尝试模拟邮箱登录');
      const user = DB_USERS.find(u => u.email === email) || DB_USERS[2]; // 优先找匹配的，否则用zhangsan
      const mockToken = 'mock_token_' + user.id + '_' + Date.now();
      window._mockCurrentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      backendAvailable = false;
      return mockToken;
    }
  },

  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  sendSmsCode: (phone) => request('/auth/send-code?phone=' + encodeURIComponent(phone), {
    method: 'POST'
  }),

  sendEmailCode: (email) => request('/auth/send-email-code?email=' + encodeURIComponent(email), {
    method: 'POST'
  }),

  logout: () => {
    window._mockCurrentUser = null;
    return request('/auth/logout', {
      method: 'POST'
    }).catch(() => ({ success: true }));
  }
};

// ==================== 用户接口 ====================
const UserAPI = {
  getInfo: () => request('/user/info'),
  updateInfo: (data) => request('/user/info', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  changePassword: (data) => request('/user/password', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getTags: () => request('/user/tags'),
  updateTags: (tags) => request('/user/tags', {
    method: 'PUT',
    body: JSON.stringify(tags)
  })
};

// ==================== 竞赛接口 ====================
const CompetitionAPI = {
  list: (page = 1, size = 10, keyword, categoryId, level, includeExternal) => {
    const params = new URLSearchParams({ page, size });
    if (keyword) params.append('keyword', keyword);
    if (categoryId) params.append('categoryId', categoryId);
    if (level) params.append('level', level);
    if (includeExternal !== undefined) params.append('includeExternal', includeExternal ? 'true' : 'false');
    return request('/competition/list?' + params.toString());
  },
  latest: (limit = 6) => request('/competition/latest?limit=' + limit),
  hot: (limit = 6) => request('/competition/hot?limit=' + limit),
  byCategory: (categoryId) => request('/competition/category/' + categoryId),
  detail: (id) => request('/competition/' + id),
  create: (data) => request('/competition', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request('/competition/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request('/competition/' + id, {
    method: 'DELETE'
  }),
  byMonth: (year, month) => request(`/competition/by-month?year=${year}&month=${month}`)
};

// ==================== 分类接口 ====================
const CategoryAPI = {
  list: () => request('/category/list')
};

// ==================== 报名接口 ====================
const EnrollmentAPI = {
  enroll: (data) => request('/enrollment', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  cancel: (competitionId) => request('/enrollment/' + competitionId, {
    method: 'DELETE'
  }),
  myList: (status) => {
    const params = new URLSearchParams();
    if (status !== undefined && status !== null) params.append('status', status);
    const qs = params.toString();
    return request('/enrollment/my' + (qs ? '?' + qs : ''));
  },
  list: (page = 1, size = 10, compId, status, keyword) => {
    const params = new URLSearchParams({ page, size });
    if (compId) params.append('compId', compId);
    if (status !== undefined && status !== null) params.append('status', status);
    if (keyword) params.append('keyword', keyword);
    return request('/enrollment/list?' + params.toString());
  },
  export: (compId, status) => {
    const params = new URLSearchParams();
    if (compId) params.append('compId', compId);
    if (status !== undefined && status !== null) params.append('status', status);
    return request('/enrollment/export?' + params.toString());
  },
  approve: (id) => request('/enrollment/' + id + '/approve', { method: 'PUT' }),
  reject: (id, reason) => request('/enrollment/' + id + '/reject?reason=' + encodeURIComponent(reason), { method: 'PUT' }),
  /** 管理员按报名主键 id 物理删除 */
  adminDelete: (enrollmentId) => request('/enrollment/admin/' + enrollmentId, { method: 'DELETE' })
};

// ==================== 收藏接口 ====================
const FavoriteAPI = {
  add: (competitionId) => request('/favorite/' + competitionId, { method: 'POST' }),
  remove: (competitionId) => request('/favorite/' + competitionId, { method: 'DELETE' }),
  list: () => request('/favorite/list'),
  check: (competitionId) => request('/favorite/check/' + competitionId)
};

// ==================== 获奖记录接口 ====================
// 所有数据通过后端API持久化到数据库，重启后数据不会丢失
const AwardAPI = {
  list: () => request('/award/list'),
  listAll: () => request('/award/all'),  // 管理员获取所有获奖记录
  add: (data) => request('/award', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request('/award/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request('/award/' + id, { method: 'DELETE' }),
  approve: (id) => request('/award/' + id + '/approve', { method: 'PUT' }),
  getUserAwards: (userId) => request('/award/user/' + userId)
};

// ==================== 论坛接口 ====================
const ForumAPI = {
  getPosts: (page = 1, size = 10, category, keyword) => {
    const params = new URLSearchParams({ page, size });
    if (category && category !== 'all') params.append('category', category);
    if (keyword) params.append('keyword', keyword);
    return request('/forum/posts?' + params.toString());
  },
  getPostDetail: (id) => request('/forum/post/' + id),
  createPost: (data) => request('/forum/post', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deletePost: (id) => request('/forum/post/' + id, { method: 'DELETE' }),
  createReply: (data) => request('/forum/reply', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteReply: (id) => request('/forum/reply/' + id, { method: 'DELETE' }),
  likePost: (id) => request('/forum/post/' + id + '/like', { method: 'POST' }),
  likeReply: (id) => request('/forum/reply/' + id + '/like', { method: 'POST' })
};

// ==================== 爬虫接口 ====================
const CrawlerAPI = {
  listTasks: () => request('/crawler/tasks'),
  runTask: (id) => request('/crawler/tasks/' + id + '/run', { method: 'POST' }),
  startTask: (id) => request('/crawler/tasks/' + id + '/start', { method: 'PUT' }),
  stopTask: (id) => request('/crawler/tasks/' + id + '/stop', { method: 'PUT' }),
  getTaskCompetitions: (id) => request('/crawler/tasks/' + id + '/competitions'),
  addTask: (data) => request('/crawler/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteTask: (id) => request('/crawler/tasks/' + id, { method: 'DELETE' }),
  getProgress: (id) => request('/crawler/tasks/' + id + '/progress')
};

// 导出 API
window.API = {
  Auth: AuthAPI,
  User: UserAPI,
  Competition: CompetitionAPI,
  Category: CategoryAPI,
  Enrollment: EnrollmentAPI,
  Favorite: FavoriteAPI,
  Award: AwardAPI,
  Forum: ForumAPI,
  Crawler: CrawlerAPI,
  // 文件上传
  uploadFile: (formData) => request('/file/upload', {
    method: 'POST',
    body: formData,
    headers: {} // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
  })
};

