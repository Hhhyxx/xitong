/* =====================================================
   data.js  — 数据层（含 localStorage 持久化）
   - 后端可用时：数据来自 MySQL，localStorage 仅做离线兜底
   - 后端不可用时：数据来自 localStorage，刷新/重启不丢失
===================================================== */

/* ============================================================
   localStorage 持久化工具
   所有可变数据在 mock 模式下自动存盘，确保重启不丢
============================================================ */
const PERSIST_KEYS = {
  awards:      'db_awards',
  enrollments: 'db_enrollments',
  favorites:   'db_favorites',
  forumPosts:  'db_forum_posts',
};

function loadPersist(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  return fallback;
}

function savePersist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage full */ }
}

/* ============================================================
   核心数据定义
   先从 localStorage 恢复，若为空则用默认值
============================================================ */

/* 用户（静态参考数据，不持久化） */
const DB_USERS = [
  { id:1, username:'admin',      password:'admin123',   nickname:'超级管理员', role:1, college:'—',          major:'—',        avatar:'', email:'admin@demo.com',      phone:'138****0001' },
  { id:2, username:'teacher01',  password:'teacher123', nickname:'张老师',     role:2, college:'计算机学院',  major:'计算机',   avatar:'', email:'teacher@demo.com',    phone:'138****0002' },
  { id:3, username:'zhangsan',   password:'pass123',    nickname:'追梦少年',   role:3, college:'计算机科学',  major:'软件工程', avatar:'', email:'zhangsan@demo.com',   phone:'138****8888', studentId:'2024010001', grade:'大二', realName:'张三' },
  { id:4, username:'lisi',       password:'pass123',    nickname:'李四同学',   role:4, college:'数学学院',    major:'数学',     avatar:'', email:'lisi@demo.com',       phone:'139****9999', studentId:'2024020002', grade:'大三', realName:'李四' },
];

/* 竞赛分类（静态） */
const DB_CATEGORIES = [
  { id:1, name:'数学建模', emoji:'📐', bg:'linear-gradient(135deg,#ddd6fe,#ede9fe)', count:186 },
  { id:2, name:'程序设计', emoji:'💻', bg:'linear-gradient(135deg,#bfdbfe,#dbeafe)', count:243 },
  { id:3, name:'创新创业', emoji:'🚀', bg:'linear-gradient(135deg,#fde68a,#fef3c7)', count:165 },
  { id:4, name:'电子设计', emoji:'🔌', bg:'linear-gradient(135deg,#a7f3d0,#d1fae5)', count:89  },
  { id:5, name:'机器人',   emoji:'🤖', bg:'linear-gradient(135deg,#fecaca,#fee2e2)', count:72  },
  { id:6, name:'数据科学', emoji:'📊', bg:'linear-gradient(135deg,#c7d2fe,#e0e7ff)', count:134 },
  { id:7, name:'人文社科', emoji:'📚', bg:'linear-gradient(135deg,#fbcfe8,#fce7f3)', count:58  },
  { id:8, name:'艺术设计', emoji:'🎨', bg:'linear-gradient(135deg,#fed7aa,#ffedd5)', count:47  },
];

/* 竞赛数据（静态） */
const DB_COMPS = [
  { id:1,  title:'全国大学生数学建模竞赛（CUMCM）',              catId:1, catName:'数学建模', organizer:'中国工业与应用数学学会',      level:'国家级', startDate:'2026-07-01', endDate:'2026-09-05', emoji:'📐', hot:true,  url:'http://www.mcm.edu.cn/',        desc:'每年一届，全国规模最大的数学建模赛事。' },
  { id:13, title:'美国大学生数学建模竞赛（MCM/ICM）',            catId:1, catName:'数学建模', organizer:'美国数学及其应用联合会',      level:'国际级', startDate:'2027-01-20', endDate:'2027-01-24', emoji:'📐', hot:true,  url:'https://www.contest.comap.com/', desc:'国际权威数学建模赛事。' },
  { id:14, title:'华为ICT大赛数学建模专项',                      catId:1, catName:'数学建模', organizer:'华为技术有限公司',              level:'国家级', startDate:'2026-10-01', endDate:'2027-01-31', emoji:'📐', hot:false, url:'https://www.huawei.com/', desc:'聚焦云计算、AI、大数据方向。' },
  { id:2,  title:'蓝桥杯全国软件和信息技术大赛',                 catId:2, catName:'程序设计', organizer:'工业和信息化部人才交流中心',    level:'国家级', startDate:'2026-01-15', endDate:'2026-06-15', emoji:'💻', hot:true,  url:'https://www.lanqiao.cn/',        desc:'覆盖多语言赛道，每年数十万人参赛。' },
  { id:12, title:'中国大学生程序设计竞赛（CCPC）',               catId:2, catName:'程序设计', organizer:'中国计算机学会 CCF',            level:'国家级', startDate:'2026-04-01', endDate:'2026-11-01', emoji:'⌨️', hot:true,  url:'https://ccpc.io/',               desc:'国内顶级算法竞赛。' },
  { id:15, title:'ACM-ICPC 国际大学生程序设计竞赛',              catId:2, catName:'程序设计', organizer:'国际计算机学会（ACM）',         level:'国际级', startDate:'2026-09-01', endDate:'2026-11-30', emoji:'🏆', hot:true,  url:'https://icpc.global/',          desc:'全球历史最悠久的顶级编程竞赛。' },
  { id:16, title:'全国青少年信息学奥林匹克竞赛（NOI）联赛大学组',catId:2, catName:'程序设计', organizer:'中国计算机学会',               level:'国家级', startDate:'2026-10-01', endDate:'2026-11-30', emoji:'💻', hot:false, url:'https://www.noi.cn/',            desc:'考察数据结构与算法综合能力。' },
  { id:17, title:'字节跳动青训营编程挑战赛',                     catId:2, catName:'程序设计', organizer:'字节跳动',                     level:'企业级', startDate:'2026-06-01', endDate:'2026-07-31', emoji:'💻', hot:false, url:'https://youthcamp.bytedance.com/', desc:'优秀选手可获实习机会。' },
  { id:3,  title:'中国国际大学生创新大赛（原互联网+）',          catId:3, catName:'创新创业', organizer:'教育部',                       level:'国家级', startDate:'2026-04-01', endDate:'2026-09-30', emoji:'🚀', hot:true,  url:'https://cy.ncss.cn/',            desc:'全国影响力最广的创业赛事。' },
  { id:9,  title:'全国大学生节能减排社会实践与科技竞赛',          catId:3, catName:'创新创业', organizer:'教育部高等教育司',             level:'国家级', startDate:'2026-03-10', endDate:'2026-06-30', emoji:'🌱', hot:false, url:'http://www.jnjp.org/',           desc:'聚焦节能环保与双碳目标。' },
  { id:18, title:'"挑战杯"全国大学生课外学术科技作品竞赛',       catId:3, catName:'创新创业', organizer:'共青团中央、中国科协',         level:'国家级', startDate:'2026-03-01', endDate:'2026-11-01', emoji:'🚀', hot:true,  url:'http://www.tiaozhanbei.net/',   desc:'国内最具权威性的大学生科技赛事。' },
  { id:19, title:'全国大学生创业实训营',                          catId:3, catName:'创新创业', organizer:'人力资源和社会保障部',         level:'国家级', startDate:'2026-07-01', endDate:'2026-08-31', emoji:'🎯', hot:false, url:'https://www.mohrss.gov.cn/',    desc:'创业指导和资金支持。' },
  { id:4,  title:'全国大学生电子设计竞赛',                        catId:4, catName:'电子设计', organizer:'教育部高等教育司',             level:'国家级', startDate:'2026-07-01', endDate:'2026-08-05', emoji:'🔌', hot:false, url:'https://nuedc-training.com.cn/', desc:'考察硬件设计与调试能力。' },
  { id:20, title:'全国大学生集成电路创新创业大赛',                catId:4, catName:'电子设计', organizer:'教育部、工业和信息化部',       level:'国家级', startDate:'2026-04-01', endDate:'2026-08-31', emoji:'🔌', hot:false, url:'https://nuedc-training.com.cn/', desc:'聚焦集成电路设计。' },
  { id:21, title:'全国大学生智能汽车竞赛',                        catId:4, catName:'电子设计', organizer:'教育部高等教育司',             level:'国家级', startDate:'2026-03-01', endDate:'2026-08-01', emoji:'🚗', hot:false, url:'http://www.smartcar.au.tsinghua.edu.cn/', desc:'自动控制类赛事。' },
  { id:5,  title:'中国机器人及人工智能大赛',                      catId:5, catName:'机器人',   organizer:'中国人工智能学会',             level:'国家级', startDate:'2026-05-01', endDate:'2026-07-20', emoji:'🤖', hot:false, url:'http://www.caairobot.com/',      desc:'聚焦机器人与人工智能技术。' },
  { id:22, title:'RoboMaster机甲大师赛',                          catId:5, catName:'机器人',   organizer:'大疆创新DJI',                 level:'国家级', startDate:'2026-01-01', endDate:'2026-08-01', emoji:'🤖', hot:true,  url:'https://www.robomaster.com/',   desc:'大疆主办的机器人对抗赛。' },
  { id:23, title:'中国大学生机器人大赛（ROBOCON）',               catId:5, catName:'机器人',   organizer:'中国科学技术协会',             level:'国家级', startDate:'2026-04-01', endDate:'2026-07-01', emoji:'🤖', hot:false, url:'http://www.robocon.org.cn/',     desc:'亚太机器人竞赛中国区。' },
  { id:6,  title:'全国大学生数据统计建模大赛',                    catId:6, catName:'数据科学', organizer:'中国统计学会',                 level:'国家级', startDate:'2026-03-01', endDate:'2026-05-20', emoji:'📊', hot:false, url:'http://www.tjjmds.com/',         desc:'数据分析与统计建模综合能力。' },
  { id:24, title:'DataFountain大数据挑战赛',                      catId:6, catName:'数据科学', organizer:'CCF & 联通集团',               level:'国家级', startDate:'2026-05-01', endDate:'2026-09-30', emoji:'📊', hot:false, url:'https://www.datafountain.cn/',   desc:'依托真实企业数据的AI算法竞赛。' },
  { id:25, title:'Kaggle 全球数据科学竞赛',                       catId:6, catName:'数据科学', organizer:'Google Kaggle',                level:'国际级', startDate:'2026-01-01', endDate:'2026-12-31', emoji:'🌐', hot:true,  url:'https://www.kaggle.com/',       desc:'全球最大数据科学竞赛平台。' },
  { id:26, title:'阿里云天池大数据竞赛',                          catId:6, catName:'数据科学', organizer:'阿里云',                       level:'企业级', startDate:'2026-03-01', endDate:'2026-12-31', emoji:'☁️', hot:true,  url:'https://tianchi.aliyun.com/',   desc:'奖金丰厚，参赛门槛适中。' },
  { id:8,  title:'全国大学生市场调查与分析大赛',                  catId:7, catName:'人文社科', organizer:'中国商业统计学会',             level:'国家级', startDate:'2026-04-15', endDate:'2026-05-10', emoji:'📋', hot:false, url:'http://www.marketingcontest.cn/', desc:'市场调研与数据分析能力。（已截止）' },
  { id:10, title:'全国高校商业精英挑战赛',                         catId:7, catName:'人文社科', organizer:'中国国际贸易促进委员会',      level:'国家级', startDate:'2026-05-01', endDate:'2026-09-01', emoji:'💼', hot:false, url:'https://www.ccpit.org/',         desc:'商科赛事标杆。' },
  { id:27, title:'全国大学生英语竞赛（NECCS）',                   catId:7, catName:'人文社科', organizer:'高等学校外语专业教学指导委员会',level:'国家级', startDate:'2026-04-01', endDate:'2026-05-16', emoji:'📝', hot:false, url:'http://www.neccs.org/',          desc:'全国性大学英语竞赛。（即将截止）' },
  { id:28, title:'"创青春"中国青年创新创业大赛',                  catId:7, catName:'人文社科', organizer:'共青团中央',                   level:'国家级', startDate:'2026-05-01', endDate:'2026-10-31', emoji:'🌟', hot:false, url:'http://www.chuangqingchun.net/', desc:'面向青年的综合创业赛事。' },
  { id:11, title:'全国大学生广告艺术大赛',                         catId:8, catName:'艺术设计', organizer:'教育部高校艺术教育委员会',     level:'国家级', startDate:'2026-06-01', endDate:'2026-10-01', emoji:'🎨', hot:false, url:'http://www.aaa.edu.cn/',         desc:'展现创意推动文化产业。' },
  { id:29, title:'全国大学生工业设计大赛',                         catId:8, catName:'艺术设计', organizer:'工业和信息化部',               level:'国家级', startDate:'2026-04-01', endDate:'2026-09-01', emoji:'🎨', hot:false, url:'https://www.idesign.org.cn/',   desc:'工业产品创新设计。' },
  { id:30, title:'中国大学生计算机设计大赛',                       catId:8, catName:'艺术设计', organizer:'教育部高等学校计算机类专业教学指导委员会', level:'国家级', startDate:'2026-04-01', endDate:'2026-07-31', emoji:'🖥️', hot:false, url:'https://jsjds.ruc.edu.cn/',     desc:'涵盖软件设计、数媒设计等多赛道。' },
];

/* ============================================================
   可变数据 —— 先从 localStorage 恢复，无则用默认值
   每次修改后自动 savePersist() 确保刷新不丢失
============================================================ */

const DEFAULT_AWARDS = [
  { id:1, userId:3, compName:'第十四届蓝桥杯程序设计大赛', awardLevel:'二等奖', awardTime:'2025-05-20', certificate:'', description:'', source:'self', photoUrl:'', studentId:'2024010001', studentName:'张三', status:1 },
  { id:2, userId:3, compName:'第九届全国大学生数学建模竞赛', awardLevel:'一等奖', awardTime:'2025-09-15', certificate:'', description:'', source:'self', photoUrl:'', studentId:'2024010001', studentName:'张三', status:1 },
  { id:3, userId:4, compName:'校级软件开发大赛',             awardLevel:'特等奖', awardTime:'2025-12-01', certificate:'', description:'', source:'self', photoUrl:'', studentId:'2024020002', studentName:'李四', status:1 },
];

const DEFAULT_ENROLLMENTS = [
  { id:1001, compId:1, compTitle:'全国大学生数学建模竞赛', status:'待审核', statusClass:'dot-yellow', enrollTime:'2026-04-11 10:23', userId:3, realName:'张三', studentId:'2024010001', college:'计算机科学', major:'软件工程', phone:'138****8888', teamName:'数模先锋队', teamMembers:'张三、李四', remark:'已组队完成' },
  { id:1002, compId:2, compTitle:'蓝桥杯程序设计大赛',     status:'已通过', statusClass:'dot-green',  enrollTime:'2026-03-20 09:15', userId:3, realName:'张三', studentId:'2024010001', college:'计算机科学', major:'软件工程', phone:'138****8888', teamName:'', teamMembers:'', remark:'' },
  { id:1003, compId:3, compTitle:'中国国际大学生创新大赛',  status:'已通过', statusClass:'dot-green',  enrollTime:'2026-05-02 14:30', userId:4, realName:'李四', studentId:'2024020002', college:'数学学院', major:'数学', phone:'139****9999', teamName:'创新先锋', teamMembers:'李四、王五', remark:'已获省级推荐' },
];

const DEFAULT_FAVORITES = [
  { id:101, compId:1, userId:3, addTime:'2026-04-01 10:23' },
  { id:102, compId:2, userId:3, addTime:'2026-03-28 14:55' },
  { id:103, compId:3, userId:4, addTime:'2026-03-15 09:12' },
];

// ---- 从 localStorage 恢复（有则用，无则默认）----
let DB_AWARDS      = loadPersist(PERSIST_KEYS.awards,      DEFAULT_AWARDS);
let DB_ENROLLMENTS = loadPersist(PERSIST_KEYS.enrollments, DEFAULT_ENROLLMENTS);
let DB_FAVORITES   = loadPersist(PERSIST_KEYS.favorites,   DEFAULT_FAVORITES);

// 加载持久化注册用户（新注册的账号永久保存）
try {
  const extraUsers = JSON.parse(localStorage.getItem('db_users_extra') || '[]');
  extraUsers.forEach(u => {
    if (!DB_USERS.find(existing => existing.id === u.id)) {
      DB_USERS.push(u);
    }
  });
} catch(e) {}

// 首次加载时立即存盘（确保默认数据也被持久化）
if (!localStorage.getItem(PERSIST_KEYS.awards))      savePersist(PERSIST_KEYS.awards,      DB_AWARDS);
if (!localStorage.getItem(PERSIST_KEYS.enrollments)) savePersist(PERSIST_KEYS.enrollments, DB_ENROLLMENTS);
if (!localStorage.getItem(PERSIST_KEYS.favorites))   savePersist(PERSIST_KEYS.favorites,   DB_FAVORITES);

/* 爬虫任务（已废弃，保留空数组兼容旧代码） */
let DB_CRAWLERS = [];

/* 当前登录状态 */
let currentUser = null;

/* 收藏 ID 集合 — 登录后按用户重建 */
let favoriteSet = new Set();
// 登录后自动重建当前用户的收藏集合
window._rebuildFavSet = function(userId) {
  favoriteSet = new Set(
    DB_FAVORITES.filter(f => f.userId === userId).map(f => f.compId)
  );
};

/* ============================================================
   持久化钩子 —— 被 api.js 的 mock 写操作调用
   每次修改可变数据后自动存盘
============================================================ */
window._persistAwards = function() {
  savePersist(PERSIST_KEYS.awards, DB_AWARDS);
};
window._persistEnrollments = function() {
  savePersist(PERSIST_KEYS.enrollments, DB_ENROLLMENTS);
};
window._persistFavorites = function() {
  savePersist(PERSIST_KEYS.favorites, DB_FAVORITES);
};
