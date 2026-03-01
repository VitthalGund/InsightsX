import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: chatId } = await params;

        // Ensure the ID is a valid MongoDB ObjectId
        if (!mongoose.isValidObjectId(chatId)) {
            return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
        }

        await connectDB();

        // Fetch the chat by ID and explicitly verify ownership
        const chat = await Chat.findOne({
            _id: chatId,
            userId: session.user.id
        }).lean();

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ chat });
    } catch (error) {
        console.error('Error fetching chat session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat session' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id: chatId } = resolvedParams;

        // Parse the intended updates from the request body
        const { title } = await req.json();

        if (!mongoose.isValidObjectId(chatId)) {
            return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
        }
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json({ error: 'A valid title string is required' }, { status: 400 });
        }

        await connectDB();

        // Update the Chat document but enforce ownership inside the query criteria to secure the endpoint
        const updatedChat = await Chat.findOneAndUpdate(
            { _id: chatId, userId: session.user.id },
            { $set: { title: title.trim() } },
            { new: true, runValidators: true }
        );

        if (!updatedChat) {
            return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ chat: updatedChat });
    } catch (error) {
        console.error('Error updating chat session:', error);
        return NextResponse.json(
            { error: 'Failed to update chat session' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id: chatId } = resolvedParams;

        if (!mongoose.isValidObjectId(chatId)) {
            return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
        }

        await connectDB();

        // Delete the target Chat by matching both its Object ID and the authenticated user's ID
        const deleteResult = await Chat.deleteOne({
            _id: chatId,
            userId: session.user.id
        });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ error: 'Chat not found or already deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return NextResponse.json(
            { error: 'Failed to delete chat session' },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id: chatId } = resolvedParams;

        // Parse the intended updates from the request body
        const { messages, toolDataStore } = await req.json();

        if (!mongoose.isValidObjectId(chatId)) {
            return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
        }

        await connectDB();

        const updatePayload: Record<string, unknown> = {};
        if (messages !== undefined) updatePayload.messages = messages;
        if (toolDataStore !== undefined) updatePayload.toolDataStore = toolDataStore;

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ message: 'No updates provided' });
        }

        // Update the Chat document but enforce ownership
        const updatedChat = await Chat.findOneAndUpdate(
            { _id: chatId, userId: session.user.id },
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!updatedChat) {
            return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error syncing chat session:', error);
        return NextResponse.json(
            { error: 'Failed to sync chat session' },
            { status: 500 }
        );
    }
}
