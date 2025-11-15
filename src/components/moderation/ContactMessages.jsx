
import React, { useState, useEffect } from "react";
import { ContactMessage } from "@/entities/ContactMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, User, Loader2, Trash2, Eye } from "lucide-react"; // Added Eye icon
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ContactMessages({ onReload }) { // Changed onUpdate to onReload
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    // Removed try-catch block as per outline, assuming errors are handled by a higher-level interceptor or not crucial for this specific operation
    const data = await ContactMessage.list("-created_date");
    setMessages(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (id) => { // Changed messageId to id
    // Removed try-catch block as per outline
    await ContactMessage.update(id, { status: "read" });
    toast.success("Message marqué comme lu");
    loadMessages();
    onReload(); // Added onReload
  };

  const handleResolve = async (id) => { // Renamed from handleMarkAsResolved, changed messageId to id
    // Removed try-catch block as per outline
    await ContactMessage.update(id, { status: "resolved" });
    toast.success("Message marqué comme résolu");
    loadMessages();
    onReload(); // Added onReload
  };

  const handleDelete = async (id) => { // Changed messageId to id
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;
    
    try {
      await ContactMessage.delete(id);
      toast.success("Message supprimé avec succès"); // Updated toast message
      loadMessages();
      onReload(); // Added onReload
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erreur lors de la suppression du message");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200", // Changed pending color
    read: "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-green-100 text-green-800 border-green-200"
  };

  const statusLabels = {
    pending: "En attente",
    read: "Lu",
    resolved: "Résolu"
  };

  if (loading) {
    return (
      // Updated loading UI
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        // Updated empty state UI
        <Card className="bg-slate-50">
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Aucun message pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        messages.map((message) => (
          // Removed motion.div, updated Card styles
          <Card key={message.id} className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Simplified CardTitle and moved icon/badge */}
                  <CardTitle className="text-lg mb-2">{message.subject}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">{message.name}</span>
                    <span>•</span>
                    <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
                      {message.email}
                    </a>
                    <span>•</span>
                    {/* Updated date format */}
                    <span>{format(new Date(message.created_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  </div>
                </div>
                {/* Badge moved here */}
                <Badge className={statusColors[message.status]}>
                  {statusLabels[message.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Message content display, removed extra div */}
              <p className="text-slate-700 whitespace-pre-wrap mb-4">{message.message}</p>
              
              <div className="flex flex-wrap gap-2">
                {message.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(message.id)}>
                    <Eye className="w-4 h-4 mr-2" /> {/* Added Eye icon */}
                    Marquer comme lu
                  </Button>
                )}
                {message.status !== "resolved" && ( // Condition updated
                  <Button 
                    size="sm" 
                    variant="outline" // Retained variant as per original, but added custom styles from outline
                    className="border-green-200 text-green-700 hover:bg-green-50" 
                    onClick={() => handleResolve(message.id)} // Renamed function
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer comme résolu
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(message.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
