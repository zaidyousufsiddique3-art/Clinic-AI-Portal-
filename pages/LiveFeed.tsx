import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { MessageCircle, Bot, User, UserCircle } from 'lucide-react';

interface Message {
    id: string;
    from: 'bot' | 'patient' | 'staff';
    text: string;
    language: string;
    createdAt: any;
}

interface Conversation {
    id: string;
    patientId: string;
    state: string;
    mode: string;
    staffAssigned?: string;
    lastMessageAt: any;
}

interface Patient {
    id: string;
    email: string;
    phone: string;
    name?: string;
}

interface Lead {
    stage: string;
    service?: string;
}

export default function LiveFeed() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
    const [leadInfo, setLeadInfo] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    // Load conversations
    useEffect(() => {
        const q = query(collection(db, 'conversations'), orderBy('lastMessageAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
            setConversations(convs);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) return;
        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', selectedConversation),
            orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
            setMessages(msgs);
        });
        return () => unsub();
    }, [selectedConversation]);

    // Load patient and lead info when a conversation is selected
    useEffect(() => {
        if (!selectedConversation) return;
        const conv = conversations.find(c => c.id === selectedConversation);
        if (!conv) return;

        // Patient
        getDoc(doc(db, 'patients', conv.patientId)).then(snap => {
            if (snap.exists()) setPatientInfo({ id: snap.id, ...snap.data() } as Patient);
        });

        // Lead (latest)
        const leadQuery = query(
            collection(db, 'leads'),
            where('patientId', '==', conv.patientId),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(leadQuery, snap => {
            if (!snap.empty) setLeadInfo(snap.docs[0].data() as Lead);
        });
        return () => unsub();
    }, [selectedConversation, conversations]);

    const handleHandoff = async (conversationId: string) => {
        try {
            await fetch('/api/toggle-bot-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, mode: 'human' })
            });
            alert('Bot disabled – staff can now reply.');
        } catch (e) {
            console.error('Handoff error', e);
            alert('Failed to switch to human mode');
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!selectedConversation) return;
        try {
            await fetch('/api/agent-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: selectedConversation, message: text })
            });
        } catch (e) {
            console.error('Send error', e);
            alert('Failed to send staff message');
        }
    };

    const bubbleColor = (from: string) => {
        switch (from) {
            case 'bot':
                return 'bg-purple-100 text-purple-900 border-purple-300';
            case 'patient':
                return 'bg-blue-100 text-blue-900 border-blue-300';
            case 'staff':
                return 'bg-green-100 text-green-900 border-green-300';
            default:
                return 'bg-gray-100 text-gray-900';
        }
    };

    const iconFor = (from: string) => {
        switch (from) {
            case 'bot':
                return <Bot className="w-4 h-4" />;
            case 'patient':
                return <User className="w-4 h-4" />;
            case 'staff':
                return <UserCircle className="w-4 h-4" />;
            default:
                return <MessageCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Live Conversations</h2>
                </div>
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No conversations yet</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selectedConversation === conv.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-gray-400" />
                                        <span className="font-medium text-gray-700">
                                            {conv.patientId.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${conv.mode === 'human' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}
                                    >
                                        {conv.mode === 'human' ? 'Human' : 'Bot'}
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    State: <span className="font-medium">{conv.state}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {patientInfo?.name || patientInfo?.phone || 'Patient'}
                                    </h3>
                                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                        {patientInfo?.email && <span>📧 {patientInfo.email}</span>}
                                        {patientInfo?.phone && <span>📱 {patientInfo.phone}</span>}
                                    </div>
                                    {leadInfo && (
                                        <div className="flex gap-3 mt-2 text-xs">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                Stage: {leadInfo.stage}
                                            </span>
                                            {leadInfo.service && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                    Service: {leadInfo.service}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleHandoff(selectedConversation)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Take Over
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.from === 'patient' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-xl px-4 py-2 rounded-lg border ${bubbleColor(msg.from)}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {iconFor(msg.from)}
                                            <span className="text-xs font-semibold uppercase">{msg.from}</span>
                                            {msg.language !== 'en' && <span className="text-xs bg-white px-1 rounded">{msg.language}</span>}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        handleSendMessage(input.value.trim());
                                        input.value = '';
                                    }
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    name="message"
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Select a conversation to view messages</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
