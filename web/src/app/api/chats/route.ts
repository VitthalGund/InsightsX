import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Fetch all chats for the current user, sorted by newest first.
        // We explicitly exclude the heavy `messages` and `toolDataStore` payloads 
        // to keep the sidebar fast to load.
        const chats = await Chat.find({ userId: session.user.id })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({ chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chats' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { initialMessage } = await req.json().catch(() => ({ initialMessage: '' }));

        // Generate a quick title from the first message, or default to 'New Conversation'
        const title = initialMessage
            ? (initialMessage.length > 40 ? initialMessage.substring(0, 40) + '...' : initialMessage)
            : 'New Conversation';

        await connectDB();

        const newChat = await Chat.create({
            userId: session.user.id,
            title,
            messages: [],
            toolDataStore: {}
        });

        return NextResponse.json({ id: newChat._id });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json(
            { error: 'Failed to create chat' },
            { status: 500 }
        );
    }
}
