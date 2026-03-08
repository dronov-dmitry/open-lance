/**
 * Task handlers
 * Using MongoDB Atlas for data storage
 */

const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

/**
 * Get all tasks (with optional filters)
 */
async function getTasks(event) {
    try {
        const queryParams = event.queryStringParameters || {};
        const { status, category, owner, search } = queryParams;

        let query = {};
        let options = {
            sort: { created_at: -1 }
        };

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by owner
        if (owner === 'me') {
            const userId = event.requestContext.authorizer.userId;
            query.owner_id = userId;
        }

        // Search in title, description, tags
        if (search) {
            query.$text = { $search: search };
            options.projection = { score: { $meta: 'textScore' } };
            options.sort = { score: { $meta: 'textScore' } };
        }

        // Get tasks from MongoDB
        const tasks = await mongoManager.find('tasks', query, options);

        // Fetch authors
        const ownerIds = [...new Set(tasks.map(t => t.owner_id))];
        if (ownerIds.length > 0) {
            const users = await mongoManager.find('users', { user_id: { $in: ownerIds } });
            const userMap = users.reduce((acc, u) => {
                acc[u.user_id] = { name: u.name, avatar_url: u.avatar_url };
                return acc;
            }, {});
            
            tasks.forEach(t => {
                t.author = userMap[t.owner_id] || { name: 'Неизвестный автор' };
            });
        }

        // Remove MongoDB _id field from response
        const cleanTasks = tasks.map(task => {
            const { _id, ...cleanTask } = task;
            return cleanTask;
        });

        return response.success(cleanTasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
        return response.serverError('Failed to get tasks', error.message);
    }
}

/**
 * Get single task by ID
 */
async function getTask(event) {
    try {
        const taskId = event.pathParameters.id || event.pathParameters.taskId;

        if (!validation.isValidUUID(taskId)) {
            return response.error('Invalid task ID');
        }

        // Get task from MongoDB
        const task = await mongoManager.findOne('tasks', { task_id: taskId });

        if (!task) {
            return response.notFound('Task not found');
        }

        // Fetch author
        if (task.owner_id) {
            const author = await mongoManager.findOne('users', { user_id: task.owner_id });
            if (author) {
                task.author = { name: author.name, avatar_url: author.avatar_url };
            } else {
                task.author = { name: 'Неизвестный автор' };
            }
        }

        // Deeply clone and remove _id to prevent MongoDB BSON error when serializing
        const cleanTask = JSON.parse(JSON.stringify(task));
        delete cleanTask._id;
        if (cleanTask.applications && Array.isArray(cleanTask.applications)) {
            cleanTask.applications.forEach(app => delete app._id);
        }

        return response.success(cleanTask);
    } catch (error) {
        console.error('Error getting task:', error);
        return response.serverError('Failed to get task', error.message);
    }
}

/**
 * Create new task
 */
async function createTask(event) {
    try {
        const body = JSON.parse(event.body);
        const taskData = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        // Validate task data
        const validationResult = validation.validateTask(taskData);
        if (!validationResult.valid) {
            return response.error('Validation failed', 400, validationResult.errors);
        }

        const now = new Date().toISOString();

        // Sanitize inputs
        const sanitizedTask = {
            task_id: uuidv4(),
            owner_id: userId,
            title: validation.sanitizeString(taskData.title, validation.MAX_TITLE_LENGTH),
            description: validation.sanitizeString(taskData.description, validation.MAX_DESCRIPTION_LENGTH),
            category: validation.sanitizeString(taskData.category, 100),
            tags: Array.isArray(taskData.tags) 
                ? taskData.tags.map(tag => validation.sanitizeString(tag, 50)).slice(0, validation.MAX_TAGS)
                : [],
            budget_estimate: parseFloat(taskData.budget_estimate),
            deadline: new Date(taskData.deadline).toISOString(),
            status: 'OPEN',
            matched_user_id: null,
            applications: [],
            created_at: now,
            updated_at: now
        };

        // Store task in MongoDB
        await mongoManager.insertOne('tasks', sanitizedTask);

        return response.success(sanitizedTask, 201);
    } catch (error) {
        console.error('Error creating task:', error);
        return response.serverError('Failed to create task', error.message);
    }
}

/**
 * Update task
 */
async function updateTask(event) {
    try {
        const taskId = event.pathParameters.taskId;
        const body = JSON.parse(event.body);
        const taskData = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(taskId)) {
            return response.error('Invalid task ID');
        }

        // Get existing task
        const existingTask = await mongoManager.findOne('tasks', { task_id: taskId });

        if (!existingTask) {
            return response.notFound('Task not found');
        }

        // Check ownership
        if (existingTask.owner_id !== userId) {
            return response.forbidden('You can only update your own tasks');
        }

        // Build update object
        const updates = {};
        const allowedFields = ['title', 'description', 'category', 'tags', 'budget_estimate', 'deadline'];
        
        for (const field of allowedFields) {
            if (taskData[field] !== undefined) {
                if (field === 'title' || field === 'description' || field === 'category') {
                    updates[field] = validation.sanitizeString(taskData[field]);
                } else if (field === 'tags' && Array.isArray(taskData[field])) {
                    updates[field] = taskData[field].map(tag => 
                        validation.sanitizeString(tag, 50)
                    ).slice(0, validation.MAX_TAGS);
                } else {
                    updates[field] = taskData[field];
                }
            }
        }

        // Always update updated_at
        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length === 1) { // Only updated_at
            return response.error('No fields to update');
        }

        // Update task in MongoDB
        const result = await mongoManager.updateOne(
            'tasks',
            { task_id: taskId },
            { $set: updates },
            { returnUpdatedDocument: true }
        );

        // Remove MongoDB _id field
        const { _id, ...cleanTask } = result.document;

        return response.success(cleanTask);
    } catch (error) {
        console.error('Error updating task:', error);
        return response.serverError('Failed to update task', error.message);
    }
}

/**
 * Delete task
 */
async function deleteTask(event) {
    try {
        const taskId = event.pathParameters.taskId;
        const userId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(taskId)) {
            return response.error('Invalid task ID');
        }

        // Get existing task
        const existingTask = await mongoManager.findOne('tasks', { task_id: taskId });

        if (!existingTask) {
            return response.notFound('Task not found');
        }

        const userRole = event.requestContext.authorizer.role;
        // Check ownership or admin role
        if (existingTask.owner_id !== userId && userRole !== 'ADMIN') {
            return response.forbidden('You can only delete your own tasks');
        }

        // Delete task from MongoDB
        await mongoManager.deleteOne('tasks', { task_id: taskId });

        // Also delete associated applications
        await mongoManager.db.collection('applications').deleteMany({ task_id: taskId });

        return response.success({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return response.serverError('Failed to delete task', error.message);
    }
}

/**
 * Apply to task (worker response)
 */
async function applyToTask(event) {
    try {
        const taskId = event.pathParameters.taskId || event.pathParameters.id;
        const body = JSON.parse(event.body);
        const { message } = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(taskId)) {
            return response.error('Invalid task ID');
        }

        if (!message || typeof message !== 'string') {
            return response.error('Application message is required');
        }

        // Get task
        const task = await mongoManager.findOne('tasks', { task_id: taskId });

        if (!task) {
            return response.notFound('Task not found');
        }

        if (task.status !== 'OPEN') {
            return response.error('Task is not open for applications');
        }

        if (task.owner_id === userId) {
            return response.error('You cannot apply to your own task');
        }

        // Create application
        const now = new Date().toISOString();
        const application = {
            application_id: uuidv4(),
            task_id: taskId,
            task_title: task.title,
            worker_id: userId,
            message: validation.sanitizeString(message, 1000),
            status: 'PENDING',
            created_at: now,
            updated_at: now
        };

        // Store application in separate collection
        await mongoManager.insertOne('applications', application);

        // Also add to task's applications array
        await mongoManager.updateOne(
            'tasks',
            { task_id: taskId },
            { $push: { applications: application } }
        );

        const { _id, ...cleanApp } = application;

        return response.success({ 
            message: 'Application submitted successfully',
            application: cleanApp
        }, 201);
    } catch (error) {
        console.error('Error applying to task:', error);
        return response.serverError('Failed to apply to task', error.message);
    }
}

/**
 * Match worker to task
 */
async function matchWorker(event) {
    try {
        const taskId = event.pathParameters.taskId;
        const body = JSON.parse(event.body);
        const { worker_id } = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(taskId) || !validation.isValidUUID(worker_id)) {
            return response.error('Invalid task or worker ID');
        }

        // Get task
        const task = await mongoManager.findOne('tasks', { task_id: taskId });

        if (!task) {
            return response.notFound('Task not found');
        }

        // Check ownership
        if (task.owner_id !== userId) {
            return response.forbidden('Only task owner can match workers');
        }

        if (task.status !== 'OPEN') {
            return response.error('Task is not open');
        }

        // Update task with matched worker
        const result = await mongoManager.updateOne(
            'tasks',
            { task_id: taskId },
            { 
                $set: { 
                    matched_user_id: worker_id,
                    status: 'MATCHED',
                    updated_at: new Date().toISOString()
                }
            },
            { returnUpdatedDocument: true }
        );

        // Remove MongoDB _id field
        const { _id, ...cleanTask } = result.document;

        return response.success(cleanTask);
    } catch (error) {
        console.error('Error matching worker:', error);
        return response.serverError('Failed to match worker', error.message);
    }
}

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    applyToTask,
    matchWorker
};
