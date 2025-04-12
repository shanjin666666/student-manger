class PointsManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('pointsRecords') || '[]');
        this.bindEvents();
    }

    bindEvents() {
        // 积分规则选择变化时的处理
        document.getElementById('pointsRuleSelect')?.addEventListener('change', (e) => {
            const customPointsGroup = document.getElementById('customPointsGroup');
            if (e.target.value === '自定义') {
                customPointsGroup.style.display = 'block';
            } else {
                customPointsGroup.style.display = 'none';
            }
        });

        // 监听积分模态框的显示
        const pointsModal = document.getElementById('pointsModal');
        if (pointsModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        if (pointsModal.classList.contains('show')) {
                            const confirmBtn = document.getElementById('confirmPointsBtn');
                            if (confirmBtn) {
                                // 移除旧的事件监听器
                                const newBtn = confirmBtn.cloneNode(true);
                                confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
                                newBtn.addEventListener('click', () => this.handlePointsSubmit());
                            }
                        }
                    }
                });
            });
            
            observer.observe(pointsModal, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    handlePointsSubmit() {
        const studentId = document.getElementById('pointsStudentId').value;
        const actionType = document.getElementById('pointsActionType').value;
        const ruleSelect = document.getElementById('pointsRuleSelect');
        const selectedRule = ruleSelect.options[ruleSelect.selectedIndex];
        let points = parseInt(selectedRule.dataset.points) || 0;
        
        // 如果是自定义分值
        if (selectedRule.value === '自定义') {
            points = parseInt(document.getElementById('customPoints').value) || 0;
        }
        
        // 如果是扣分操作，确保分值为负数
        if (actionType === 'subtract' && points > 0) {
            points = -points;
        }

        const record = {
            studentId,
            points,
            reason: selectedRule.value,
            note: document.getElementById('pointsNote').value
        };

        this.addPointsRecord(record);
        showToast('积分操作成功', 'success');
        toggleModal('pointsModal', false);
        
        // 如果当前在积分管理页面，刷新积分记录列表
        if (document.querySelector('.points-table')) {
            this.renderPointsHistory();
        }
    }

    addPointsRecord(data) {
        const record = {
            id: Date.now().toString(),
            studentId: data.studentId,
            points: data.points,
            reason: data.reason,
            note: data.note || '',
            createdAt: new Date().toISOString()
        };

        this.records.unshift(record);
        this.saveRecords();
        this.updateRanking();
        return record;
    }

    getStudentPoints(studentId) {
        return this.records
            .filter(record => record.studentId === studentId)
            .reduce((sum, record) => sum + record.points, 0);
    }

    saveRecords() {
        localStorage.setItem('pointsRecords', JSON.stringify(this.records));
    }

    renderPointsHistory() {
        const tbody = document.getElementById('pointsHistoryBody');
        const students = studentManager.getAllStudents();
        
        if (!tbody) return;

        const html = this.records.map(record => {
            const student = students.find(s => s.id === record.studentId);
            if (!student) return '';

            const date = new Date(record.createdAt);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${student.name}</td>
                    <td>${record.points >= 0 ? '加分' : '扣分'}</td>
                    <td>
                        <span class="badge ${record.points >= 0 ? 'badge-primary' : 'badge-danger'}">
                            ${record.points >= 0 ? '+' : ''}${record.points}
                        </span>
                    </td>
                    <td>${record.reason}</td>
                    <td>${record.note || '-'}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html || `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>暂无积分记录</p>
                    </div>
                </td>
            </tr>
        `;

        // 添加搜索功能
        document.getElementById('pointsSearch')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                if (row.querySelector('.empty-state')) return;
                
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });

            // 显示空状态
            const hasVisibleRows = Array.from(rows).some(row => row.style.display !== 'none');
            if (!hasVisibleRows) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="empty-search">
                                <i class="fas fa-search"></i>
                                <p>未找到匹配的记录</p>
                                <small>尝试使用其他关键词搜索</small>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
    }

    updateRanking() {
        const leaderboardBody = document.getElementById('leaderboardBody');
        if (!leaderboardBody) return;

        const students = studentManager.getAllStudents();
        const studentPoints = {};

        // 计算每个学生的总分
        students.forEach(student => {
            studentPoints[student.id] = this.getStudentPoints(student.id);
        });

        // 按分数排序
        const rankedStudents = students
            .map(student => ({
                ...student,
                points: studentPoints[student.id]
            }))
            .sort((a, b) => b.points - a.points);

        // 渲染排行榜
        leaderboardBody.innerHTML = rankedStudents
            .slice(0, 10)
            .map((student, index) => `
                <div class="leaderboard-item ${index < 3 ? 'podium-' + (index + 1) : ''}">
                    <div class="student-info">
                        <span class="rank">${index + 1}</span>
                        <span class="name">${student.name}</span>
                    </div>
                    <span class="points ${student.points >= 0 ? 'positive' : 'negative'}">
                        ${student.points >= 0 ? '+' : ''}${student.points}
                    </span>
                </div>
            `)
            .join('');

        // 更新最后更新时间
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    }

    openPointsForm(studentId) {
        const student = studentManager.getAllStudents().find(s => s.id === studentId);
        if (!student) return;

        document.getElementById('pointsStudentId').value = studentId;
        document.getElementById('pointsActionType').value = 'add';
        document.getElementById('pointsRuleSelect').value = '课堂表现';
        document.getElementById('pointsNote').value = '';
        document.querySelector('#pointsModal .modal-title').textContent = `${student.name} - 积分操作`;

        toggleModal('pointsModal', true);
    }

    showStudentHistory(studentId) {
        const student = studentManager.getAllStudents().find(s => s.id === studentId);
        if (!student) return;

        const records = this.records.filter(record => record.studentId === studentId);
        const totalPoints = this.getStudentPoints(studentId);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'studentHistoryModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${student.name} - 积分记录</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="student-points-summary">
                        <h4>总积分：<span class="${totalPoints >= 0 ? 'positive' : 'negative'}">${totalPoints >= 0 ? '+' : ''}${totalPoints}</span></h4>
                    </div>
                    <table class="points-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>操作</th>
                                <th>分值</th>
                                <th>原因</th>
                                <th>备注</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.length ? records.map(record => {
                                const date = new Date(record.createdAt);
                                return `
                                    <tr>
                                        <td>${date.toLocaleString()}</td>
                                        <td>${record.points >= 0 ? '加分' : '扣分'}</td>
                                        <td>
                                            <span class="badge ${record.points >= 0 ? 'badge-primary' : 'badge-danger'}">
                                                ${record.points >= 0 ? '+' : ''}${record.points}
                                            </span>
                                        </td>
                                        <td>${record.reason}</td>
                                        <td>${record.note || '-'}</td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="5" class="text-center">
                                        <div class="empty-state">
                                            <i class="fas fa-history"></i>
                                            <p>暂无积分记录</p>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

// 创建全局实例
const pointsManager = new PointsManager();
