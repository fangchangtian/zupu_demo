// ====================================================================
//  成员列表渲染
// ====================================================================

function renderMemberList(filterText = '') {
  const container = document.getElementById('memberList');
  const ft = (filterText || '').toLowerCase();

  const filtered = mockMembers.filter(m => {
    if (!ft) return true;
    return m.name.toLowerCase().includes(ft) ||
           (m.generationName && m.generationName.toLowerCase().includes(ft)) ||
           (m.birthPlace && m.birthPlace.toLowerCase().includes(ft));
  });

  // 按代数、性别排序
  filtered.sort((a,b) => {
    if (a.generationOrder !== b.generationOrder) return a.generationOrder - b.generationOrder;
    if (a.gender !== b.gender) return a.gender === 'M' ? -1 : 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  let html = '';
  for (const m of filtered) {
    const activeClass = selectedMemberId === m.id ? ' active' : '';
    const genderClass = m.gender === 'M' ? 'male' : 'female';
    const initial = m.name.charAt(m.name.length - 1);
    const avatarHtml = m.avatarUrl ? `<img src="${m.avatarUrl}" alt="${m.name}"/>` : initial;
    html += `
      <div class="member-item${activeClass}" onclick="selectMember(${m.id})">
        <div class="avatar ${genderClass}">${avatarHtml}</div>
        <div class="info">
          <div class="name">${m.name}</div>
          <div class="meta">${getAgeText(m)} · ${m.birthPlace||'未知'}</div>
        </div>
        <span class="gen-badge">第${m.generationOrder}代</span>
      </div>`;
  }

  container.innerHTML = html || '<p style="color:var(--ink-light);text-align:center;padding:20px;">无匹配成员</p>';
}

function filterMembers(text) {
  renderMemberList(text);
}

// ====================================================================
//  成员详情面板
// ====================================================================

function selectMember(id, opts = {}) {
  selectedMemberId = id;
  const m = getMember(id);
  if (!m) return;

  // 全族模式：左侧列表点击 → 切换根节点并重绘树；树图点击 → 不改变根节点
  if (treeViewMode === 'full' && opts.changeRoot !== false) {
    if (fullRootId !== id) {
      fullRootId = id;
      expandedIds.clear();
      renderTree();
    }
  }

  // 如果当前处于祖先/后代模式且选的人变了，自动切换树图
  if ((treeViewMode === 'ancestor' || treeViewMode === 'descendant') && focusPersonId !== id) {
    focusPersonId = id;
    highlightIds.clear();
    updateToolbarButtons();
    renderTree();
  }

  // 高亮列表项
  document.querySelectorAll('.member-item').forEach(el => el.classList.remove('active'));
  const items = document.querySelectorAll('.member-item');
  items.forEach((el, i) => {
    // 用 onclick 属性匹配
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes('selectMember(' + id + ')')) {
      el.classList.add('active');
    }
  });
  renderMemberList(document.querySelector('.search-box input')?.value || '');

  // 渲染详情
  const spouse = getSpouse(id);
  const children = getChildren(id);
  const father = m.fatherId ? getMember(m.fatherId) : null;
  const mother = m.motherId ? getMember(m.motherId) : null;
  const genderClass = m.gender === 'M' ? 'male' : 'female';
  const initial = m.name.charAt(m.name.length - 1);
  const avatarHtml = m.avatarUrl
    ? `<img src="${escapeAttr(m.avatarUrl)}" alt="${escapeAttr(m.name)}" onerror="this.style.display='none';this.parentElement.innerHTML='${initial}';">`
    : initial;

  const genNames = ['','始祖','第二代','第三代','第四代','第五代','第六代','第七代'];

  let parentsHtml = '';
  if (father || mother) {
    let parentLinks = [];
    if (father) parentLinks.push(`<a href="javascript:selectMember(${father.id})" style="color:var(--gold);text-decoration:none;">${father.name}</a>`);
    if (mother) parentLinks.push(`<a href="javascript:selectMember(${mother.id})" style="color:var(--rose);text-decoration:none;">${mother.name}</a>`);
    parentsHtml = `<div class="field"><span class="label">父母</span><span class="value">${parentLinks.join('、')}</span></div>`;
  }

  let html = `
    <div class="big-avatar ${genderClass}" onclick="showProfileDialog(${m.id})" title="点击查看详情">${avatarHtml}</div>
    <div class="field"><span class="label">姓名</span><span class="value">${m.name}</span></div>
    ${m.generationName ? `<div class="field"><span class="label">字辈</span><span class="value">${m.generationName}字辈</span></div>` : ''}
    ${parentsHtml}
    ${spouse ? `<div class="field"><span class="label">配偶</span><span class="value"><a href="javascript:selectMember(${spouse.id})" style="color:var(--rose);text-decoration:none;">${spouse.name}</a></span></div>` : ''}
    ${children.length > 0 ? `<div class="field"><span class="label">子女</span><span class="value">${children.map(c => `<a href="javascript:selectMember(${c.id})" style="color:var(--gold);text-decoration:none;">${c.name}</a>`).join('、')}</span></div>` : ''}
  `;

  document.getElementById('detailBody').innerHTML = html;
  
  // 根据权限控制管理操作按钮的显示
  const actions = document.getElementById('detailActions');
  const toggle = document.getElementById('manageToggle');
  if (canManageMember(id)) {
    actions.style.display = 'flex';
    actions.classList.remove('managing');
    if (toggle) { toggle.classList.remove('active'); toggle.textContent = '⚙ 管理操作'; }
  } else {
    actions.style.display = 'none';
  }
}

// ---------- 成员操作管理模式 ----------
function toggleDetailManage() {
  const actions = document.getElementById('detailActions');
  const toggle = document.getElementById('manageToggle');
  if (!actions || !toggle) return;
  const managing = actions.classList.toggle('managing');
  if (managing) {
    toggle.textContent = '✕ 收起';
    toggle.classList.add('active');
  } else {
    toggle.textContent = '⚙ 管理操作';
    toggle.classList.remove('active');
  }
}

// ---------- 成员详情弹窗 ----------
function showProfileDialog(id) {
  const m = getMember(id);
  if (!m) return;
  const spouse = getSpouse(id);
  const children = getChildren(id);
  const father = m.fatherId ? getMember(m.fatherId) : null;
  const mother = m.motherId ? getMember(m.motherId) : null;
  const genderClass = m.gender === 'M' ? 'male' : 'female';
  const initial = m.name.charAt(m.name.length - 1);
  const genNames = ['','始祖','第二代','第三代','第四代','第五代','第六代','第七代','第八代','第九代'];

  // 头像
  const avatarHtml = m.avatarUrl
    ? `<img src="${escapeAttr(m.avatarUrl)}" alt="${escapeAttr(m.name)}" onerror="this.style.display='none';this.parentElement.innerHTML='${initial}';">`
    : initial;
  document.getElementById('profileAvatar').className = `profile-avatar ${genderClass}`;
  document.getElementById('profileAvatar').innerHTML = avatarHtml;

  // 姓名 + 标签
  document.getElementById('profileName').textContent = m.name;
  const tags = [];
  tags.push(`<span class="tag">${m.gender === 'M' ? '♂ 男' : '♀ 女'}</span>`);
  tags.push(`<span class="tag">${genNames[m.generationOrder] || '第' + m.generationOrder + '代'}</span>`);
  if (m.generationName) tags.push(`<span class="tag">${m.generationName}字辈</span>`);
  tags.push(`<span class="tag">${m.isAlive ? '🏵️ 在世' : '🕯️ 已故'}</span>`);
  document.getElementById('profileSub').innerHTML = tags.join('');

  // 详情正文
  const fmtDate = d => d ? d.replace(/-/g, '年').replace(/-/, '月') + '日' : '—';
  let body = '';

  // 基本信息
  body += `<div class="profile-section"><div class="profile-section-title">📋 基本信息</div><div class="profile-grid">`;
  body += `<div class="profile-item"><span class="pi-label">姓名</span><span class="pi-value">${escapeHtml(m.name)}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">字辈</span><span class="pi-value">${m.generationName ? escapeHtml(m.generationName) + '字辈' : '—'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">性别</span><span class="pi-value">${m.gender === 'M' ? '男' : '女'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">代数</span><span class="pi-value">${genNames[m.generationOrder] || '第' + m.generationOrder + '代'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">出生日期</span><span class="pi-value">${fmtDate(m.birthDate)}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">逝世日期</span><span class="pi-value">${m.deathDate ? fmtDate(m.deathDate) : '—'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">出生地</span><span class="pi-value">${escapeHtml(m.birthPlace) || '—'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">状态</span><span class="pi-value">${m.isAlive ? '🏵️ 在世' : '🕯️ 已故'}</span></div>`;
  body += `</div></div>`;

  // 家族关系
  body += `<div class="profile-section"><div class="profile-section-title">👥 家族关系</div><div class="profile-grid">`;
  body += `<div class="profile-item"><span class="pi-label">父亲</span><span class="pi-value">${father ? `<a href="javascript:closeProfileDialog();selectMember(${father.id});showProfileDialog(${father.id})">${escapeHtml(father.name)}</a>` : '— （始祖）'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">母亲</span><span class="pi-value">${mother ? `<a href="javascript:closeProfileDialog();selectMember(${mother.id});showProfileDialog(${mother.id})">${escapeHtml(mother.name)}</a>` : '—'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">配偶</span><span class="pi-value">${spouse ? `<a href="javascript:closeProfileDialog();selectMember(${spouse.id});showProfileDialog(${spouse.id})">${escapeHtml(spouse.name)}</a>` : '—'}</span></div>`;
  body += `<div class="profile-item"><span class="pi-label">子女 (${children.length})</span><span class="pi-value">${children.length > 0 ? children.map(c => `<a href="javascript:closeProfileDialog();selectMember(${c.id});showProfileDialog(${c.id})">${escapeHtml(c.name)}</a>`).join('、') : '—'}</span></div>`;
  body += `</div></div>`;

  // 生平简介
  if (m.biography) {
    body += `<div class="profile-section"><div class="profile-section-title">📜 生平简介</div><div class="profile-bio">${escapeHtml(m.biography)}</div></div>`;
  }

  document.getElementById('profileBody').innerHTML = body;
  document.getElementById('profileOverlay').classList.add('show');
}

function closeProfileDialog() {
  document.getElementById('profileOverlay').classList.remove('show');
}

function clearDetail() {
  selectedMemberId = null;
  document.getElementById('detailBody').innerHTML =
    '<p style="color:var(--ink-light);text-align:center;padding:40px 0;">点击树图节点<br>或左侧列表查看成员详情</p>';
  document.getElementById('detailActions').style.display = 'none';
  document.querySelectorAll('.member-item').forEach(el => el.classList.remove('active'));
}

// ====================================================================
//  成员增删改
// ====================================================================

function openAddModal() {
  currentEditId = null;
  prefilledFatherId = null;
  addingSpouseForId = null;
  document.getElementById('formGender').disabled = false;
  document.getElementById('fatherSelect').closest('.form-row').style.display = '';
  document.getElementById('childrenEditor').style.display = '';
  document.getElementById('modalTitle').textContent = '添加成员';
  document.getElementById('modalConfirm').textContent = '确认添加';
  clearForm();
  populateParentSelects();
  document.getElementById('modalOverlay').classList.add('show');
}

function openAddChildModal() {
  if (!selectedMemberId) return;
  const parent = getMember(selectedMemberId);
  if (!parent) return;

  currentEditId = null;
  addingSpouseForId = null;
  prefilledFatherId = parent.gender === 'M' ? selectedMemberId : null;
  document.getElementById('formGender').disabled = false;
  document.getElementById('fatherSelect').closest('.form-row').style.display = '';
  document.getElementById('childrenEditor').style.display = 'none';
  document.getElementById('modalTitle').textContent = parent.gender === 'M'
    ? `添加「${parent.name}」的子女`
    : `添加子女（母亲：${parent.name}）`;
  document.getElementById('modalConfirm').textContent = '确认添加';
  clearForm();
  populateParentSelects();

  if (parent.gender === 'M') {
    setParentSelect('fatherSelect', 'formFather', 'formFatherHidden', parent.id);
  } else {
    const spouse = getSpouse(parent.id);
    if (spouse && spouse.gender === 'M') {
      setParentSelect('fatherSelect', 'formFather', 'formFatherHidden', spouse.id);
    }
    setParentSelect('motherSelect', 'formMother', 'formMotherHidden', parent.id);
  }

  // 预填出生地
  if (parent.birthPlace) {
    document.getElementById('formBirthplace').value = parent.birthPlace;
  }

  document.getElementById('modalOverlay').classList.add('show');
}

function openAddSpouseModal() {
  if (!selectedMemberId) return;
  const member = getMember(selectedMemberId);
  if (!member) return;
  const existingSpouse = getSpouse(selectedMemberId);
  if (existingSpouse) {
    if (!confirm(member.name + ' 已有配偶「' + existingSpouse.name + '」，是否继续添加新配偶？')) return;
  }

  currentEditId = null;
  prefilledFatherId = null;
  addingSpouseForId = selectedMemberId;
  document.getElementById('modalTitle').textContent = '添加「' + member.name + '」的配偶';
  document.getElementById('modalConfirm').textContent = '确认添加';
  clearForm();

  document.getElementById('formGender').value = member.gender === 'M' ? 'F' : 'M';
  document.getElementById('formGender').disabled = true;
  document.getElementById('fatherSelect').closest('.form-row').style.display = 'none';
  document.getElementById('childrenEditor').style.display = 'none';

  document.getElementById('modalOverlay').classList.add('show');
}

function editMember() {
  if (!selectedMemberId) return;
  const m = getMember(selectedMemberId);
  if (!m) return;

  currentEditId = m.id;
  addingSpouseForId = null;
  // 恢复表单默认状态
  document.getElementById('formGender').disabled = false;
  document.getElementById('fatherSelect').closest('.form-row').style.display = '';
  document.getElementById('childrenEditor').style.display = '';

  document.getElementById('modalTitle').textContent = '编辑成员：' + m.name;
  document.getElementById('modalConfirm').textContent = '保存修改';
  populateParentSelects();

  document.getElementById('formName').value = m.name || '';
  document.getElementById('formGender').value = m.gender || 'M';
  document.getElementById('formGenName').value = m.generationName || '';
  document.getElementById('formBirth').value = m.birthDate || '';
  document.getElementById('formAlive').value = m.isAlive ? '1' : '0';
  document.getElementById('formDeath').value = m.deathDate || '';
  setParentSelect('fatherSelect', 'formFather', 'formFatherHidden', m.fatherId);
  setParentSelect('motherSelect', 'formMother', 'formMotherHidden', m.motherId);
  document.getElementById('formBirthplace').value = m.birthPlace || '';
  document.getElementById('formBio').value = m.biography || '';

  // 加载当前头像到预览
  avatarState = 'unchanged'; // 编辑时重置状态，只有用户重新操作才会修改
  updateAvatarPreview(m.avatarUrl || null, m.gender);

  // 加载子女列表
  loadChildrenForEditor(m.id);

  document.getElementById('modalOverlay').classList.add('show');
}

function saveMember() {
  const name = document.getElementById('formName').value.trim();
  if (!name) { alert('请输入姓名'); return; }

  const data = {
    name: name,
    gender: document.getElementById('formGender').value,
    generationName: document.getElementById('formGenName').value.trim(),
    birthDate: document.getElementById('formBirth').value || null,
    isAlive: parseInt(document.getElementById('formAlive').value),
    deathDate: document.getElementById('formDeath').value || null,
    fatherId: getFormFatherId(),
    motherId: getFormMotherId(),
    birthPlace: document.getElementById('formBirthplace').value.trim(),
    biography: document.getElementById('formBio').value.trim(),
  };

  // 处理头像：根据 avatarState 决定保存逻辑
  if (avatarState === 'removed') {
    data.avatarUrl = makeDefaultAvatar(Object.assign({}, getMember(currentEditId) || {}, data));
  } else if (avatarState !== 'unchanged') {
    data.avatarUrl = avatarState; // 新上传的 Data URL
  }

  if (currentEditId) {
    // 编辑模式
    const m = getMember(currentEditId);
    if (m) {
      Object.assign(m, data);
      m.generationOrder = calcGeneration(m);
      // 同步子女关系
      syncChildrenRelations(m.id);
      // 如果头像被移除，重新生成默认头像
      if (avatarState === 'removed') {
        m.avatarUrl = makeDefaultAvatar(m);
      }
    }
  } else if (addingSpouseForId) {
    // 添加配偶模式
    const member = getMember(addingSpouseForId);
    const newId = Math.max(...mockMembers.map(m => m.id)) + 1;
    const spouse = {
      id: newId,
      familyId: 1,
      ...data,
      generationOrder: member.generationOrder, // 配偶与对方同代
      createdBy: 1,
    };
    mockMembers.push(spouse);
    // 建立配偶关系
    const isMale = member.gender === 'M';
    mockSpouses.push({
      id: Math.max(...mockSpouses.map(s => s.id), 0) + 1,
      familyId: 1,
      husbandId: isMale ? member.id : newId,
      wifeId: isMale ? newId : member.id,
      marriageDate: null,
      isCurrent: 1,
    });
    initMemberMap();
  } else {
    // 新增成员模式
    const newId = Math.max(...mockMembers.map(m => m.id)) + 1;
    const gen = calcGeneration(data);
    const newMember = {
      id: newId,
      familyId: 1,
      ...data,
      generationOrder: gen,
      createdBy: 1,
    };
    mockMembers.push(newMember);
    initMemberMap();
  }

  closeModal();
  refreshAll();
}

function calcGeneration(m) {
  if (m.fatherId) {
    const father = getMember(m.fatherId);
    return father ? father.generationOrder + 1 : 1;
  }
  return 1;
}

// ====================================================================
//  头像上传
// ====================================================================
// avatarState: 'unchanged' = 未修改 | 'removed' = 已移除 | 'data:image/...' = 新上传
let avatarState = 'unchanged';

function updateAvatarPreview(avatarUrl, gender) {
  const preview = document.getElementById('formAvatarPreview');
  const resetBtn = document.getElementById('formAvatarReset');
  if (!preview) return;
  preview.className = 'preview ' + (gender === 'F' ? 'female' : 'male');
  if (avatarUrl) {
    preview.innerHTML = `<img src="${avatarUrl}" alt="头像"/>`;
    if (resetBtn) resetBtn.style.display = '';
  } else {
    // 显示默认占位（姓氏末字或"图"）
    const nameEl = document.getElementById('formName');
    const name = nameEl ? nameEl.value.trim() : '';
    const initial = name ? name.charAt(name.length - 1) : '图';
    preview.innerHTML = initial;
    if (resetBtn) resetBtn.style.display = 'none';
  }
}

function handleAvatarUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  // 校验类型
  if (!/^image\//.test(file.type)) {
    alert('请选择图片文件');
    event.target.value = '';
    return;
  }
  // 校验大小（限制 2MB）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    avatarState = e.target.result; // 新上传的 Data URL
    const gender = document.getElementById('formGender').value;
    updateAvatarPreview(avatarState, gender);
  };
  reader.onerror = function() {
    alert('图片读取失败，请重试');
  };
  reader.readAsDataURL(file);
  // 清空 input，方便再次选择同一文件
  event.target.value = '';
}

function resetAvatar() {
  avatarState = 'removed';
  const gender = document.getElementById('formGender').value;
  updateAvatarPreview(null, gender);
}

// ====================================================================
function clearForm() {
  document.getElementById('formName').value = '';
  document.getElementById('formGender').value = 'M';
  document.getElementById('formGenName').value = '';
  document.getElementById('formBirth').value = '';
  document.getElementById('formAlive').value = '1';
  document.getElementById('formDeath').value = '';
  document.getElementById('formBirthplace').value = '';
  document.getElementById('formBio').value = '';
  // 清空父母选择器
  setParentSelect('fatherSelect', 'formFather', 'formFatherHidden', null);
  setParentSelect('motherSelect', 'formMother', 'formMotherHidden', null);
  // 清空子女编辑器
  initChildrenEditor();
  // 清空头像
  avatarState = 'unchanged';
  updateAvatarPreview(null, 'M');
}

function populateParentSelects() {
  // 已替换为可搜索选择器，此函数保留兼容
}

// ====================================================================
//  可搜索选择器
// ====================================================================
function showSearchDropdown(containerId, genderFilter, hiddenId) {
  const container = document.getElementById(containerId);
  const dropdown = document.getElementById(containerId + 'Dropdown');
  if (!container || !dropdown) return;
  
  const keyword = document.getElementById(containerId === 'fatherSelect' ? 'formFather' : 'formMother').value.trim();
  renderSearchDropdown(containerId, dropdown, keyword, genderFilter, hiddenId);
  dropdown.classList.add('show');
}

function filterSearchDropdown(containerId, keyword, genderFilter, hiddenId) {
  const dropdown = document.getElementById(containerId + 'Dropdown');
  if (!dropdown) return;
  keyword = keyword.trim();
  renderSearchDropdown(containerId, dropdown, keyword, genderFilter, hiddenId);
  dropdown.classList.add('show');
}

function renderSearchDropdown(containerId, dropdown, keyword, genderFilter, hiddenId) {
  let list = mockMembers.filter(m => !genderFilter || m.gender === genderFilter);
  
  // 排除当前编辑的成员自己
  if (currentEditId) {
    list = list.filter(m => m.id !== currentEditId);
  }
  
  if (keyword) {
    list = list.filter(m => m.name.includes(keyword));
  }
  
  list.sort((a, b) => a.generationOrder - b.generationOrder);
  
  const hiddenVal = document.getElementById(hiddenId).value;
  
  if (list.length === 0) {
    dropdown.innerHTML = '<div class="ss-empty">无匹配成员</div>';
    return;
  }
  
  dropdown.innerHTML = list.map(m => `
    <div class="ss-option" onclick="selectSearchOption('${containerId}', '${hiddenId}', ${m.id}, '${escapeAttr(m.name)}')">
      <span>${m.name}</span>
      <span class="ss-gen">第${m.generationOrder}代</span>
    </div>
  `).join('');
}

function selectSearchOption(containerId, hiddenId, id, name) {
  const hidden = document.getElementById(hiddenId);
  const inputId = containerId === 'fatherSelect' ? 'formFather' : 'formMother';
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  if (hidden) hidden.value = id;
  if (input) input.value = name;
  if (container) container.classList.add('has-value');
  const dropdown = document.getElementById(containerId + 'Dropdown');
  if (dropdown) dropdown.classList.remove('show');
}

function clearSearchSelect(containerId, inputId, hiddenId) {
  event.stopPropagation();
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  const container = document.getElementById(containerId);
  if (input) input.value = '';
  if (hidden) hidden.value = '';
  if (container) container.classList.remove('has-value');
  input.focus();
}

// 点击页面其他地方关闭下拉
document.addEventListener('click', function(e) {
  const selects = document.querySelectorAll('.searchable-select');
  selects.forEach(s => {
    if (!s.contains(e.target)) {
      const dd = s.querySelector('.ss-dropdown');
      if (dd) dd.classList.remove('show');
    }
  });
});

// 从表单获取父亲 ID
function getFormFatherId() {
  const hidden = document.getElementById('formFatherHidden');
  if (hidden) return hidden.value ? parseInt(hidden.value) : null;
  return null;
}
function getFormMotherId() {
  const hidden = document.getElementById('formMotherHidden');
  if (hidden) return hidden.value ? parseInt(hidden.value) : null;
  return null;
}

// 设置父亲/母亲选择器的值
function setParentSelect(containerId, inputId, hiddenId, memberId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  if (!memberId) {
    if (input) input.value = '';
    if (hidden) hidden.value = '';
    if (container) container.classList.remove('has-value');
    return;
  }
  const m = getMember(memberId);
  if (m) {
    if (input) input.value = m.name;
    if (hidden) hidden.value = m.id;
    if (container) container.classList.add('has-value');
  }
}

// ====================================================================
//  子女编辑器
// ====================================================================
let editingChildrenIds = []; // 暂存编辑中的子女 ID 列表

function initChildrenEditor() {
  editingChildrenIds = [];
  renderChildrenList();
}

function loadChildrenForEditor(memberId) {
  const children = getChildren(memberId);
  editingChildrenIds = children.map(c => c.id);
  renderChildrenList();
}

function renderChildrenList() {
  const listEl = document.getElementById('ceList');
  if (!listEl) return;
  
  if (editingChildrenIds.length === 0) {
    listEl.innerHTML = '<span style="font-size:12px;color:var(--ink-light);padding:4px 8px;">暂无子女，在下方搜索添加</span>';
    return;
  }
  
  listEl.innerHTML = editingChildrenIds.map(id => {
    const c = getMember(id);
    if (!c) return '';
    const genderClass = c.gender === 'M' ? 'male' : 'female';
    const genderText = c.gender === 'M' ? '子' : '女';
    return `
      <span class="ce-tag ${genderClass}">
        ${c.name}（${genderText}）
        <button class="ce-remove" onclick="removeChildFromEditor(${id})">✕</button>
      </span>
    `;
  }).join('');
}

function removeChildFromEditor(id) {
  event.stopPropagation();
  editingChildrenIds = editingChildrenIds.filter(cid => cid !== id);
  renderChildrenList();
}

function showChildDropdown() {
  const dropdown = document.getElementById('childDropdown');
  const input = document.getElementById('ceSearchInput');
  if (!dropdown || !input) return;
  const keyword = input.value.trim();
  renderChildDropdown(keyword);
  dropdown.classList.add('show');
}

function filterChildDropdown(keyword) {
  const dropdown = document.getElementById('childDropdown');
  if (!dropdown) return;
  keyword = keyword.trim();
  renderChildDropdown(keyword);
  dropdown.classList.add('show');
}

function renderChildDropdown(keyword) {
  const dropdown = document.getElementById('childDropdown');
  if (!dropdown) return;
  
  let list = mockMembers.slice();
  
  // 排除已经添加的子女
  list = list.filter(m => !editingChildrenIds.includes(m.id));
  // 排除当前编辑的成员自己
  if (currentEditId) {
    list = list.filter(m => m.id !== currentEditId);
  }
  // 排除配偶（不能添加配偶为子女）
  const spouse = getSpouse(currentEditId);
  if (spouse) {
    list = list.filter(m => m.id !== spouse.id);
  }
  
  if (keyword) {
    list = list.filter(m => m.name.includes(keyword));
  }
  
  list.sort((a, b) => a.generationOrder - b.generationOrder);
  
  if (list.length === 0) {
    dropdown.innerHTML = '<div class="ss-empty">无匹配成员</div>';
    return;
  }
  
  dropdown.innerHTML = list.map(m => `
    <div class="ss-option" onclick="addChildToEditor(${m.id})">
      <span>${m.name}${m.gender === 'M' ? '（子）' : '（女）'}</span>
      <span class="ss-gen">第${m.generationOrder}代</span>
    </div>
  `).join('');
}

function addChildToEditor(id) {
  if (!editingChildrenIds.includes(id)) {
    editingChildrenIds.push(id);
    renderChildrenList();
  }
  const input = document.getElementById('ceSearchInput');
  const dropdown = document.getElementById('childDropdown');
  if (input) input.value = '';
  if (dropdown) dropdown.classList.remove('show');
}

function clearChildSearch() {
  event.stopPropagation();
  const input = document.getElementById('ceSearchInput');
  if (input) input.value = '';
  input.focus();
}

// 保存时同步子女关系
function syncChildrenRelations(memberId) {
  const member = getMember(memberId);
  if (!member) return;
  
  const isMale = member.gender === 'M';
  const oldChildren = getChildren(memberId);
  const oldChildIds = oldChildren.map(c => c.id);
  const newChildIds = editingChildrenIds.slice();
  
  // 添加新增的子女关系
  newChildIds.forEach(cid => {
    if (!oldChildIds.includes(cid)) {
      const child = getMember(cid);
      if (child) {
        if (isMale) {
          child.fatherId = memberId;
        } else {
          child.motherId = memberId;
        }
      }
    }
  });
  
  // 移除被删除的子女关系
  oldChildIds.forEach(cid => {
    if (!newChildIds.includes(cid)) {
      const child = getMember(cid);
      if (child) {
        if (isMale) {
          child.fatherId = null;
        } else {
          child.motherId = null;
        }
      }
    }
  });
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  currentEditId = null;
  prefilledFatherId = null;
  addingSpouseForId = null;
  // 恢复表单默认状态
  document.getElementById('formGender').disabled = false;
  document.getElementById('fatherSelect').closest('.form-row').style.display = '';
  document.getElementById('childrenEditor').style.display = '';
}

// ====================================================================
//  删除成员
// ====================================================================

let pendingDeleteId = null;

function confirmDeleteMember() {
  if (!selectedMemberId) return;
  const m = getMember(selectedMemberId);
  if (!m) return;

  pendingDeleteId = selectedMemberId;

  // 检查此人是否有子女
  const children = getChildren(selectedMemberId);
  const hasKids = children.length > 0;

  document.getElementById('delName').textContent = m.name
    + '（第' + m.generationOrder + '代·' + (m.gender === 'M' ? '男' : '女') + '）';
  document.getElementById('delWarn').textContent = hasKids
    ? '⚠ 此人有 ' + children.length + ' 个子女，删除后子女的父亲/母亲关联将失效，请谨慎操作。'
    : '此操作不可恢复，确认删除？';

  document.getElementById('delOverlay').classList.add('show');
}

function closeDelDialog() {
  document.getElementById('delOverlay').classList.remove('show');
  pendingDeleteId = null;
}

function executeDelete() {
  if (!pendingDeleteId) return;

  const id = pendingDeleteId;
  const m = getMember(id);

  // 1. 从 mockMembers 中移除
  const idx = mockMembers.findIndex(m => m.id === id);
  if (idx !== -1) mockMembers.splice(idx, 1);

  // 2. 移除配偶关系
  for (let i = mockSpouses.length - 1; i >= 0; i--) {
    if (mockSpouses[i].husbandId === id || mockSpouses[i].wifeId === id) {
      mockSpouses.splice(i, 1);
    }
  }

  // 3. 清空其子女的 fatherId/motherId
  for (const child of mockMembers) {
    if (child.fatherId === id) child.fatherId = null;
    if (child.motherId === id) child.motherId = null;
  }

  // 4. 更新家族成员数
  mockFamily.memberCount = mockMembers.length;

  // 5. 关闭所有关联状态
  closeDelDialog();
  if (selectedMemberId === id) selectedMemberId = null;
  if (focusPersonId === id) {
    focusPersonId = null;
    if (treeViewMode !== 'relation') {
      treeViewMode = 'full';
    }
  }
  if (fullRootId === id) {
    fullRootId = findRootMembers()[0]?.id || null;
    expandedIds.clear();
  }
  if (currentEditId === id) currentEditId = null;

  // 6. 重新初始化并渲染
  initMemberMap();
  document.getElementById('familyInfo').textContent =
    `${mockFamily.name} · ${mockFamily.generationCount}代 · ${mockMembers.length}人`;
  renderTree();
  renderMemberList();
  clearDetail();
  updateToolbarButtons();
  populateRelSelects();
}

// 点击遮罩关闭删除弹窗
document.getElementById('delOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeDelDialog();
});

// 点击遮罩关闭
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ====================================================================
//  视图切换
// ====================================================================

function switchView(view) {
  document.querySelectorAll('.header nav button').forEach(b => {
    b.classList.remove('active');
    // 匹配按钮文字来设置 active
    const btnView = b.textContent.trim();
    if ((view === 'tree' && btnView.includes('世系')) ||
        (view === 'rules' && btnView.includes('族规')) ||
        (view === 'logs' && btnView.includes('日志'))) {
      b.classList.add('active');
    }
  });

  const main = document.getElementById('mainContent');
  if (view === 'tree') {
    main.innerHTML = main.innerHTML; // 恢复默认布局
    location.reload(); // 简单方式：重载页面
    return;
  }
  if (view === 'rules') {
    showRulesView();
  }
  if (view === 'logs') {
    showLogsView();
  }
}

function showRulesView() {
  ruleManageMode = false;
  const main = document.getElementById('mainContent');
  let html = `
    <div id="rulesContainer" style="flex:1;padding:32px;max-width:800px;margin:0 auto;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <h2 style="margin:0;">📜 张氏族规家训</h2>
        <button class="manage-rule-btn" id="manageRuleBtn" onclick="toggleRuleManage()">⚙ 管理族规</button>
      </div>
      <button class="add-rule-btn" onclick="showAddRuleForm()">＋ 新增族规</button>
      <!-- 新增表单区域 -->
      <div class="rule-edit-form" id="ruleAddForm">
        <input type="text" id="ruleAddTitle" placeholder="标题，如：族规·祭祀礼仪">
        <select id="ruleAddCategory">
          <option value="家训">家训</option>
          <option value="族规">族规</option>
        </select>
        <textarea id="ruleAddContent" placeholder="规则详细内容..."></textarea>
        <div class="form-btns">
          <button onclick="cancelAddRule()">取消</button>
          <button class="save" onclick="addRule()">确认添加</button>
        </div>
      </div>
  `;
  for (const r of mockRules) {
    html += `
      <div class="rule-card" id="ruleCard${r.id}" style="${r.isPinned ? 'border-left-color:var(--gold);border-left-width:4px;' : ''}">
        <div class="rule-title">
          ${r.isPinned ? '📌 ' : ''}${r.title}
          <span style="font-size:11px;color:var(--ink-light);font-weight:400;">· ${r.category}</span>
          <div class="rule-actions">
            <button onclick="togglePinRule(${r.id})" title="${r.isPinned ? '取消置顶' : '置顶'}">${r.isPinned ? '📌 取消置顶' : '📌 置顶'}</button>
            <button onclick="showEditRuleForm(${r.id})">✏️ 编辑</button>
            <button class="del" onclick="deleteRule(${r.id})">🗑</button>
          </div>
        </div>
        <div class="rule-content">${escapeHtml(r.content)}</div>
        <!-- 编辑表单 -->
        <div class="rule-edit-form" id="ruleEditForm${r.id}">
          <input type="text" id="ruleEditTitle${r.id}" value="${escapeAttr(r.title)}">
          <select id="ruleEditCategory${r.id}">
            <option value="家训" ${r.category === '家训' ? 'selected' : ''}>家训</option>
            <option value="族规" ${r.category === '族规' ? 'selected' : ''}>族规</option>
          </select>
          <textarea id="ruleEditContent${r.id}">${escapeHtml(r.content)}</textarea>
          <div class="form-btns">
            <button onclick="cancelEditRule(${r.id})">取消</button>
            <button class="save" onclick="saveEditRule(${r.id})">保存</button>
          </div>
        </div>
      </div>
    `;
  }
  html += '</div>';
  main.innerHTML = html;
}

// ---------- 管理族规模式 ----------
let ruleManageMode = false;
function toggleRuleManage() {
  ruleManageMode = !ruleManageMode;
  const container = document.getElementById('rulesContainer');
  const btn = document.getElementById('manageRuleBtn');
  if (!container || !btn) return;
  if (ruleManageMode) {
    container.classList.add('rules-managing');
    btn.textContent = '✕ 退出管理';
    btn.classList.add('active');
  } else {
    container.classList.remove('rules-managing');
    btn.textContent = '⚙ 管理族规';
    btn.classList.remove('active');
    // 退出管理时关闭所有打开的编辑/新增表单
    document.querySelectorAll('.rule-edit-form.active').forEach(f => f.classList.remove('active'));
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escapeAttr(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---------- 新增族规 ----------
function showAddRuleForm() {
  document.getElementById('ruleAddForm').classList.add('active');
  document.getElementById('ruleAddTitle').value = '';
  document.getElementById('ruleAddContent').value = '';
  document.getElementById('ruleAddCategory').value = '家训';
  document.getElementById('ruleAddTitle').focus();
}

function cancelAddRule() {
  document.getElementById('ruleAddForm').classList.remove('active');
}

function addRule() {
  const title = document.getElementById('ruleAddTitle').value.trim();
  const content = document.getElementById('ruleAddContent').value.trim();
  const category = document.getElementById('ruleAddCategory').value;
  if (!title) { alert('请输入标题'); return; }
  if (!content) { alert('请输入内容'); return; }

  const newId = Math.max(...mockRules.map(r => r.id), 0) + 1;
  mockRules.push({
    id: newId,
    familyId: 1,
    title: title,
    category: category,
    isPinned: 0,
    sortOrder: mockRules.length + 1,
    content: content,
  });
  showRulesView();
}

// ---------- 编辑族规 ----------
function showEditRuleForm(id) {
  // 关闭其他编辑表单
  document.querySelectorAll('.rule-edit-form.active').forEach(f => f.classList.remove('active'));
  // 关闭新增表单
  document.getElementById('ruleAddForm')?.classList.remove('active');
  // 打开当前表单
  document.getElementById('ruleEditForm' + id).classList.add('active');
  document.getElementById('ruleEditTitle' + id).focus();
}

function cancelEditRule(id) {
  document.getElementById('ruleEditForm' + id).classList.remove('active');
}

function saveEditRule(id) {
  const title = document.getElementById('ruleEditTitle' + id).value.trim();
  const content = document.getElementById('ruleEditContent' + id).value.trim();
  const category = document.getElementById('ruleEditCategory' + id).value;
  if (!title) { alert('请输入标题'); return; }
  if (!content) { alert('请输入内容'); return; }

  const rule = mockRules.find(r => r.id === id);
  if (rule) {
    rule.title = title;
    rule.content = content;
    rule.category = category;
  }
  showRulesView();
}

// ---------- 删除族规 ----------
function deleteRule(id) {
  const rule = mockRules.find(r => r.id === id);
  if (!rule) return;
  if (!confirm('确认删除族规「' + rule.title + '」？此操作不可恢复。')) return;

  const idx = mockRules.findIndex(r => r.id === id);
  if (idx !== -1) mockRules.splice(idx, 1);
  showRulesView();
}

// ---------- 置顶/取消置顶 ----------
function togglePinRule(id) {
  const rule = mockRules.find(r => r.id === id);
  if (!rule) return;
  rule.isPinned = rule.isPinned ? 0 : 1;
  // 置顶的排前面
  mockRules.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
  showRulesView();
}

function showLogsView() {
  const main = document.getElementById('mainContent');
  const logs = [
    { time: '2026-07-09 10:30', user: '张志强', action: '添加成员', target: '张晓雅', detail: '新增第五代成员' },
    { time: '2026-07-08 15:20', user: '张建国', action: '更新成员', target: '张志强', detail: '更新工作信息' },
    { time: '2026-07-05 09:15', user: '张建国', action: '添加配偶关系', target: '张志强 & 赵敏', detail: '添加婚姻记录' },
    { time: '2026-07-01 14:00', user: '张志强', action: '添加成员', target: '张晓明', detail: '新增第五代成员' },
    { time: '2026-06-28 11:45', user: '张建国', action: '更新族规', target: '族规·助学奖励', detail: '修改奖学金金额' },
    { time: '2026-06-20 08:30', user: '张建业', action: '添加成员', target: '张志文', detail: '新增第四代成员' },
  ];

  let html = `
    <div style="flex:1;padding:32px;max-width:900px;margin:0 auto;overflow-y:auto;">
      <h2 style="margin-bottom:24px;">📋 操作日志</h2>
      <div style="background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);">
  `;

  for (const log of logs) {
    const actionColors = {
      '添加成员': '#4A9C5D',
      '更新成员': '#4A7C9C',
      '添加配偶关系': '#C4736E',
      '更新族规': '#B8860B',
    };
    const color = actionColors[log.action] || '#6B5E4F';
    html += `
      <div style="display:flex;align-items:center;gap:16px;padding:14px 20px;border-bottom:1px solid var(--border);">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <div style="flex:1;">
          <span style="background:${color}15;color:${color};padding:2px 8px;border-radius:4px;font-size:12px;">${log.action}</span>
          <span style="margin-left:8px;font-weight:500;">${log.target}</span>
          <span style="margin-left:8px;color:var(--ink-light);font-size:12px;">${log.detail}</span>
        </div>
        <div style="font-size:12px;color:var(--ink-light);white-space:nowrap;">${log.time}</div>
        <div style="font-size:12px;color:var(--ink-med);">by ${log.user}</div>
      </div>
    `;
  }

  html += '</div></div>';
  main.innerHTML = html;
}

// ====================================================================
//  初始化
// ====================================================================

function refreshAll() {
  initMemberMap();
  renderMemberList();
  renderTree();
  populateRelSelects();
  if (selectedMemberId) selectMember(selectedMemberId);
}

// 当前登录用户 ID（默认第4代张志强）
const currentUserId = 13;

function getCurrentUser() {
  return getMember(currentUserId);
}

function canManageMember(memberId) {
  if (memberId === currentUserId) return true;
  
  const user = getCurrentUser();
  if (!user) return false;
  
  // 检查是否是自己的配偶
  const spouse = getSpouse(currentUserId);
  if (spouse && spouse.id === memberId) return true;
  
  // 检查是否是自己的后代（以自己为根节点向下延伸的所有子节点）
  const descendants = getAllDescendants(currentUserId);
  if (descendants.some(d => d.id === memberId)) return true;
  
  // 如果登录者是外族配偶（没有父亲或母亲在族谱中），只能管理自己
  if (!user.fatherId && !user.motherId) {
    return memberId === currentUserId;
  }
  
  return false;
}

function getAllDescendants(rootId) {
  const result = [];
  const children = getChildren(rootId);
  
  function collect(node) {
    result.push(node);
    const nodeChildren = getChildren(node.id);
    nodeChildren.forEach(child => collect(child));
  }
  
  children.forEach(child => collect(child));
  return result;
}

function initHeaderUser() {
  const user = getCurrentUser();
  if (!user) return;
  
  const avatarEl = document.getElementById('headerAvatar');
  const nameEl = document.getElementById('headerUserName');
  const genEl = document.getElementById('headerUserGen');
  
  if (avatarEl) {
    avatarEl.className = 'user-avatar ' + (user.gender === 'M' ? 'male' : 'female');
    if (user.avatarUrl) {
      avatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="${user.name}"/>`;
    } else {
      const initial = user.name.charAt(user.name.length - 1);
      avatarEl.textContent = initial;
    }
  }
  if (nameEl) nameEl.textContent = user.name;
  if (genEl) {
    genEl.textContent = user.generationName ? `${user.generationName}字辈 · 第${user.generationOrder}代` : `第${user.generationOrder}代`;
  }
}

function toggleUserPopover() {
  const overlay = document.getElementById('userPopoverOverlay');
  const popover = document.getElementById('userPopover');
  if (!overlay || !popover) return;
  
  const isVisible = overlay.classList.contains('show');
  if (isVisible) {
    closeUserPopover();
  } else {
    openUserPopover();
  }
}

function openUserPopover() {
  const user = getCurrentUser();
  if (!user) return;
  
  const overlay = document.getElementById('userPopoverOverlay');
  const popover = document.getElementById('userPopover');
  if (!overlay || !popover) return;
  
  // 更新弹窗内容
  const avatarEl = document.getElementById('popoverAvatar');
  const nameEl = document.getElementById('popoverName');
  const genEl = document.getElementById('popoverGen');
  const genderEl = document.getElementById('popoverGender');
  const birthEl = document.getElementById('popoverBirth');
  const spouseEl = document.getElementById('popoverSpouse');
  const childrenEl = document.getElementById('popoverChildren');
  
  if (avatarEl) {
    avatarEl.className = 'popover-avatar ' + (user.gender === 'M' ? 'male' : 'female');
    if (user.avatarUrl) {
      avatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="${user.name}"/>`;
    } else {
      const initial = user.name.charAt(user.name.length - 1);
      avatarEl.textContent = initial;
    }
  }
  if (nameEl) nameEl.textContent = user.name;
  if (genEl) {
    genEl.textContent = user.generationName ? `${user.generationName}字辈 · 第${user.generationOrder}代` : `第${user.generationOrder}代`;
  }
  if (genderEl) genderEl.textContent = user.gender === 'M' ? '男' : '女';
  if (birthEl) birthEl.textContent = user.birthDate || '未知';
  
  // 获取配偶信息
  const spouses = mockSpouses.filter(s => s.husbandId === user.id || s.wifeId === user.id);
  if (spouseEl) {
    if (spouses.length > 0) {
      const spouseId = spouses[0].husbandId === user.id ? spouses[0].wifeId : spouses[0].husbandId;
      const spouse = getMember(spouseId);
      spouseEl.innerHTML = spouse ? `<a href="javascript:selectMember(${spouse.id});closeUserPopover()" style="color:var(--rose);text-decoration:none;">${spouse.name}</a>` : '未知';
    } else {
      spouseEl.textContent = '无';
    }
  }
  
  // 获取子女信息
  const children = mockMembers.filter(m => m.fatherId === user.id || m.motherId === user.id);
  if (childrenEl) {
    if (children.length > 0) {
      childrenEl.innerHTML = children.map(c => 
        `<a href="javascript:selectMember(${c.id});closeUserPopover()" style="color:var(--gold);text-decoration:none;">${c.name}</a>`
      ).join('、');
    } else {
      childrenEl.textContent = '无';
    }
  }
  
  overlay.classList.add('show');
  popover.style.display = 'block';
}

function closeUserPopover() {
  const overlay = document.getElementById('userPopoverOverlay');
  const popover = document.getElementById('userPopover');
  if (overlay) overlay.classList.remove('show');
  if (popover) popover.style.display = 'none';
}

function editCurrentUser() {
  closeUserPopover();
  selectedMemberId = currentUserId;
  editMember();
}

function addChildForCurrentUser() {
  closeUserPopover();
  selectedMemberId = currentUserId;
  openAddChildModal();
}

function addSpouseForCurrentUser() {
  closeUserPopover();
  selectedMemberId = currentUserId;
  openAddSpouseModal();
}

// 点击其他地方关闭弹窗
document.addEventListener('click', function(e) {
  const userProfile = document.getElementById('headerUser');
  const popover = document.getElementById('userPopover');
  if (userProfile && popover && !userProfile.contains(e.target) && !popover.contains(e.target)) {
    closeUserPopover();
  }
});

function init() {
  initMemberMap();
  renderMemberList();
  initHeaderUser();

  // 默认选中始祖，全族模式以始祖为根（必须在 initTreeChart 之前设置，确保首次渲染使用 buildFullTree）
  const root = findRootMembers()[0];
  if (root) {
    fullRootId = root.id;
  }

  initTreeChart();
  populateRelSelects();

  // 更新家族信息
  document.getElementById('familyInfo').textContent =
    `${mockFamily.name} · ${mockFamily.generationCount}代 · ${mockMembers.length}人`;

  // 选中始祖以更新详情面板
  if (root) {
    selectMember(root.id);
  }
  updateToolbarButtons();
}

// 启动
document.addEventListener('DOMContentLoaded', init);
