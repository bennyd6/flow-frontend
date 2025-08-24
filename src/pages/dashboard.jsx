import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FolderKanban, Users, X, UserPlus, Send, 
  PlusCircle, ChevronsLeft, MessageSquare, LogOut, Video
} from 'lucide-react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io.connect("http://localhost:3000");
const host = "http://localhost:3000";

// --- Sub-Components ---

const StatusBadge = ({ status, onClick }) => {
  const statusStyles = { 'ongoing': 'bg-blue-100 text-blue-700 hover:bg-blue-200', 'completed': 'bg-green-100 text-green-700', 'pending': 'bg-gray-100 text-gray-600 hover:bg-gray-200', 'review': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' };
  return <button onClick={onClick} className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${statusStyles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>;
};

const EmptyState = () => (
  <motion.div className="text-center flex flex-col items-center justify-center h-full text-gray-400" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
    <FolderKanban size={64} className="mb-4" /><h2 className="text-xl font-semibold text-gray-600">No Project Selected</h2><p>Select a project or create a new one to get started.</p>
  </motion.div>
);

const ProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${host}/api/projects/createproject`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ name, description }) });
        if (response.ok) { onProjectCreated(await response.json()); onClose(); } else { alert("Failed to create project."); }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-md"><h2 className="text-2xl font-bold mb-4">Create New Project</h2><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Project Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" required /><textarea placeholder="Project Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" required /><div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button></div></form></motion.div></div>
    );
};

const ManageTeamModal = ({ isOpen, onClose, project, onTeamUpdate }) => {
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
    };
    const removeUserFromTeam = (userId) => setTeam(team.filter(member => member._id !== userId));

    const handleUpdateTeam = async () => {
        const teamIds = team.map(member => member._id);
        const response = await fetch(`${host}/api/projects/updateproject/${project._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'auth-token': localStorage.getItem('token') }, body: JSON.stringify({ team: teamIds }) });
        if (response.ok) { onTeamUpdate(); onClose(); } else { alert("Failed to update team."); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 w-full max-w-lg"><h2 className="text-2xl font-bold mb-4">Manage Team for {project.name}</h2><div className="relative mb-4"><input type="text" placeholder="Search user by email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="w-full p-2 border rounded" /><AnimatePresence>{searchResults.length > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute w-full bg-white border rounded mt-1 z-10">{searchResults.map(user => <div key={user._id} onClick={() => addUserToTeam(user)} className="p-2 hover:bg-gray-100 cursor-pointer">{user.name} ({user.email})</div>)}</motion.div>}</AnimatePresence></div><h3 className="font-semibold mb-2">Team Members</h3><div className="space-y-2 mb-4">{team.map(member => <div key={member._id} className="flex justify-between items-center p-2 bg-gray-50 rounded"><span>{member.name} ({member.email})</span><button onClick={() => removeUserFromTeam(member._id)}><X size={16} className="text-red-500"/></button></div>)}</div><div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button><button type="button" onClick={handleUpdateTeam} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button></div></motion.div></div>
    );
};

const TaskModal = ({ isOpen, onClose, project, onTaskCreated }) => {
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

const StatusUpdateModal = ({ isOpen, onClose, task, onStatusUpdate, isTeamLead }) => {
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

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const projectResponse = await fetch(`${host}/api/projects/fetchallprojects`, { headers: { 'auth-token': token } });
    if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProjects(projectData);
        if(selectedProject) {
            setSelectedProject(projectData.find(p => p._id === selectedProject._id));
        }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const fetchInitialData = async () => {
        const userResponse = await fetch(`${host}/api/auth/getuser`, { method: 'POST', headers: { 'auth-token': token } });
        if (userResponse.ok) setCurrentUser(await userResponse.json());
        else { localStorage.removeItem('token'); navigate('/login'); }
        fetchProjects();
    };
    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    if (!selectedProject) { setTasks([]); setChatMessages([]); return; }
    const fetchProjectData = async () => {
      const token = localStorage.getItem('token');
      const taskResponse = await fetch(`${host}/api/tasks/fetchalltasks/${selectedProject._id}`, { headers: { 'auth-token': token } });
      if (taskResponse.ok) setTasks(await taskResponse.json());
      const chatResponse = await fetch(`${host}/api/chat/${selectedProject._id}`, { headers: { 'auth-token': token } });
      if (chatResponse.ok) setChatMessages(await chatResponse.json());
    };
    fetchProjectData();
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) socket.emit('join_project', selectedProject._id);
    const messageListener = (data) => { if (data.projectId === selectedProject?._id) setChatMessages((list) => [...list, data]); };
    socket.on('receive_message', messageListener);
    return () => socket.off('receive_message', messageListener);
  }, [selectedProject]);

  useEffect(() => { if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }, [chatMessages]);

  const handleSendMessage = async () => {
    if (currentMessage.trim() === "" || !selectedProject || !currentUser) return;
    
    const tempMessage = currentMessage;
    setCurrentMessage(""); // Clear input immediately for better UX

    const messageData = { 
      projectId: selectedProject._id, 
      sender: { _id: currentUser._id, name: currentUser.name }, 
      content: tempMessage, 
      timestamp: new Date().toISOString() 
    };
    
    // Emit message to WebSocket server. The listener will update the state for all clients.
    await socket.emit('send_message', messageData);
    
    // Persist message to the database via API
    await fetch(`${host}/api/chat/sendmessage`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        'auth-token': localStorage.getItem('token') 
      }, 
      body: JSON.stringify({ content: tempMessage, projectId: selectedProject._id }) 
    });
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
  const handleProjectCreated = (newProject) => { setProjects(prev => [...prev, newProject]); setSelectedProject(newProject); };
  const handleTaskCreated = (newTask) => setTasks(prev => [...prev, newTask]);
  const openStatusModal = (task) => { setTaskToUpdate(task); setStatusModalOpen(true); };
  const handleStatusUpdate = (updatedTask) => setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
  
  const isTeamLead = selectedProject && currentUser && selectedProject.teamLead._id === currentUser._id;
  const filteredTasks = isTeamLead ? tasks : tasks.filter(task => task.assignedTo._id === currentUser?._id);

  return (
    <>
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} onProjectCreated={handleProjectCreated} />
      {selectedProject && <ManageTeamModal isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} project={selectedProject} onTeamUpdate={fetchProjects} />}
      {selectedProject && <TaskModal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} project={selectedProject} onTaskCreated={handleTaskCreated} />}
      {taskToUpdate && <StatusUpdateModal isOpen={isStatusModalOpen} onClose={() => setStatusModalOpen(false)} task={taskToUpdate} onStatusUpdate={handleStatusUpdate} isTeamLead={isTeamLead} />}
      
      <div className="h-screen w-screen bg-gray-50 text-gray-800 flex overflow-hidden font-sans">
        <motion.div className="group relative bg-white border-r border-gray-200 flex flex-col" initial="collapsed" whileHover="expanded" variants={{ expanded: { width: '16rem' }, collapsed: { width: '4rem' } }} transition={{ type: 'spring', stiffness: 100, damping: 15 }}>
          <div className="p-4 flex items-center justify-center h-16 border-b border-gray-200"><LayoutDashboard className="text-indigo-600 w-8 h-8 flex-shrink-0"/></div>
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto"><button onClick={() => setProjectModalOpen(true)} className="w-full flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"><PlusCircle className="w-8 h-8 flex-shrink-0" /><motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">New Project</motion.span></button><p className="px-2 pt-4 text-xs font-semibold text-gray-400 uppercase hidden group-hover:block">Projects</p>{projects.map(project => <a key={project._id} href="#" onClick={(e) => { e.preventDefault(); setSelectedProject(project); }} className={`flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${selectedProject?._id === project._id ? 'bg-indigo-100 text-indigo-600' : ''}`}><span className="text-lg w-8 text-center flex-shrink-0">#</span><motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">{project.name}</motion.span></a>)}</nav>
          <div className="p-4 border-t border-gray-200"><a href="#" onClick={handleLogout} className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600"><LogOut className="w-8 h-8 flex-shrink-0" /><motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">Logout</motion.span></a></div>
        </motion.div>

        <div className="flex-1 flex flex-col"><header className="h-16 flex items-center justify-center relative"><nav className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 flex items-center space-x-4 shadow-sm"><a href="#" className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-full">Dashboard</a></nav><div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-2"><img src={`https://i.pravatar.cc/150?u=${currentUser?._id}`} alt="User Avatar" className="w-8 h-8 rounded-full" /><span className="text-sm font-medium">{currentUser?.name}</span></div></header>
          <main className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!selectedProject ? <EmptyState key="empty" /> : (
                <motion.div key={selectedProject._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                   <div className="flex justify-between items-center mb-6"><div><h1 className="text-3xl font-bold tracking-tight text-gray-900">{selectedProject.name}</h1><p className="text-gray-500 mt-1">{selectedProject.description}</p></div><div className="flex items-center space-x-2">{isTeamLead && <><button onClick={() => setTeamModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><UserPlus size={16} /><span>Manage Team</span></button><button onClick={() => setTaskModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"><PlusCircle size={16} /><span>New Task</span></button></>}</div></div>
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b"><div className="col-span-4">Task</div><div className="col-span-2">Status</div><div className="col-span-2">Assigned By</div><div className="col-span-2">Assigned To</div><div className="col-span-2">Due Date</div></div>
                      <div>{filteredTasks.map((task) => <motion.div key={task._id} className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 text-sm"><div className="col-span-4 font-semibold">{task.title}</div><div className="col-span-2"><StatusBadge status={task.status} onClick={() => openStatusModal(task)} /></div><div className="col-span-2">{task.assignedBy.name}</div><div className="col-span-2">{task.assignedTo.name}</div><div className="col-span-2 text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</div></motion.div>)}</div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        
        <motion.div 
            className="bg-white border-l border-gray-200 flex flex-col w-[22rem] flex-shrink-0"
            animate={selectedProject ? "open" : "closed"}
            initial="closed"
            variants={{
                open: { x: 0 },
                closed: { x: "100%" }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AnimatePresence>{selectedProject && <motion.div className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="p-4 flex items-center justify-between h-16 border-b border-gray-200 flex-shrink-0"><h2 className="font-bold text-lg">Team Chat</h2></div><div ref={chatBodyRef} className="flex-1 p-4 space-y-4 overflow-y-auto">{chatMessages.map((msg, index) => <div key={index} className={`flex items-start gap-3 ${msg.sender._id === currentUser?._id ? 'justify-end' : ''}`}>{msg.sender._id !== currentUser?._id && <img src={`https://i.pravatar.cc/150?u=${msg.sender._id}`} className="w-8 h-8 rounded-full" />}<div className={`max-w-xs p-3 rounded-2xl ${msg.sender._id === currentUser?._id ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>{msg.sender._id !== currentUser?._id && <p className="text-xs font-bold text-indigo-500 mb-1">{msg.sender.name}</p>}<p className="text-sm">{msg.content}</p></div></div>)}</div><div className="p-4 border-t border-gray-200 flex-shrink-0"><div className="relative"><input type="text" placeholder="Type a message..." className="w-full pl-4 pr-12 py-3 text-sm bg-gray-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-300" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} /><button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-indigo-500 rounded-full hover:bg-indigo-600"><Send size={18} /></button></div></div></motion.div>}</AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
