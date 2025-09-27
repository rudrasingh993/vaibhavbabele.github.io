// Assignment Tracker JavaScript

class AssignmentTracker {
    constructor() {
        this.assignments = [];
        this.currentView = 'list';
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.loadAssignments();
        this.setupEventListeners();
        this.updateStats();
        this.renderAssignments();
        this.setupNotifications();
    }

    setupEventListeners() {
        // Set minimum date for deadline input to today
        const deadlineInput = document.getElementById('assignmentDeadline');
        const editDeadlineInput = document.getElementById('editAssignmentDeadline');
        const today = new Date().toISOString().slice(0, 16);
        
        if (deadlineInput) {
            deadlineInput.min = today;
        }
        if (editDeadlineInput) {
            editDeadlineInput.min = today;
        }

        // Auto-save on form changes
        document.getElementById('assignmentForm')?.addEventListener('input', this.debounce(() => {
            this.autoSaveForm();
        }, 1000));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        this.showAddAssignmentModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput')?.focus();
                        break;
                }
            }
        });
    }

    // Local Storage Management
    loadAssignments() {
        const saved = localStorage.getItem('nitra_assignments');
        if (saved) {
            try {
                this.assignments = JSON.parse(saved);
                // Convert date strings back to Date objects
                this.assignments.forEach(assignment => {
                    assignment.deadline = new Date(assignment.deadline);
                    assignment.createdAt = new Date(assignment.createdAt);
                    assignment.updatedAt = new Date(assignment.updatedAt);
                });
            } catch (e) {
                console.error('Error loading assignments:', e);
                this.assignments = [];
            }
        }
    }

    saveAssignments() {
        localStorage.setItem('nitra_assignments', JSON.stringify(this.assignments));
        this.updateStats();
    }

    // Assignment CRUD Operations
    addAssignment(assignmentData) {
        const assignment = {
            id: this.generateId(),
            title: assignmentData.title,
            subject: assignmentData.subject,
            description: assignmentData.description || '',
            deadline: new Date(assignmentData.deadline),
            priority: assignmentData.priority || 'Medium',
            status: assignmentData.status || 'Not Started',
            grade: assignmentData.grade || '',
            notes: assignmentData.notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.assignments.push(assignment);
        this.saveAssignments();
        this.renderAssignments();
        this.showNotification('Assignment added successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAssignmentModal'));
        modal?.hide();
        
        // Reset form
        document.getElementById('assignmentForm').reset();
    }

    updateAssignment(id, assignmentData) {
        const index = this.assignments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.assignments[index] = {
                ...this.assignments[index],
                ...assignmentData,
                deadline: new Date(assignmentData.deadline),
                updatedAt: new Date()
            };
            this.saveAssignments();
            this.renderAssignments();
            this.showNotification('Assignment updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAssignmentModal'));
            modal?.hide();
        }
    }

    deleteAssignment(id) {
        if (confirm('Are you sure you want to delete this assignment?')) {
            this.assignments = this.assignments.filter(a => a.id !== id);
            this.saveAssignments();
            this.renderAssignments();
            this.showNotification('Assignment deleted successfully!', 'info');
        }
    }

    // UI Rendering
    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        const filteredAssignments = this.getFilteredAssignments();

        if (filteredAssignments.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        // Sort assignments by deadline
        const sortedAssignments = filteredAssignments.sort((a, b) => a.deadline - b.deadline);

        container.innerHTML = sortedAssignments.map(assignment => 
            this.getAssignmentCardHTML(assignment)
        ).join('');

        // Add event listeners to action buttons
        this.setupAssignmentCardListeners();
    }

    getAssignmentCardHTML(assignment) {
        const daysUntilDeadline = this.getDaysUntilDeadline(assignment.deadline);
        const deadlineClass = this.getDeadlineClass(daysUntilDeadline);
        const progressPercentage = this.getProgressPercentage(assignment.status);
        const progressClass = this.getProgressClass(assignment.status);

        return `
            <div class="assignment-card ${assignment.priority.toLowerCase()}-priority fade-in" data-id="${assignment.id}">
                <div class="assignment-header-info">
                    <h3 class="assignment-title">${this.escapeHtml(assignment.title)}</h3>
                    <div class="assignment-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="assignmentTracker.editAssignment('${assignment.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="assignmentTracker.deleteAssignment('${assignment.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="assignment-meta">
                    <div class="meta-item">
                        <i class="fas fa-book"></i>
                        <span>${this.escapeHtml(assignment.subject)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-flag"></i>
                        <span class="status-badge status-${assignment.status.toLowerCase().replace(' ', '-')}">${assignment.status}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${assignment.priority} Priority</span>
                    </div>
                    ${assignment.grade ? `
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>Grade: ${this.escapeHtml(assignment.grade)}</span>
                    </div>
                    ` : ''}
                </div>

                ${assignment.description ? `
                <div class="assignment-description">
                    ${this.escapeHtml(assignment.description)}
                </div>
                ` : ''}

                <div class="assignment-progress">
                    <div class="progress">
                        <div class="progress-bar ${progressClass}" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>

                <div class="assignment-deadline ${deadlineClass}">
                    <i class="fas fa-clock"></i>
                    <span>Due: ${assignment.deadline.toLocaleDateString()} at ${assignment.deadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span class="ms-2">(${this.getDeadlineText(daysUntilDeadline)})</span>
                </div>

                ${assignment.notes ? `
                <div class="assignment-notes mt-2">
                    <small class="text-muted">
                        <i class="fas fa-sticky-note"></i> ${this.escapeHtml(assignment.notes)}
                    </small>
                </div>
                ` : ''}
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No assignments found</h3>
                <p>Start by adding your first assignment to track your academic workload.</p>
                <button class="btn btn-primary" onclick="assignmentTracker.showAddAssignmentModal()">
                    <i class="fas fa-plus"></i> Add Assignment
                </button>
            </div>
        `;
    }

    // Calendar View
    renderCalendar() {
        const container = document.getElementById('calendar');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === this.currentDate.getMonth();
            const isToday = currentDate.getTime() === today.getTime();
            const dayAssignments = this.getAssignmentsForDate(currentDate);

            calendarHTML += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    <div class="calendar-assignments">
                        ${dayAssignments.slice(0, 3).map(assignment => `
                            <div class="calendar-assignment ${assignment.priority.toLowerCase()}-priority" 
                                 onclick="assignmentTracker.editAssignment('${assignment.id}')"
                                 title="${this.escapeHtml(assignment.title)}">
                                ${this.escapeHtml(assignment.title.substring(0, 15))}${assignment.title.length > 15 ? '...' : ''}
                            </div>
                        `).join('')}
                        ${dayAssignments.length > 3 ? `
                            <div class="calendar-assignment" style="background: #6c757d;">
                                +${dayAssignments.length - 3} more
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = calendarHTML;
    }

    // Filtering and Search
    getFilteredAssignments() {
        let filtered = [...this.assignments];

        // Subject filter
        const subjectFilter = document.getElementById('subjectFilter')?.value;
        if (subjectFilter) {
            filtered = filtered.filter(a => a.subject === subjectFilter);
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter) {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        // Priority filter
        const priorityFilter = document.getElementById('priorityFilter')?.value;
        if (priorityFilter) {
            filtered = filtered.filter(a => a.priority === priorityFilter);
        }

        // Search filter
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(searchTerm) ||
                a.subject.toLowerCase().includes(searchTerm) ||
                a.description.toLowerCase().includes(searchTerm)
            );
        }

        return filtered;
    }

    filterAssignments() {
        this.renderAssignments();
    }

    // View Toggle
    toggleView(view) {
        this.currentView = view;
        
        if (view === 'list') {
            document.getElementById('assignmentsList').style.display = 'block';
            document.getElementById('calendarView').style.display = 'none';
        } else if (view === 'calendar') {
            document.getElementById('assignmentsList').style.display = 'none';
            document.getElementById('calendarView').style.display = 'block';
            this.renderCalendar();
        }
    }

    // Modal Management
    showAddAssignmentModal() {
        const modal = new bootstrap.Modal(document.getElementById('addAssignmentModal'));
        modal.show();
        
        // Set minimum date to today
        const deadlineInput = document.getElementById('assignmentDeadline');
        const today = new Date().toISOString().slice(0, 16);
        deadlineInput.min = today;
    }

    editAssignment(id) {
        const assignment = this.assignments.find(a => a.id === id);
        if (!assignment) return;

        // Populate edit form
        document.getElementById('editAssignmentId').value = assignment.id;
        document.getElementById('editAssignmentTitle').value = assignment.title;
        document.getElementById('editAssignmentSubject').value = assignment.subject;
        document.getElementById('editAssignmentDescription').value = assignment.description;
        document.getElementById('editAssignmentDeadline').value = assignment.deadline.toISOString().slice(0, 16);
        document.getElementById('editAssignmentPriority').value = assignment.priority;
        document.getElementById('editAssignmentStatus').value = assignment.status;
        document.getElementById('editAssignmentGrade').value = assignment.grade;
        document.getElementById('editAssignmentNotes').value = assignment.notes;

        const modal = new bootstrap.Modal(document.getElementById('editAssignmentModal'));
        modal.show();
    }

    // Form Handling
    saveAssignment() {
        const form = document.getElementById('assignmentForm');
        const formData = new FormData(form);
        
        const assignmentData = {
            title: document.getElementById('assignmentTitle').value.trim(),
            subject: document.getElementById('assignmentSubject').value,
            description: document.getElementById('assignmentDescription').value.trim(),
            deadline: document.getElementById('assignmentDeadline').value,
            priority: document.getElementById('assignmentPriority').value,
            status: document.getElementById('assignmentStatus').value,
            grade: document.getElementById('assignmentGrade').value.trim(),
            notes: document.getElementById('assignmentNotes').value.trim()
        };

        // Validation
        if (!assignmentData.title || !assignmentData.subject || !assignmentData.deadline) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.addAssignment(assignmentData);
    }

    updateAssignment() {
        const id = document.getElementById('editAssignmentId').value;
        const assignmentData = {
            title: document.getElementById('editAssignmentTitle').value.trim(),
            subject: document.getElementById('editAssignmentSubject').value,
            description: document.getElementById('editAssignmentDescription').value.trim(),
            deadline: document.getElementById('editAssignmentDeadline').value,
            priority: document.getElementById('editAssignmentPriority').value,
            status: document.getElementById('editAssignmentStatus').value,
            grade: document.getElementById('editAssignmentGrade').value.trim(),
            notes: document.getElementById('editAssignmentNotes').value.trim()
        };

        // Validation
        if (!assignmentData.title || !assignmentData.subject || !assignmentData.deadline) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.updateAssignment(id, assignmentData);
    }

    // Statistics
    updateStats() {
        const total = this.assignments.length;
        const upcoming = this.assignments.filter(a => {
            const days = this.getDaysUntilDeadline(a.deadline);
            return days >= 0 && days <= 7 && a.status !== 'Graded';
        }).length;
        const completed = this.assignments.filter(a => a.status === 'Graded').length;

        document.getElementById('totalAssignments').textContent = total;
        document.getElementById('upcomingDeadlines').textContent = upcoming;
        document.getElementById('completedAssignments').textContent = completed;
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getDaysUntilDeadline(deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    }

    getDeadlineClass(days) {
        if (days < 0) return 'deadline-overdue';
        if (days <= 1) return 'deadline-urgent';
        if (days <= 3) return 'deadline-warning';
        return 'deadline-safe';
    }

    getDeadlineText(days) {
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `${days} days left`;
    }

    getProgressPercentage(status) {
        switch (status) {
            case 'Not Started': return 0;
            case 'In Progress': return 50;
            case 'Submitted': return 90;
            case 'Graded': return 100;
            default: return 0;
        }
    }

    getProgressClass(status) {
        switch (status) {
            case 'Not Started': return 'bg-secondary';
            case 'In Progress': return 'bg-warning';
            case 'Submitted': return 'bg-info';
            case 'Graded': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getAssignmentsForDate(date) {
        return this.assignments.filter(assignment => {
            const assignmentDate = new Date(assignment.deadline);
            return assignmentDate.toDateString() === date.toDateString();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Calendar Navigation
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Export Functionality
    exportAssignments() {
        const data = this.assignments.map(assignment => ({
            Title: assignment.title,
            Subject: assignment.subject,
            Description: assignment.description,
            Deadline: assignment.deadline.toLocaleString(),
            Priority: assignment.priority,
            Status: assignment.status,
            Grade: assignment.grade,
            Notes: assignment.notes
        }));

        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, 'assignments.csv');
        this.showNotification('Assignments exported successfully!', 'success');
    }

    convertToCSV(data) {
        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Notifications
    setupNotifications() {
        // Check for upcoming deadlines every hour
        setInterval(() => {
            this.checkUpcomingDeadlines();
        }, 60 * 60 * 1000);

        // Initial check
        this.checkUpcomingDeadlines();
    }

    checkUpcomingDeadlines() {
        const upcoming = this.assignments.filter(assignment => {
            const days = this.getDaysUntilDeadline(assignment.deadline);
            return days >= 0 && days <= 1 && assignment.status !== 'Graded';
        });

        if (upcoming.length > 0) {
            this.showNotification(`You have ${upcoming.length} assignment(s) due soon!`, 'warning');
        }
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

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
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

    autoSaveForm() {
        // Auto-save form data to localStorage
        const formData = {
            title: document.getElementById('assignmentTitle')?.value || '',
            subject: document.getElementById('assignmentSubject')?.value || '',
            description: document.getElementById('assignmentDescription')?.value || '',
            deadline: document.getElementById('assignmentDeadline')?.value || '',
            priority: document.getElementById('assignmentPriority')?.value || '',
            status: document.getElementById('assignmentStatus')?.value || '',
            grade: document.getElementById('assignmentGrade')?.value || '',
            notes: document.getElementById('assignmentNotes')?.value || ''
        };
        localStorage.setItem('nitra_assignment_form_draft', JSON.stringify(formData));
    }

    loadFormDraft() {
        const draft = localStorage.getItem('nitra_assignment_form_draft');
        if (draft) {
            try {
                const formData = JSON.parse(draft);
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(`assignment${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (element) {
                        element.value = formData[key];
                    }
                });
            } catch (e) {
                console.error('Error loading form draft:', e);
            }
        }
    }

    clearFormDraft() {
        localStorage.removeItem('nitra_assignment_form_draft');
    }
}

// Global functions for HTML onclick handlers
function showAddAssignmentModal() {
    assignmentTracker.showAddAssignmentModal();
}

function toggleView(view) {
    assignmentTracker.toggleView(view);
}

function filterAssignments() {
    assignmentTracker.filterAssignments();
}

function saveAssignment() {
    assignmentTracker.saveAssignment();
}

function updateAssignment() {
    assignmentTracker.updateAssignment();
}

function deleteAssignment() {
    const id = document.getElementById('editAssignmentId').value;
    assignmentTracker.deleteAssignment(id);
}

function exportAssignments() {
    assignmentTracker.exportAssignments();
}

function previousMonth() {
    assignmentTracker.previousMonth();
}

function nextMonth() {
    assignmentTracker.nextMonth();
}

// Initialize the assignment tracker when the page loads
let assignmentTracker;
document.addEventListener('DOMContentLoaded', function() {
    assignmentTracker = new AssignmentTracker();
    
    // Load form draft if exists
    assignmentTracker.loadFormDraft();
    
    // Clear form draft when modal is hidden
    document.getElementById('addAssignmentModal').addEventListener('hidden.bs.modal', function() {
        assignmentTracker.clearFormDraft();
    });
});

// Handle page visibility change to refresh data
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && assignmentTracker) {
        assignmentTracker.updateStats();
        assignmentTracker.renderAssignments();
    }
});
