// ====================================================================
//  核心：将扁平成员列表转为 ECharts 树形数据（3 种模式）
// ====================================================================

let treeViewMode = 'full';        // 'full' | 'ancestor' | 'descendant' | 'relation'
let focusPersonId = null;         // 当前关注的人（祖先/后代/关系模式）
let fullRootId = null;            // 全族模式根节点
let expandedIds = new Set();      // 全族模式：用户手动展开的节点（在第5代截止线上继续展示其子节点）
let highlightIds = new Set();     // 关系路径高亮节点
let highlightLinks = new Map();   // 关系路径高亮连线: "parentId->childId" -> true

// 获取 A 的全部祖先 ID 列表（含自己），最多 maxGens 代
function getAncestorIds(memberId, maxGens = 5) {
  const ids = [memberId];
  let cur = memberId;
  for (let i = 1; i < maxGens; i++) {
    const m = getMember(cur);
    if (!m || !m.fatherId) break;
    ids.push(m.fatherId);
    cur = m.fatherId;
  }
  return ids;
}

// 获取某人向下 N 代所有子孙 ID
function getDescendantIds(memberId, maxGens = 5) {
  const result = [];
  function dfs(pid, depth) {
    if (depth > maxGens) return;
    const children = getChildren(pid);
    for (const c of children) {
      result.push(c.id);
      dfs(c.id, depth + 1);
    }
  }
  dfs(memberId, 1);
  return result;
}

// 向上的祖先树：以最顶层祖先为根，只沿直系路径向下展开，旁支兄弟不展开后代
function buildAncestorTree(memberId, maxGens = 5) {
  const ancestorIds = getAncestorIds(memberId, maxGens);
  const rootId = ancestorIds[ancestorIds.length - 1]; // 最顶层祖先

  const pathSet = new Set(ancestorIds);
  highlightIds.clear();

  function buildNode(mid) {
    const m = getMember(mid);
    if (!m) return null;

    const onPath = pathSet.has(mid);
    if (onPath) highlightIds.add(mid);

    const node = makeNode(m);
    node.collapsed = false;

    // 配偶
    if (m.gender === 'M') {
      const spouse = getSpouse(mid);
      if (spouse) {
        if (onPath) highlightIds.add(spouse.id);
        node.children = node.children || [];
        node.children.push(makeSpouseNode(spouse));
      }
    }

    // 子女：只有直系路径上的节点才继续展开其子女，旁支兄弟到此为止
    const children = getChildren(mid);
    const childNodes = [];
    for (const c of children) {
      if (pathSet.has(c.id)) {
        // 直系路径上的子女 → 继续向下展开
        childNodes.push(buildNode(c.id));
      } else {
        // 旁支兄弟 → 只显示本人，不展开后代
        const cn = makeNode(c);
        cn.collapsed = false;
        if (c.gender === 'M') {
          const sp = getSpouse(c.id);
          if (sp) {
            cn.children = cn.children || [];
            cn.children.push(makeSpouseNode(sp));
          }
        }
        childNodes.push(cn);
      }
    }
    if (childNodes.length > 0) {
      node.children = (node.children || []).concat(childNodes);
    }
    return node;
  }

  return buildNode(rootId);
}

// 向下的后代树：以该人为根，向下展开 maxGens 代子孙
function buildDescendantTree(memberId, maxGens = 5) {
  const m = getMember(memberId);
  if (!m) return null;

  highlightIds.clear();
  highlightIds.add(memberId); // 根节点高亮

  const node = makeNode(m);
  node.collapsed = false;

  if (m.gender === 'M') {
    const spouse = getSpouse(memberId);
    if (spouse) {
      node.children = node.children || [];
      node.children.push(makeSpouseNode(spouse));
    }
  }

  // depth: 1 = 子女辈, 2 = 孙辈, ... maxGens = 最大辈数
  function buildChildren(pid, depth) {
    if (depth > maxGens) return [];
    const children = getChildren(pid);
    const nodes = [];
    for (const c of children) {
      const cn = makeNode(c);
      cn.collapsed = false;
      if (c.gender === 'M') {
        const sp = getSpouse(c.id);
        if (sp) {
          cn.children = cn.children || [];
          cn.children.push(makeSpouseNode(sp));
        }
      }
      const grandKids = buildChildren(c.id, depth + 1);
      if (grandKids.length > 0) {
        cn.children = (cn.children || []).concat(grandKids);
      }
      nodes.push(cn);
    }
    return nodes;
  }

  // depth=1 从子女开始，所以最大 depth = maxGens
  const kidNodes = buildChildren(memberId, 1);
  if (kidNodes.length > 0) {
    node.children = (node.children || []).concat(kidNodes);
  }

  return node;
}

// 全族模式树：以 rootId 为根，展示全部后代（无深度限制）
function buildFullTree(rootId, maxDepth = 5) {
  const m = getMember(rootId);
  if (!m) return null;

  highlightIds.clear();

  const rootGen = m.generationOrder || 1;       // 根节点实际代数
  const maxGen = rootGen + maxDepth - 1;        // 最大展示到的代数（含根节点共 maxDepth 代）

  // depth: 当前成员的实际代数
  function buildNode(mid, depth) {
    const mem = getMember(mid);
    if (!mem) return null;
    const node = makeNode(mem);

    if (depth >= maxGen && !expandedIds.has(mid)) return node;

    if (mem.gender === 'M') {
      const spouse = getSpouse(mid);
      if (spouse) {
        node.children = node.children || [];
        node.children.push(makeSpouseNode(spouse));
      }
    }

    const children = getChildren(mid);
    const childNodes = [];
    for (const c of children) {
      const cn = buildNode(c.id, depth + 1);
      if (cn) childNodes.push(cn);
    }
    if (childNodes.length > 0) {
      node.children = (node.children || []).concat(childNodes);
    }

    return node;
  }

  return buildNode(rootId, rootGen);
}

// 全族树（原始递归，无深度限制，用于完整森林）
function buildTreeData(memberId, visited = new Set()) {
  if (visited.has(memberId)) return null;
  visited.add(memberId);
  const m = getMember(memberId);
  if (!m) return null;

  const node = makeNode(m);
  if (m.gender === 'M') {
    const spouse = getSpouse(memberId);
    if (spouse) {
      node.children = node.children || [];
      node.children.push(makeSpouseNode(spouse));
    }
  }

  const children = getChildren(memberId);
  const childNodes = [];
  for (const c of children) {
    const cn = buildTreeData(c.id, visited);
    if (cn) childNodes.push(cn);
  }
  if (childNodes.length > 0) {
    node.children = (node.children || []).concat(childNodes);
  }
  return node;
}

function findRootMembers() {
  return mockMembers.filter(m => m.fatherId === null && m.generationOrder === 1)
    .sort((a,b) => a.gender === 'M' ? -1 : 1);
}

function buildForestData() {
  const roots = findRootMembers();
  const forest = [];
  const visited = new Set();
  for (const root of roots) {
    if (root.gender === 'M') {
      const treeData = buildTreeData(root.id, visited);
      if (treeData) forest.push(treeData);
    }
  }
  return forest;
}

// 创建单个节点
function makeNode(m, extra = {}) {
  // 节点仅展示姓名
  let label = m.name;

  const isHighlighted = highlightIds.has(m.id);
  const maleColor = isHighlighted ? '#E8A820' : '#C4944A';
  const femaleColor = isHighlighted ? '#E8A820' : '#C4736E';
  const maleBorder = isHighlighted ? '#C48800' : '#A67C3E';
  const femaleBorder = isHighlighted ? '#C48800' : '#A85E5A';
  const bgColor = m.gender === 'M' ? maleColor : femaleColor;

  return {
    name: label,
    value: { id: m.id, gender: m.gender, gen: m.generationOrder },
    itemStyle: {
      color: bgColor,
      borderColor: m.gender === 'M' ? maleBorder : femaleBorder,
      borderWidth: isHighlighted ? 3 : 1,
      borderRadius: 14,
      shadowBlur: isHighlighted ? 12 : 0,
      shadowColor: isHighlighted ? 'rgba(232,168,32,0.5)' : 'transparent',
    },
    symbolSize: 8,
    label: {
      backgroundColor: bgColor,
      borderColor: m.gender === 'M' ? maleBorder : femaleBorder,
      borderWidth: isHighlighted ? 2 : 1,
    },
    ...extra,
  };
}

function makeSpouseNode(spouse) {
  const isHighlighted = highlightIds.has(spouse.id);
  const bgColor = isHighlighted ? '#F0D060' : '#E8D5D3';
  return {
    name: spouse.name,
    value: { id: spouse.id, gender: 'F', gen: spouse.generationOrder, isSpouse: true },
    itemStyle: {
      color: bgColor,
      borderColor: isHighlighted ? '#C48800' : '#C4736E',
      borderWidth: isHighlighted ? 3 : 1,
      borderRadius: 14,
    },
    symbolSize: 8,
    label: {
      backgroundColor: bgColor,
      borderColor: isHighlighted ? '#C48800' : '#C4736E',
      borderWidth: isHighlighted ? 2 : 1,
    },
    collapsed: true,
  };
}

// 获取当前树数据（根据模式）
function getCurrentTreeData() {
  highlightIds.clear();
  highlightLinks.clear();

  if (treeViewMode === 'ancestor' && focusPersonId) {
    return buildAncestorTree(focusPersonId, 5);
  }
  if (treeViewMode === 'descendant' && focusPersonId) {
    return buildDescendantTree(focusPersonId, 5);
  }
  if (treeViewMode === 'relation') {
    return null; // 由 buildRelationTree 特殊处理
  }
  // full mode
  if (fullRootId) {
    return [buildFullTree(fullRootId)];
  }
  return buildForestData();
}

// ====================================================================
//  ECharts 树图渲染
// ====================================================================

function initTreeChart() {
  const container = document.getElementById('treeChart');
  treeChart = echarts.init(container);

  // 响应窗口变化
  window.addEventListener('resize', () => treeChart && treeChart.resize());

  renderTree();
}

function renderTree() {
  let seriesData;

  if (treeViewMode === 'relation') {
    seriesData = buildRelationTree();
  } else {
    const data = getCurrentTreeData();
    seriesData = (data && (Array.isArray(data) ? data : data.length !== undefined ? data : [data])) || [];
    if (!Array.isArray(seriesData)) seriesData = [seriesData];
  }

  if (!seriesData || seriesData.length === 0 ||
      (seriesData.length === 1 && seriesData[0].name === '（空）')) {
    document.getElementById('emptyState').style.display = 'flex';
    seriesData = [{ name: '（空）', children: [] }];
  } else {
    document.getElementById('emptyState').style.display = 'none';
  }

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params) {
        if (params.data.value && params.data.value.isSpouse) {
          return '<b>' + params.name.replace('💍 ', '') + '</b><br/>配偶';
        }
        const v = params.data.value || {};
        const genNames = ['','始祖','第二代','第三代','第四代','第五代','第六代','第七代'];
        const relTag = v.relationTag || '';
        return '<b>' + params.name.replace(/\n/g, '<br/>') + '</b><br/>' +
               (genNames[v.gen] || ('第' + v.gen + '代')) +
               ' · ' + (v.gender === 'M' ? '男' : '女') +
               (relTag ? '<br/>' + relTag : '');
      }
    },
    series: [{
      type: 'tree',
      data: seriesData,
      layout: 'orthogonal',
      orient: treeOrientVal,
      roam: true,
      initialTreeDepth: -1,
      expandAndCollapse: true,
      animationDuration: 500,
      animationDurationUpdate: 600,
      top: '5%',
      left: '5%',
      bottom: '5%',
      right: '10%',
      label: {
        position: 'inside',
        verticalAlign: 'middle',
        align: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: '#FFFFFF',
        padding: [6, 12],
        borderRadius: 14,
        backgroundColor: '#00000000',
        formatter: function(p) {
          // 只取第一行（姓名），避免关系标签污染
          return (p.name || '').split('\n')[0];
        }
      },
      leaves: {
        label: {
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
        }
      },
      lineStyle: {
        color: '#C4B99A',
        width: 2,
        curveness: 0.5,
      },
      symbol: 'emptyCircle',
      symbolSize: 8,
      itemStyle: {
        borderWidth: 1,
      },
      emphasis: {
        focus: 'descendant',
        lineStyle: { color: '#B8860B', width: 3 },
        itemStyle: {
          shadowBlur: 12,
          shadowColor: 'rgba(184,134,11,0.4)',
        },
      },
    }]
  };

  treeChart.setOption(option, true);

  treeChart.off('click');
  treeChart.on('click', function(params) {
    if (params.data && params.data.value && params.data.value.id) {
      const id = params.data.value.id;
      // 全族模式：点击树中节点
      if (treeViewMode === 'full') {
        // expandedIds 仅用于截止线边界节点（maxGen 代）的"展开更多"逻辑；
        // 截止线以内的节点交给 ECharts 自带的 expandAndCollapse 处理
        const fm = getMember(id);
        if (fm) {
          const rootGen = fullRootId ? (getMember(fullRootId)?.generationOrder || 1) : 1;
          const maxGen = rootGen + 4; // maxDepth=5，边界节点为第 rootGen+4 代
          if (fm.generationOrder >= maxGen && getChildren(id).length > 0 && !expandedIds.has(id)) {
            expandedIds.add(id);
            renderTree();
          }
        }
        selectMember(id, { changeRoot: false });
      } else {
        selectMember(id);
      }
    }
  });
}

// 关系路径树：向上找到 A 和 B 的全部祖先，以最高祖先为根构建包含两条路径的树
function buildRelationTree() {
  const aId = parseInt(document.getElementById('relPersonA').value);
  const bId = parseInt(document.getElementById('relPersonB').value);
  if (!aId || !bId) {
    const d = getCurrentTreeData();
    return Array.isArray(d) ? d : [d];
  }

  const a = getMember(aId);
  const b = getMember(bId);
  if (!a || !b) {
    const d = getCurrentTreeData();
    return Array.isArray(d) ? d : [d];
  }

  // 收集 A 的祖先链（含自己），外来配偶通过丈夫接入
  const aPath = [aId];
  let cur = getParentForPath(a);
  while (cur) { aPath.push(cur); const p = getMember(cur); cur = p ? getParentForPath(p) : null; }

  // 收集 B 的祖先链（含自己），外来配偶通过丈夫接入
  const bPath = [bId];
  cur = getParentForPath(b);
  while (cur) { bPath.push(cur); const p = getMember(cur); cur = p ? getParentForPath(p) : null; }

  // 找共同祖先
  let lca = null, lcaIdxA = -1, lcaIdxB = -1;
  for (let i = 0; i < aPath.length; i++) {
    const idx = bPath.indexOf(aPath[i]);
    if (idx !== -1) { lca = aPath[i]; lcaIdxA = i; lcaIdxB = idx; break; }
  }

  if (!lca) {
    const d = getCurrentTreeData();
    return Array.isArray(d) ? d : [d];
  }

  // 高亮集合：两条路径上的所有节点（从共同祖先到两人）
  const aPathToLca = aPath.slice(0, lcaIdxA + 1);  // A → LCA（不含LCA之上）
  const bPathToLca = bPath.slice(0, lcaIdxB + 1);  // B → LCA（不含LCA之上）
  highlightIds = new Set([...aPathToLca, ...bPathToLca]);

  // 以共同祖先为根，不再往上追溯到更远的祖先
  const rootId = lca;
  const pathSet = highlightIds;  // 只包含共同祖先到两人之间的节点

  function buildPathTree(mid, visited = new Set()) {
    if (visited.has(mid)) return null;
    visited.add(mid);
    const m = getMember(mid);
    if (!m) return null;

    const extra = {};
    if (mid === aId) extra.relationTag = '👤 A';
    if (mid === bId) extra.relationTag = '👤 B';
    if (mid === lca && mid !== aId && mid !== bId) extra.relationTag = '🏠 共同祖先';

    const node = makeNode(m, extra);
    if (extra.relationTag) {
      node.name = node.name.replace(/\n/g, ' ') + '\n' + extra.relationTag;
    }

    node.collapsed = false;

    if (m.gender === 'M') {
      const spouse = getSpouse(mid);
      if (spouse) {
        node.children = node.children || [];
        const sNode = makeSpouseNode(spouse);
        // 如果配偶是 A 或 B，加上标签
        if (spouse.id === aId) {
          sNode.name = sNode.name + '\n👤 A';
        }
        if (spouse.id === bId) {
          sNode.name = sNode.name + '\n👤 B';
        }
        if (spouse.id === lca) {
          sNode.name = sNode.name + '\n🏠 共同祖先';
        }
        node.children.push(sNode);
      }
    }

    // 也检查当前成员自己（对女性成员），通过父亲向下的路径不够
    // 需要将外来配偶的丈夫也纳入 pathSet 以确保路径完整
    const spouseId = isExternalSpouse(m) ? getParentForPath(m) : null;

    const children = getChildren(mid);
    const childNodes = [];
    for (const c of children) {
      if (!pathSet.has(c.id)) continue;
      const cn = buildPathTree(c.id, visited);
      if (cn) childNodes.push(cn);
    }
    // 如果当前节点是外来配偶的丈夫，且那些配偶在 pathSet 中
    // 此时孩子列表应该也包含配偶（已经通过前面的 getSpouse 处理）
    if (childNodes.length > 0) {
      node.children = (node.children || []).concat(childNodes);
    }
    return node;
  }

  const tree = buildPathTree(rootId);
  return tree ? [tree] : buildForestData();
}

function treeOrient(orient) {
  treeOrientVal = orient;
  document.getElementById('btnTB').classList.toggle('active', orient === 'TB');
  document.getElementById('btnLR').classList.toggle('active', orient === 'LR');
  renderTree();
}

// ====== 三种模式切换 ======

function switchToAncestor(id) {
  const mid = id || focusPersonId || selectedMemberId;
  if (!mid) { alert('请先选择一个成员'); return; }
  focusPersonId = mid;
  fullRootId = mid;
  selectedMemberId = mid;
  treeViewMode = 'ancestor';
  highlightIds.clear();
  updateToolbarButtons();
  const m = getMember(mid);
  document.getElementById('focusBadge').textContent = '🎯 ' + (m ? m.name : '') + ' 向上追溯';
  document.getElementById('focusBadge').style.display = '';
  document.getElementById('sep1').style.display = '';
  renderTree();
  selectMember(mid);
}

function switchToDescendant(id) {
  const mid = id || focusPersonId || selectedMemberId;
  if (!mid) { alert('请先选择一个成员'); return; }
  focusPersonId = mid;
  fullRootId = mid;
  selectedMemberId = mid;
  treeViewMode = 'descendant';
  highlightIds.clear();
  updateToolbarButtons();
  const m = getMember(mid);
  document.getElementById('focusBadge').textContent = '🎯 ' + (m ? m.name : '') + ' 向下展开';
  document.getElementById('focusBadge').style.display = '';
  document.getElementById('sep1').style.display = '';
  renderTree();
  selectMember(mid);
}

function switchToFull() {
  treeViewMode = 'full';
  // 保留 focusPersonId，以便用户还能切回祖先/后代模式
  highlightIds.clear();
  updateToolbarButtons();
  document.getElementById('focusBadge').style.display = 'none';
  document.getElementById('sep1').style.display = 'none';
  document.getElementById('relResult').classList.remove('show');
  renderTree();
}

function updateToolbarButtons() {
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnFull = document.getElementById('btnFull');

  // 始终显示切换按钮（当有焦点人物时）
  const hasTarget = focusPersonId || selectedMemberId;
  btnUp.style.display = hasTarget ? '' : 'none';
  btnDown.style.display = hasTarget ? '' : 'none';

  btnFull.classList.toggle('active', treeViewMode === 'full');
  btnUp.classList.toggle('active', treeViewMode === 'ancestor');
  btnDown.classList.toggle('active', treeViewMode === 'descendant');

  if (hasTarget && treeViewMode !== 'full') {
    document.getElementById('sep1').style.display = '';
  }
}
