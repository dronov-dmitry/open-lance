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

        return response.success({
            message: 'Application message updated',
            application: result.document
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
