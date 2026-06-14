/* =====================================================
   utils.js  — 通用工具函数
===================================================== */

/** Toast 通知 */
function showToast(msg, type = 'success', duration = 3000) {
  const icons = { success:'✅', warning:'⚠️', error:'❌', info:'ℹ️' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type !== 'success' ? type : ''}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type]||'ℹ️'}</span>
    <span style="flex:1">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/** 计算截止剩余天数，日期无效时返回 null */
function daysLeft(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

/** 格式化截止文案 */
function deadlineText(dateStr) {
  const d = daysLeft(dateStr);
  if (d === null) return { text:'日期待定', cls:'' };
  if (d < 0)   return { text:'已截止', cls:'over' };
  if (d === 0) return { text:'今日截止', cls:'closing' };
  if (d <= 7)  return { text:`还剩 ${d} 天`, cls:'closing' };
  return { text:`还剩 ${d} 天`, cls:'safe' };
}

/** 卡片角标：有截止日用截止倒计时；仅有开始日则提示报名进行中 */
function deadlineTextForComp(c) {
  const endStr = getCompetitionEndDateValue(c);
  if (endStr) return deadlineText(endStr);
  const startStr = getCompetitionStartDateValue(c);
  if (startStr) return { text: '报名进行中', cls: 'safe' };
  return { text: '日期待定', cls: '' };
}

/** 卡片「日历」一行：优先展示截止；无截止则展示报名开始 */
function formatCompCardCalendarLine(c) {
  const endRaw = getCompetitionEndDateValue(c);
  if (endRaw) return `截止 ${String(endRaw).slice(0, 10)}`;
  const startRaw = getCompetitionStartDateValue(c);
  if (startRaw) return `报名开始 ${String(startRaw).slice(0, 10)}`;
  return '截止 待定';
}

/**
 * 统一解析后端 LocalDateTime：ISO 字符串，或 Jackson 未配置时的 [y,m,d,h,mi,s] 数组等。
 */
function normalizeApiDateTime(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T23:59:59';
    return s;
  }
  if (Array.isArray(v)) {
    if (v.length < 3) return null;
    const y = v[0], mo = v[1], d = v[2];
    const h = v.length > 3 ? v[3] : 0, mi = v.length > 4 ? v[4] : 0, sec = v.length > 5 ? v[5] : 0;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  if (typeof v === 'object' && v !== null && typeof v.year === 'number') {
    const mo = v.monthValue != null ? v.monthValue : v.month;
    const d = v.dayOfMonth != null ? v.dayOfMonth : v.day;
    const h = v.hour != null ? v.hour : 0, mi = v.minute != null ? v.minute : 0, sec = v.second != null ? v.second : 0;
    if (mo != null && d != null) {
      return `${v.year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
  }
  return null;
}

/** 竞赛报名截止（用于卡片、筛选） */
function getCompetitionEndDateValue(c) {
  if (!c) return null;
  return normalizeApiDateTime(c.endTime)
    || normalizeApiDateTime(c.end_time)
    || (c.endDate ? (typeof c.endDate === 'string' && c.endDate.length >= 10 ? String(c.endDate).slice(0, 10) + 'T23:59:59' : String(c.endDate)) : null);
}

/** 竞赛报名开始 */
function getCompetitionStartDateValue(c) {
  if (!c) return null;
  return normalizeApiDateTime(c.startTime)
    || normalizeApiDateTime(c.start_time)
    || (c.startDate ? (typeof c.startDate === 'string' && c.startDate.length >= 10 ? String(c.startDate).slice(0, 10) + 'T00:00:00' : String(c.startDate)) : null);
}

/** 卡片上显示的 YYYY-MM-DD，无则待定 */
function formatCompDateYmd(c) {
  const raw = getCompetitionEndDateValue(c);
  if (!raw) return '待定';
  const s = String(raw);
  return s.length >= 10 ? s.slice(0, 10) : '待定';
}

/** 级别 → badge class */
function levelBadge(level) {
  const map = {
    '国家级': 'badge-national',
    '省级': 'badge-province',
    '校级': 'badge-school',
    '国际级': 'badge-inter',
    '企业级': 'badge-new'
  };
  return map[level] || 'badge-school';
}

/**
 * 竞赛卡片等处的级别展示文案：优先用数值 level（1–4）映射，避免 level_name 乱码覆盖正确级别。
 * 后端约定：1 校级 2 省级 3 国家级 4 国际级
 */
function getCompetitionLevelLabel(c) {
  if (!c) return '其他';
  const CODE_TO_LABEL = { 1: '校级', 2: '省级', 3: '国家级', 4: '国际级' };
  const lv = c.level;
  let code = null;
  if (typeof lv === 'number' && !Number.isNaN(lv)) code = lv;
  else if (lv != null && lv !== '' && typeof lv === 'string' && /^[1-4]$/.test(lv.trim())) {
    code = parseInt(lv.trim(), 10);
  }
  if (code != null && CODE_TO_LABEL[code]) return CODE_TO_LABEL[code];

  const rawName = c.levelName != null ? String(c.levelName).trim() : '';
  if (rawName && !/[\uFFFD�]/.test(rawName)) return rawName;

  if (typeof lv === 'string') {
    const s = lv.trim();
    if (s && !/^[1-4]$/.test(s) && !/[\uFFFD�]/.test(s)) return s;
  }
  const repaired = rawName.replace(/[\uFFFD�]/g, '').trim();
  return repaired || '其他';
}

/**
 * 与 backend data.sql 中 competition_category 默认 id–name 一致（库内名称因编码损坏时按 categoryId 显示中文）。
 * 若你使用 schema-mysql.sql 的另一套分类，请以库为准并优先修复表/连接 utf8mb4。
 */
const CATEGORY_NAME_BY_ID_FALLBACK = {
  1: '学科竞赛',
  2: '创新创业',
  3: '程序设计',
  4: '数学建模',
  5: '机器人/人工智能',
  6: '外语竞赛',
  7: '艺术设计',
  8: '体育竞技'
};

/** schema-mysql.sql 中的另一套分类名（id 与 data.sql 不完全一致，作二次兜底） */
const CATEGORY_NAME_BY_ID_FALLBACK_MYSQL_SCHEMA = {
  1: '程序设计',
  2: '数学建模',
  3: '创新创业',
  4: '电子设计',
  5: '机器人',
  6: '英语竞赛',
  7: '艺术设计',
  8: '商业策划'
};

function isCorruptCategoryLabel(s) {
  const t = String(s == null ? '' : s).trim();
  if (!t) return true;
  if (/\uFFFD/.test(t)) return true;
  if (/�/.test(t)) return true;
  if (/[\uD800-\uDFFF]/.test(t)) return true;
  try {
    if (/[\u{20000}-\u{2FFFF}]|[\u{E000}-\u{F8FF}]/u.test(t)) return true;
  } catch (e) { /* 旧环境忽略 */ }
  return false;
}

function categoryNameFallbackById(id) {
  const n = Number(id);
  if (Number.isNaN(n)) return '';
  return CATEGORY_NAME_BY_ID_FALLBACK[n]
    || CATEGORY_NAME_BY_ID_FALLBACK_MYSQL_SCHEMA[n]
    || '';
}

/**
 * 竞赛卡片绿色标签：分类名。API/库编码异常时勿把乱码直接插进 DOM。
 */
function getCompetitionCategoryLabel(c) {
  if (!c) return '竞赛';
  const raw = String(
    c.categoryName != null ? c.categoryName : (c.catName != null ? c.catName : '')
  ).trim();
  const cidRaw = c.categoryId != null ? c.categoryId : c.catId;
  const cid = cidRaw != null && cidRaw !== '' ? Number(cidRaw) : NaN;

  if (!isCorruptCategoryLabel(raw)) return raw;

  if (typeof window !== 'undefined' && window.__categoryNamesById && !Number.isNaN(cid)) {
    const fromApi = window.__categoryNamesById[cid];
    if (fromApi && !isCorruptCategoryLabel(fromApi)) return fromApi;
  }

  const byId = categoryNameFallbackById(cid);
  if (byId) return byId;

  if (!Number.isNaN(cid) && typeof DB_CATEGORIES !== 'undefined') {
    const row = DB_CATEGORIES.find(x => Number(x.id) === cid);
    if (row && row.name && !isCorruptCategoryLabel(row.name)) return row.name;
  }

  if (raw) return raw;
  return Number.isNaN(cid) ? '竞赛' : `分类 ${cid}`;
}

/** 与后端 CompetitionConstants.EXTERNAL_COMPETITION_ID_BASE 一致：合并进来的爬虫行 id */
var EXTERNAL_COMPETITION_ID_BASE = 9000000000;

function isExternalMergedCompetitionId(id) {
  const n = Number(id);
  return Number.isFinite(n) && n >= EXTERNAL_COMPETITION_ID_BASE;
}

/** 格式化日期 */
function fmtDate(str) {
  if (!str) return '—';
  try {
    // 统一转换为 Date 对象
    const date = (str instanceof Date) ? str : new Date(str);
    if (isNaN(date.getTime())) return '—';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (e) {
    return '—';
  }
}

/** 简单 HTML 转义 */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/** 弹出遮罩 */
function showModal(htmlContent, id = 'dynModal') {
  let existing = document.getElementById(id);
  if (existing) existing.remove();
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'overlay';
  wrap.innerHTML = htmlContent;
  // 点击遮罩关闭
  wrap.addEventListener('click', e => { if (e.target === wrap) closeModal(id); });
  document.getElementById('modalContainer').appendChild(wrap);
  document.body.style.overflow = 'hidden';
}

function closeModal(id = 'dynModal') {
  const el = document.getElementById(id);
  if (el) { el.style.animation = 'fadeIn .18s ease reverse'; setTimeout(() => { el.remove(); document.body.style.overflow = ''; }, 170); }
}

/** el 只读提示 */
function readonlyAlert() { showToast('该字段不可修改', 'warning'); }

/** 生成唯一 id */
let _uid = 10000;
function uid() { return ++_uid; }

/**
 * 将图片文件转为 base64 Data URL
 * 照片直接以 base64 编码存入数据库，无需依赖文件服务器
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('照片大小不能超过 2MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
