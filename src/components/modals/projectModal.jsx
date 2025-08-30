
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProjectModal({ isOpen, onClose, onProjectCreated, host }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${host}/api/projects/createproject`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ name, description }) });
        if (response.ok) { onProjectCreated(await response.json()); onClose(); } else { alert("Failed to create project."); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Project Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" required />
                    <textarea placeholder="Project Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" required />
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
