class GroupManager {
    constructor() {
        this.groups = JSON.parse(localStorage.getItem('groups') || '[]');
        this.currentGroupId = null;
        this.selectedMembers = new Set();
        this.init();
    }

    init() {
        // 初始化时绑定所有事件
        document.addEventListener('DOMContentLoaded', () => {
            this.bindModalEvents();
            this.bindFormEvents();
        });
    }

    bindModalEvents() {
        const groupModal = document.getElementById('groupModal');
        if (!groupModal) return;

        // 监听模态框显示状态
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    if (groupModal.classList.contains('show')) {
                        this.initializeForm();
                    } else {
                        // 模态框关闭时重置状态
                        this.resetForm();
                    }
                }
            });
        });
        
        observer.observe(groupModal, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    bindFormEvents() {
        // 绑定保存按钮事件
        const saveBtn = document.getElementById('saveGroupBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveGroupForm();
            });
        }

        // 绑定取消按钮事件
        const cancelBtns = document.querySelectorAll('[onclick*="toggleModal(\'groupModal\', false)"]');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => this.resetForm());
        });
    }

    initializeForm() {
        const memberSelect = document.getElementById('groupMemberSelect');
        if (!memberSelect) return;

        // 清空之前的事件监听器
        const newSelect = memberSelect.cloneNode(true);
        memberSelect.parentNode.replaceChild(newSelect, memberSelect);

        // 初始化选择列表
        this.updateStudentSelect();

        // 绑定新的事件监听器
        newSelect.addEventListener('mousedown', this.handleMemberSelection.bind(this));
        newSelect.addEventListener('mousemove', (e) => e.preventDefault());

        // 确保所有选项的选中状态与 selectedMembers 一致
        Array.from(newSelect.options).forEach(option => {
            option.selected = this.selectedMembers.has(option.value);
        });
    }

    handleMemberSelection(e) {
        e.preventDefault();
        const select = e.currentTarget;
        const option = e.target;
        
        if (option.tagName !== 'OPTION') return;

        const lastScrollTop = select.scrollTop;
        const studentId = option.value;

        if (this.selectedMembers.has(studentId)) {
            option.selected = false;
            this.selectedMembers.delete(studentId);
        } else {
            option.selected = true;
            this.selectedMembers.add(studentId);
        }

        // 保持滚动位置
        setTimeout(() => select.scrollTop = lastScrollTop, 0);
    }

    updateStudentSelect() {
        const select = document.getElementById('groupMemberSelect');
        if (!select) return;

        const students = studentManager.getAllStudents();
        
        // 如果是编辑模式，获取当前分组的成员
        if (this.currentGroupId) {
            const currentGroup = this.groups.find(g => g.id === this.currentGroupId);
            if (currentGroup) {
                this.selectedMembers = new Set(currentGroup.members);
            }
        } else {
            this.selectedMembers.clear();
        }

        // 更新选择列表，不设置 selected 属性
        select.innerHTML = students.map(student => `
            <option value="${student.id}">
                ${student.name} ${student.studentId ? `(${student.studentId})` : ''}
            </option>
        `).join('');
    }

    resetForm() {
        this.currentGroupId = null;
        this.selectedMembers.clear();
        const form = document.getElementById('groupForm');
        if (form) form.reset();
    }

    saveGroupForm() {
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDescription').value.trim();
        const members = Array.from(this.selectedMembers);

        if (!this.validateForm(name, members)) return;

        const groupData = { name, description, members };

        try {
            if (this.currentGroupId) {
                this.updateGroup(this.currentGroupId, groupData);
                showToast('分组更新成功', 'success');
            } else {
                this.createGroup(groupData);
                showToast('分组创建成功', 'success');
            }

            toggleModal('groupModal', false);
            this.renderGroupList();
        } catch (error) {
            showToast('保存失败，请重试', 'error');
            console.error('保存分组失败:', error);
        }
    }

    validateForm(name, members) {
        if (!name) {
            showToast('请输入分组名称', 'error');
            return false;
        }

        if (members.length === 0) {
            showToast('请至少选择一名成员', 'error');
            return false;
        }

        return true;
    }

    openGroupForm(groupId = null) {
        this.currentGroupId = groupId;
        const modal = document.getElementById('groupModal');
        
        if (groupId) {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return;
            
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupDescription').value = group.description || '';
            this.selectedMembers = new Set(group.members);
            
            modal.querySelector('.modal-title').textContent = '编辑分组';
        } else {
            this.resetForm();
            modal.querySelector('.modal-title').textContent = '创建新分组';
        }
        
        toggleModal('groupModal', true);
    }

    createGroup(data) {
        const group = {
            id: Date.now().toString(),
            name: data.name,
            description: data.description,
            members: data.members,
            createdAt: new Date().toISOString()
        };
        
        this.groups.push(group);
        this.saveGroups();
        return group;
    }

    updateGroup(id, data) {
        const index = this.groups.findIndex(g => g.id === id);
        if (index !== -1) {
            this.groups[index] = {
                ...this.groups[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveGroups();
            return true;
        }
        return false;
    }

    deleteGroup(id) {
        if (!confirm('确定要删除这个分组吗？')) return;

        const index = this.groups.findIndex(g => g.id === id);
        if (index !== -1) {
            this.groups.splice(index, 1);
            this.saveGroups();
            this.renderGroupList();
            showToast('分组已删除', 'success');
        }
    }

    renderGroupList() {
        const container = document.getElementById('groupsContainer');
        if (!container) return;

        if (this.groups.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        container.innerHTML = this.renderGroups();
        this.updateGroupCount();
    }

    renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <p>暂无分组</p>
                <button class="btn btn-primary" onclick="groupManager.openGroupForm()">
                    创建第一个分组
                </button>
            </div>
        `;
    }

    renderGroups() {
        return `
            <div class="groups-grid">
                ${this.groups.map(group => this.renderGroupCard(group)).join('')}
            </div>
        `;
    }

    renderGroupCard(group) {
        const members = group.members
            .map(id => studentManager.getAllStudents().find(s => s.id === id))
            .filter(Boolean);

        return `
            <div class="group-card" data-id="${group.id}">
                <div class="group-header">
                    <h3 class="group-name">${group.name}</h3>
                    <div class="group-actions">
                        <button class="btn btn-sm btn-outline" onclick="groupManager.openGroupForm('${group.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="groupManager.deleteGroup('${group.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="group-info">
                    <p class="group-description">${group.description || '暂无描述'}</p>
                    <div class="group-stats">
                        <span class="member-count">
                            <i class="fas fa-users"></i> ${members.length} 名成员
                        </span>
                        <span class="total-points">
                            <i class="fas fa-star"></i> ${this.calculateGroupPoints(members)} 总分
                        </span>
                    </div>
                </div>
                <div class="group-members">
                    ${this.renderMemberList(members)}
                </div>
            </div>
        `;
    }

    renderMemberList(members) {
        if (!members.length) {
            return '<p class="no-members">暂无成员</p>';
        }

        return `
            <div class="member-list">
                ${members.map(student => `
                    <div class="member-item" title="${student.name}">
                        <span class="member-name">${student.name}</span>
                        <span class="member-points ${pointsManager.getStudentPoints(student.id) >= 0 ? 'positive' : 'negative'}">
                            ${pointsManager.getStudentPoints(student.id)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateGroupPoints(members) {
        return members.reduce((sum, student) => 
            sum + pointsManager.getStudentPoints(student.id), 0
        );
    }

    updateGroupCount() {
        const countElement = document.getElementById('groupCount');
        if (countElement) {
            countElement.textContent = `(共 ${this.groups.length} 个分组)`;
        }
    }

    saveGroups() {
        localStorage.setItem('groups', JSON.stringify(this.groups));
    }
}

// 创建全局实例
const groupManager = new GroupManager();
