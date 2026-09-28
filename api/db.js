import mongoose from 'mongoose';

// ═══════════════════════════════════════════
// 🎯 MONGODB CONNECTION (FEATURES DB)
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

    console.log('✅ [DB] Connected to Features MongoDB');
    return cachedConnection;
}

// ═══════════════════════════════════════════
// 🎯 USER COMMAND SCHEMA
// 🔥 collection: 'commands' - ඔබට ඕන collection එක
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// 🎯 USER COMMAND SCHEMA (Extended)
// ═══════════════════════════════════════════
const UserCommandSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, index: true },
    pattern: { type: String, required: true, lowercase: true },
    alias: { type: [String], default: [] },
    
    // 🎯 MAIN TYPE: text | media | api
    actionType: {
        type: String,
        enum: ['text', 'media', 'api'],
        default: 'text'
    },
    
    // 🎯 TEXT type fields
    response: { type: String, default: '' },
    
    // 🎯 MEDIA type fields
    mediaType: { 
        type: String, 
        enum: ['image', 'audio', 'document', 'video', null],
        default: null 
    },
    mediaUrl: { type: String, default: null },
    mediaCaption: { type: String, default: '' },
    
    // 🎯 API type fields
    apiMethod: { type: String, default: 'GET' },  // GET | POST
    apiUrl: { type: String, default: null },
    apiHeaders: { type: Object, default: {} },
    apiBody: { type: Object, default: {} },
    apiResponsePaths: { type: [String], default: [] },  // 🔥 paths list
    apiImageUrl: { type: String, default: null },  // optional image
    apiCaption: { type: String, default: '' },     // caption with {path} placeholders
    
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
}, { 
    collection: 'commands'
});

UserCommandSchema.index({ botNumber: 1, pattern: 1 }, { unique: true });

export const UserCommand = mongoose.models.UserCommand || 
    mongoose.model("UserCommand", UserCommandSchema);

export default { connectDB, UserCommand };
