import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TaskModal({ isOpen, onClose, project, onTaskCreated, host }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${host}/api/tasks/createtask/${project._id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ title, description, assignedTo, dueDate }) });
        if (response.ok) { onTaskCreated(await response.json()); onClose(); } else { alert("Failed to create task. Ensure the user is in the team."); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-4">Create New Task</h2><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" required /><textarea placeholder="Task Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" /><select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full p-2 border rounded" required><option value="" disabled>Assign to...</option>{[project.teamLead, ...project.team].map(member => <option key={member._id} value={member._id}>{member.name}</option>)}</select><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 border rounded" required /><div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create Task</button></div></form></motion.div></div>
    );
};
