class Storage {
    constructor() {
        this.init();
    }

    init() {
        // 初始化存储
        if (!localStorage.getItem('students')) {
            localStorage.setItem('students', '[]');
        }
        if (!localStorage.getItem('pointsRecords')) {
            localStorage.setItem('pointsRecords', '[]');
        }
        if (!localStorage.getItem('groups')) {
            localStorage.setItem('groups', '[]');
        }
        if (!localStorage.getItem('rules')) {
            const defaultRules = [
                { id: '1', name: '课堂表现', points: 5 },
                { id: '2', name: '作业完成', points: 10 },
                { id: '3', name: '迟到', points: -5 },
                { id: '4', name: '缺勤', points: -10 }
            ];
            localStorage.setItem('rules', JSON.stringify(defaultRules));
        }
    }

    getRules() {
        return JSON.parse(localStorage.getItem('rules') || '[]');
    }

    getStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }

    getPointsRecords() {
        return JSON.parse(localStorage.getItem('pointsRecords') || '[]');
    }

    getGroups() {
        return JSON.parse(localStorage.getItem('groups') || '[]');
    }

    exportData() {
        return {
            students: this.getStudents(),
            pointsRecords: this.getPointsRecords(),
            groups: this.getGroups(),
            rules: this.getRules()
        };
    }

    importData(data) {
        if (data.students) localStorage.setItem('students', JSON.stringify(data.students));
        if (data.pointsRecords) localStorage.setItem('pointsRecords', JSON.stringify(data.pointsRecords));
        if (data.groups) localStorage.setItem('groups', JSON.stringify(data.groups));
        if (data.rules) localStorage.setItem('rules', JSON.stringify(data.rules));
    }
}

// 创建全局实例
const storage = new Storage();
