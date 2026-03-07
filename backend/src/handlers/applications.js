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
        const userId = event.requestContext.authorizer.userId;
        console.log('[getMyApplications] User ID:', userId);

        // Get all applications for this user
        const applications = await mongoManager.find('applications', {
            worker_id: userId
        });

        console.log('[getMyApplications] Found applications:', applications.length);

        // Get task details for each application
        const applicationsWithTasks = await Promise.all(
            applications.map(async (app) => {
                const task = await mongoManager.findOne('tasks', {
                    task_id: app.task_id
                });
                
                return {
                    ...app,
                    task: task || null
                };
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

        // Get all applications for this task
        const applications = await mongoManager.find('applications', {
            task_id: taskId
        });

        console.log('[getTaskApplications] Found applications:', applications.length);

        // Get user details for each application
        const applicationsWithUsers = await Promise.all(
            applications.map(async (app) => {
                const user = await mongoManager.findOne('users', {
                    user_id: app.worker_id
                });
                
                return {
                    ...app,
                    user: user ? {
                        _id: user._id,
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

        return response.success({
            message: 'Application status updated',
            application: result.document
        });
    } catch (error) {
        console.error('[updateApplicationStatus] Error:', error);
        return response.serverError('Failed to update application status', error.message);
    }
}

module.exports = {
    getMyApplications,
    getTaskApplications,
    updateApplicationStatus
};
