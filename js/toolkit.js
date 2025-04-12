class ToolkitManager {
    constructor() {
        this.timer = null;
        this.timerInterval = null;
        this.init();
    }

    init() {
        // 初始化时绑定所有事件
        this.bindEvents();
        
        // 监听视图变化，确保在工具箱视图加载时重新绑定事件
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.view === 'toolkit') {
                setTimeout(() => this.bindEvents(), 100);
            }
        });
    }

    bindEvents() {
        // 绑定分组按钮事件
        const startGroupBtn = document.getElementById('startGroupBtn');
        if (startGroupBtn) {
            // 移除旧的事件监听器
            const newBtn = startGroupBtn.cloneNode(true);
            startGroupBtn.parentNode.replaceChild(newBtn, startGroupBtn);
            
            newBtn.addEventListener('click', () => {
                const groupCount = parseInt(document.getElementById('groupCount').value);
                if (!groupCount || groupCount < 2) {
                    showToast('请输入有效的分组数量（至少2组）', 'error');
                    return;
                }
                this.randomGroup(groupCount);
            });
        }

        // 绑定点名按钮事件
        const startPickBtn = document.getElementById('startPickBtn');
        if (startPickBtn) {
            const newBtn = startPickBtn.cloneNode(true);
            startPickBtn.parentNode.replaceChild(newBtn, startPickBtn);
            
            newBtn.addEventListener('click', () => {
                const studentCount = parseInt(document.getElementById('studentCount').value);
                if (!studentCount || studentCount < 1) {
                    showToast('请输入有效的选择人数（至少1人）', 'error');
                    return;
                }
                this.randomPick(studentCount);
            });
        }

        // 绑定计时器按钮事件
        const startTimerBtn = document.getElementById('startTimerBtn');
        if (startTimerBtn) {
            const newBtn = startTimerBtn.cloneNode(true);
            startTimerBtn.parentNode.replaceChild(newBtn, startTimerBtn);
            
            newBtn.addEventListener('click', () => {
                const minutes = parseInt(document.getElementById('timerMinutes').value);
                if (!minutes || minutes < 1) {
                    showToast('请输入有效的时间（至少1分钟）', 'error');
                    return;
                }
                this.startTimer(minutes);
            });
        }

        // 绑定值日表按钮事件
        const generateDutyBtn = document.getElementById('generateDutyBtn');
        if (generateDutyBtn) {
            const newBtn = generateDutyBtn.cloneNode(true);
            generateDutyBtn.parentNode.replaceChild(newBtn, generateDutyBtn);
            
            newBtn.addEventListener('click', () => {
                const dutyCount = parseInt(document.getElementById('dutyCount').value);
                if (!dutyCount || dutyCount < 1) {
                    showToast('请输入有效的值日生人数', 'error');
                    return;
                }
                this.generateDutyRoster(dutyCount);
            });
        }
    }

    randomGroup(groupCount) {
        const students = studentManager.getAllStudents();
        if (students.length === 0) {
            showToast('当前没有学生数据', 'error');
            return;
        }

        if (groupCount > students.length) {
            showToast('分组数量不能大于学生总数', 'error');
            return;
        }

        // 检查学生是否已经在其他分组中
        const existingGroups = groupManager.groups;
        const studentsInGroups = new Set(
            existingGroups.flatMap(group => group.members)
        );

        // 过滤出未分组的学生
        const availableStudents = students.filter(student => 
            !studentsInGroups.has(student.id)
        );

        if (availableStudents.length === 0) {
            showToast('所有学生都已在分组中，请先清除旧分组', 'error');
            return;
        }

        if (groupCount > availableStudents.length) {
            showToast(`当前只有 ${availableStudents.length} 名未分组学生，不能分成 ${groupCount} 组`, 'error');
            return;
        }

        // 随机打乱未分组的学生数组
        const shuffledStudents = [...availableStudents].sort(() => Math.random() - 0.5);
        
        // 计算每组的基本人数和余数
        const baseSize = Math.floor(availableStudents.length / groupCount);
        const remainder = availableStudents.length % groupCount;

        // 创建分组
        let currentIndex = 0;
        const timestamp = new Date().toLocaleDateString();
        
        for (let i = 0; i < groupCount; i++) {
            // 当前组的大小（如果有余数，前面的组多分配一个人）
            const currentGroupSize = i < remainder ? baseSize + 1 : baseSize;
            
            // 获取当前组的学生
            const groupStudents = shuffledStudents.slice(currentIndex, currentIndex + currentGroupSize);
            currentIndex += currentGroupSize;

            // 创建新分组
            const groupName = `${timestamp}-第${i + 1}组`;
            const memberIds = groupStudents.map(student => student.id);
            
            // 调用分组管理器创建分组
            groupManager.createGroup({
                name: groupName,
                description: `${timestamp} 随机分配的第${i + 1}组，共${memberIds.length}人`,
                members: memberIds,
                createdAt: new Date().toISOString(),
                isRandomGroup: true
            });
        }

        // 切换到分组管理页面
        const navItem = document.querySelector('.nav-item[data-view="group-manage"]');
        if (navItem) {
            navItem.click();
        }
        
        showToast(`成功将 ${availableStudents.length} 名学生分成 ${groupCount} 组`, 'success');
    }

    randomPick(count) {
        const students = studentManager.getAllStudents();
        if (students.length === 0) {
            showToast('当前没有学生数据', 'error');
            return;
        }

        if (count > students.length) {
            showToast('选择人数不能大于学生总数', 'error');
            return;
        }

        // 随机选择学生
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);

        // 创建结果显示对话框
        const dialog = document.createElement('div');
        dialog.className = 'pick-result-dialog';
        dialog.innerHTML = `
            <div class="pick-result-content">
                <div class="pick-result-header">
                    <h3><i class="fas fa-random"></i> 随机点名结果</h3>
                    <button class="modal-close close-btn" title="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="selected-students">
                    ${selected.map((student, index) => `
                        <div class="selected-student" style="animation-delay: ${index * 0.1}s">
                            <div class="student-info">
                                <div class="student-avatar">
                                    <i class="fas fa-user-graduate"></i>
                                    <span class="student-number">#${index + 1}</span>
                                </div>
                                <div class="student-details">
                                    <span class="student-name">${student.name}</span>
                                    ${student.studentId ? `<small class="student-id">学号: ${student.studentId}</small>` : ''}
                                </div>
                            </div>
                            <div class="points-input">
                                <div class="points-control">
                                    <button class="btn btn-sm btn-outline points-btn minus" onclick="this.nextElementSibling.value = Math.max(0, parseInt(this.nextElementSibling.value) - 1)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input type="number" class="form-control points-value" 
                                        data-student-id="${student.id}" 
                                        value="5" min="0" max="100">
                                    <button class="btn btn-sm btn-outline points-btn plus" onclick="this.previousElementSibling.value = Math.min(100, parseInt(this.previousElementSibling.value) + 1)">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <span class="points-label">分</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-primary award-points">
                        <i class="fas fa-check"></i> 确认奖励
                    </button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .pick-result-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(4px);
            }
            .pick-result-dialog.show {
                opacity: 1;
            }
            .pick-result-content {
                background: var(--bg-color);
                border-radius: 16px;
                padding: 24px;
                min-width: 480px;
                max-width: 640px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            .pick-result-dialog.show .pick-result-content {
                transform: translateY(0);
            }
            .pick-result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border-color);
            }
            .pick-result-header h3 {
                font-size: 1.25rem;
                color: var(--text-color);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .selected-students {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 8px;
            }
            .selected-student {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: var(--card-bg);
                border-radius: 12px;
                border: 1px solid var(--border-color);
                opacity: 0;
                transform: translateX(-20px);
                animation: slideIn 0.5s ease forwards;
            }
            .student-info {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .student-avatar {
                width: 48px;
                height: 48px;
                background: var(--primary-color);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                position: relative;
            }
            .student-number {
                position: absolute;
                bottom: -6px;
                right: -6px;
                background: var(--bg-color);
                color: var(--primary-color);
                border: 2px solid var(--primary-color);
                border-radius: 12px;
                padding: 0 6px;
                font-size: 0.75rem;
                font-weight: bold;
            }
            .student-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .student-name {
                font-size: 1.1rem;
                font-weight: 500;
                color: var(--text-color);
            }
            .student-id {
                color: var(--text-light);
                font-size: 0.85rem;
            }
            .points-input {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .points-control {
                display: flex;
                align-items: center;
                gap: 4px;
                background: var(--bg-color);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 4px;
            }
            .points-btn {
                padding: 6px 8px;
                border: none;
                background: none;
                color: var(--text-color);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .points-btn:hover {
                color: var(--primary-color);
            }
            .points-value {
                width: 60px;
                text-align: center;
                border: none;
                font-size: 1rem;
                font-weight: 500;
                color: var(--text-color);
                background: transparent;
            }
            .points-value:focus {
                outline: none;
            }
            .points-label {
                color: var(--text-light);
                font-size: 0.9rem;
            }
            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
            }
            @keyframes slideIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .selected-students::-webkit-scrollbar {
                width: 6px;
            }
            .selected-students::-webkit-scrollbar-track {
                background: transparent;
            }
            .selected-students::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 3px;
            }
            .selected-students::-webkit-scrollbar-thumb:hover {
                background: var(--text-light);
            }
        `;
        document.head.appendChild(style);

        // 添加关闭按钮事件
        const closeBtn = dialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dialog.classList.remove('show');
            setTimeout(() => {
                dialog.remove();
                style.remove();
            }, 300);
        });

        // 添加奖励积分按钮事件
        const awardBtn = dialog.querySelector('.award-points');
        awardBtn.addEventListener('click', () => {
            const inputs = dialog.querySelectorAll('.points-value');
            let awarded = false;

            inputs.forEach(input => {
                const studentId = input.dataset.studentId;
                const points = parseInt(input.value);
                
                if (points && !isNaN(points)) {
                    pointsManager.addPointsRecord({
                        studentId: studentId,
                        points: points,
                        reason: '随机点名奖励',
                        note: '课堂表现优秀'
                    });
                    awarded = true;
                }
            });

            if (awarded) {
                showToast('积分奖励已发放', 'success');
                dialog.classList.remove('show');
                setTimeout(() => {
                    dialog.remove();
                    style.remove();
                }, 300);
            } else {
                showToast('请输入有效的积分数值', 'error');
            }
        });

        // 显示对话框
        document.body.appendChild(dialog);
        setTimeout(() => dialog.classList.add('show'), 10);
    }

    startTimer(minutes) {
        let seconds = minutes * 60;
        
        // 创建计时器显示
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'timer-display';
        timerDisplay.innerHTML = `
            <div class="timer-content">
                <div class="timer-circle">
                    <span class="timer-time"></span>
                    <span class="timer-label">剩余时间</span>
                    <button class="close-timer" title="关闭计时器">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(timerDisplay);

        // 添加拖拽功能
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.type === "mousedown") {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            } else {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            }

            if (e.target.closest('.timer-circle')) {
                isDragging = true;
            }
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "mousemove") {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                } else {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, timerDisplay);
            }
        };

        const dragEnd = () => {
            isDragging = false;
        };

        const setTranslate = (xPos, yPos, el) => {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        };

        // 添加事件监听器
        timerDisplay.addEventListener('mousedown', dragStart);
        timerDisplay.addEventListener('touchstart', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .timer-display {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                touch-action: none;
                user-select: none;
            }
            .timer-display.show {
                opacity: 1;
            }
            .timer-content {
                position: relative;
                width: 180px;
                height: 180px;
                cursor: move;
            }
            .timer-circle {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 6px solid var(--primary-color);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 8px;
                animation: pulse 2s infinite;
                background: var(--bg-color);
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .timer-circle::before {
                content: '';
                position: absolute;
                top: -8px;
                left: -8px;
                right: -8px;
                bottom: -8px;
                border-radius: 50%;
                background: linear-gradient(45deg, var(--primary-color), transparent);
                opacity: 0.1;
                z-index: -1;
            }
            .timer-time {
                font-size: 2.8rem;
                font-weight: bold;
                color: var(--text-color);
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .timer-label {
                font-size: 1rem;
                color: var(--text-light);
                font-weight: 500;
            }
            .close-timer {
                position: absolute;
                top: -10px;
                right: -10px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 0.8rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
            }
            .close-timer:hover {
                transform: scale(1.1);
                background: var(--danger-color);
            }
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4);
                }
                70% {
                    box-shadow: 0 0 0 15px rgba(52, 152, 219, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
                }
            }
            .timer-display.completed .timer-circle {
                border-color: var(--success-color);
                animation: none;
            }
            .timer-display.completed .timer-time {
                color: var(--success-color);
            }
            .timer-display.completed .timer-circle::before {
                background: linear-gradient(45deg, var(--success-color), transparent);
            }
            @media (max-width: 768px) {
                .timer-content {
                    width: 160px;
                    height: 160px;
                }
                .timer-time {
                    font-size: 2.5rem;
                }
            }
            @media (max-width: 480px) {
                .timer-content {
                    width: 140px;
                    height: 140px;
                }
                .timer-time {
                    font-size: 2.2rem;
                }
                .timer-label {
                    font-size: 0.9rem;
                }
            }
        `;
        document.head.appendChild(style);

        // 更新时间显示
        const updateDisplay = () => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
            timerDisplay.querySelector('.timer-time').textContent = timeStr;
        };

        // 开始计时
        updateDisplay();
        const timer = setInterval(() => {
            seconds--;
            updateDisplay();

            if (seconds <= 0) {
                clearInterval(timer);
                // 播放两声提示音
                const playBeep = () => {
                    const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1NOTQrHxELAwr/+33wa+Rw3HLUc9J21H7Xht6T6qr2xwgEGCgrKyRAQkk6RDU3MCsoIyEbGBcTDg0KBwQCAAD9/Pv6+ff29fX09PPy8vHw7+/u7e3s6+vq6eno5+fn5uXl5OPj4uLh4eHg39/f3t7d3d3c29vb2tra2djY19fX1tbW1dXU1NTT09PS0tLR0dDQ0M/Pz8/Ozs3NzczMzMvLy8rKycnJyMjIx8fGxsbFxcXExMPDw8LCwsHBwcDAwL+/vr6+vb29vLy8u7u6urq5ubm4uLi3t7e2trW1tbS0tLOzs7KysrGxsbCwsK+vr66urq2traysrKurq6qqqampqaioqKenp6ampqWlpaSkpKOjo6KioqGhoaCgoJ+fn56enp2dnZycnJubm5qampmZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fXx8fHt7e3p6enl5eXh4eHd3d3Z2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGNjY2JiYmFhYWBgYF9fX15eXl1dXVxcXFtbW1paWllZWVhYWFdXV1ZWVlVVVVRUVFNTU1JSUlFRUVBQUE9PT05OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozo6Ojk5OTg4ODc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC8vLy4uLi0tLSwsLCsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx4eHh0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEhERERAQEA8PDw4ODg0NDQwMDAsLCwoKCgkJCQgICAcHBwYGBgUFBQQEBAMDAwICAgEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
                    beep.play();
                };
                
                // 播放第一声
                playBeep();
                // 500毫秒后播放第二声
                setTimeout(playBeep, 500);
                
                // 添加完成动画
                timerDisplay.classList.add('completed');
                // 更新提示文本
                timerDisplay.querySelector('.timer-label').textContent = '计时结束';
            }
        }, 1000);

        // 绑定关闭按钮事件
        const closeBtn = timerDisplay.querySelector('.close-timer');
        closeBtn.addEventListener('click', () => {
            timerDisplay.classList.remove('show');
            setTimeout(() => {
                clearInterval(timer);
                timerDisplay.remove();
                style.remove();
            }, 300);
        });

        // 显示计时器
        setTimeout(() => timerDisplay.classList.add('show'), 10);
    }

    // 添加生成值日表方法
    generateDutyRoster(dutyCount) {
        const students = studentManager.getAllStudents();
        if (students.length === 0) {
            showToast('当前没有学生数据', 'error');
            return;
        }

        if (dutyCount > students.length) {
            showToast('值日生人数不能大于学生总数', 'error');
            return;
        }

        // 获取当前日期
        const today = new Date();
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        
        // 生成本周的值日表
        const dutyRoster = [];
        let currentStudentIndex = 0;

        // 为每天分配值日生
        for (let i = 0; i < 7; i++) {
            const dayStudents = [];
            for (let j = 0; j < dutyCount; j++) {
                dayStudents.push(students[currentStudentIndex % students.length]);
                currentStudentIndex++;
            }
            dutyRoster.push({
                day: weekDays[i],
                students: dayStudents
            });
        }

        // 创建值日表显示对话框
        const dialog = document.createElement('div');
        dialog.className = 'duty-roster-dialog';
        dialog.innerHTML = `
            <div class="duty-roster-content">
                <div class="duty-roster-header">
                    <h3><i class="fas fa-calendar-check"></i> 本周值日表</h3>
                    <button class="modal-close close-btn" title="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="duty-roster-body">
                    ${dutyRoster.map(day => `
                        <div class="duty-day">
                            <div class="day-header">
                                <span class="day-name">${day.day}</span>
                                <span class="student-count">${dutyCount}人</span>
                            </div>
                            <div class="duty-students">
                                ${day.students.map(student => `
                                    <div class="duty-student">
                                        <i class="fas fa-user"></i>
                                        <span>${student.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-primary" onclick="window.print()">
                        <i class="fas fa-print"></i> 打印值日表
                    </button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .duty-roster-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(4px);
            }
            .duty-roster-dialog.show {
                opacity: 1;
            }
            .duty-roster-content {
                background: var(--bg-color);
                border-radius: 16px;
                padding: 24px;
                width: 800px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .duty-roster-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border-color);
            }
            .duty-roster-header h3 {
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .duty-roster-body {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }
            .duty-day {
                background: var(--card-bg);
                border-radius: 12px;
                padding: 16px;
                border: 1px solid var(--border-color);
            }
            .day-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--border-color);
            }
            .day-name {
                font-weight: 500;
                color: var(--primary-color);
            }
            .student-count {
                font-size: 0.85rem;
                color: var(--text-light);
            }
            .duty-students {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .duty-student {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--bg-color);
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            .duty-student:hover {
                transform: translateX(4px);
                background: var(--primary-color);
                color: white;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                .duty-roster-content, .duty-roster-content * {
                    visibility: visible;
                }
                .duty-roster-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    box-shadow: none;
                }
                .dialog-footer {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        // 添加关闭按钮事件
        const closeBtn = dialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            dialog.classList.remove('show');
            setTimeout(() => {
                dialog.remove();
                style.remove();
            }, 300);
        });

        // 显示对话框
        document.body.appendChild(dialog);
        setTimeout(() => dialog.classList.add('show'), 10);
    }
}

// 创建全局实例
const toolkitManager = new ToolkitManager(); 