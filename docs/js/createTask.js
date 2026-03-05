// Create Task Module
(function() {
    function init() {
        const createTaskBtn = document.getElementById('createTaskBtn');
        const createTaskModal = document.getElementById('createTaskModal');
        const createTaskForm = document.getElementById('createTaskForm');
        
        if (!createTaskBtn || !createTaskModal || !createTaskForm) {
            console.log('[CreateTask] Elements not found, skipping init');
            return;
        }
        
        // Open modal on button click
        createTaskBtn.addEventListener('click', () => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [CreateTask] Opening create task modal`);
            createTaskModal.classList.add('active');
        });
        
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
            const startTime = new Date().toISOString();
            console.log(`[${startTime}] [CreateTask] Form submitted`);
            
            e.preventDefault();
            
            // Get form data
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const budget = parseFloat(document.getElementById('taskBudget').value);
            const deadline = document.getElementById('taskDeadline').value;
            const skillsInput = document.getElementById('taskSkills').value.trim();
            
            console.log(`[${startTime}] [CreateTask] Form data:`, { 
                title, 
                descriptionLength: description.length, 
                budget, 
                deadline,
                skills: skillsInput
            });
            
            // Validation
            if (!title || !description) {
                window.utils.showToast('Заполните все обязательные поля', 'error');
                return;
            }
            
            if (budget <= 0) {
                window.utils.showToast('Бюджет должен быть больше нуля', 'error');
                return;
            }
            
            if (!deadline) {
                window.utils.showToast('Укажите срок выполнения', 'error');
                return;
            }
            
            // Parse skills
            const skills = skillsInput 
                ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [];
            
            // Prepare task data
            const taskData = {
                title,
                description,
                budget,
                deadline,
                skills
            };
            
            const submitBtn = createTaskForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Создание...';
            
            try {
                const apiCallTime = new Date().toISOString();
                console.log(`[${apiCallTime}] [CreateTask] Calling API createTask...`);
                
                const response = await window.api.createTask(taskData);
                
                const successTime = new Date().toISOString();
                console.log(`[${successTime}] [CreateTask] Task created successfully:`, response);
                
                window.utils.showToast('Задача успешно создана!', 'success');
                
                // Close modal and reset form
                createTaskModal.classList.remove('active');
                createTaskForm.reset();
                
                // Navigate to my tasks or task details
                if (response.data && response.data.taskId) {
                    window.router.navigate('my-tasks');
                } else {
                    window.router.navigate('my-tasks');
                }
            } catch (error) {
                const errorTime = new Date().toISOString();
                console.error(`[${errorTime}] [CreateTask] Error:`, error);
                window.utils.showToast(error.message || 'Ошибка при создании задачи', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Создать задачу';
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
