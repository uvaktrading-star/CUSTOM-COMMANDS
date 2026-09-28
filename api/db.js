import mongoose from 'mongoose';

// ═══════════════════════════════════════════
// 🎯 MONGODB CONNECTION
// ═══════════════════════════════════════════
const FEATURES_MONGO_URI = process.env.FEATURES_MONGODB_URI || 
    "mongodb+srv://feature-settings:Akashkavindu12345@feature-settings.stfrtvq.mongodb.net/?appName=feature-settings";

let cachedConnection = null;

export async function connectDB() {
    if (cachedConnection && cachedConnection.readyState === 1) {
        return cachedConnection;
    }

    if (mongoose.connection.readyState === 1) {
        cachedConnection = mongoose.connection;
        return cachedConnection;
    }

    cachedConnection = await mongoose.connect(FEATURES_MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
    });

    console.log('✅ [DB] Connected to MongoDB');
    return cachedConnection;
}

// ═══════════════════════════════════════════
// 🎯 USER COMMAND SCHEMA
// ═══════════════════════════════════════════
const UserCommandSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, index: true },
    pattern: { type: String, required: true, lowercase: true },
    alias: { type: [String], default: [] },
    
    actionType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'api', 'template'],
        default: 'text'
    },
    
    // 🎯 Response
    response: { type: String, default: '' },
    mediaUrl: { type: String, default: null },
    
    // 🎯 API Config
    apiUrl: { type: String, default: null },
    apiMethod: { type: String, default: 'GET' },
    apiHeaders: { type: Object, default: {} },
    apiBody: { type: Object, default: {} },
    apiResponsePath: { type: String, default: null },
    
    // 🎯 Metadata
    description: { type: String, default: '' },
    category: { type: String, default: 'custom' },
    react: { type: String, default: '⚡' },
    
    // 🎯 Permissions
    ownerOnly: { type: Boolean, default: false },
    groupOnly: { type: Boolean, default: false },
    privateOnly: { type: Boolean, default: false },
    
    // 🎯 Status
    enabled: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserCommandSchema.index({ botNumber: 1, pattern: 1 }, { unique: true });

// ═══════════════════════════════════════════
// 🎯 EXPORT MODEL
// ═══════════════════════════════════════════
export const UserCommand = mongoose.models.UserCommand || 
    mongoose.model("UserCommand", UserCommandSchema);

export default { connectDB, UserCommand };
