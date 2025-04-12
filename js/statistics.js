class StatisticsManager {
    constructor() {
        this.charts = {};
        this.currentTimeRange = 'all';
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            // 监听时间范围选择变化
            const timeRangeSelect = document.getElementById('statsTimeRange');
            if (timeRangeSelect) {
                timeRangeSelect.addEventListener('change', (e) => {
                    this.currentTimeRange = e.target.value;
                    this.updateStatistics();
                });
            }

            // 监听积分变化
            document.addEventListener('pointsUpdated', () => {
                this.updateStatistics();
            });

            // 监听学生数据变化
            document.addEventListener('studentsUpdated', () => {
                this.updateStatistics();
            });
        });
    }

    updateStatistics() {
        if (!document.getElementById('statsTimeRange')) return;
        
        this.updateSummaryCards();
        this.updateCharts();
        this.updateRankingTable();
    }

    getFilteredRecords() {
        const records = JSON.parse(localStorage.getItem('pointsRecords') || '[]');
        if (this.currentTimeRange === 'all') return records;

        const now = new Date();
        const startDate = new Date();

        switch (this.currentTimeRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }

        return records.filter(record => new Date(record.createdAt) >= startDate);
    }

    updateSummaryCards() {
        const students = studentManager.getAllStudents();
        const records = this.getFilteredRecords();
        
        // 更新总学生数
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) totalStudentsEl.textContent = students.length;
        
        // 更新总积分操作次数
        const totalOperationsEl = document.getElementById('totalOperations');
        if (totalOperationsEl) totalOperationsEl.textContent = records.length;
        
        // 计算平均分
        const totalPoints = students.reduce((sum, student) => {
            return sum + this.getStudentPoints(student.id);
        }, 0);
        const average = students.length ? (totalPoints / students.length).toFixed(1) : 0;
        const averagePointsEl = document.getElementById('averagePoints');
        if (averagePointsEl) averagePointsEl.textContent = average;

        // 触发数据更新事件
        document.dispatchEvent(new CustomEvent('statisticsUpdated'));
    }

    getStudentPoints(studentId) {
        const records = this.getFilteredRecords();
        return records
            .filter(record => record.studentId === studentId)
            .reduce((sum, record) => sum + record.points, 0);
    }

    updateCharts() {
        this.updatePointsDistributionChart();
        this.updatePointsTrendChart();
    }

    updatePointsDistributionChart() {
        const students = studentManager.getAllStudents();
        const pointsRanges = [
            { min: -Infinity, max: -20, label: '< -20' },
            { min: -20, max: -10, label: '-19 ~ -10' },
            { min: -10, max: 0, label: '-9 ~ 0' },
            { min: 0, max: 10, label: '1 ~ 10' },
            { min: 10, max: 20, label: '11 ~ 20' },
            { min: 20, max: Infinity, label: '> 20' }
        ];

        const distribution = pointsRanges.map(range => ({
            ...range,
            count: students.filter(student => {
                const points = this.getStudentPoints(student.id);
                return points > range.min && points <= range.max;
            }).length
        }));

        const ctx = document.getElementById('pointsDistributionChart');
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: distribution.map(d => d.label),
                datasets: [{
                    label: '学生人数',
                    data: distribution.map(d => d.count),
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '积分分布'
                    }
                }
            }
        });
    }

    updatePointsTrendChart() {
        const records = this.getFilteredRecords();
        const timeFormat = this.currentTimeRange === 'today' ? 'HH:00' : 'MM-DD';
        
        // 按日期分组
        const groupedData = records.reduce((acc, record) => {
            const date = new Date(record.createdAt);
            const key = this.currentTimeRange === 'today' 
                ? date.getHours()
                : `${date.getMonth() + 1}-${date.getDate()}`;
            
            if (!acc[key]) {
                acc[key] = {
                    positive: 0,
                    negative: 0
                };
            }
            
            if (record.points >= 0) {
                acc[key].positive += record.points;
            } else {
                acc[key].negative += Math.abs(record.points);
            }
            
            return acc;
        }, {});

        const labels = Object.keys(groupedData).sort();
        const positiveData = labels.map(key => groupedData[key].positive);
        const negativeData = labels.map(key => groupedData[key].negative);

        const ctx = document.getElementById('pointsTrendChart');
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '加分',
                        data: positiveData,
                        borderColor: 'rgba(46, 204, 113, 1)',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        fill: true
                    },
                    {
                        label: '扣分',
                        data: negativeData,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '积分趋势'
                    }
                }
            }
        });
    }

    updateRankingTable() {
        const students = studentManager.getAllStudents();
        const tbody = document.querySelector('#rankingTable tbody');
        if (!tbody) return;

        // 计算每个学生的积分统计
        const studentsStats = students.map(student => {
            const records = this.getFilteredRecords().filter(r => r.studentId === student.id);
            const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
            const positiveCount = records.filter(r => r.points > 0).length;
            const negativeCount = records.filter(r => r.points < 0).length;

            return {
                ...student,
                totalPoints,
                positiveCount,
                negativeCount
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        tbody.innerHTML = studentsStats.map((student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.studentId || '-'}</td>
                <td>
                    <span class="badge ${student.totalPoints >= 0 ? 'badge-primary' : 'badge-danger'}">
                        ${student.totalPoints}
                    </span>
                </td>
                <td>${student.positiveCount}</td>
                <td>${student.negativeCount}</td>
            </tr>
        `).join('');
    }
}

// 创建全局实例
const statisticsManager = new StatisticsManager(); 