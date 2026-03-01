import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[];
    toolDataStore: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: 'New Conversation',
    },
    messages: {
        type: [Schema.Types.Mixed],
        default: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    toolDataStore: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true
});

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
export default Chat;
