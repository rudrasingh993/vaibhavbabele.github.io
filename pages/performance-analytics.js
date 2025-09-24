// Performance Analytics JavaScript

class PerformanceAnalytics {
    constructor() {
        this.grades = [];
        this.attendance = [];
        this.goals = [];
        this.studyTime = [];
        this.charts = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setCurrentDate();
        this.updateStats();
        this.renderCharts();
        this.renderGoals();
        this.renderGrades();
        this.generateInsights();
    }

    setupEventListeners() {
        // Set current date for forms
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('gradeDate').value = today;
        document.getElementById('attendanceDate').value = today;
        document.getElementById('goalDeadline').value = today;

        // Auto-save on form changes
        document.getElementById('gradeForm').addEventListener('input', this.debounce(() => {
            this.saveData();
        }, 1000));

        document.getElementById('attendanceForm').addEventListener('input', this.debounce(() => {
            this.saveData();
        }, 1000));

        document.getElementById('goalForm').addEventListener('input', this.debounce(() => {
            this.saveData();
        }, 1000));
    }

    setCurrentDate() {
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('gradeDate').value = today;
        document.getElementById('attendanceDate').value = today;
    }

    // Data Management
    loadData() {
        try {
            this.grades = JSON.parse(localStorage.getItem('performance_grades')) || [];
            this.attendance = JSON.parse(localStorage.getItem('performance_attendance')) || [];
            this.goals = JSON.parse(localStorage.getItem('performance_goals')) || [];
            this.studyTime = JSON.parse(localStorage.getItem('performance_study_time')) || [];
        } catch (error) {
            console.error('Error loading data:', error);
            this.grades = [];
            this.attendance = [];
            this.goals = [];
            this.studyTime = [];
        }
    }

    saveData() {
        try {
            localStorage.setItem('performance_grades', JSON.stringify(this.grades));
            localStorage.setItem('performance_attendance', JSON.stringify(this.attendance));
            localStorage.setItem('performance_goals', JSON.stringify(this.goals));
            localStorage.setItem('performance_study_time', JSON.stringify(this.studyTime));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    // Grade Management
    saveGrade() {
        const form = document.getElementById('gradeForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const grade = {
            id: Date.now().toString(),
            subject: document.getElementById('gradeSubject').value,
            type: document.getElementById('gradeType').value,
            title: document.getElementById('gradeTitle').value,
            value: document.getElementById('gradeValue').value,
            date: document.getElementById('gradeDate').value,
            maxMarks: document.getElementById('gradeMaxMarks').value || null,
            notes: document.getElementById('gradeNotes').value,
            createdAt: new Date().toISOString()
        };

        this.grades.unshift(grade);
        this.saveData();
        this.updateStats();
        this.renderCharts();
        this.renderGrades();
        this.generateInsights();

        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addGradeModal')).hide();
        form.reset();
        this.setCurrentDate();

        this.showNotification('Grade added successfully!', 'success');
    }

    deleteGrade(gradeId) {
        if (confirm('Are you sure you want to delete this grade?')) {
            this.grades = this.grades.filter(grade => grade.id !== gradeId);
            this.saveData();
            this.updateStats();
            this.renderCharts();
            this.renderGrades();
            this.generateInsights();
            this.showNotification('Grade deleted successfully!', 'success');
        }
    }

    // Attendance Management
    saveAttendance() {
        const form = document.getElementById('attendanceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const attendance = {
            id: Date.now().toString(),
            subject: document.getElementById('attendanceSubject').value,
            date: document.getElementById('attendanceDate').value,
            status: document.getElementById('attendanceStatus').value,
            notes: document.getElementById('attendanceNotes').value,
            createdAt: new Date().toISOString()
        };

        this.attendance.unshift(attendance);
        this.saveData();
        this.updateStats();
        this.renderCharts();
        this.generateInsights();

        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addAttendanceModal')).hide();
        form.reset();
        this.setCurrentDate();

        this.showNotification('Attendance updated successfully!', 'success');
    }

    // Goal Management
    saveGoal() {
        const form = document.getElementById('goalForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const goal = {
            id: Date.now().toString(),
            title: document.getElementById('goalTitle').value,
            subject: document.getElementById('goalSubject').value,
            target: document.getElementById('goalTarget').value,
            deadline: document.getElementById('goalDeadline').value,
            description: document.getElementById('goalDescription').value,
            progress: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        this.goals.unshift(goal);
        this.saveData();
        this.renderGoals();
        this.generateInsights();

        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addGoalModal')).hide();
        form.reset();
        this.setCurrentDate();

        this.showNotification('Goal added successfully!', 'success');
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.min(100, Math.max(0, progress));
            if (goal.progress >= 100) {
                goal.status = 'completed';
            }
            this.saveData();
            this.renderGoals();
            this.generateInsights();
        }
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(goal => goal.id !== goalId);
            this.saveData();
            this.renderGoals();
            this.generateInsights();
            this.showNotification('Goal deleted successfully!', 'success');
        }
    }

    // Statistics Calculation
    updateStats() {
        this.updateOverallGPA();
        this.updateBestSubject();
        this.updateImprovement();
        this.updateAttendance();
    }

    updateOverallGPA() {
        if (this.grades.length === 0) {
            document.getElementById('overallGPA').textContent = '0.00';
            return;
        }

        const numericGrades = this.grades.map(grade => this.parseGrade(grade.value)).filter(g => g !== null);
        if (numericGrades.length === 0) {
            document.getElementById('overallGPA').textContent = '0.00';
            return;
        }

        const average = numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;
        document.getElementById('overallGPA').textContent = average.toFixed(2);
    }

    updateBestSubject() {
        if (this.grades.length === 0) {
            document.getElementById('bestSubject').textContent = '-';
            return;
        }

        const subjectAverages = {};
        this.grades.forEach(grade => {
            const numericGrade = this.parseGrade(grade.value);
            if (numericGrade !== null) {
                if (!subjectAverages[grade.subject]) {
                    subjectAverages[grade.subject] = { sum: 0, count: 0 };
                }
                subjectAverages[grade.subject].sum += numericGrade;
                subjectAverages[grade.subject].count += 1;
            }
        });

        let bestSubject = '-';
        let bestAverage = 0;

        Object.keys(subjectAverages).forEach(subject => {
            const average = subjectAverages[subject].sum / subjectAverages[subject].count;
            if (average > bestAverage) {
                bestAverage = average;
                bestSubject = subject;
            }
        });

        document.getElementById('bestSubject').textContent = bestSubject;
    }

    updateImprovement() {
        if (this.grades.length < 2) {
            document.getElementById('improvement').textContent = '0%';
            return;
        }

        const sortedGrades = this.grades
            .map(grade => ({ ...grade, numericGrade: this.parseGrade(grade.value) }))
            .filter(grade => grade.numericGrade !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (sortedGrades.length < 2) {
            document.getElementById('improvement').textContent = '0%';
            return;
        }

        const firstHalf = sortedGrades.slice(0, Math.floor(sortedGrades.length / 2));
        const secondHalf = sortedGrades.slice(Math.floor(sortedGrades.length / 2));

        const firstAverage = firstHalf.reduce((sum, grade) => sum + grade.numericGrade, 0) / firstHalf.length;
        const secondAverage = secondHalf.reduce((sum, grade) => sum + grade.numericGrade, 0) / secondHalf.length;

        const improvement = ((secondAverage - firstAverage) / firstAverage) * 100;
        document.getElementById('improvement').textContent = `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`;
    }

    updateAttendance() {
        if (this.attendance.length === 0) {
            document.getElementById('attendance').textContent = '0%';
            return;
        }

        const presentCount = this.attendance.filter(a => a.status === 'Present').length;
        const totalCount = this.attendance.length;
        const attendancePercentage = (presentCount / totalCount) * 100;

        document.getElementById('attendance').textContent = `${attendancePercentage.toFixed(1)}%`;
    }

    parseGrade(gradeValue) {
        if (!gradeValue) return null;

        // Handle percentage grades (e.g., "85%", "85")
        const percentageMatch = gradeValue.match(/(\d+(?:\.\d+)?)/);
        if (percentageMatch) {
            const value = parseFloat(percentageMatch[1]);
            if (value >= 0 && value <= 100) {
                return value;
            }
        }

        // Handle letter grades
        const letterGrades = {
            'A+': 95, 'A': 90, 'A-': 85,
            'B+': 80, 'B': 75, 'B-': 70,
            'C+': 65, 'C': 60, 'C-': 55,
            'D+': 50, 'D': 45, 'D-': 40,
            'F': 0
        };

        const upperGrade = gradeValue.toUpperCase().trim();
        if (letterGrades[upperGrade] !== undefined) {
            return letterGrades[upperGrade];
        }

        // Handle GPA scale (0-4 or 0-10)
        const gpaMatch = gradeValue.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
        if (gpaMatch) {
            const obtained = parseFloat(gpaMatch[1]);
            const total = parseFloat(gpaMatch[2]);
            if (total > 0) {
                return (obtained / total) * 100;
            }
        }

        return null;
    }

    // Chart Rendering
    renderCharts() {
        this.renderTrendsChart();
        this.renderSubjectChart();
        this.renderAttendanceChart();
        this.renderStudyTimeChart();
    }

    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart').getContext('2d');
        
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const period = document.getElementById('trendPeriod').value;
        const filteredGrades = this.filterGradesByPeriod(period);

        if (filteredGrades.length === 0) {
            this.showEmptyChart(ctx, 'No grade data available');
            return;
        }

        const labels = filteredGrades.map(grade => {
            const date = new Date(grade.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const data = filteredGrades.map(grade => this.parseGrade(grade.value)).filter(g => g !== null);

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Grade Trend',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderSubjectChart() {
        const ctx = document.getElementById('subjectChart').getContext('2d');
        
        if (this.charts.subject) {
            this.charts.subject.destroy();
        }

        if (this.grades.length === 0) {
            this.showEmptyChart(ctx, 'No subject data available');
            return;
        }

        const subjectAverages = {};
        this.grades.forEach(grade => {
            const numericGrade = this.parseGrade(grade.value);
            if (numericGrade !== null) {
                if (!subjectAverages[grade.subject]) {
                    subjectAverages[grade.subject] = { sum: 0, count: 0 };
                }
                subjectAverages[grade.subject].sum += numericGrade;
                subjectAverages[grade.subject].count += 1;
            }
        });

        const labels = Object.keys(subjectAverages);
        const data = labels.map(subject => {
            const avg = subjectAverages[subject].sum / subjectAverages[subject].count;
            return avg;
        });

        const colors = [
            '#667eea', '#764ba2', '#28a745', '#ffc107', 
            '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'
        ];

        this.charts.subject = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    renderAttendanceChart() {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        
        if (this.charts.attendance) {
            this.charts.attendance.destroy();
        }

        if (this.attendance.length === 0) {
            this.showEmptyChart(ctx, 'No attendance data available');
            return;
        }

        const last30Days = this.attendance.filter(a => {
            const date = new Date(a.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date >= thirtyDaysAgo;
        });

        const dailyAttendance = {};
        last30Days.forEach(record => {
            if (!dailyAttendance[record.date]) {
                dailyAttendance[record.date] = { present: 0, total: 0 };
            }
            dailyAttendance[record.date].total += 1;
            if (record.status === 'Present') {
                dailyAttendance[record.date].present += 1;
            }
        });

        const labels = Object.keys(dailyAttendance).sort();
        const data = labels.map(date => {
            const day = dailyAttendance[date];
            return day.total > 0 ? (day.present / day.total) * 100 : 0;
        });

        this.charts.attendance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Attendance %',
                    data: data,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderStudyTimeChart() {
        const ctx = document.getElementById('studyTimeChart').getContext('2d');
        
        if (this.charts.studyTime) {
            this.charts.studyTime.destroy();
        }

        // Generate sample study time data if none exists
        if (this.studyTime.length === 0) {
            this.generateSampleStudyTime();
        }

        const last7Days = this.studyTime.slice(-7);
        const labels = last7Days.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        const data = last7Days.map(day => day.hours);

        this.charts.studyTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Study Hours',
                    data: data,
                    backgroundColor: 'rgba(23, 162, 184, 0.8)',
                    borderColor: '#17a2b8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    generateSampleStudyTime() {
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            this.studyTime.push({
                date: date.toISOString().slice(0, 10),
                hours: Math.floor(Math.random() * 8) + 2,
                subjects: subjects.slice(0, Math.floor(Math.random() * 3) + 2)
            });
        }
        
        this.saveData();
    }

    showEmptyChart(ctx, message) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }

    filterGradesByPeriod(period) {
        const now = new Date();
        const cutoff = new Date();

        switch (period) {
            case '1month':
                cutoff.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                cutoff.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                cutoff.setMonth(now.getMonth() - 6);
                break;
            default:
                return this.grades;
        }

        return this.grades.filter(grade => new Date(grade.date) >= cutoff);
    }

    // Goals Rendering
    renderGoals() {
        const goalsList = document.getElementById('goalsList');
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-target"></i>
                    <h3>No Goals Set</h3>
                    <p>Set your first academic goal to start tracking your progress!</p>
                    <button class="btn btn-primary" onclick="showGoalModal()">
                        <i class="fas fa-plus"></i> Add Goal
                    </button>
                </div>
            `;
            return;
        }

        goalsList.innerHTML = this.goals.map(goal => {
            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status !== 'completed';
            const statusClass = goal.status === 'completed' ? 'completed' : (isOverdue ? 'overdue' : '');
            
            return `
                <div class="goal-item ${statusClass}">
                    <div class="goal-header">
                        <h6 class="goal-title">${goal.title}</h6>
                        <div class="goal-progress">
                            <span>${goal.progress}%</span>
                            <div class="progress" style="width: 100px;">
                                <div class="progress-bar ${this.getProgressBarClass(goal.progress)}" 
                                     style="width: ${goal.progress}%"></div>
                            </div>
                        </div>
                    </div>
                    ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                    <div class="goal-meta">
                        <div class="goal-deadline">
                            <i class="fas fa-calendar"></i>
                            <span>${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                        <div class="goal-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="updateGoalProgress('${goal.id}', ${Math.min(100, goal.progress + 10)})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteGoal('${goal.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getProgressBarClass(progress) {
        if (progress >= 80) return 'bg-success';
        if (progress >= 60) return 'bg-info';
        if (progress >= 40) return 'bg-warning';
        return 'bg-danger';
    }

    // Grades Rendering
    renderGrades() {
        const tbody = document.getElementById('gradesTableBody');
        
        if (this.grades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="empty-state py-4">
                            <i class="fas fa-graduation-cap"></i>
                            <h5>No Grades Added</h5>
                            <p>Add your first grade to start tracking your performance!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.grades.map(grade => {
            const numericGrade = this.parseGrade(grade.value);
            const gradeClass = this.getGradeClass(numericGrade);
            
            return `
                <tr>
                    <td><strong>${grade.subject}</strong></td>
                    <td>${grade.title}</td>
                    <td>
                        <span class="grade-badge ${gradeClass}">${grade.value}</span>
                    </td>
                    <td>${new Date(grade.date).toLocaleDateString()}</td>
                    <td>
                        <div class="grade-actions">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteGrade('${grade.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getGradeClass(numericGrade) {
        if (numericGrade >= 90) return 'grade-excellent';
        if (numericGrade >= 80) return 'grade-good';
        if (numericGrade >= 70) return 'grade-average';
        return 'grade-poor';
    }

    filterGrades() {
        const subjectFilter = document.getElementById('subjectFilter').value;
        const tbody = document.getElementById('gradesTableBody');
        
        let filteredGrades = this.grades;
        if (subjectFilter) {
            filteredGrades = this.grades.filter(grade => grade.subject === subjectFilter);
        }

        if (filteredGrades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="empty-state py-4">
                            <i class="fas fa-search"></i>
                            <h5>No Grades Found</h5>
                            <p>No grades match the selected filter.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredGrades.map(grade => {
            const numericGrade = this.parseGrade(grade.value);
            const gradeClass = this.getGradeClass(numericGrade);
            
            return `
                <tr>
                    <td><strong>${grade.subject}</strong></td>
                    <td>${grade.title}</td>
                    <td>
                        <span class="grade-badge ${gradeClass}">${grade.value}</span>
                    </td>
                    <td>${new Date(grade.date).toLocaleDateString()}</td>
                    <td>
                        <div class="grade-actions">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteGrade('${grade.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Insights Generation
    generateInsights() {
        const insightsList = document.getElementById('insightsList');
        const insights = [];

        // Grade-based insights
        if (this.grades.length > 0) {
            const numericGrades = this.grades.map(grade => this.parseGrade(grade.value)).filter(g => g !== null);
            const average = numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;

            if (average >= 85) {
                insights.push({
                    type: 'positive',
                    title: 'Excellent Performance!',
                    description: `Your average grade of ${average.toFixed(1)}% is outstanding. Keep up the great work!`
                });
            } else if (average >= 75) {
                insights.push({
                    type: 'positive',
                    title: 'Good Performance',
                    description: `Your average grade of ${average.toFixed(1)}% shows solid academic progress.`
                });
            } else if (average < 60) {
                insights.push({
                    type: 'negative',
                    title: 'Needs Improvement',
                    description: `Your average grade of ${average.toFixed(1)}% suggests you might need to focus more on your studies.`
                });
            }

            // Subject performance insights
            const subjectAverages = {};
            this.grades.forEach(grade => {
                const numericGrade = this.parseGrade(grade.value);
                if (numericGrade !== null) {
                    if (!subjectAverages[grade.subject]) {
                        subjectAverages[grade.subject] = { sum: 0, count: 0 };
                    }
                    subjectAverages[grade.subject].sum += numericGrade;
                    subjectAverages[grade.subject].count += 1;
                }
            });

            Object.keys(subjectAverages).forEach(subject => {
                const avg = subjectAverages[subject].sum / subjectAverages[subject].count;
                if (avg < 60) {
                    insights.push({
                        type: 'warning',
                        title: `${subject} Needs Attention`,
                        description: `Your ${subject} average is ${avg.toFixed(1)}%. Consider spending more time on this subject.`
                    });
                }
            });
        }

        // Attendance insights
        if (this.attendance.length > 0) {
            const presentCount = this.attendance.filter(a => a.status === 'Present').length;
            const attendancePercentage = (presentCount / this.attendance.length) * 100;

            if (attendancePercentage < 75) {
                insights.push({
                    type: 'warning',
                    title: 'Low Attendance',
                    description: `Your attendance is ${attendancePercentage.toFixed(1)}%. Regular attendance is crucial for academic success.`
                });
            } else if (attendancePercentage >= 90) {
                insights.push({
                    type: 'positive',
                    title: 'Excellent Attendance',
                    description: `Your attendance of ${attendancePercentage.toFixed(1)}% shows great commitment to your studies.`
                });
            }
        }

        // Goal insights
        const activeGoals = this.goals.filter(goal => goal.status === 'active');
        const overdueGoals = activeGoals.filter(goal => goal.deadline && new Date(goal.deadline) < new Date());

        if (overdueGoals.length > 0) {
            insights.push({
                type: 'negative',
                title: 'Overdue Goals',
                description: `You have ${overdueGoals.length} overdue goal(s). Consider revising your timeline or priorities.`
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'positive',
                title: 'Keep Going!',
                description: 'Continue adding grades and attendance data to get personalized insights.'
            });
        }

        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <h6 class="insight-title">${insight.title}</h6>
                <p class="insight-description">${insight.description}</p>
            </div>
        `).join('');
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Data Export/Import
    exportData() {
        const data = {
            grades: this.grades,
            attendance: this.attendance,
            goals: this.goals,
            studyTime: this.studyTime,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (confirm('This will replace all your current data. Are you sure?')) {
                            this.grades = data.grades || [];
                            this.attendance = data.attendance || [];
                            this.goals = data.goals || [];
                            this.studyTime = data.studyTime || [];
                            this.saveData();
                            this.updateStats();
                            this.renderCharts();
                            this.renderGoals();
                            this.renderGrades();
                            this.generateInsights();
                            this.showNotification('Data imported successfully!', 'success');
                        }
                    } catch (error) {
                        this.showNotification('Invalid file format!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// Global Functions
let performanceAnalytics;

function showAddGradeModal() {
    const modal = new bootstrap.Modal(document.getElementById('addGradeModal'));
    modal.show();
}

function showAddAttendanceModal() {
    const modal = new bootstrap.Modal(document.getElementById('addAttendanceModal'));
    modal.show();
}

function showGoalModal() {
    const modal = new bootstrap.Modal(document.getElementById('addGoalModal'));
    modal.show();
}

function saveGrade() {
    performanceAnalytics.saveGrade();
}

function saveAttendance() {
    performanceAnalytics.saveAttendance();
}

function saveGoal() {
    performanceAnalytics.saveGoal();
}

function deleteGrade(gradeId) {
    performanceAnalytics.deleteGrade(gradeId);
}

function deleteGoal(goalId) {
    performanceAnalytics.deleteGoal(goalId);
}

function updateGoalProgress(goalId, progress) {
    performanceAnalytics.updateGoalProgress(goalId, progress);
}

function filterGrades() {
    performanceAnalytics.filterGrades();
}

function updateTrendsChart() {
    performanceAnalytics.renderTrendsChart();
}

function exportData() {
    performanceAnalytics.exportData();
}

function importData() {
    performanceAnalytics.importData();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    performanceAnalytics = new PerformanceAnalytics();
});
