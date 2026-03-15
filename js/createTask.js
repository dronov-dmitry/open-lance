// Create Task Module
(function() {
    function init() {
        const createTaskBtn = document.getElementById('createTaskBtn');
        const createTaskModal = document.getElementById('createTaskModal');
        const createTaskForm = document.getElementById('createTaskForm');
        
        if (!createTaskModal || !createTaskForm) {
            console.log('[CreateTask] Elements not found, skipping init');
            return;
        }

        // Set minimum date for deadline to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const taskDeadlineInput = document.getElementById('taskDeadline');
        if (taskDeadlineInput) {
            taskDeadlineInput.min = tomorrow.toISOString().split('T')[0];
        }
        
        // Open modal on old header button click if it exists
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] [CreateTask] Opening create task modal`);
                createTaskModal.classList.add('active');
            });
        }
        
        // Close modal on X click
        const closeBtn = createTaskModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                createTaskModal.classList.remove('active');
            });
        }
        
        // Close modal on outside click
        createTaskModal.addEventListener('click', (e) => {
            if (e.target === createTaskModal) {
                createTaskModal.classList.remove('active');
            }
        });
        
        // Handle form submission
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const budget = parseFloat(document.getElementById('taskBudget').value);
            const deadline = document.getElementById('taskDeadline').value;
            const skillsInput = document.getElementById('taskSkills').value.trim();
            if (!title || !description) {
                window.utils.showToast(tr('createTask.fillRequired'), 'error');
                return;
            }
            if (budget <= 0) {
                window.utils.showToast(tr('createTask.budgetPositive'), 'error');
                return;
            }
            if (!deadline) {
                window.utils.showToast(tr('createTask.setDeadline'), 'error');
                return;
            }
            
            // Parse skills
            const skills = skillsInput 
                ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [];
            
            // Prepare task data (backend expects category and budget_estimate)
            const taskData = {
                title,
                description,
                category: 'Development', // default category since there is no UI input for it yet
                budget_estimate: budget,
                deadline,
                skills
            };
            
            const submitBtn = createTaskForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '...';
            try {
                const response = await window.api.createTask(taskData);
                window.utils.showToast(tr('createTask.created'), 'success');
                localStorage.removeItem('my-tasks-cache');
                localStorage.removeItem('my-tasks-cache-time');
                createTaskModal.classList.remove('active');
                createTaskForm.reset();
                window.router.navigate('my-tasks');
            } catch (error) {
                console.error('[CreateTask] Error:', error);
                window.utils.showToast(error.message || tr('createTask.createError'), 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = tr('createTask.title');
            }
        });
        
        console.log('[CreateTask] Module initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
