import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ManageTeamModal({ isOpen, onClose, project, onTeamUpdate, host }) {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [team, setTeam] = useState(project?.team || []);

    useEffect(() => {
        if (project) setTeam(project.team);
    }, [project]);

    useEffect(() => {
        if (searchEmail.length < 2) { setSearchResults([]); return; }
        const handler = setTimeout(async () => {
            const response = await fetch(`${host}/api/auth/searchusers?email=${searchEmail}`, { headers: { 'auth-token': localStorage.getItem('token') } });
            if (response.ok) setSearchResults(await response.json());
        }, 300);
        return () => clearTimeout(handler);
    }, [searchEmail]);

    const addUserToTeam = (user) => {
        if (!team.find(member => member._id === user._id)) setTeam([...team, user]);
        setSearchEmail('');
        setSearchResults([]);
    };
    const removeUserFromTeam = (userId) => setTeam(team.filter(member => member._id !== userId));

    const handleUpdateTeam = async () => {
        const teamIds = team.map(member => member._id);
        const response = await fetch(`${host}/api/projects/updateproject/${project._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ team: teamIds }) });
        if (response.ok) { onTeamUpdate(); onClose(); } else { alert("Failed to update team."); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-lg"><h2 className="text-2xl font-bold mb-4">Manage Team for {project.name}</h2><div className="relative mb-4"><input type="text" placeholder="Search user by email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="w-full p-2 border rounded" /><AnimatePresence>{searchResults.length > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute w-full bg-white border rounded mt-1 z-10">{searchResults.map(user => <div key={user._id} onClick={() => addUserToTeam(user)} className="p-2 hover:bg-gray-100 cursor-pointer">{user.name} ({user.email})</div>)}</motion.div>}</AnimatePresence></div><h3 className="font-semibold mb-2">Team Members</h3><div className="space-y-2 mb-4 h-48 overflow-y-auto">{team.map(member => <div key={member._id} className="flex justify-between items-center p-2 bg-gray-50 rounded"><span>{member.name} ({member.email})</span><button onClick={() => removeUserFromTeam(member._id)}><X size={16} className="text-red-500"/></button></div>)}</div><div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="button" onClick={handleUpdateTeam} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button></div></motion.div></div>
    );
};
