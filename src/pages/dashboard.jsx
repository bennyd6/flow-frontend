import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

// Import components
import LeftSidebar from '../components/dashboard/leftSidebar';
import MainContent from '../components/dashboard/mainContent';
import ChatSidebar from '../components/dashboard/chatSidebar';
import ProjectModal from '../components/modals/projectModal';
import ManageTeamModal from '../components/modals/manageTeamModal';
import TaskModal from '../components/modals/taskModal';
import StatusUpdateModal from '../components/modals/statusUpdateModal';
import VideoCallModal from '../components/modals/videoCallModal';

const host = "http://localhost:3000";
const chatSocket = io.connect(host);

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal states (VideoCallModal state is removed)
  const [modal, setModal] = useState({ project: false, team: false, task: false, status: false });
  
  // State for modals that need data
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  
  // Real-time states
  const [chatMessages, setChatMessages] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const response = await fetch(`${host}/api/projects/fetchallprojects`, { headers: { 'auth-token': token } });
    if (response.ok) {
        setProjects(await response.json());
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const fetchInitialData = async () => {
        const userResponse = await fetch(`${host}/api/auth/getuser`, { method: 'POST', headers: { 'auth-token': token } });
        if (userResponse.ok) {
            setCurrentUser(await userResponse.json());
            fetchProjects();
        } else {
            localStorage.removeItem('token');
            navigate('/login');
        }
    };
    fetchInitialData();
  }, [navigate, fetchProjects]);
  
  useEffect(() => {
    if (selectedProject?._id) {
        const updatedSelectedProject = projects.find(p => p._id === selectedProject._id);
        setSelectedProject(updatedSelectedProject || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);
  
  useEffect(() => {
    if (!selectedProject) { 
        setTasks([]); 
        setChatMessages([]);
        setIsCallActive(false); 
        return; 
    }
    const fetchProjectData = async () => {
      const token = localStorage.getItem('token');
      const [taskRes, chatRes, callRes] = await Promise.all([
          fetch(`${host}/api/tasks/fetchalltasks/${selectedProject._id}`, { headers: { 'auth-token': token } }),
          fetch(`${host}/api/chat/${selectedProject._id}`, { headers: { 'auth-token': token } }),
          fetch(`${host}/api/video/status/${selectedProject._id}`, { headers: { 'auth-token': token } })
      ]);
      if (taskRes.ok) setTasks(await taskRes.json());
      if (chatRes.ok) setChatMessages(await chatRes.json());
      if (callRes.ok) setIsCallActive((await callRes.json()).isActive);
    };
    fetchProjectData();
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
        chatSocket.emit('join_project', selectedProject._id);
        
        const messageListener = (data) => { if (data.projectId === selectedProject?._id) setChatMessages((list) => [...list, data]); };
        chatSocket.on('receive_message', messageListener);

        const callStatusListener = (data) => { if (data.projectId === selectedProject._id) setIsCallActive(data.isActive); };
        chatSocket.on('call-status-change', callStatusListener);

        return () => {
            chatSocket.off('receive_message', messageListener);
            chatSocket.off('call-status-change', callStatusListener);
        };
    }
  }, [selectedProject]);

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
  const handleProjectCreated = (newProject) => { setProjects(prev => [...prev, newProject]); setSelectedProject(newProject); };
  const handleTaskCreated = (newTask) => setTasks(prev => [...prev, newTask]);
  const handleStatusUpdate = (updatedTask) => setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));

  return (
    <>
      <ProjectModal isOpen={modal.project} onClose={() => setModal(m => ({...m, project: false}))} onProjectCreated={handleProjectCreated} host={host} />
      {selectedProject && <ManageTeamModal isOpen={modal.team} onClose={() => setModal(m => ({...m, team: false}))} project={selectedProject} onTeamUpdate={fetchProjects} host={host} />}
      {selectedProject && <TaskModal isOpen={modal.task} onClose={() => setModal(m => ({...m, task: false}))} project={selectedProject} onTaskCreated={handleTaskCreated} host={host} />}
      {taskToUpdate && <StatusUpdateModal isOpen={modal.status} onClose={() => { setModal(m => ({...m, status: false})); setTaskToUpdate(null); }} task={taskToUpdate} onStatusUpdate={handleStatusUpdate} isTeamLead={selectedProject?.teamLead._id === currentUser?._id} host={host} />}
      
      <div className="h-screen w-screen bg-gray-50 text-gray-800 flex overflow-hidden font-sans">
        <LeftSidebar 
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onNewProject={() => setModal(m => ({...m, project: true}))}
            onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-center relative">
            <nav className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 flex items-center space-x-4 shadow-sm">
                <a href="/dashboard" className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-full">Dashboard</a>
                <a href="/github" className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-indigo-600">GitHub Stats</a>
            </nav>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <img src={`https://i.pravatar.cc/150?u=${currentUser?._id}`} alt="User Avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium">{currentUser?.name}</span>
            </div>
          </header>
          <MainContent 
            selectedProject={selectedProject}
            tasks={tasks}
            currentUser={currentUser}
            isCallActive={isCallActive}
            onOpenModal={setModal}
            onOpenStatusModal={(task) => { setTaskToUpdate(task); setModal(m => ({...m, status: true})); }}
          />
        </div>
        <ChatSidebar 
            selectedProject={selectedProject}
            currentUser={currentUser}
            chatMessages={chatMessages}
            chatSocket={chatSocket}
            host={host}
        />
      </div>
    </>
  );
}