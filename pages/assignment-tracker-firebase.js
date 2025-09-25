// Assignment Tracker JavaScript with Firebase Integration

class AssignmentTrackerFirebase {
    constructor() {
        this.assignments = [];
        this.currentView = 'list';
        this.currentDate = new Date();
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        await this.setupEventListeners();
        await this.loadAssignments();
        this.updateStats();
        this.renderAssignments();
        this.setupNotifications();
    }

    showLoginRequired() {
        const container = document.querySelector('.main');
        if (container) {
            container.innerHTML = `
                <div class="login-required">
                    <div class="login-required-content">
                        <i class="fas fa-lock"></i>
                        <h2>Login Required</h2>
                        <p>Please login to access the Assignment Tracker</p>
                        <button class="btn btn-primary" onclick="window.location.href='../pages/auth.html'">
                            <i class="fas fa-sign-in-alt"></i>
                            Login Now
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async setupEventListeners() {
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

    // Load assignments from Firebase or localStorage
    async loadAssignments() {
        try {
            // Check if user is authenticated and Firebase is available
            if (window.utils && window.utils.isAuthenticated() && window.dbFunctions) {
                // Load from Firebase
                this.unsubscribe = window.dbFunctions.listenToCollection('assignments', (assignments) => {
                    this.assignments = assignments;
                    this.updateStats();
                    this.renderAssignments();
                }, window.currentUser?.uid);
            } else {
                // Load from localStorage
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            // Fallback to localStorage
            this.loadFromLocalStorage();
        }
    }

    // Load assignments from localStorage
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('assignments');
            this.assignments = stored ? JSON.parse(stored) : [];
            this.updateStats();
            this.renderAssignments();
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.assignments = [];
            this.updateStats();
            this.renderAssignments();
        }
    }

    // Save assignments to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('assignments', JSON.stringify(this.assignments));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Save assignment to Firebase
    async saveAssignment() {
        console.log('saveAssignment called');
        
        const form = document.getElementById('assignmentForm');
        console.log('Form element:', form);
        
        if (!form) {
            console.error('Assignment form not found');
            window.utils.showNotification('Form not found. Please refresh the page.', 'error');
            return;
        }
        
        if (!form.checkValidity()) {
            console.log('Form validation failed');
            form.reportValidity();
            return;
        }

        // Check authentication status for appropriate storage method
        const isAuthenticated = window.utils && window.utils.isAuthenticated();

        // Get form elements safely
        const getElementValue = (id) => {
            const element = document.getElementById(id);
            console.log(`Getting value for ${id}:`, element);
            return element ? (element.value || '') : '';
        };

        const assignmentData = {
            title: getElementValue('assignmentTitle').trim(),
            subject: getElementValue('assignmentSubject'),
            description: getElementValue('assignmentDescription').trim(),
            deadline: getElementValue('assignmentDeadline'),
            priority: getElementValue('assignmentPriority'),
            status: getElementValue('assignmentStatus'),
            grade: getElementValue('assignmentGrade') || null,
            notes: getElementValue('assignmentNotes').trim()
        };
        
        console.log('Assignment data:', assignmentData);

        try {
            if (isAuthenticated && window.dbFunctions) {
                // Save to Firebase
                const result = await window.dbFunctions.addDocument('assignments', assignmentData);
                
                if (result.success) {
                    window.utils.showNotification('Assignment saved successfully!', 'success');
                    
                    // Close modal and reset form
                    bootstrap.Modal.getInstance(document.getElementById('addAssignmentModal')).hide();
                    form.reset();
                    this.setCurrentDate();
                } else {
                    window.utils.showNotification('Error saving assignment: ' + result.error, 'error');
                }
            } else {
                // Save to localStorage
                assignmentData.id = Date.now().toString(); // Generate simple ID
                this.assignments.push(assignmentData);
                this.saveToLocalStorage();
                this.updateStats();
                this.renderAssignments();
                
                window.utils?.showNotification('Assignment saved locally!', 'success') || 
                alert('Assignment saved locally!');
                
                // Close modal and reset form
                bootstrap.Modal.getInstance(document.getElementById('addAssignmentModal')).hide();
                form.reset();
                this.setCurrentDate();
            }
        } catch (error) {
            console.error('Error saving assignment:', error);
            window.utils?.showNotification('Error saving assignment', 'error') || 
            alert('Error saving assignment');
        }
    }

    // Update assignment in Firebase
    async updateAssignment(assignmentId) {
        const form = document.getElementById('editAssignmentForm');
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        // Get form elements safely
        const getElementValue = (id) => {
            const element = document.getElementById(id);
            return element ? (element.value || '') : '';
        };

        const assignmentData = {
            title: getElementValue('editAssignmentTitle').trim(),
            subject: getElementValue('editAssignmentSubject'),
            description: getElementValue('editAssignmentDescription').trim(),
            deadline: getElementValue('editAssignmentDeadline'),
            priority: getElementValue('editAssignmentPriority'),
            status: getElementValue('editAssignmentStatus'),
            grade: getElementValue('editAssignmentGrade') || null,
            notes: getElementValue('editAssignmentNotes').trim()
        };

        try {
            const result = await window.dbFunctions.updateDocument('assignments', assignmentId, assignmentData);
            
            if (result.success) {
                window.utils.showNotification('Assignment updated successfully!', 'success');
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('editAssignmentModal')).hide();
            } else {
                window.utils.showNotification('Error updating assignment: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error updating assignment:', error);
            window.utils.showNotification('Error updating assignment', 'error');
        }
    }

    // Delete assignment from Firebase
    async deleteAssignment(assignmentId) {
        if (!confirm('Are you sure you want to delete this assignment?')) {
            return;
        }

        try {
            const result = await window.dbFunctions.deleteDocument('assignments', assignmentId);
            
            if (result.success) {
                window.utils.showNotification('Assignment deleted successfully!', 'success');
            } else {
                window.utils.showNotification('Error deleting assignment: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            window.utils.showNotification('Error deleting assignment', 'error');
        }
    }

    // Update assignment status
    async updateAssignmentStatus(assignmentId, newStatus) {
        try {
            const result = await window.dbFunctions.updateDocument('assignments', assignmentId, {
                status: newStatus
            });
            
            if (result.success) {
                window.utils.showNotification('Status updated successfully!', 'success');
            } else {
                window.utils.showNotification('Error updating status: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            window.utils.showNotification('Error updating status', 'error');
        }
    }

    // Statistics calculation
    updateStats() {
        console.log('updateStats called with assignments:', this.assignments.length);
        
        const total = this.assignments.length;
        const completed = this.assignments.filter(a => a.status === 'Completed' || a.status === 'Graded').length;
        const upcoming = this.assignments.filter(a => {
            const deadline = new Date(a.deadline);
            const now = new Date();
            const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return a.status !== 'Completed' && a.status !== 'Graded' && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
        }).length;

        console.log('Stats calculated:', { total, completed, upcoming });

        // Update stats elements (check if they exist first)
        const totalEl = document.getElementById('totalAssignments');
        const completedEl = document.getElementById('completedAssignments');
        const upcomingEl = document.getElementById('upcomingDeadlines');

        console.log('Stats elements found:', { totalEl, completedEl, upcomingEl });

        if (totalEl) {
            totalEl.textContent = total;
            console.log('Updated total assignments:', total);
        } else {
            console.warn('totalAssignments element not found');
        }
        
        if (completedEl) {
            completedEl.textContent = completed;
            console.log('Updated completed assignments:', completed);
        } else {
            console.warn('completedAssignments element not found');
        }
        
        if (upcomingEl) {
            upcomingEl.textContent = upcoming;
            console.log('Updated upcoming deadlines:', upcoming);
        } else {
            console.warn('upcomingDeadlines element not found');
        }
    }

    // Render assignments
    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        if (this.assignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Assignments Yet</h3>
                    <p>Create your first assignment to get started!</p>
                    <button class="btn btn-primary" onclick="assignmentTracker.showAddAssignmentModal()">
                        <i class="fas fa-plus"></i>
                        Add Assignment
                    </button>
                </div>
            `;
            return;
        }

        const filteredAssignments = this.filterAssignments();
        
        container.innerHTML = filteredAssignments.map(assignment => {
            const deadline = new Date(assignment.deadline);
            const isOverdue = deadline < new Date() && assignment.status !== 'Completed';
            const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="assignment-card ${assignment.priority.toLowerCase()} ${assignment.status.toLowerCase().replace(' ', '-')} ${isOverdue ? 'overdue' : ''}">
                    <div class="assignment-header">
                        <h4 class="assignment-title">${assignment.title}</h4>
                        <div class="assignment-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="assignmentTracker.editAssignment('${assignment.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="assignmentTracker.deleteAssignment('${assignment.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="assignment-meta">
                        <span class="subject-badge">${assignment.subject}</span>
                        <span class="priority-badge ${assignment.priority.toLowerCase()}">${assignment.priority}</span>
                        <span class="status-badge ${assignment.status.toLowerCase().replace(' ', '-')}">${assignment.status}</span>
                    </div>
                    
                    ${assignment.description ? `<p class="assignment-description">${assignment.description}</p>` : ''}
                    
                    <div class="assignment-footer">
                        <div class="deadline-info">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Due: ${deadline.toLocaleDateString()}</span>
                            ${isOverdue ? '<span class="overdue-text">Overdue!</span>' : ''}
                            ${!isOverdue && daysLeft <= 3 ? '<span class="urgent-text">Due Soon!</span>' : ''}
                        </div>
                        
                        <div class="status-controls">
                            <select class="form-select form-select-sm" onchange="assignmentTracker.updateAssignmentStatus('${assignment.id}', this.value)">
                                <option value="Not Started" ${assignment.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                <option value="In Progress" ${assignment.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Completed" ${assignment.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                    </div>
                    
                    ${assignment.notes ? `<div class="assignment-notes"><i class="fas fa-sticky-note"></i> ${assignment.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Filter assignments based on current filters
    filterAssignments() {
        let filtered = [...this.assignments];
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }
        
        // Subject filter
        const subjectFilter = document.getElementById('subjectFilter')?.value;
        if (subjectFilter && subjectFilter !== 'all') {
            filtered = filtered.filter(a => a.subject === subjectFilter);
        }
        
        // Priority filter
        const priorityFilter = document.getElementById('priorityFilter')?.value;
        if (priorityFilter && priorityFilter !== 'all') {
            filtered = filtered.filter(a => a.priority === priorityFilter);
        }
        
        // Search filter
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(searchTerm) ||
                a.description.toLowerCase().includes(searchTerm) ||
                a.subject.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort by deadline
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        
        return filtered;
    }

    // Show add assignment modal
    showAddAssignmentModal() {
        const modal = new bootstrap.Modal(document.getElementById('addAssignmentModal'));
        this.setCurrentDate();
        modal.show();
    }

    // Edit assignment
    editAssignment(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        // Helper function to set element value safely
        const setElementValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        };

        // Populate edit form
        setElementValue('editAssignmentTitle', assignment.title);
        setElementValue('editAssignmentSubject', assignment.subject);
        setElementValue('editAssignmentDescription', assignment.description);
        setElementValue('editAssignmentDeadline', assignment.deadline);
        setElementValue('editAssignmentPriority', assignment.priority);
        setElementValue('editAssignmentStatus', assignment.status);
        setElementValue('editAssignmentGrade', assignment.grade);
        setElementValue('editAssignmentNotes', assignment.notes);

        // Show modal
        const modalElement = document.getElementById('editAssignmentModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    // Set current date for forms
    setCurrentDate() {
        const today = new Date().toISOString().slice(0, 16);
        const deadlineInput = document.getElementById('assignmentDeadline');
        const editDeadlineInput = document.getElementById('editAssignmentDeadline');
        
        if (deadlineInput) deadlineInput.value = today;
        if (editDeadlineInput) editDeadlineInput.value = today;
    }

    // Auto-save form data
    autoSaveForm() {
        const getElementValue = (id) => {
            const element = document.getElementById(id);
            return element ? (element.value || '') : '';
        };

        const formData = {
            title: getElementValue('assignmentTitle'),
            subject: getElementValue('assignmentSubject'),
            description: getElementValue('assignmentDescription'),
            deadline: getElementValue('assignmentDeadline'),
            priority: getElementValue('assignmentPriority'),
            status: getElementValue('assignmentStatus'),
            grade: getElementValue('assignmentGrade'),
            notes: getElementValue('assignmentNotes')
        };
        
        localStorage.setItem('assignmentFormDraft', JSON.stringify(formData));
    }

    // Load form draft
    loadFormDraft() {
        const draft = localStorage.getItem('assignmentFormDraft');
        if (draft) {
            const formData = JSON.parse(draft);
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(`assignment${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (element) element.value = formData[key] || '';
            });
        }
    }

    // Setup notifications
    setupNotifications() {
        // Check for overdue assignments every minute
        setInterval(() => {
            this.checkOverdueAssignments();
        }, 60000);
    }

    // Check for overdue assignments
    checkOverdueAssignments() {
        const overdue = this.assignments.filter(a => {
            return a.status !== 'Completed' && new Date(a.deadline) < new Date();
        });

        if (overdue.length > 0) {
            // Show notification for overdue assignments
            window.utils.showNotification(`You have ${overdue.length} overdue assignment(s)`, 'warning');
        }
    }

    // Utility functions
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

    // Cleanup when page unloads
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Global functions
let assignmentTracker;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    assignmentTracker = new AssignmentTrackerFirebase();
});

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (assignmentTracker) {
        assignmentTracker.destroy();
    }
});

// Global functions for HTML onclick handlers
function saveAssignment() {
    assignmentTracker.saveAssignment();
}

function updateAssignment(assignmentId) {
    assignmentTracker.updateAssignment(assignmentId);
}

function deleteAssignment(assignmentId) {
    assignmentTracker.deleteAssignment(assignmentId);
}

function updateAssignmentStatus(assignmentId, newStatus) {
    assignmentTracker.updateAssignmentStatus(assignmentId, newStatus);
}

function showAddAssignmentModal() {
    assignmentTracker.showAddAssignmentModal();
}

function editAssignment(assignmentId) {
    assignmentTracker.editAssignment(assignmentId);
}

function filterAssignments() {
    assignmentTracker.renderAssignments();
}

function clearFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('subjectFilter').value = 'all';
    document.getElementById('priorityFilter').value = 'all';
    document.getElementById('searchInput').value = '';
    assignmentTracker.renderAssignments();
}

function exportAssignments() {
    if (assignmentTracker.assignments.length === 0) {
        window.utils.showNotification('No assignments to export', 'warning');
        return;
    }

    const dataStr = JSON.stringify(assignmentTracker.assignments, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assignments-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    window.utils.showNotification('Assignments exported successfully!', 'success');
}

function importAssignments() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const assignments = JSON.parse(e.target.result);
                    let imported = 0;
                    
                    for (const assignment of assignments) {
                        const result = await window.dbFunctions.addDocument('assignments', {
                            title: assignment.title,
                            subject: assignment.subject,
                            description: assignment.description,
                            deadline: assignment.deadline,
                            priority: assignment.priority,
                            status: assignment.status,
                            estimatedHours: assignment.estimatedHours,
                            notes: assignment.notes
                        });
                        
                        if (result.success) imported++;
                    }
                    
                    window.utils.showNotification(`Imported ${imported} assignments successfully!`, 'success');
                } catch (error) {
                    window.utils.showNotification('Error importing assignments', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

console.log('Assignment Tracker with Firebase loaded successfully!');
