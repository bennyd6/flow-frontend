import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

export default function ChatSidebar({ selectedProject, currentUser, chatMessages, chatSocket, host }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (currentMessage.trim() === "" || !selectedProject || !currentUser) return;
    const tempMessage = currentMessage;
    setCurrentMessage("");
    const messageData = { projectId: selectedProject._id, sender: { _id: currentUser._id, name: currentUser.name }, content: tempMessage, timestamp: new Date().toISOString() };
    await chatSocket.emit('send_message', messageData);
    await fetch(`${host}/api/chat/sendmessage`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ content: tempMessage, projectId: selectedProject._id }) });
  };

  return (
    <motion.div
      className="bg-white border-l border-gray-200 flex flex-col w-[22rem] flex-shrink-0"
      animate={selectedProject ? "open" : "closed"}
      initial="closed"
      variants={{ open: { x: 0 }, closed: { x: "100%" } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <AnimatePresence>
        {selectedProject && (
          <motion.div className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-4 flex items-center justify-between h-16 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-lg">Team Chat</h2>
            </div>
            <div ref={chatBodyRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender._id === currentUser?._id ? 'justify-end' : ''}`}>
                  {msg.sender._id !== currentUser?._id && <img src={`https://i.pravatar.cc/150?u=${msg.sender._id}`} className="w-8 h-8 rounded-full" />}
                  <div className={`max-w-xs p-3 rounded-2xl ${msg.sender._id === currentUser?._id ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
                    {msg.sender._id !== currentUser?._id && <p className="text-xs font-bold text-indigo-500 mb-1">{msg.sender.name}</p>}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 text-sm bg-gray-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-300"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-indigo-500 rounded-full hover:bg-indigo-600">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
