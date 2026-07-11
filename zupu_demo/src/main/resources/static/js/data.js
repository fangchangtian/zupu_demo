// ====================================================================
//  数据层：Mock 数据 & 数据转换
// ====================================================================

/** 模拟家族数据 */
const mockFamily = {
  id: 1,
  name: '张氏宗谱',
  surname: '张',
  description: '浙江绍兴张氏一支，自清末至今已传承九代。族人以耕读传家，世代和睦。',
  generationCount: 9,
  memberCount: 48
};

/** 模拟成员数据（扁平列表，与后端 API 返回格式一致） */
const mockMembers = [
  // 第1代 - 始祖
  { id: 1,  familyId:1, name:'张德厚',  generationName:'德', gender:'M', birthDate:'1900-03-15', deathDate:'1975-08-20', isAlive:0, generationOrder:1, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张氏本支始祖。清末秀才，后弃儒从商，在绍兴开设"德厚堂"商号，经营丝绸茶叶，家境殷实。乐善好施，乡里称颂。' },
  { id: 2,  familyId:1, name:'陈氏',    generationName:'',   gender:'F', birthDate:'1902-05-10', deathDate:'1980-02-14', isAlive:0, generationOrder:1, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张德厚之妻。出身书香门第，贤良淑德，持家有方。' },

  // 第2代
  { id: 3,  familyId:1, name:'张守仁',  generationName:'守', gender:'M', birthDate:'1925-01-20', deathDate:'2005-06-10', isAlive:0, generationOrder:2, fatherId:1, motherId:2, birthPlace:'浙江绍兴', biography:'长子。继承父业经营德厚堂，新中国成立后公私合营，转为国营商场经理。为人耿直，在族中威望极高。' },
  { id: 4,  familyId:1, name:'王氏',    generationName:'',   gender:'F', birthDate:'1928-07-12', deathDate:'2010-03-22', isAlive:0, generationOrder:2, fatherId:null, motherId:null, birthPlace:'浙江杭州', biography:'张守仁之妻。杭州人，温婉贤惠。' },
  { id: 5,  familyId:1, name:'张守义',  generationName:'守', gender:'M', birthDate:'1928-11-08', deathDate:'1998-09-15', isAlive:0, generationOrder:2, fatherId:1, motherId:2, birthPlace:'浙江绍兴', biography:'次子。参军入伍，参加抗美援朝，后转业至地方粮食局工作。一生节俭，教子严格。' },
  { id: 6,  familyId:1, name:'杨氏',    generationName:'',   gender:'F', birthDate:'1930-03-25', deathDate:'2005-12-01', isAlive:0, generationOrder:2, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张守义之妻。家庭妇女，抚养三子一女成才。' },

  // 第3代
  { id: 7,  familyId:1, name:'张建国',  generationName:'建', gender:'M', birthDate:'1950-06-15', deathDate:null, isAlive:1, generationOrder:3, fatherId:3, motherId:4, birthPlace:'浙江绍兴', biography:'长子。恢复高考后第一批大学生，毕业于浙江大学机械系。曾任绍兴机械厂总工程师，现已退休。' },
  { id: 8,  familyId:1, name:'李秀兰',  generationName:'',   gender:'F', birthDate:'1952-09-20', deathDate:null, isAlive:1, generationOrder:3, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张建国之妻。退休教师，曾任绍兴一中语文教研组长。' },
  { id: 9,  familyId:1, name:'张建华',  generationName:'建', gender:'M', birthDate:'1953-12-02', deathDate:null, isAlive:1, generationOrder:3, fatherId:3, motherId:4, birthPlace:'浙江绍兴', biography:'次子。中专毕业后进入供销社工作，改革开放后下海创办贸易公司，现居上海。' },
  { id: 10, familyId:1, name:'刘芳',    generationName:'',   gender:'F', birthDate:'1955-04-18', deathDate:null, isAlive:1, generationOrder:3, fatherId:null, motherId:null, birthPlace:'上海', biography:'张建华之妻。上海人，与建华共同经营贸易公司。' },
  { id: 11, familyId:1, name:'张建业',  generationName:'建', gender:'M', birthDate:'1955-08-30', deathDate:'2020-01-05', isAlive:0, generationOrder:3, fatherId:5, motherId:6, birthPlace:'浙江绍兴', biography:'张守义长子。乡村教师，在绍兴山区小学任教三十年，退休后因病去世。' },
  { id: 12, familyId:1, name:'张建芬',  generationName:'建', gender:'F', birthDate:'1958-03-12', deathDate:null, isAlive:1, generationOrder:3, fatherId:5, motherId:6, birthPlace:'浙江绍兴', biography:'张守义之女。卫校毕业，绍兴人民医院护士长，现已退休。' },

  // 第4代
  { id: 13, familyId:1, name:'张志强',  generationName:'志', gender:'M', birthDate:'1975-03-08', deathDate:null, isAlive:1, generationOrder:4, fatherId:7, motherId:8, birthPlace:'浙江绍兴', biography:'张建国长子。浙江大学计算机系毕业，现为杭州某互联网公司技术总监。' },
  { id: 14, familyId:1, name:'赵敏',    generationName:'',   gender:'F', birthDate:'1978-07-15', deathDate:null, isAlive:1, generationOrder:4, fatherId:null, motherId:null, birthPlace:'浙江杭州', biography:'张志强之妻。杭州人，阿里巴巴产品经理。' },
  { id: 15, familyId:1, name:'张志刚',  generationName:'志', gender:'M', birthDate:'1978-11-20', deathDate:null, isAlive:1, generationOrder:4, fatherId:7, motherId:8, birthPlace:'浙江绍兴', biography:'张建国次子。医学院毕业，绍兴市人民医院外科医生。' },
  { id: 16, familyId:1, name:'张志芳',  generationName:'志', gender:'F', birthDate:'1982-05-16', deathDate:null, isAlive:1, generationOrder:4, fatherId:7, motherId:8, birthPlace:'浙江绍兴', biography:'张建国之女。华东政法大学毕业后在绍兴中级法院工作。' },
  { id: 17, familyId:1, name:'张志伟',  generationName:'志', gender:'M', birthDate:'1978-04-22', deathDate:null, isAlive:1, generationOrder:4, fatherId:9, motherId:10, birthPlace:'上海', biography:'张建华之子。复旦大学经济系毕业，现于上海某投行工作。' },
  { id: 18, familyId:1, name:'张志文',  generationName:'志', gender:'M', birthDate:'1980-09-10', deathDate:null, isAlive:1, generationOrder:4, fatherId:11, motherId:null, birthPlace:'浙江绍兴', biography:'张建业之子。师范毕业后子承父业，在绍兴任教。' },

  // 第5代
  { id: 19, familyId:1, name:'张晓明',  generationName:'晓', gender:'M', birthDate:'2000-01-15', deathDate:null, isAlive:1, generationOrder:5, fatherId:13, motherId:14, birthPlace:'浙江杭州', biography:'张志强之子。浙江大学在读。' },
  { id: 20, familyId:1, name:'张晓雨',  generationName:'晓', gender:'F', birthDate:'2003-06-20', deathDate:null, isAlive:1, generationOrder:5, fatherId:13, motherId:14, birthPlace:'浙江杭州', biography:'张志强之女。复旦大学在读。' },
  { id: 21, familyId:1, name:'张晓峰',  generationName:'晓', gender:'M', birthDate:'2005-09-03', deathDate:null, isAlive:1, generationOrder:5, fatherId:15, motherId:null, birthPlace:'浙江绍兴', biography:'张志刚之子。高中生。' },
  { id: 22, familyId:1, name:'张晓龙',  generationName:'晓', gender:'M', birthDate:'2003-12-10', deathDate:null, isAlive:1, generationOrder:5, fatherId:17, motherId:null, birthPlace:'上海', biography:'张志伟之子。上海交通大学在读。' },
  { id: 23, familyId:1, name:'张晓雅',  generationName:'晓', gender:'F', birthDate:'2006-04-05', deathDate:null, isAlive:1, generationOrder:5, fatherId:18, motherId:null, birthPlace:'浙江绍兴', biography:'张志文之女。初中生。' },

  // 第5代（补充配偶）
  { id: 24, familyId:1, name:'林悦',    generationName:'',   gender:'F', birthDate:'2001-08-22', deathDate:null, isAlive:1, generationOrder:5, fatherId:null, motherId:null, birthPlace:'浙江杭州', biography:'张晓明之妻。杭州人，浙江大学硕士毕业，现为中学教师。' },

  // 第6代 - 文字辈
  { id: 25, familyId:1, name:'张文博',  generationName:'文', gender:'M', birthDate:'2024-03-15', deathDate:null, isAlive:1, generationOrder:6, fatherId:19, motherId:24, birthPlace:'浙江杭州', biography:'张晓明之子。' },
  { id: 26, familyId:1, name:'张文婷',  generationName:'文', gender:'F', birthDate:'2026-01-10', deathDate:null, isAlive:1, generationOrder:6, fatherId:19, motherId:24, birthPlace:'浙江杭州', biography:'张晓明之女。' },
  { id: 27, familyId:1, name:'吴倩',    generationName:'',   gender:'F', birthDate:'2002-11-05', deathDate:null, isAlive:1, generationOrder:6, fatherId:null, motherId:null, birthPlace:'浙江杭州', biography:'张文博之妻。杭州人，设计师。' },
  { id: 33, familyId:1, name:'周婷',    generationName:'',   gender:'F', birthDate:'2004-08-18', deathDate:null, isAlive:1, generationOrder:5, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张晓峰之妻。绍兴人，护士。' },
  { id: 34, familyId:1, name:'张文杰',  generationName:'文', gender:'M', birthDate:'2025-06-20', deathDate:null, isAlive:1, generationOrder:6, fatherId:21, motherId:33, birthPlace:'浙江绍兴', biography:'张晓峰之子。' },
  { id: 35, familyId:1, name:'沈慧',    generationName:'',   gender:'F', birthDate:'2003-04-12', deathDate:null, isAlive:1, generationOrder:6, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张文杰之妻。绍兴人，小学教师。' },
  { id: 41, familyId:1, name:'孙莉',    generationName:'',   gender:'F', birthDate:'2004-01-30', deathDate:null, isAlive:1, generationOrder:5, fatherId:null, motherId:null, birthPlace:'上海', biography:'张晓龙之妻。上海人，金融分析师。' },
  { id: 42, familyId:1, name:'张文轩',  generationName:'文', gender:'M', birthDate:'2025-09-08', deathDate:null, isAlive:1, generationOrder:6, fatherId:22, motherId:41, birthPlace:'上海', biography:'张晓龙之子。' },
  { id: 43, familyId:1, name:'郑洁',    generationName:'',   gender:'F', birthDate:'2004-07-25', deathDate:null, isAlive:1, generationOrder:6, fatherId:null, motherId:null, birthPlace:'上海', biography:'张文轩之妻。上海人，医生。' },

  // 第7代 - 武字辈
  { id: 28, familyId:1, name:'张武杰',  generationName:'武', gender:'M', birthDate:'2048-08-10', deathDate:null, isAlive:1, generationOrder:7, fatherId:25, motherId:27, birthPlace:'浙江杭州', biography:'张文博之子。' },
  { id: 29, familyId:1, name:'许芳',    generationName:'',   gender:'F', birthDate:'2050-03-15', deathDate:null, isAlive:1, generationOrder:7, fatherId:null, motherId:null, birthPlace:'浙江宁波', biography:'张武杰之妻。宁波人，企业高管。' },
  { id: 36, familyId:1, name:'张武豪',  generationName:'武', gender:'M', birthDate:'2049-11-05', deathDate:null, isAlive:1, generationOrder:7, fatherId:34, motherId:35, birthPlace:'浙江绍兴', biography:'张文杰之子。' },
  { id: 37, familyId:1, name:'宋雅',    generationName:'',   gender:'F', birthDate:'2051-06-20', deathDate:null, isAlive:1, generationOrder:7, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张武豪之妻。绍兴人，公务员。' },
  { id: 44, familyId:1, name:'张武斌',  generationName:'武', gender:'M', birthDate:'2050-12-18', deathDate:null, isAlive:1, generationOrder:7, fatherId:42, motherId:43, birthPlace:'上海', biography:'张文轩之子。' },
  { id: 45, familyId:1, name:'潘虹',    generationName:'',   gender:'F', birthDate:'2052-05-14', deathDate:null, isAlive:1, generationOrder:7, fatherId:null, motherId:null, birthPlace:'江苏苏州', biography:'张武斌之妻。苏州人，律师。' },

  // 第8代 - 翰字辈
  { id: 30, familyId:1, name:'张翰文',  generationName:'翰', gender:'M', birthDate:'2070-04-20', deathDate:null, isAlive:1, generationOrder:8, fatherId:28, motherId:29, birthPlace:'浙江杭州', biography:'张武杰之子。' },
  { id: 31, familyId:1, name:'何琪',    generationName:'',   gender:'F', birthDate:'2072-09-10', deathDate:null, isAlive:1, generationOrder:8, fatherId:null, motherId:null, birthPlace:'浙江杭州', biography:'张翰文之妻。杭州人，医生。' },
  { id: 38, familyId:1, name:'张翰宇',  generationName:'翰', gender:'M', birthDate:'2071-07-30', deathDate:null, isAlive:1, generationOrder:8, fatherId:36, motherId:37, birthPlace:'浙江绍兴', biography:'张武豪之子。' },
  { id: 39, familyId:1, name:'冯倩',    generationName:'',   gender:'F', birthDate:'2073-02-14', deathDate:null, isAlive:1, generationOrder:8, fatherId:null, motherId:null, birthPlace:'浙江绍兴', biography:'张翰宇之妻。绍兴人，教师。' },
  { id: 46, familyId:1, name:'张翰林',  generationName:'翰', gender:'M', birthDate:'2072-10-22', deathDate:null, isAlive:1, generationOrder:8, fatherId:44, motherId:45, birthPlace:'上海', biography:'张武斌之子。' },
  { id: 47, familyId:1, name:'姜妍',    generationName:'',   gender:'F', birthDate:'2074-06-08', deathDate:null, isAlive:1, generationOrder:8, fatherId:null, motherId:null, birthPlace:'上海', biography:'张翰林之妻。上海人，建筑师。' },

  // 第9代 - 墨字辈
  { id: 32, familyId:1, name:'张墨轩',  generationName:'墨', gender:'M', birthDate:'2094-01-15', deathDate:null, isAlive:1, generationOrder:9, fatherId:30, motherId:31, birthPlace:'浙江杭州', biography:'张翰文之子。' },
  { id: 40, familyId:1, name:'张墨涵',  generationName:'墨', gender:'M', birthDate:'2095-08-25', deathDate:null, isAlive:1, generationOrder:9, fatherId:38, motherId:39, birthPlace:'浙江绍兴', biography:'张翰宇之子。' },
  { id: 48, familyId:1, name:'张墨言',  generationName:'墨', gender:'M', birthDate:'2096-03-18', deathDate:null, isAlive:1, generationOrder:9, fatherId:46, motherId:47, birthPlace:'上海', biography:'张翰林之子。' },
];

/** 为所有成员自动生成 SVG 内联头像（按性别、代数差异化，无需外部请求） */
const avatarPalettes = {
  elderM: ['#8B6914', '#C9A961', '#F5ECD7'],
  elderF: ['#A0522D', '#D4A574', '#FAF0E6'],
  midM:   ['#2F5496', '#5B9BD5', '#E8F0FE'],
  midF:   ['#7B3F7A', '#C77DBF', '#F4E6F4'],
  youngM: ['#1E6B4A', '#4CAF82', '#E6F6EE'],
  youngF: ['#C23A5B', '#F094A8', '#FCE9EE'],
  childM: ['#1F6FBF', '#60A5FA', '#E0EEFF'],
  childF: ['#B83280', '#F687B3', '#FFF0F5'],
};
function pickAvatarPalette(m) {
  if (!m.isAlive || m.generationOrder <= 2) return m.gender === 'M' ? 'elderM' : 'elderF';
  if (m.generationOrder <= 4) return m.gender === 'M' ? 'midM' : 'midF';
  if (m.generationOrder <= 6) return m.gender === 'M' ? 'youngM' : 'youngF';
  return m.gender === 'M' ? 'childM' : 'childF';
}
function makeDefaultAvatar(m) {
  const p = avatarPalettes[pickAvatarPalette(m)];
  const [dark, mid, light] = p;
  const initial = (m.name || '?').charAt((m.name || '?').length - 1);
  const gen = m.generationOrder || 1;
  const bgPattern = m.gender === 'M'
    ? `<circle cx="50" cy="38" r="18" fill="${light}" opacity="0.6"/>
       <rect x="20" y="56" width="60" height="34" rx="8" fill="${light}" opacity="0.6"/>`
    : `<circle cx="50" cy="40" r="16" fill="${light}" opacity="0.6"/>
       <path d="M20 90 Q20 60 50 55 Q80 60 80 90 Z" fill="${light}" opacity="0.6"/>`;
  const genText = gen > 0 ? `<text x="50" y="90" text-anchor="middle" font-size="10" fill="${dark}" opacity="0.7" font-family="serif">第${gen}代</text>` : '';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="g${m.id}" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${mid}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#g${m.id})"/>
      ${bgPattern}
      <text x="50" y="58" text-anchor="middle" font-size="32" font-weight="700" fill="#fff" font-family="serif" style="text-shadow:0 1px 2px rgba(0,0,0,0.3)">${initial}</text>
      ${genText}
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}
// 初始化：为所有成员生成默认头像（已有 avatarUrl 的跳过）
mockMembers.forEach(m => {
  if (!m.avatarUrl) m.avatarUrl = makeDefaultAvatar(m);
});

/** 模拟配偶关系 */
const mockSpouses = [
  { id:1, familyId:1, husbandId:1, wifeId:2, marriageDate:'1923-10-06', isCurrent:1 },
  { id:2, familyId:1, husbandId:3, wifeId:4, marriageDate:'1948-05-15', isCurrent:1 },
  { id:3, familyId:1, husbandId:5, wifeId:6, marriageDate:'1949-11-20', isCurrent:1 },
  { id:4, familyId:1, husbandId:7, wifeId:8, marriageDate:'1973-03-08', isCurrent:1 },
  { id:5, familyId:1, husbandId:9, wifeId:10, marriageDate:'1976-10-01', isCurrent:1 },
  { id:6, familyId:1, husbandId:13, wifeId:14, marriageDate:'1999-05-20', isCurrent:1 },
  { id:7, familyId:1, husbandId:19, wifeId:24, marriageDate:'2023-08-18', isCurrent:1 },
  { id:8, familyId:1, husbandId:21, wifeId:33, marriageDate:'2024-05-12', isCurrent:1 },
  { id:9, familyId:1, husbandId:22, wifeId:41, marriageDate:'2024-10-01', isCurrent:1 },
  { id:10, familyId:1, husbandId:25, wifeId:27, marriageDate:'2046-06-08', isCurrent:1 },
  { id:11, familyId:1, husbandId:34, wifeId:35, marriageDate:'2047-03-20', isCurrent:1 },
  { id:12, familyId:1, husbandId:28, wifeId:29, marriageDate:'2068-09-15', isCurrent:1 },
  { id:13, familyId:1, husbandId:36, wifeId:37, marriageDate:'2070-06-22', isCurrent:1 },
  { id:14, familyId:1, husbandId:42, wifeId:43, marriageDate:'2048-08-12', isCurrent:1 },
  { id:15, familyId:1, husbandId:44, wifeId:45, marriageDate:'2071-11-05', isCurrent:1 },
  { id:16, familyId:1, husbandId:30, wifeId:31, marriageDate:'2092-05-18', isCurrent:1 },
  { id:17, familyId:1, husbandId:38, wifeId:39, marriageDate:'2093-08-08', isCurrent:1 },
  { id:18, familyId:1, husbandId:46, wifeId:47, marriageDate:'2094-07-01', isCurrent:1 },
];

/** 模拟族规 */
const mockRules = [
  { id:1, familyId:1, title:'张氏家训十则', category:'家训', isPinned:1, sortOrder:1,
    content:'一、孝悌为先，敬祖先、爱父母、悌兄弟；二、耕读传家，勤耕以养身，苦读以明志；三、诚信为本，言必信、行必果……' },
  { id:2, familyId:1, title:'族规·婚丧嫁娶', category:'族规', isPinned:0, sortOrder:2,
    content:'凡族中婚嫁，须禀告族长，择吉日而行。丧事从简，禁铺张浪费。族中互助，一家有事，全族支援。' },
  { id:3, familyId:1, title:'族规·助学奖励', category:'族规', isPinned:0, sortOrder:3,
    content:'族中子弟考入重点大学者，由族产拨付奖学金。取得硕博学位者，优先主持家族事务。' },
];

// ====================================================================
//  工具函数
// ====================================================================

const memberMap = new Map();
let selectedMemberId = null;
let currentEditId = null;
let addingSpouseForId = null;
let prefilledFatherId = null;
let treeOrientVal = 'TB';
let treeChart = null;

function initMemberMap() {
  memberMap.clear();
  mockMembers.forEach(m => memberMap.set(m.id, m));
}

function getMember(id) { return memberMap.get(id); }

function getSpouse(memberId) {
  const m = getMember(memberId);
  if (!m) return null;
  const isMale = m.gender === 'M';
  for (const s of mockSpouses) {
    if (isMale && s.husbandId === memberId) return getMember(s.wifeId);
    if (!isMale && s.wifeId === memberId) return getMember(s.husbandId);
  }
  return null;
}

function getChildren(fatherId) {
  return mockMembers.filter(m => m.fatherId === fatherId).sort((a,b) => (a.sortOrder||0) - (b.sortOrder||0));
}

function getAgeText(m) {
  const parts = [];
  if (m.birthDate) parts.push(m.birthDate.substring(0,4));
  if (m.deathDate) parts.push('–' + m.deathDate.substring(0,4));
  else if (m.isAlive === 1) parts.push('–至今');
  else if (m.birthDate) parts.push('–已故');
  return parts.join('');
}
