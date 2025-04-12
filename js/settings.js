class SettingsManager {
    constructor() {
        this.rules = JSON.parse(localStorage.getItem('rules') || '[]');
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindDataEvents();
        });
    }

    bindDataEvents() {
        // 导出数据
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            const data = storage.exportData();
            this.downloadData(data);
        });

        // 导入数据
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            this.uploadData();
        });
    }

    downloadData(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_points_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('数据导出成功', 'success');
    }

    uploadData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    storage.importData(data);
                    showToast('数据导入成功', 'success');
                    loadCurrentView();
                } catch (error) {
                    showToast('数据导入失败：文件格式不正确', 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    openRuleForm(ruleId = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'ruleFormModal';

        const rule = ruleId ? this.rules.find(r => r.id === ruleId) : null;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${rule ? '编辑规则' : '添加规则'}</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="ruleForm">
                        <input type="hidden" id="ruleId" value="${rule?.id || ''}">
                        <div class="form-group">
                            <label class="form-label">规则名称</label>
                            <input type="text" id="ruleName" class="form-control" value="${rule?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">分值</label>
                            <input type="number" id="rulePoints" class="form-control" value="${rule?.points || 0}" required>
                            <small class="form-text text-muted">正数表示加分，负数表示扣分</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="settingsManager.saveRule()">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    saveRule() {
        const form = document.getElementById('ruleForm');
        const ruleId = document.getElementById('ruleId').value;
        const name = document.getElementById('ruleName').value.trim();
        const points = parseInt(document.getElementById('rulePoints').value);

        if (!name) {
            showToast('请输入规则名称', 'error');
            return;
        }

        if (isNaN(points)) {
            showToast('请输入有效的分值', 'error');
            return;
        }

        const ruleData = { name, points };

        if (ruleId) {
            this.updateRule(ruleId, ruleData);
        } else {
            this.createRule(ruleData);
        }

        document.getElementById('ruleFormModal').remove();
        this.renderRules();
    }

    createRule(data) {
        const rule = {
            id: Date.now().toString(),
            name: data.name,
            points: data.points,
            createdAt: new Date().toISOString()
        };

        this.rules.push(rule);
        this.saveRules();
        showToast('规则创建成功', 'success');
    }

    updateRule(id, data) {
        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
            this.rules[index] = {
                ...this.rules[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveRules();
            showToast('规则更新成功', 'success');
        }
    }

    deleteRule(id) {
        if (!confirm('确定要删除这个规则吗？')) return;

        const index = this.rules.findIndex(r => r.id === id);
        if (index !== -1) {
            this.rules.splice(index, 1);
            this.saveRules();
            this.renderRules();
            showToast('规则已删除', 'success');
        }
    }

    saveRules() {
        localStorage.setItem('rules', JSON.stringify(this.rules));
    }

    renderRules() {
        const container = document.getElementById('rulesList');
        if (!container) return;

        if (this.rules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>暂无积分规则</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.rules.map(rule => `
            <div class="rule-item">
                <div class="rule-name">
                    <i class="fas fa-${rule.points >= 0 ? 'plus-circle' : 'minus-circle'} 
                       ${rule.points >= 0 ? 'text-success' : 'text-danger'}"></i>
                    <span>${rule.name}</span>
                </div>
                <div class="rule-info">
                    <span class="rule-points ${rule.points >= 0 ? 'positive' : 'negative'}">
                        ${rule.points >= 0 ? '+' : ''}${rule.points}
                    </span>
                    <div class="rule-actions">
                        <button class="btn btn-sm btn-outline" onclick="settingsManager.openRuleForm('${rule.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="settingsManager.deleteRule('${rule.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 创建全局实例
const settingsManager = new SettingsManager(); 