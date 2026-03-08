const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');

/**
 * Validates review data
 */
function validateReviewData(data) {
    const errors = [];
    
    if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
        errors.push('Rating must be a number between 1 and 5');
    }
    
    if (!data.comment || data.comment.trim().length < 5) {
        errors.push('Review comment is too short');
    }

    if (data.comment && data.comment.length > 1000) {
        errors.push('Review comment is too long (max 1000 characters)');
    }

    return errors;
}

/**
 * Recalculate and update the user's average rating 
 */
async function updateUserRating(userId) {
    try {
        const reviewsCollection = mongoManager.getCollection('reviews');
        
        // Find all reviews for this user
        const reviewsArray = await reviewsCollection.find({ target_user_id: userId }).toArray();
        if (reviewsArray.length === 0) return;
        
        // Calculate average rating
        const totalRating = reviewsArray.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviewsArray.length;
        
        // Update user profile
        const usersCollection = mongoManager.getCollection('users');
        await usersCollection.updateOne(
            { user_id: userId },
            { 
                $set: { 
                    rating_as_worker: parseFloat(averageRating.toFixed(1)),
                    review_count: reviewsArray.length // Optionally track the amount of reviews
                } 
            }
        );
        console.log(`Updated rating for ${userId} to ${averageRating}`);
    } catch (error) {
        console.error('Error updating user rating:', error);
    }
}

/**
 * Submit a review for a user
 * POST /users/:userId/reviews
 */
async function submitReview(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { rating, comment } = body.data || body;
        const targetUserId = event.pathParameters.userId;
        const reviewerId = event.requestContext.authorizer.userId;
        
        if (!targetUserId) {
            return response.error('Target user ID is missing from path', 400);
        }

        if (targetUserId === reviewerId) {
            return response.error('You cannot review yourself', 400);
        }

        const dataToValidate = { rating, comment };
        const validationErrors = validateReviewData(dataToValidate);
        if (validationErrors.length > 0) {
            return response.error({ message: 'Validation failed', details: validationErrors }, 400);
        }

        // Check if there is an ACCEPTED application between reviewer and target user
        // Reviewer can be either owner (reviewing worker) or worker (reviewing owner)
        
        // Case 1: Reviewer is task owner, reviewing the worker
        // Find ACCEPTED application where target is worker
        const acceptedAppAsOwner = await mongoManager.findOne('applications', {
            worker_id: targetUserId,
            status: 'ACCEPTED'
        });
        
        let hasAcceptedApplicationAsOwner = false;
        if (acceptedAppAsOwner) {
            // Check if the task owner is the reviewer
            const task = await mongoManager.findOne('tasks', {
                task_id: acceptedAppAsOwner.task_id,
                owner_id: reviewerId
            });
            hasAcceptedApplicationAsOwner = !!task;
        }

        // Case 2: Reviewer is worker, reviewing the task owner
        // Find ACCEPTED application where reviewer is worker
        const acceptedAppAsWorker = await mongoManager.findOne('applications', {
            worker_id: reviewerId,
            status: 'ACCEPTED'
        });
        
        let hasAcceptedApplicationAsWorker = false;
        if (acceptedAppAsWorker) {
            // Check if the task owner is the target user
            const task = await mongoManager.findOne('tasks', {
                task_id: acceptedAppAsWorker.task_id,
                owner_id: targetUserId
            });
            hasAcceptedApplicationAsWorker = !!task;
        }

        if (!hasAcceptedApplicationAsOwner && !hasAcceptedApplicationAsWorker) {
            return response.error('You can only review users after the client accepts their application on a task', 403);
        }

        const reviewsCollection = mongoManager.getCollection('reviews');

        // Check if user already reviewed this target
        const existingReview = await reviewsCollection.findOne({
            target_user_id: targetUserId,
            reviewer_id: reviewerId
        });

        if (existingReview) {
            return response.error('You have already reviewed this user', 400);
        }

        const reviewId = uuidv4();
        const now = new Date().toISOString();

        const newReview = {
            review_id: reviewId,
            target_user_id: targetUserId,
            reviewer_id: reviewerId,
            rating: rating,
            comment: comment.trim(),
            created_at: now,
            updated_at: now
        };

        await reviewsCollection.insertOne(newReview);
        
        // Update the user's average rating in background
        // Passing the promise directly works in a worker context as execution continues
        await updateUserRating(targetUserId);

        return response.success({
            message: 'Review submitted successfully',
            review_id: reviewId
        }, 201);
    } catch (error) {
        console.error('Submit review error:', error);
        return response.serverError('Failed to submit review');
    }
}

/**
 * Check if current user can review target user
 * GET /users/:userId/reviews/can-review
 */
async function canReviewUser(event) {
    try {
        const targetUserId = event.pathParameters.userId;
        const reviewerId = event.requestContext.authorizer.userId;
        
        if (!targetUserId) {
            return response.error('Target user ID is missing from path', 400);
        }

        if (targetUserId === reviewerId) {
            return response.success({ canReview: false, reason: 'You cannot review yourself' });
        }

        // Check if there is an ACCEPTED application between reviewer and target user
        
        // Case 1: Reviewer is task owner, reviewing the worker
        // Find ACCEPTED application where target is worker
        const acceptedAppAsOwner = await mongoManager.findOne('applications', {
            worker_id: targetUserId,
            status: 'ACCEPTED'
        });
        
        let hasAcceptedApplicationAsOwner = false;
        if (acceptedAppAsOwner) {
            // Check if the task owner is the reviewer
            const task = await mongoManager.findOne('tasks', {
                task_id: acceptedAppAsOwner.task_id,
                owner_id: reviewerId
            });
            hasAcceptedApplicationAsOwner = !!task;
        }

        // Case 2: Reviewer is worker, reviewing the task owner
        // Find ACCEPTED application where reviewer is worker
        const acceptedAppAsWorker = await mongoManager.findOne('applications', {
            worker_id: reviewerId,
            status: 'ACCEPTED'
        });
        
        let hasAcceptedApplicationAsWorker = false;
        if (acceptedAppAsWorker) {
            // Check if the task owner is the target user
            const task = await mongoManager.findOne('tasks', {
                task_id: acceptedAppAsWorker.task_id,
                owner_id: targetUserId
            });
            hasAcceptedApplicationAsWorker = !!task;
        }

        const canReview = hasAcceptedApplicationAsOwner || hasAcceptedApplicationAsWorker;
        
        // Check if already reviewed
        let alreadyReviewed = false;
        if (canReview) {
            const reviewsCollection = mongoManager.getCollection('reviews');
            const existingReview = await reviewsCollection.findOne({
                target_user_id: targetUserId,
                reviewer_id: reviewerId
            });
            alreadyReviewed = !!existingReview;
        }

        return response.success({
            canReview: canReview && !alreadyReviewed,
            alreadyReviewed: alreadyReviewed,
            reason: !canReview ? 'You can only review users after accepting their application on a task' : 
                    alreadyReviewed ? 'You have already reviewed this user' : null
        });
    } catch (error) {
        console.error('Can review user error:', error);
        return response.serverError('Failed to check review eligibility', error.message);
    }
}

/**
 * Get reviews for a user
 * GET /users/:userId/reviews
 */
async function getUserReviews(event) {
    try {
        const targetUserId = event.pathParameters.userId;
        
        if (!targetUserId) {
            return response.error('Target user ID is missing from path', 400);
        }

        const reviewsCollection = mongoManager.getCollection('reviews');
        
        // Fetch reviews sorted by newest
        const reviews = await reviewsCollection.find({ target_user_id: targetUserId })
            .sort({ created_at: -1 })
            .toArray();

        // Let's populate the reviewer names and avatars
        if (reviews.length > 0) {
            const usersCollection = mongoManager.getCollection('users');
            const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
            
            const reviewers = await usersCollection.find(
                { user_id: { $in: reviewerIds } },
                { projection: { user_id: 1, name: 1, avatar_url: 1, _id: 0 } }
            ).toArray();
            
            const reviewerMap = {};
            reviewers.forEach(user => {
                reviewerMap[user.user_id] = user;
            });
            
            // Map the data into the reviews array
            reviews.forEach(review => {
                const reviewerInfo = reviewerMap[review.reviewer_id] || { name: 'Unknown User' };
                review.reviewer = reviewerInfo;
                // Remove internal ObjectId
                delete review._id;
            });
        }

        return response.success(reviews);
    } catch (error) {
        console.error('Get reviews error:', error);
        return response.serverError('Failed to retrieve reviews');
    }
}

module.exports = {
    submitReview,
    getUserReviews,
    canReviewUser
};
