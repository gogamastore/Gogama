
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare, X, Send, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface AdminContact {
  id: string;
  name: string;
  whatsapp: string;
}

// Helper component to bypass react-beautiful-dnd strict mode issue
const StrictModeDroppable = ({ children, ...props }: any) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) {
        return null;
    }
    return <Droppable {...props}>{children}</Droppable>;
};

function ContactList() {
    const [contacts, setContacts] = useState<AdminContact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "whatsapp_contacts"), orderBy("createdAt", "asc"));
                const querySnapshot = await getDocs(q);
                const fetchedContacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminContact));
                setContacts(fetchedContacts);
            } catch (error) {
                console.error("Error fetching contacts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const handleContactClick = (whatsappNumber: string) => {
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        const message = "Halo Admin, saya ingin bertanya...";
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (contacts.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Tidak ada kontak admin yang tersedia saat ini.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3 p-4">
            {contacts.map(contact => (
                <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact.whatsapp)}
                    className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-muted"
                >
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">Klik untuk memulai chat</p>
                    </div>
                    <Send className="h-4 w-4 text-primary"/>
                </button>
            ))}
        </div>
    )
}


export default function ResellerChatTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Load position from localStorage
    const savedPos = localStorage.getItem('chat-trigger-pos');
    if (savedPos) {
      setPosition(JSON.parse(savedPos));
    } else {
        // Default position for mobile view (above bottom nav)
        const defaultX = window.innerWidth - 64 - 24; // width - button_width - margin_right
        const defaultY = window.innerHeight - 64 - 80; // height - button_height - margin_bottom (to be above nav)
        setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    // This function is required for DragDropContext but we handle position manually in the Draggable
  };

  const handleDrag = (draggableId: any, newPosition: any) => {
    const newPos = { x: newPosition.x, y: newPosition.y };
    setPosition(newPos);
    localStorage.setItem('chat-trigger-pos', JSON.stringify(newPos));
  };


  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="chat-droppable" direction="vertical">
            {(provided: any) => (
                 <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="absolute z-50"
                    style={{ left: position.x, top: position.y }}
                 >
                    <Draggable draggableId="chat-trigger" index={0}>
                         {(provided: any, snapshot: any) => (
                             <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                    ...provided.draggableProps.style,
                                    // Override transform to allow free drag
                                    transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'translate(0px, 0px)',
                                    left: position.x,
                                    top: position.y,
                                    position: 'fixed'
                                }}
                             >
                                {isOpen && (
                                    <Card className="w-80 h-[500px] shadow-2xl rounded-xl mb-2 flex flex-col overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5">
                                        <CardHeader className="flex flex-row items-center justify-between bg-card p-4 border-b">
                                            <CardTitle className="text-lg font-bold">Hubungi Admin</CardTitle>
                                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="flex-1 p-0 overflow-y-auto">
                                            <ContactList />
                                        </CardContent>
                                    </Card>
                                )}
                                <Button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="h-16 w-16 rounded-full shadow-lg flex items-center justify-center"
                                    aria-label="Hubungi Admin"
                                >
                                    {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                                </Button>
                            </div>
                         )}
                    </Draggable>
                    {provided.placeholder}
                </div>
            )}
        </StrictModeDroppable>
    </DragDropContext>
  );
}
