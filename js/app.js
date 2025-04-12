document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    initNavigation();
    initActionButtons();
    initModals();
    setupEventListeners();
    
    // 初始化排行榜
    pointsManager.updateRanking();
});

// 在app.js中添加
function setupEventListeners() {
    // 监听所有模态框的关闭按钮
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                toggleModal(modal.id, false);
            }
        });
    });

    // 点击模态框背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                toggleModal(modal.id, false);
            }
        });
    });
}

// 显示Toast通知
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
              type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
              '<i class="fas fa-info-circle"></i>'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


function loadView(viewId) {
    const container = document.querySelector('.view-container');
    const sectionTitle = document.querySelector('.section-title');
    
    // 更新导航项的激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });
    
    // 更新标题
    const titles = {
        'student-list': '学生管理',
        'points-manage': '积分管理',
        'group-manage': '分组管理',
        'statistics': '数据统计',
        'settings': '系统设置'
    };
    sectionTitle.textContent = titles[viewId] || '';
    
    // 清空容器内容
    container.innerHTML = '';
    
    switch(viewId) {
        case 'student-list':
            studentManager.renderStudentList();
            break;
            
        case 'points-manage':
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div class="header-content">
                            <div class="header-title">
                                <h2>积分记录</h2>
                            </div>
                            <div class="header-actions">
                                <div class="search-box">
                                    <input type="text" id="pointsSearch" placeholder="搜索积分记录...">
                                    <i class="fas fa-search"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="points-table">
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>学生</th>
                                    <th>操作</th>
                                    <th>分值</th>
                                    <th>原因</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody id="pointsHistoryBody">
                                <!-- 积分记录将动态插入这里 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            pointsManager.renderPointsHistory();
            break;
            
        case 'group-manage':
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div class="header-content">
                            <div class="header-title">
                                <h2>分组管理</h2>
                                <span class="group-count" id="groupCount"></span>
                            </div>
                            <div class="header-actions">
                                <button class="btn btn-primary" onclick="groupManager.openGroupForm()">
                                    <i class="fas fa-plus"></i> 创建分组
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="groups-container" id="groupsContainer">
                        <!-- 分组列表将动态插入这里 -->
                    </div>
                </div>
            `;
            groupManager.renderGroupList();
            break;
            
        case 'statistics':
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div class="header-content">
                            <div class="header-title">
                                <h2>数据统计</h2>
                            </div>
                            <div class="header-actions">
                                <select class="form-control" id="statsTimeRange">
                                    <option value="all">全部时间</option>
                                    <option value="today">今天</option>
                                    <option value="week">本周</option>
                                    <option value="month">本月</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="statistics-container">
                        <div class="stats-cards">
                            <div class="stats-card">
                                <div class="stats-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stats-info">
                                    <div class="stats-title">总学生数</div>
                                    <div class="stats-value" id="totalStudents">-</div>
                                </div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <div class="stats-info">
                                    <div class="stats-title">总积分操作</div>
                                    <div class="stats-value" id="totalOperations">-</div>
                                </div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="stats-info">
                                    <div class="stats-title">平均分</div>
                                    <div class="stats-value" id="averagePoints">-</div>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="pointsDistributionChart"></canvas>
                        </div>
                    </div>
                </div>
            `;
            renderStatistics();
            break;
            
        case 'settings':
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div class="header-content">
                            <div class="header-title">
                                <h2>系统设置</h2>
                            </div>
                        </div>
                    </div>
                    <div class="settings-container">
                        <div class="setting-group">
                            <h3><i class="fas fa-star"></i> 积分规则管理</h3>
                            <div class="rules-list" id="rulesList">
                                <!-- 积分规则将动态插入这里 -->
                            </div>
                            <div class="setting-actions">
                                <button class="btn btn-primary" onclick="settingsManager.openRuleForm()">
                                    <i class="fas fa-plus"></i> 添加规则
                                </button>
                            </div>
                        </div>

                        <div class="setting-group">
                            <h3><i class="fas fa-database"></i> 数据管理</h3>
                            <div class="setting-content">
                                <p class="setting-description">导入或导出系统数据，包括学生信息、积分记录和分组信息。</p>
                                <div class="setting-actions">
                                    <button class="btn btn-outline" id="exportDataBtn">
                                        <i class="fas fa-download"></i> 导出数据
                                    </button>
                                    <button class="btn btn-outline" id="importDataBtn">
                                        <i class="fas fa-upload"></i> 导入数据
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="setting-group">
                            <h3><i class="fas fa-palette"></i> 主题设置</h3>
                            <div class="setting-content">
                                <div class="theme-options">
                                    <div class="theme-option">
                                        <input type="radio" name="theme" id="themeLight" value="light" checked>
                                        <label for="themeLight">
                                            <div class="theme-preview light"></div>
                                            <span>浅色主题</span>
                                        </label>
                                    </div>
                                    <div class="theme-option">
                                        <input type="radio" name="theme" id="themeDark" value="dark">
                                        <label for="themeDark">
                                            <div class="theme-preview dark"></div>
                                            <span>深色主题</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            setupSettingsEvents();
            break;
    }
}

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有导航项的激活状态
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // 添加当前点击项的激活状态
            item.classList.add('active');
            // 加载对应的视图
            loadView(item.dataset.view);
        });
    });

    // 默认加载学生列表视图
    loadView('student-list');
}

function initActionButtons() {
    // 移除不存在的元素的事件绑定
    const fileInput = document.getElementById('fileInput');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const newGroupBtn = document.getElementById('newGroupBtn');
    const showRulesBtn = document.getElementById('showRulesBtn');

    // 只有在元素存在时才绑定事件
    if (fileInput && importBtn) {
        // 导入数据
        importBtn.addEventListener('click', () => {
            fileInput.value = null;
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        storage.importData(data);
                        alert('数据导入成功！');
                        location.reload();
                    } catch (error) {
                        alert('导入失败：文件格式不正确');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
    
    // 导出数据
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `班级数据_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    // 显示规则
    if (showRulesBtn) {
        showRulesBtn.addEventListener('click', () => {
            toggleModal('rulesModal', true);
        });
    }
}

function setupStudentListEvents() {
    const container = document.querySelector('.view-container');
    
    // 删除学生
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const studentId = e.target.closest('tr').dataset.id;
            if (confirm('确定要删除这个学生吗？')) {
                studentManager.deleteStudent(studentId);
                loadView('student-list');
                pointsManager.updateRanking();
            }
        }
        
        // 编辑学生
        if (e.target.classList.contains('edit-btn')) {
            const studentId = e.target.closest('tr').dataset.id;
            const student = studentManager.getAllStudents().find(s => s.id === studentId);
            
            const newName = prompt('输入新的姓名：', student.name);
            if (newName !== null) {
                const newStudentId = prompt('输入新学号：', student.studentId);
                const newClass = prompt('输入新班级：', student.className);
                
                studentManager.updateStudent(studentId, {
                    name: newName,
                    studentId: newStudentId,
                    className: newClass
                });
                
                loadView('student-list');
            }
        }
    });
}

function setupPointsManagementEvents() {
    document.getElementById('applyPoints').addEventListener('click', () => {
        const studentId = document.getElementById('studentSelect').value;
        const reasonSelect = document.getElementById('pointsReason');
        const selectedReason = reasonSelect.options[reasonSelect.selectedIndex];
        const points = parseInt(selectedReason.dataset.points);
        
        pointsManager.addPointsRecord({
            studentId,
            points,
            reason: selectedReason.value
        });
        
        alert('积分已更新！');
        pointsManager.updateRanking();
    });
}

function setupGroupManagementEvents() {
    const container = document.querySelector('.view-container');
    
    container.addEventListener('click', (e) => {
        // 删除分组
        if (e.target.classList.contains('delete-group')) {
            const groupId = e.target.closest('.group-card').dataset.id;
            if (confirm('确定要删除这个分组吗？')) {
                groupManager.deleteGroup(groupId);
                loadView('group-manage');
            }
        }
        
        // 编辑分组
        if (e.target.classList.contains('edit-group')) {
            const groupId = e.target.closest('.group-card').dataset.id;
            const group = storage.getGroups().find(g => g.id === groupId);
            showGroupForm(group);
        }
        
        // 新建分组
        if (e.target.id === 'addGroupBtn') {
            showGroupForm();
        }
    });
    
    // 处理分组表单提交
    document.getElementById('groupForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.target;
        const memberSelect = document.getElementById('groupMemberSelect');
        const selectedMembers = Array.from(memberSelect.selectedOptions).map(opt => opt.value);
        
        const groupData = {
            name: form.querySelector('#groupName').value,
            description: form.querySelector('#groupDescription').value,
            members: selectedMembers
        };
        
        const groupId = form.querySelector('#groupId').value;
        if (groupId) {
            groupManager.updateGroup(groupId, groupData);
        } else {
            groupManager.createGroup(groupData);
        }
        
        document.getElementById('groupFormModal').style.display = 'none';
        loadView('group-manage');
    });
}

function showGroupForm(group = null) {
    const modal = document.getElementById('groupFormModal');
    const form = document.getElementById('groupForm');
    
    if (group) {
        form.querySelector('#groupId').value = group.id;
        form.querySelector('#groupName').value = group.name;
        form.querySelector('#groupDescription').value = group.description || '';
        
        // 设置选中成员
        const memberSelect = form.querySelector('#groupMemberSelect');
        Array.from(memberSelect.options).forEach(opt => {
            opt.selected = group.members.includes(opt.value);
        });
    } else {
        form.reset();
        form.querySelector('#groupId').value = '';
    }
    
    modal.style.display = 'block';
}

function initModals() {
    // 为所有模态框添加关闭按钮事件
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function renderRules() {
    const rules = storage.getRules();
    const container = document.querySelector('.rules-list');
    
    container.innerHTML = rules.map(rule => `
        <div class="rule-item">
            <span>${rule.name}</span>
            <span>${rule.points > 0 ? '+' : ''}${rule.points}</span>
        </div>
    `).join('');
}

// 添加统计图表渲染函数
function renderStatistics() {
    statisticsManager.updateStatistics();
}

// 添加设置页面事件处理
function setupSettingsEvents() {
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_points_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            storage.importData(data);
                            showToast('数据导入成功', 'success');
                            loadView('student-list');
                        } catch (error) {
                            showToast('数据导入失败：文件格式不正确', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
    }
}

// 添加toggleModal函数
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        } else {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }
}

// 添加一个函数来更新当前视图
function loadCurrentView() {
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        loadView(activeNavItem.dataset.view);
    }
}
