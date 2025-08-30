import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function StatusUpdateModal({ isOpen, onClose, task, onStatusUpdate, isTeamLead, host }) {
    const [newStatus, setNewStatus] = useState(task?.status);
    const availableStatuses = isTeamLead ? ['pending', 'ongoing', 'review', 'completed'] : ['pending', 'ongoing', 'review'];

    const handleSubmit = async () => {
        const response = await fetch(`${host}/api/tasks/updatetask/${task._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ status: newStatus }) });
        if (response.ok) { onStatusUpdate((await response.json()).task); onClose(); } else { alert(`Update failed: ${(await response.text())}`); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-4">Update Task Status</h2><p className="mb-4">Task: <span className="font-semibold">{task.title}</span></p><div className="space-y-2">{availableStatuses.map(status => <label key={status} className="flex items-center gap-2"><input type="radio" name="status" value={status} checked={newStatus === status} onChange={() => setNewStatus(status)} />{status.charAt(0).toUpperCase() + status.slice(1)}</label>)}</div><div className="flex justify-end gap-4 mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="button" onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded">Update</button></div></motion.div></div>
    );
};
