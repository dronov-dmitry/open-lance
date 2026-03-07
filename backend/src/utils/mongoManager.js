/**
 * MongoDB Atlas Connection Manager
 * Replaces DynamoDB multi-account manager with MongoDB Atlas
 */

const { MongoClient, ObjectId } = require('mongodb');

class MongoManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
        this.connectPromise = null; // Lock for concurrent connections
        this.env = null; // Store env for future connect() calls
        
        // MongoDB Atlas connection string (will be set in connect())
        this.connectionString = null;
        this.dbName = 'open-lance';
        
        // Collections
        this.collections = {
            users: 'users',
            tasks: 'tasks',
            applications: 'applications',
            reviews: 'reviews'
        };

        // Retry settings
        this.maxRetries = 2; // Reduced to 2 to prevent 10s Cloudflare worker timeouts
        this.retryDelay = 500; // ms
    }

    /**
     * Initialize MongoDB connection
     * @param {Object} env - Cloudflare Workers environment variables
     */
    async connect(env = null) {
        // Store env if provided
        if (env && env.MONGODB_URI) {
            this.env = env;
        }
        
        // Use stored env if available
        const currentEnv = env || this.env || {};
        
        // Debug logging
        console.log('mongoManager.connect called');
        console.log('env type:', typeof currentEnv);
        console.log('env keys:', currentEnv ? Object.keys(currentEnv) : 'null');
        console.log('env.MONGODB_URI exists:', !!(currentEnv && currentEnv.MONGODB_URI));
        
        // Set connection string from env (Cloudflare Workers way)
        if (currentEnv && currentEnv.MONGODB_URI) {
            this.connectionString = currentEnv.MONGODB_URI;
            console.log('Using MONGODB_URI from env (length:', currentEnv.MONGODB_URI.length, ')');
        } else if (typeof process !== 'undefined' && process.env) {
            // Fallback to process.env for local development
            this.connectionString = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING;
            console.log('Using MONGODB_URI from process.env');
        }

        if (!this.connectionString) {
            console.error('No connection string found!');
            throw new Error('MongoDB connection string not found! Set MONGODB_URI secret in Cloudflare Workers.');
        }

        if (this.isConnected && this.client) {
            // Check if connection has been idle for more than 5 seconds in real-time.
            // Cloudflare freezes time when idle, so if Date.now() jumped, we know we woke up.
            const timeSinceLastUse = Date.now() - (this.lastUsed || 0);
            if (timeSinceLastUse > 5000) {
                console.log(`Connection idle for ${timeSinceLastUse}ms, destroying frozen socket...`);
                this.isConnected = false;
                await this.client.close(true).catch(() => {});
                this.client = null;
            } else {
                this.lastUsed = Date.now();
                return this.db;
            }
        }

        if (this.connectPromise) {
            console.log('Already connecting to MongoDB, waiting for promise...');
            return await this.connectPromise;
        }

        this.connectPromise = (async () => {
            try {
                console.log('Connecting to MongoDB Atlas...');
                
                this.client = new MongoClient(this.connectionString, {
                    maxPoolSize: 10,
                    minPoolSize: 0,
                    maxIdleTimeMS: 10000, // Close connections idle for >10s to avoid frozen Cloudflare sockets
                    retryWrites: true,
                    retryReads: true,
                    serverSelectionTimeoutMS: 1500, // Fail extremely fast for serverless (1.5s)
                    connectTimeoutMS: 1500,
                    socketTimeoutMS: 1500,
                    waitQueueTimeoutMS: 1500,
                    family: 4, // Force IPv4 to prevent 5s DNS fallback timeout
                });

                await this.client.connect();
                this.db = this.client.db(this.dbName);
                this.isConnected = true;

                console.log(`Connected to MongoDB database: ${this.dbName}`);

                // Create indexes on first connection
                await this.createIndexes();
                
                this.lastUsed = Date.now();
                return this.db;
            } catch (error) {
                console.error('Failed to connect to MongoDB:', error);
                this.isConnected = false;
                throw error;
            } finally {
                this.connectPromise = null;
            }
        })();

        return await this.connectPromise;
    }

    /**
     * Create database indexes for optimal performance
     */
    async createIndexes() {
        try {
            const usersCollection = this.db.collection(this.collections.users);
            const tasksCollection = this.db.collection(this.collections.tasks);
            const applicationsCollection = this.db.collection(this.collections.applications);

            // Users indexes
            await usersCollection.createIndex({ email: 1 }, { unique: true });
            await usersCollection.createIndex({ user_id: 1 }, { unique: true });
            await usersCollection.createIndex({ created_at: -1 });
            await usersCollection.createIndex({ verification_token: 1 });

            // Tasks indexes
            await tasksCollection.createIndex({ task_id: 1 }, { unique: true });
            await tasksCollection.createIndex({ owner_id: 1 });
            await tasksCollection.createIndex({ status: 1 });
            await tasksCollection.createIndex({ category: 1 });
            await tasksCollection.createIndex({ created_at: -1 });
            await tasksCollection.createIndex({ deadline: 1 });
            
            // Text search index for tasks
            await tasksCollection.createIndex({ 
                title: 'text', 
                description: 'text',
                tags: 'text'
            });

            // Applications indexes
            await applicationsCollection.createIndex({ application_id: 1 }, { unique: true });
            await applicationsCollection.createIndex({ task_id: 1 });
            await applicationsCollection.createIndex({ worker_id: 1 });
            await applicationsCollection.createIndex({ status: 1 });

            // Reviews indexes
            const reviewsCollection = this.db.collection(this.collections.reviews);
            await reviewsCollection.createIndex({ review_id: 1 }, { unique: true });
            await reviewsCollection.createIndex({ target_user_id: 1 });
            await reviewsCollection.createIndex({ reviewer_id: 1 });
            await reviewsCollection.createIndex({ created_at: -1 });

            console.log('MongoDB indexes created successfully');
        } catch (error) {
            // Ignore duplicate index errors
            if (error.code !== 85 && error.code !== 86) {
                console.error('Error creating indexes:', error);
            }
        }
    }

    /**
     * Get collection
     */
    getCollection(collectionName) {
        if (!this.isConnected || !this.db) {
            throw new Error('MongoDB not connected. Call connect() first.');
        }
        return this.db.collection(collectionName);
    }

    /**
     * Find one document
     */
    async findOne(collectionName, query, options = {}) {
        return this.executeWithRetry(async () => {
            await this.connect();
            this.lastUsed = Date.now();
            const collection = this.getCollection(collectionName);
            return await collection.findOne(query, options);
        });
    }

    /**
     * Find multiple documents
     */
    async find(collectionName, query, options = {}) {
        return this.executeWithRetry(async () => {
            await this.connect();
            this.lastUsed = Date.now();
            const collection = this.getCollection(collectionName);
            return await collection.find(query, options).toArray();
        });
    }

    /**
     * Insert one document
     */
    async insertOne(collectionName, document) {
        return this.executeWithRetry(async () => {
            await this.connect();
            this.lastUsed = Date.now();
            const collection = this.getCollection(collectionName);
            const result = await collection.insertOne(document);
            return { 
                success: true, 
                insertedId: result.insertedId,
                document: { _id: result.insertedId, ...document }
            };
        });
    }

    /**
     * Update one document
     */
    async updateOne(collectionName, query, update, options = {}) {
        return this.executeWithRetry(async () => {
            await this.connect();
            this.lastUsed = Date.now();
            const collection = this.getCollection(collectionName);
            
            // If update doesn't have operators, wrap in $set
            const updateDoc = update.$set || update.$inc || update.$push || update.$pull
                ? update
                : { $set: update };
            
            const result = await collection.updateOne(query, updateDoc, options);
            
            // Return updated document if requested
            if (options.returnDocument === 'after' || options.returnUpdatedDocument) {
                const updatedDoc = await collection.findOne(query);
                return { 
                    success: true, 
                    modifiedCount: result.modifiedCount,
                    document: updatedDoc
                };
            }
            
            return { 
                success: true, 
                modifiedCount: result.modifiedCount 
            };
        });
    }

    /**
     * Delete one document
     */
    async deleteOne(collectionName, query) {
        await this.connect();
        const collection = this.getCollection(collectionName);
        const result = await collection.deleteOne(query);
        return { 
            success: true, 
            deletedCount: result.deletedCount 
        };
    }

    /**
     * Count documents
     */
    async count(collectionName, query = {}) {
        await this.connect();
        const collection = this.getCollection(collectionName);
        return await collection.countDocuments(query);
    }

    /**
     * Aggregate query
     */
    async aggregate(collectionName, pipeline) {
        await this.connect();
        const collection = this.getCollection(collectionName);
        return await collection.aggregate(pipeline).toArray();
    }

    /**
     * Execute operation with retry logic
     */
    async executeWithRetry(operation, attempt = 1) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Operation failed (attempt ${attempt}):`, error);

            // Retry on network or timeout errors
            if ((error.name === 'MongoNetworkError' || 
                 error.name === 'MongoTimeoutError' ||
                 error.name === 'MongoServerSelectionError' ||
                 error.code === 'ETIMEDOUT' ||
                 error.code === 'ECONNRESET') && 
                attempt < this.maxRetries) {
                
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`Retrying after ${delay}ms...`);
                await this.sleep(delay);
                
                // Reconnect if connection lost
                this.isConnected = false;
                if (this.client) {
                    await this.client.close(true).catch(() => {});
                    this.client = null;
                }
                await this.connect();
                
                return this.executeWithRetry(operation, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Helper: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper: Check if string is valid ObjectId
     */
    isValidObjectId(id) {
        return ObjectId.isValid(id);
    }

    /**
     * Helper: Convert string to ObjectId
     */
    toObjectId(id) {
        return new ObjectId(id);
    }

    /**
     * Close MongoDB connection
     */
    async close() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('MongoDB connection closed');
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.connect();
            await this.db.admin().ping();
            return { 
                status: 'healthy', 
                database: this.dbName,
                connected: this.isConnected 
            };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                error: error.message,
                connected: false
            };
        }
    }
}

// Create singleton instance
const mongoManager = new MongoManager();

module.exports = mongoManager;
