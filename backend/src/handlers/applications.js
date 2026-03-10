/**
 * Applications Handlers
 * Handle task applications
 */

const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const { ObjectId } = require('mongodb');

/**
 * Get user's applications
 * GET /applications/me
 */
async function getMyApplications(event) {
    try {
        const userId = event.requestContext?.authorizer?.userId;
        if (!userId) {
            return response.unauthorized('Authentication required');
        }
        console.log('[getMyApplications] User ID:', userId);

        // 1. Get from applications collection
        const standaloneApps = await mongoManager.find('applications', {
            worker_id: userId
        });

        // 2. Get from tasks embedded array (older applications)
        const tasksWithApps = await mongoManager.find('tasks', {
            'applications.worker_id': userId
        });

        // 3. Extract embedded apps
        const embeddedApps = [];
        tasksWithApps.forEach(task => {
            if (task.applications && Array.isArray(task.applications)) {
                task.applications.forEach(app => {
                    if (app.worker_id === userId) {
                        embeddedApps.push({
                            ...app,
                            task_id: task.task_id
                        });
                    }
                });
            }
        });

        // 4. Merge and deduplicate by application_id
        const allAppsMap = new Map();
        [...embeddedApps, ...standaloneApps].forEach(app => {
            if (app.application_id) {
                allAppsMap.set(app.application_id, app);
            } else {
                // If no application_id, use task_id + worker_id as key (for legacy apps)
                const fallbackKey = `${app.task_id || 'unknown'}_${app.worker_id || 'unknown'}`;
                if (!allAppsMap.has(fallbackKey)) {
                    allAppsMap.set(fallbackKey, app);
                }
            }
        });
        const applications = Array.from(allAppsMap.values());

        console.log('[getMyApplications] Found standalone apps:', standaloneApps.length);
        console.log('[getMyApplications] Found embedded apps:', embeddedApps.length);
        console.log('[getMyApplications] Total unique applications:', applications.length);

        // 5. Get task details and build plain objects (avoid BSON/serialization in Workers)
        const applicationsWithTasks = await Promise.all(
            applications.map(async (app) => {
                const task = await mongoManager.findOne('tasks', {
                    task_id: app.task_id
                });
                const appStatus = (task && task.status === 'MATCHED' && task.matched_user_id === app.worker_id)
                    ? 'ACCEPTED'
                    : (app.status ? String(app.status) : 'PENDING');
                const cleanApp = {
                    application_id: app.application_id ? String(app.application_id) : null,
                    worker_id: app.worker_id ? String(app.worker_id) : null,
                    task_id: app.task_id ? String(app.task_id) : null,
                    message: app.message != null ? String(app.message) : '',
                    status: appStatus,
                    created_at: app.created_at || null,
                    updated_at: app.updated_at || null
                };
                if (!task) {
                    return { ...cleanApp, task: null };
                }
                const cleanTask = {
                    task_id: task.task_id,
                    owner_id: task.owner_id,
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    tags: Array.isArray(task.tags) ? task.tags : [],
                    budget_estimate: task.budget_estimate,
                    deadline: task.deadline,
                    status: task.status,
                    matched_user_id: task.matched_user_id || null,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                    applications: Array.isArray(task.applications)
                        ? task.applications.map(a => ({
                            application_id: a.application_id ? String(a.application_id) : null,
                            worker_id: a.worker_id ? String(a.worker_id) : null,
                            task_id: a.task_id ? String(a.task_id) : null,
                            message: a.message != null ? String(a.message) : '',
                            status: (task.status === 'MATCHED' && task.matched_user_id === a.worker_id) ? 'ACCEPTED' : (a.status ? String(a.status) : 'PENDING'),
                            created_at: a.created_at || null,
                            updated_at: a.updated_at || null,
                            user: a.user && typeof a.user === 'object' ? {
                                fullName: a.user.fullName || null,
                                email: a.user.email || null,
                                avatar: a.user.avatar || null,
                                rating: a.user.rating != null ? Number(a.user.rating) : null,
                                completedTasks: a.user.completedTasks != null ? Number(a.user.completedTasks) : null
                            } : null
                        }))
                        : []
                };
                return { ...cleanApp, task: cleanTask };
            })
        );

        return response.success({
            applications: applicationsWithTasks
        });
    } catch (error) {
        console.error('[getMyApplications] Error:', error);
        return response.serverError('Failed to get applications', error.message);
    }
}

/**
 * Get applications for a task (task owner only)
 * GET /applications/task/:taskId
 */
async function getTaskApplications(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const taskId = event.pathParameters.taskId;

        console.log('[getTaskApplications] User ID:', userId, 'Task ID:', taskId);

        // Verify task ownership
        const task = await mongoManager.findOne('tasks', {
            task_id: taskId
        });

        if (!task) {
            return response.notFound('Task not found');
        }

        if (task.owner_id !== userId) {
            return response.forbidden('You do not have permission to view applications for this task');
        }

        // 1. Get all applications for this task from standalone collection
        const standaloneApps = await mongoManager.find('applications', {
            task_id: taskId
        });

        // 2. Get from task's embedded array
        const embeddedApps = task.applications || [];

        // 3. Merge and deduplicate
        const allAppsMap = new Map();
        [...embeddedApps, ...standaloneApps].forEach(app => {
            if (app.application_id) {
                allAppsMap.set(app.application_id, app);
            }
        });
        const applications = Array.from(allAppsMap.values());

        console.log('[getTaskApplications] Found applications:', applications.length);

        // Get user details for each application
        const applicationsWithUsers = await Promise.all(
            applications.map(async (app) => {
                const user = await mongoManager.findOne('users', {
                    user_id: app.worker_id
                });
                
                // Strip _id to prevent serialization issues
                const { _id: appId, ...cleanApp } = app;
                
                return {
                    ...cleanApp,
                    user: user ? {
                        email: user.email,
                        fullName: user.profile?.fullName || null,
                        avatar: user.profile?.avatar || null,
                        rating: user.profile?.rating || 0,
                        completedTasks: user.profile?.completedTasks || 0
                    } : null
                };
            })
        );

        return response.success({
            applications: applicationsWithUsers
        });
    } catch (error) {
        console.error('[getTaskApplications] Error:', error);
        return response.serverError('Failed to get task applications', error.message);
    }
}

/**
 * Update application status
 * PUT /applications/:id
 */
async function updateApplicationStatus(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const applicationId = event.pathParameters.id;
        const body = JSON.parse(event.body);

        console.log('[updateApplicationStatus] User ID:', userId, 'Application ID:', applicationId);

        if (!body.status) {
            return response.badRequest('Status is required');
        }

        // Get application
        const application = await mongoManager.findOne('applications', {
            application_id: applicationId
        });

        if (!application) {
            return response.notFound('Application not found');
        }

        // Get task to verify ownership
        const task = await mongoManager.findOne('tasks', {
            task_id: application.task_id
        });

        if (!task || task.owner_id !== userId) {
            return response.forbidden('You do not have permission to update this application');
        }

        // Update application
        const result = await mongoManager.updateOne(
            'applications',
            { application_id: applicationId },
            {
                $set: {
                    status: body.status,
                    updated_at: new Date().toISOString()
                }
            }
        );

        // If application is accepted, update task status to MATCHED
        if (body.status === 'ACCEPTED') {
            await mongoManager.updateOne(
                'tasks',
                { task_id: application.task_id },
                {
                    $set: {
                        matched_user_id: application.worker_id,
                        status: 'MATCHED',
                        updated_at: new Date().toISOString()
                    }
                }
            );
            
            // Also update in task's applications array
            await mongoManager.updateOne(
                'tasks',
                {
                    task_id: application.task_id,
                    'applications.worker_id': application.worker_id
                },
                {
                    $set: {
                        'applications.$.status': 'ACCEPTED',
                        'applications.$.updated_at': new Date().toISOString()
                    }
                }
            );
        }

        // Strip _id before returning
        const { _id, ...cleanApp } = result.document || {};

        return response.success({
            message: 'Application status updated',
            application: cleanApp
        });
    } catch (error) {
        console.error('[updateApplicationStatus] Error:', error);
        return response.serverError('Failed to update application status', error.message);
    }
}

/**
 * Update application message (worker only)
 * PUT /applications/:id/message
 */
async function updateApplicationMessage(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const applicationId = event.pathParameters.id;
        const body = JSON.parse(event.body);

        console.log('[updateApplicationMessage] User ID:', userId, 'Application ID:', applicationId);

        if (!body.message || typeof body.message !== 'string') {
            return response.badRequest('Message is required and must be a string');
        }

        const newMessage = body.message.trim();

        if (newMessage.length < 10) {
            return response.badRequest('Message must be at least 10 characters long');
        }

        // Get application
        const application = await mongoManager.findOne('applications', {
            application_id: applicationId
        });

        if (!application) {
            return response.notFound('Application not found');
        }

        // Verify ownership
        if (application.worker_id !== userId) {
            return response.forbidden('You do not have permission to update this application');
        }

        // Verify task status
        const task = await mongoManager.findOne('tasks', {
            task_id: application.task_id
        });

        if (!task || task.status !== 'OPEN') {
            return response.badRequest('Cannot update application for a closed or matched task');
        }

        const now = new Date().toISOString();

        // Update application collection
        const result = await mongoManager.updateOne(
            'applications',
            { application_id: applicationId },
            {
                $set: {
                    message: newMessage,
                    updated_at: now
                }
            }
        );

        // Update application inside task document array
        await mongoManager.updateOne(
            'tasks',
            { 
                task_id: application.task_id,
                'applications.application_id': applicationId
            },
            {
                $set: {
                    'applications.$.message': newMessage,
                    'applications.$.updated_at': now
                }
            }
        );

        // Strip _id before returning
        const { _id, ...cleanApp } = result.document || {};

        return response.success({
            message: 'Application message updated',
            application: cleanApp
        });
    } catch (error) {
        console.error('[updateApplicationMessage] Error:', error);
        return response.serverError('Failed to update application message', error.message);
    }
}

/**
 * Withdraw application (worker only)
 * DELETE /applications/:id
 */
async function deleteApplication(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const applicationId = event.pathParameters.id;

        console.log('[deleteApplication] User ID:', userId, 'Application ID:', applicationId);

        // 1. Try to find in the dedicated applications collection
        let application = await mongoManager.findOne('applications', {
            application_id: applicationId
        });

        // 2. Fallback: search in task.applications embedded array
        if (!application) {
            console.log('[deleteApplication] Not found in applications collection, searching in tasks...');
            const taskWithApp = await mongoManager.findOne('tasks', {
                'applications.application_id': applicationId
            });

            if (taskWithApp) {
                const embedded = (taskWithApp.applications || []).find(
                    a => a.application_id === applicationId
                );
                if (embedded) {
                    application = { ...embedded, task_id: taskWithApp.task_id };
                }
            }
        }

        if (!application) {
            return response.notFound('Application not found');
        }

        // Verify ownership
        if (application.worker_id !== userId) {
            return response.forbidden('You do not have permission to delete this application');
        }

        // Verify task status
        const task = await mongoManager.findOne('tasks', {
            task_id: application.task_id
        });

        if (task && task.status !== 'OPEN' && application.status === 'ACCEPTED') {
            return response.badRequest('Cannot withdraw an accepted application from a matched/closed task');
        }

        // Delete from applications collection (may already be absent)
        await mongoManager.deleteOne('applications', {
            application_id: applicationId
        });

        // Remove from task applications embedded array
        await mongoManager.updateOne(
            'tasks',
            { task_id: application.task_id },
            {
                $pull: {
                    applications: { application_id: applicationId }
                }
            }
        );

        return response.success({
            message: 'Application withdrawn successfully'
        });
    } catch (error) {
        console.error('[deleteApplication] Error:', error);
        return response.serverError('Failed to withdraw application', error.message);
    }
}


module.exports = {
    getMyApplications,
    getTaskApplications,
    updateApplicationStatus,
    updateApplicationMessage,
    deleteApplication
};
