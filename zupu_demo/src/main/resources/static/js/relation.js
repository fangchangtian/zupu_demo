// ====================================================================
//  关系查询
// ====================================================================

function populateRelSelects() {
  // 初始化隐藏字段，下拉列表按需生成
  document.getElementById('relPersonA').value = '';
  document.getElementById('relPersonB').value = '';
  document.getElementById('relInputA').value = '';
  document.getElementById('relInputB').value = '';
}

function showRelDropdown(side) {
  renderRelDropdown(side, '');
}

function filterRelDropdown(side) {
  const input = document.getElementById('relInput' + side);
  const text = input.value || '';
  renderRelDropdown(side, text.toLowerCase());
}

function renderRelDropdown(side, filter) {
  const dropdown = document.getElementById('relDropdown' + side);
  let list = [...mockMembers].sort((a,b) => {
    if (a.generationOrder !== b.generationOrder) return a.generationOrder - b.generationOrder;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
  if (filter) {
    list = list.filter(m => m.name.includes(filter) || (m.generationName && m.generationName.includes(filter)));
  }
  if (list.length === 0) {
    dropdown.innerHTML = '<div class="rel-dropdown-item" style="color:var(--ink-light);cursor:default">无匹配成员</div>';
  } else {
    dropdown.innerHTML = list.map(m =>
      `<div class="rel-dropdown-item" onmousedown="selectRelPerson('${side}', ${m.id}, '${m.name}')">
        ${m.name}<span class="gen-tag">第${m.generationOrder}代·${m.gender==='M'?'男':'女'}</span>
      </div>`
    ).join('');
  }
  // 定位到对应输入框下方
  const input = document.getElementById('relInput' + side);
  const rect = input.getBoundingClientRect();
  const wrapRect = input.closest('.rel-search-wrap').getBoundingClientRect();
  dropdown.style.top = (rect.bottom - wrapRect.top + 2) + 'px';
  dropdown.classList.add('show');
}

function selectRelPerson(side, id, name) {
  document.getElementById('relPerson' + side).value = id;
  document.getElementById('relInput' + side).value = name;
  document.getElementById('relDropdown' + side).classList.remove('show');
  onRelChange();
}

function hideRelDropdown(side, event) {
  // 延迟关闭，让 mousedown 先触发
  setTimeout(() => {
    const dropdown = document.getElementById('relDropdown' + side);
    const active = document.activeElement;
    const input = document.getElementById('relInput' + side);
    if (active !== input) {
      dropdown.classList.remove('show');
    }
  }, 150);
}

function onRelChange() {
  document.getElementById('relResult').classList.remove('show');
}

function calculateRelation() {
  const aId = parseInt(document.getElementById('relPersonA').value);
  const bId = parseInt(document.getElementById('relPersonB').value);

  if (!aId || !bId) {
    alert('请选择两个成员');
    return;
  }

  const result = calcRelation(aId, bId);
  const el = document.getElementById('relResult');
  el.innerHTML = `<div style="font-size:24px;margin-bottom:4px;">🔗</div>${result}`;
  el.classList.add('show');

  // 切换到关系路径模式：在树图中展示两人的祖先路径
  treeViewMode = 'relation';
  focusPersonId = aId;
  selectedMemberId = aId;
  updateToolbarButtons();
  document.getElementById('focusBadge').textContent = '🔗 关系路径: ' + (getMember(aId)?.name||'') + ' ↔ ' + (getMember(bId)?.name||'');
  document.getElementById('focusBadge').style.display = '';
  document.getElementById('sep1').style.display = '';
  document.getElementById('btnUp').style.display = '';
  document.getElementById('btnDown').style.display = '';
  document.getElementById('btnFull').classList.remove('active');
  renderTree();
  selectMember(aId);
}

// 获取路径查找时的"逻辑父节点"：
// 普通成员返回 fatherId，外来配偶（女，无 fatherId）返回丈夫 ID
function getParentForPath(member) {
  if (!member) return null;
  if (member.fatherId) return member.fatherId;
  // 检查是否为外来配偶（妻子），通过婚姻关系连接到家族
  if (member.gender === 'F') {
    for (const s of mockSpouses) {
      if (s.wifeId === member.id) return s.husbandId;
    }
  }
  return null;
}

// 检查成员是否为外来配偶
function isExternalSpouse(member) {
  if (!member || member.gender !== 'F') return false;
  if (member.fatherId) return false;
  for (const s of mockSpouses) {
    if (s.wifeId === member.id) return true;
  }
  return false;
}

function calcRelation(aId, bId) {
  const a = getMember(aId);
  const b = getMember(bId);
  if (!a || !b) return '未知';
  if (aId === bId) return '本人';
  if (a.familyId !== b.familyId) return '非同族成员';

  // 检测是否为配偶关系
  for (const s of mockSpouses) {
    if ((s.husbandId === aId && s.wifeId === bId)) return a.gender === 'M' ? '配偶（妻）' : '配偶（夫）';
    if ((s.wifeId === aId && s.husbandId === bId)) return a.gender === 'F' ? '配偶（夫）' : '配偶（妻）';
  }

  // 收集 A 的祖先链（含自己），外来配偶通过丈夫接入
  const aAncestors = [];
  let cur = getParentForPath(a);
  while (cur) {
    aAncestors.push(cur);
    const p = getMember(cur);
    cur = p ? getParentForPath(p) : null;
  }

  // 检查直系（A 是 B 的直系后代）
  if (aAncestors.includes(bId)) {
    const delta = a.generationOrder - b.generationOrder;
    return delta === 1 ? '父亲' :
           delta === 2 ? '祖父' :
           delta === 3 ? '曾祖父' :
           '上' + delta + '代直系长辈';
  }

  // B 的祖先链（含自己），外来配偶通过丈夫接入
  const bAncestors = [];
  let bCur = getParentForPath(b);
  while (bCur) {
    bAncestors.push(bCur);
    const p = getMember(bCur);
    bCur = p ? getParentForPath(p) : null;
  }

  if (bAncestors.includes(aId)) {
    const delta = b.generationOrder - a.generationOrder;
    return delta === 1 ? '儿子/女儿' :
           delta === 2 ? '孙子/孙女' :
           delta === 3 ? '曾孙/曾孙女' :
           '下' + delta + '代直系后代';
  }

  // 检查 A 是不是通过配偶关系成为 B 的直系长辈/后代
  // 例如 A 是外来配偶，她通过丈夫的祖先链可能包含 B
  if (isExternalSpouse(a)) {
    const husband = getMember(getParentForPath(a));
    if (husband && husband.id === bId) return '配偶（妻）';
    if (husband && bAncestors.includes(husband.id)) {
      const hDelta = husband.generationOrder - b.generationOrder;
      return hDelta === 0 ? '配偶（妯娌关系）'
           : hDelta > 0 ? '儿媳等/晚辈配偶'
           : '婆婆等/长辈配偶';
    }
  }
  if (isExternalSpouse(b)) {
    const husband = getMember(getParentForPath(b));
    if (husband && husband.id === aId) return '配偶（妻）';
    if (husband && aAncestors.includes(husband.id)) {
      const hDelta = a.generationOrder - husband.generationOrder;
      return hDelta === 0 ? '配偶（连襟关系）'
           : hDelta > 0 ? '儿媳等/晚辈配偶'
           : '婆婆等/长辈配偶';
    }
  }

  // 找共同祖先（沿着配偶路由后的路径）
  let commonAncestor = null;
  let bDist = 0;
  bCur = b.id;
  while (bCur) {
    if (aAncestors.includes(bCur)) {
      commonAncestor = bCur;
      break;
    }
    bDist++;
    const p = getMember(bCur);
    bCur = p ? getParentForPath(p) : null;
  }

  if (!commonAncestor) return '同族远亲';

  const aDist = aAncestors.indexOf(commonAncestor) + 1;

  // 称呼计算
  const genDiff = a.generationOrder - b.generationOrder;

  // 同辈
  if (aDist === 1 && bDist === 1) {
    if (genDiff === 0) return '亲兄弟姐妹';
  }

  // 父辈（A 比 B 高一辈）
  if (genDiff === 1 && bDist === 2 && aDist === 1) {
    return a.gender === 'M' ? '叔叔/伯父/舅舅' : '姑姑/姨妈';
  }
  if (genDiff === -1 && aDist === 2 && bDist === 1) {
    return a.gender === 'M' ? '侄子/外甥' : '侄女/外甥女';
  }

  // 堂/表关系
  if (aDist === 2 && bDist === 2) {
    if (genDiff === 0) return '堂兄弟姐妹/表兄弟姐妹';
    if (genDiff === 1) return a.gender === 'M' ? '堂叔/表叔' : '堂姑/表姑';
    if (genDiff === -1) return a.gender === 'M' ? '堂侄/表侄' : '堂侄女/表侄女';
  }

  // 更远的亲戚
  const genNames = ['','一代','两代','三代','四代','五代'];
  const d = Math.abs(genDiff);
  const prefix = aDist <= 2 ? '堂/表' : '远房';
  if (genDiff > 0) return prefix + '长辈（长' + d + '辈）';
  if (genDiff < 0) return prefix + '晚辈（晚' + d + '辈）';
  return '同辈远亲';
}

// ====================================================================
//  成员增删改
// ====================================================================
