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
const UserCommandSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, index: true },
    pattern: { type: String, required: true, lowercase: true },
    alias: { type: [String], default: [] },
    
    actionType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'api', 'template'],
        default: 'text'
    },
    
    response: { type: String, default: '' },
    mediaUrl: { type: String, default: null },
    
    apiUrl: { type: String, default: null },
    apiMethod: { type: String, default: 'GET' },
    apiHeaders: { type: Object, default: {} },
    apiBody: { type: Object, default: {} },
    apiResponsePath: { type: String, default: null },
    
    description: { type: String, default: '' },
    category: { type: String, default: 'custom' },
    react: { type: String, default: '⚡' },
    
    ownerOnly: { type: Boolean, default: false },
    groupOnly: { type: Boolean, default: false },
    privateOnly: { type: Boolean, default: false },
    
    enabled: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { 
    collection: 'commands'   // 🔥 මෙතන තමයි collection එකේ නම දෙන්නේ
});

UserCommandSchema.index({ botNumber: 1, pattern: 1 }, { unique: true });

export const UserCommand = mongoose.models.UserCommand || 
    mongoose.model("UserCommand", UserCommandSchema);

export default { connectDB, UserCommand };
