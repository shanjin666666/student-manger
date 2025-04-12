class StudentManager {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students') || '[]');
        this.bindEvents();
        this.importData = [];
    }

    bindEvents() {
        // 绑定保存按钮事件
        const saveBtn = document.getElementById('saveStudentBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveStudentForm());
        }

        // 绑定文件上传事件
        const excelFile = document.getElementById('excelFile');
        if (excelFile) {
            excelFile.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // 绑定确认导入按钮事件
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => this.confirmImport());
        }

        // 监听模态框的显示
        const studentModal = document.getElementById('studentModal');
        if (studentModal) {
            // 每次模态框显示时重新绑定事件
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        if (studentModal.classList.contains('show')) {
                            const saveBtn = document.getElementById('saveStudentBtn');
                            if (saveBtn) {
                                // 移除旧的事件监听器
                                const newBtn = saveBtn.cloneNode(true);
                                saveBtn.parentNode.replaceChild(newBtn, saveBtn);
                                newBtn.addEventListener('click', () => this.saveStudentForm());
                            }
                        }
                    }
                });
            });
            
            observer.observe(studentModal, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }

    saveStudentForm() {
        const studentId = document.getElementById('studentId').value;
        const studentData = {
            name: document.getElementById('studentName').value,
            studentId: document.getElementById('studentNumber').value,
            gender: document.getElementById('studentGender').value,
            className: document.getElementById('studentClass').value
        };

        if (!studentData.name) {
            showToast('请输入学生姓名！', 'error');
            return;
        }

        if (studentId) {
            this.updateStudent(studentId, studentData);
            showToast('学生信息更新成功', 'success');
        } else {
            this.addStudent(studentData);
            showToast('学生添加成功', 'success');
        }

        toggleModal('studentModal', false);
        this.renderStudentList();
        pointsManager.updateRanking();
    }

    getAllStudents() {
        return this.students;
    }

    addStudent(studentData) {
        const student = {
            id: Date.now().toString(),
            name: studentData.name,
            studentId: studentData.studentId || '',
            gender: studentData.gender || '未知',
            className: studentData.className || '',
            createdAt: new Date().toISOString()
        };
        
        this.students.push(student);
        this.saveStudents();
        return student;
    }

    updateStudent(id, data) {
        const index = this.students.findIndex(s => s.id === id);
        if (index !== -1) {
            this.students[index] = {
                ...this.students[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveStudents();
            return true;
        }
        return false;
    }

    deleteStudent(id) {
        if (confirm('确定要删除这个学生吗？')) {
            const index = this.students.findIndex(s => s.id === id);
            if (index !== -1) {
                this.students.splice(index, 1);
                this.saveStudents();
                this.renderStudentList();
                showToast('学生已删除', 'success');
                return true;
            }
        }
        return false;
    }

    saveStudents() {
        localStorage.setItem('students', JSON.stringify(this.students));
    }

    calculateStudentPoints() {
        const points = {};
        const records = JSON.parse(localStorage.getItem('pointsRecords') || '[]');
        
        records.forEach(record => {
            if (!points[record.studentId]) {
                points[record.studentId] = 0;
            }
            points[record.studentId] += record.points;
        });
        
        return points;
    }

    renderStudentList() {
        const container = document.querySelector('.view-container');
        const students = this.getAllStudents();
        const studentPoints = this.calculateStudentPoints();
        
        const html = `
            <div class="card">
                <div class="card-header">
                    <div class="header-content">
                        <div class="header-title">
                            <h2>学生列表</h2>
                            <span class="student-count">共 ${students.length} 名学生</span>
                        </div>
                        <div class="header-actions">
                            <div class="search-box">
                                <input type="text" id="studentSearch" placeholder="搜索学生姓名、学号或班级...">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-primary" onclick="studentManager.openStudentForm()">
                                    <i class="fas fa-plus"></i> 添加学生
                                </button>
                                <button class="btn btn-outline" onclick="studentManager.openBatchImportModal()">
                                    <i class="fas fa-file-import"></i> 批量导入
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    ${students.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>暂无学生数据</p>
                            <button class="btn btn-primary" onclick="studentManager.openStudentForm()">
                                添加第一个学生
                            </button>
                        </div>
                    ` : `
                        <table class="student-table">
                            <thead>
                                <tr>
                                    <th>姓名</th>
                                    <th>学号</th>
                                    <th>性别</th>
                                    <th>班级</th>
                                    <th>积分</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${students.map(student => {
                                    const points = studentPoints[student.id] || 0;
                                    const badgeClass = points > 0 ? 'badge-primary' : (points < 0 ? 'badge-danger' : 'badge');
                                    return `
                                    <tr data-id="${student.id}">
                                        <td>${student.name}</td>
                                        <td>${student.studentId || '-'}</td>
                                        <td>
                                            ${student.gender === '男' ? '<i class="fas fa-mars text-blue"></i>' : 
                                             student.gender === '女' ? '<i class="fas fa-venus text-pink"></i>' : 
                                             '<i class="fas fa-genderless text-gray"></i>'}
                                            ${student.gender || '未知'}
                                        </td>
                                        <td>${student.className || '-'}</td>
                                        <td>
                                            <span class="${badgeClass}">
                                                ${points > 0 ? '+' : ''}${points}
                                            </span>
                                        </td>
                                        <td class="actions">
                                            <button class="btn btn-sm btn-outline" title="编辑" onclick="studentManager.openStudentForm('${student.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline" title="积分记录" onclick="pointsManager.showStudentHistory('${student.id}')">
                                                <i class="fas fa-list"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" title="删除" onclick="studentManager.deleteStudent('${student.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <button class="btn btn-sm btn-primary" title="积分操作" onclick="pointsManager.openPointsForm('${student.id}')">
                                                <i class="fas fa-plus-minus"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // 搜索功能
        document.getElementById('studentSearch')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const tbody = document.querySelector('.student-table tbody');
            if (!tbody) return;

            Array.from(tbody.children).forEach(row => {
                const name = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                const no = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const className = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
                const show = name.includes(searchTerm) || 
                           no.includes(searchTerm) || 
                           className.includes(searchTerm);
                
                row.style.display = show ? '' : 'none';
            });

            // 更新空状态显示
            const visibleRows = tbody.querySelectorAll('tr[style=""]').length;
            const emptySearch = document.querySelector('.empty-search');
            if (searchTerm && visibleRows === 0) {
                if (!emptySearch) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'empty-search';
                    emptyDiv.innerHTML = `
                        <i class="fas fa-search"></i>
                        <p>未找到匹配的学生</p>
                        <small>尝试使用其他关键词搜索</small>
                    `;
                    tbody.parentElement.appendChild(emptyDiv);
                }
            } else if (emptySearch) {
                emptySearch.remove();
            }
        });
    }

    openStudentForm(studentId = null) {
        const modal = document.getElementById('studentModal');
        const form = document.getElementById('studentForm');
        
        if (studentId) {
            const student = this.students.find(s => s.id === studentId);
            if (!student) return;
            
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentNumber').value = student.studentId || '';
            document.getElementById('studentGender').value = student.gender || '男';
            document.getElementById('studentClass').value = student.className || '';
            modal.querySelector('.modal-title').textContent = '编辑学生信息';
        } else {
            form.reset();
            document.getElementById('studentId').value = '';
            modal.querySelector('.modal-title').textContent = '添加新学生';
        }
        
        toggleModal('studentModal', true);
    }

    openBatchImportModal() {
        this.importData = [];
        document.getElementById('excelFile').value = '';
        document.getElementById('previewContainer').style.display = 'none';
        document.getElementById('importActions').style.display = 'block';
        document.getElementById('confirmImportBtn').style.display = 'none';
        toggleModal('batchImportModal', true);
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await this.readExcelFile(file);
            this.importData = data.map(row => ({
                name: row[0] || '',
                studentId: row[1] || '',
                gender: row[2] || '男',
                className: row[3] || ''
            })).filter(student => student.name.trim() !== '');

            this.renderPreview();
        } catch (error) {
            showToast('文件读取失败：' + error.message, 'error');
        }
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    // 跳过表头
                    resolve(jsonData.slice(1));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    renderPreview() {
        const tbody = document.getElementById('previewTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.importData.map((student, index) => `
            <tr>
                <td class="editable-cell">
                    <input type="text" value="${student.name}" 
                           onchange="studentManager.updatePreviewData(${index}, 'name', this.value)">
                </td>
                <td class="editable-cell">
                    <input type="text" value="${student.studentId}"
                           onchange="studentManager.updatePreviewData(${index}, 'studentId', this.value)">
                </td>
                <td class="editable-cell">
                    <select class="form-control" 
                            onchange="studentManager.updatePreviewData(${index}, 'gender', this.value)">
                        <option value="男" ${student.gender === '男' ? 'selected' : ''}>男</option>
                        <option value="女" ${student.gender === '女' ? 'selected' : ''}>女</option>
                    </select>
                </td>
                <td class="editable-cell">
                    <input type="text" value="${student.className}"
                           onchange="studentManager.updatePreviewData(${index}, 'className', this.value)">
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="studentManager.removePreviewRow(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('importActions').style.display = 'none';
        document.getElementById('confirmImportBtn').style.display = 'inline-flex';
    }

    updatePreviewData(index, field, value) {
        if (this.importData[index]) {
            this.importData[index][field] = value;
        }
    }

    removePreviewRow(index) {
        this.importData.splice(index, 1);
        this.renderPreview();
    }

    reuploadFile() {
        document.getElementById('excelFile').value = '';
        document.getElementById('excelFile').click();
    }

    confirmImport() {
        if (!this.importData.length) {
            showToast('没有可导入的数据', 'warning');
            return;
        }

        const invalidStudents = this.importData.filter(s => !s.name.trim());
        if (invalidStudents.length) {
            showToast('存在姓名为空的学生数据，请检查', 'error');
            return;
        }

        this.importData.forEach(student => {
            this.addStudent(student);
        });

        showToast(`成功导入 ${this.importData.length} 名学生`, 'success');
        toggleModal('batchImportModal', false);
        this.renderStudentList();
    }
}

// 创建全局实例
const studentManager = new StudentManager();
