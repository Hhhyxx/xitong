/* =====================================================
   pages/auth.js  — 登录 / 注册页
===================================================== */

/* ---- 登录页 ---- */
router.register('login', (el) => {
  el.innerHTML = buildLoginPage();
});

function buildLoginPage() {
  return `
  <div style="min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);padding:20px">
    <div style="background:#fff;border-radius:24px;padding:40px;width:100%;max-width:400px;box-shadow:0 25px 50px rgba(0,0,0,.22)">
      <div style="text-align:center;margin-bottom:32px">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:18px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;margin:0 auto 12px">🏆</div>
        <div style="font-size:22px;font-weight:800;color:var(--text)">竞赛通</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">大学生竞赛管理平台</div>
      </div>

      <!-- 登录方式：仅账号密码 -->
      <div id="formPwd">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input class="form-input" id="loginUser" placeholder="请输入邮箱地址" value="zhangsan@demo.com">
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" type="password" id="loginPwd" placeholder="请输入密码" value="pass123" onkeydown="if(event.key==='Enter')doLogin()">
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:20px">
          <label style="display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" checked> 记住我</label>
          <a style="color:var(--primary);cursor:pointer">忘记密码？</a>
        </div>
        <button class="btn btn-primary btn-block" style="height:46px;font-size:15px" onclick="doLogin()">登 录</button>
      </div>

      <div style="text-align:center;margin-top:18px;font-size:13px;color:var(--text-muted)">
        还没有账号？<a style="color:var(--primary);cursor:pointer;font-weight:500" onclick="router.go('register')">立即注册</a>
      </div>

      <!-- 快速体验账号提示 -->
      <div style="margin-top:18px;background:#f8fafc;border-radius:10px;padding:12px;font-size:12px;color:var(--text-muted)">
        <div style="font-weight:600;margin-bottom:6px">💡 体验账号（邮箱或用户名登录）</div>
        <div>普通用户：zhangsan@demo.com / pass123</div>
        <div>管理员：teacher01 / teacher123</div>
        <div>超级管理员：admin@demo.com / admin123</div>
      </div>
    </div>
  </div>`;
}

async function doLogin() {
  const username = document.getElementById('loginUser')?.value.trim();
  const password = document.getElementById('loginPwd')?.value;
  if (!username || !password) { showToast('请输入邮箱和密码', 'warning'); return; }

  try {
    const token = await API.Auth.login(username, password);
    localStorage.setItem('token', token);

    // 登录成功，重置后端可用状态，确保后续请求走真实后端
    if (typeof backendAvailable !== 'undefined') {
      backendAvailable = null;
    }

    // 获取用户信息
    let user = window._mockCurrentUser;
    try {
      const fetched = await API.User.getInfo();
      if (fetched && fetched.id) user = fetched;
    } catch (e) { /* 使用已有的 _mockCurrentUser */ }

    if (!user) {
      // 最后兜底：从 DB_USERS 找（支持用户名或邮箱匹配）
      user = DB_USERS.find(u => u.username === username || u.email === username);
    }
    if (!user) throw new Error('获取用户信息失败');

    localStorage.setItem('user', JSON.stringify(user));
    window.currentUser = user;
    window._mockCurrentUser = user;

    loginSuccess(user);
  } catch (e) {
    showToast(e.message || '登录失败', 'error');
  }
}

// 旧版验证码函数已删除 — 仅保留账号密码登录

function loginSuccess(user) {
  currentUser = user;
  // 重建当前用户的收藏集合
  if (window._rebuildFavSet) window._rebuildFavSet(user.id);
  // 更新导航
  document.getElementById('navGuest').style.display = 'none';
  const nu = document.getElementById('navUser');
  nu.style.display = 'flex';
  document.getElementById('navNickname').textContent = user.nickname || user.username;
  if (user.role <= 2) document.getElementById('navAdminBtn').style.display = '';
  showToast(`欢迎回来，${user.nickname || user.username} 👋`);
  router.go('home');
}

async function doLogout() {
  try {
    await API.Auth.logout();
  } catch (e) {
    // 忽略错误
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.currentUser = null;
  document.getElementById('navGuest').style.display = '';
  document.getElementById('navUser').style.display = 'none';
  document.getElementById('navAdminBtn').style.display = 'none';
  showToast('已安全退出', 'info');
  router.go('home');
}

/* ---- 注册页 ---- */
router.register('register', (el) => {
  el.innerHTML = buildRegisterPage();
});

function buildRegisterPage() {
  return `
  <div style="min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);padding:20px">
    <div style="background:#fff;border-radius:24px;padding:40px;width:100%;max-width:480px;box-shadow:0 25px 50px rgba(0,0,0,.22)">
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;margin:0 auto 10px">🏆</div>
        <div style="font-size:20px;font-weight:800">注册账号</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">使用邮箱注册，开启竞赛之旅</div>
      </div>
      <div class="form-group">
        <label class="form-label">邮箱 *</label>
        <input class="form-input" type="email" id="reg_email" placeholder="请输入邮箱地址">
      </div>
      <div class="form-group">
        <label class="form-label">邮箱验证码 *</label>
        <div style="display:flex;gap:10px">
          <input class="form-input" id="reg_emailCode" placeholder="请输入邮箱收到的 6 位验证码" maxlength="6" style="flex:1">
          <button class="btn btn-outline" id="regCodeBtn" onclick="sendRegCode()" style="white-space:nowrap">发送验证码</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">昵称</label>
        <input class="form-input" id="reg_nickname" placeholder="设置昵称（可选）">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">密码 *</label>
          <input class="form-input" type="password" id="reg_pwd" placeholder="至少 6 位">
        </div>
        <div class="form-group">
          <label class="form-label">确认密码 *</label>
          <input class="form-input" type="password" id="reg_pwd2" placeholder="再次输入密码">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">学院</label>
          <input class="form-input" id="reg_college" placeholder="所在学院">
        </div>
        <div class="form-group">
          <label class="form-label">专业</label>
          <input class="form-input" id="reg_major" placeholder="所学专业">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">学号</label>
        <input class="form-input" id="reg_studentId" placeholder="如：2024010001">
        <div class="form-hint">示例格式：年份+学院编号+序号，如 2024010001</div>
      </div>
      <button class="btn btn-primary btn-block" style="height:46px;font-size:15px" onclick="doRegister()">注 册</button>
      <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted)">
        已有账号？<a style="color:var(--primary);cursor:pointer;font-weight:500" onclick="router.go('login')">立即登录</a>
      </div>
    </div>
  </div>`;
}

function sendRegCode() {
  const email = document.getElementById('reg_email')?.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) { showToast('请输入正确的邮箱地址', 'warning'); return; }
  let s = 60;
  const btn = document.getElementById('regCodeBtn');
  btn.disabled = true;
  let t = null;
  API.Auth.sendEmailCode(email)
    .then(() => showToast('验证码已发送，请查收邮箱 ✓', 'info'))
    .catch((e) => {
      showToast(e.message || '验证码发送失败', 'error');
      btn.disabled = false;
      btn.textContent = '发送验证码';
      if (t) clearInterval(t);
    });
  t = setInterval(() => {
    btn.textContent = `重发 (${--s}s)`;
    if (s <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = '发送验证码'; }
  }, 1000);
}

async function doRegister() {
  const email     = document.getElementById('reg_email')?.value.trim();
  const nickname  = document.getElementById('reg_nickname')?.value.trim();
  const emailCode = document.getElementById('reg_emailCode')?.value.trim();
  const pwd       = document.getElementById('reg_pwd')?.value;
  const pwd2      = document.getElementById('reg_pwd2')?.value;
  const college   = document.getElementById('reg_college')?.value.trim();
  const major     = document.getElementById('reg_major')?.value.trim();
  const studentId = document.getElementById('reg_studentId')?.value.trim();

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) { showToast('请输入正确的邮箱地址', 'warning'); return; }
  if (!emailCode || !/^\d{6}$/.test(emailCode)) { showToast('请输入 6 位邮箱验证码', 'warning'); return; }
  if (!pwd || !pwd2) { showToast('请填写密码', 'warning'); return; }
  if (pwd.length < 6) { showToast('密码至少 6 位', 'warning'); return; }
  if (pwd !== pwd2)   { showToast('两次密码不一致', 'error'); return; }

  try {
    await API.Auth.register({
      email: email,
      emailCode: emailCode,
      password: pwd,
      confirmPassword: pwd2,
      nickname: nickname || email.split('@')[0],
      college: college || '',
      major: major || '',
      studentId: studentId || ''
    });
    showToast('注册成功，请使用邮箱登录 ✓');
    router.go('login');
  } catch (e) {
    showToast(e.message || '注册失败', 'error');
  }
}
