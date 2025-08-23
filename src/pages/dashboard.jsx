// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FolderKanban, Settings, ChevronDown, Video, Send, 
  Search, Bell, PlusCircle, ChevronsLeft, ChevronsRight, MessageSquare
} from 'lucide-react';

// --- MOCK DATA ---
// In a real app, this would come from an API
const mockProjects = [
  {
    id: 'proj-001',
    name: 'QuantumLeap AI',
    icon: '🧠',
    tasks: [
      { id: 'ts-1', num: 721, title: 'Develop neural network architecture', status: 'In Progress', assignedBy: 'Alice', assignedTo: 'Bob', dueDate: '2025-08-28' },
      { id: 'ts-2', num: 722, title: 'Set up CI/CD pipeline', status: 'Done', assignedBy: 'Alice', assignedTo: 'Charlie', dueDate: '2025-08-25' },
      { id: 'ts-3', num: 723, title: 'Design user authentication flow', status: 'Todo', assignedBy: 'Alice', assignedTo: 'David', dueDate: '2025-09-02' },
      { id: 'ts-4', num: 724, title: 'API performance testing', status: 'In Review', assignedBy: 'Alice', assignedTo: 'Eve', dueDate: '2025-08-29' },
    ],
    members: [
      { id: 'u1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
      { id: 'u2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
      { id: 'u3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
      { id: 'u4', name: 'David', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d' },
      { id: 'u5', name: 'Eve', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d' },
    ],
  },
  {
    id: 'proj-002',
    name: 'Project Nebula',
    icon: '🌌',
    tasks: [
      { id: 'ts-5', num: 801, title: 'User feedback analysis', status: 'Done', assignedBy: 'Frank', assignedTo: 'Grace', dueDate: '2025-08-24' },
      { id: 'ts-6', num: 802, title: 'Deploy to staging server', status: 'In Progress', assignedBy: 'Frank', assignedTo: 'Heidi', dueDate: '2025-08-27' },
    ],
    members: [
        { id: 'u6', name: 'Frank', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d' },
        { id: 'u7', name: 'Grace', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026710d' },
        { id: 'u8', name: 'Heidi', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026711d' },
    ],
  },
   {
    id: 'proj-003',
    name: 'EcoSustain App',
    icon: '🌿',
    tasks: [
      { id: 'ts-7', num: 911, title: 'Implement carbon footprint calculator', status: 'In Review', assignedBy: 'Ivy', assignedTo: 'Jack', dueDate: '2025-08-30' },
      { id: 'ts-8', num: 912, title: 'Design marketing materials', status: 'Todo', assignedBy: 'Ivy', assignedTo: 'Kate', dueDate: '2025-09-05' },
      { id: 'ts-9', num: 913, title: 'Create database schema', status: 'Done', assignedBy: 'Ivy', assignedTo: 'Liam', dueDate: '2025-08-22' },
    ],
    members: [
        { id: 'u9', name: 'Ivy', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026712d' },
        { id: 'u10', name: 'Jack', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026713d' },
    ],
  }
];

// --- Sub-components for better organization ---

const StatusBadge = ({ status }) => {
  const statusStyles = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Done': 'bg-green-100 text-green-700',
    'Todo': 'bg-gray-100 text-gray-600',
    'In Review': 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const EmptyState = () => (
  <motion.div 
    className="text-center flex flex-col items-center justify-center h-full text-gray-400"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <FolderKanban size={64} className="mb-4" />
    <h2 className="text-xl font-semibold text-gray-600">No Project Selected</h2>
    <p>Please select a project from the left sidebar to see its tasks.</p>
  </motion.div>
);

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState(null);

  const containerVariants = {
    expanded: { width: '16rem' }, // 256px
    collapsed: { width: '4rem' } // 64px
  };
  
  const chatContainerVariants = {
    expanded: { width: '20rem' }, // 320px
    collapsed: { width: '4rem' } // 64px
  };

  return (
    <div className="h-screen w-screen bg-gray-50 text-gray-800 flex overflow-hidden font-sans">
      
      {/* 1. Left Sidebar (Project Selection) */}
      <motion.div
        className="group relative bg-white border-r border-gray-200 flex flex-col transition-width duration-300 ease-in-out"
        initial="collapsed"
        whileHover="expanded"
        variants={containerVariants}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        <div className="p-4 flex items-center justify-center h-16 border-b border-gray-200">
           <LayoutDashboard className="text-indigo-600 w-8 h-8 flex-shrink-0"/>
        </div>
        <nav className="flex-1 p-2 space-y-2">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase hidden group-hover:block">Projects</p>
            {mockProjects.map(project => (
              <a 
                key={project.id} 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedProject(project);
                }}
                className={`flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${selectedProject?.id === project.id ? 'bg-indigo-100 text-indigo-600' : ''}`}
              >
                  <span className="text-2xl w-8 text-center">{project.icon}</span>
                  <motion.span 
                    className="ml-4 font-medium whitespace-nowrap hidden group-hover:block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0 }}
                  >
                    {project.name}
                  </motion.span>
              </a>
            ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600">
                <Settings className="w-8 h-8 flex-shrink-0" />
                <motion.span 
                    className="ml-4 font-medium whitespace-nowrap hidden group-hover:block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Settings
                  </motion.span>
            </a>
        </div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full p-0.5 hidden group-hover:block">
            <ChevronsLeft size={16} className="text-gray-500" />
        </div>
      </motion.div>

      {/* Main Area (Navbar + Content) */}
      <div className="flex-1 flex flex-col">
        {/* 2. Top Navbar */}
        <header className="h-16 flex items-center justify-center relative">
          <nav className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 flex items-center space-x-4 shadow-sm">
            <a href="#" className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-indigo-600">Dashboard</a>
            <a href="#" className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-full">Tasks</a>
            <a href="#" className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-indigo-600">Reports</a>
            <a href="#" className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-indigo-600">Timeline</a>
          </nav>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-200"><Search size={20} className="text-gray-500"/></button>
              <button className="p-2 rounded-full hover:bg-gray-200"><Bell size={20} className="text-gray-500"/></button>
              <div className="flex items-center space-x-2">
                <img src="https://i.pravatar.cc/150?u=admin" alt="User Avatar" className="w-8 h-8 rounded-full" />
                <ChevronDown size={16} className="text-gray-500"/>
              </div>
          </div>
        </header>

        {/* 3. Middle Content (Task Logs) */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedProject ? (
              <EmptyState key="empty" />
            ) : (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tasks for {selectedProject.name}</h1>
                    <p className="text-gray-500 mt-1">Here's a list of tasks for the active project.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700">
                      <Video size={16} />
                      <span>Start Video Call</span>
                    </button>
                     <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                      <PlusCircle size={16} />
                      <span>New Task</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                   <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Task</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Assigned By</div>
                        <div className="col-span-2">Assigned To</div>
                        <div className="col-span-1">Due Date</div>
                    </div>
                  <div>
                    {selectedProject.tasks.map((task, index) => (
                       <motion.div 
                          key={task.id}
                          className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 text-sm hover:bg-gray-50"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                       >
                            <div className="col-span-1 text-gray-500 font-medium">{task.num}</div>
                            <div className="col-span-4 font-semibold">{task.title}</div>
                            <div className="col-span-2"><StatusBadge status={task.status} /></div>
                            <div className="col-span-2">{task.assignedBy}</div>
                            <div className="col-span-2">{task.assignedTo}</div>
                            <div className="col-span-1 text-gray-600">{task.dueDate.split('-').slice(1).join('/')}</div>
                       </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {/* 4. Right Sidebar (Chat) */}
      <motion.div
        className="group relative bg-white border-l border-gray-200 flex flex-col transition-width duration-300 ease-in-out"
        initial="collapsed"
        whileHover="expanded"
        variants={chatContainerVariants}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        <div className="p-4 flex items-center justify-center h-16 border-b border-gray-200">
           <MessageSquare className="text-indigo-600 w-8 h-8 flex-shrink-0"/>
           <motion.h2 
              className="ml-4 text-lg font-bold whitespace-nowrap hidden group-hover:block"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            >
              Team Chat
            </motion.h2>
        </div>
        <AnimatePresence>
        {selectedProject && (
            <motion.div 
              className="flex-1 p-2 space-y-2 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
                {selectedProject.members.map(member => (
                    <div key={member.id} className="flex items-center p-2 rounded-lg">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                         <motion.span 
                          className="ml-3 font-medium text-gray-700 whitespace-nowrap hidden group-hover:block"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                        >
                          {member.name}
                        </motion.span>
                    </div>
                ))}
            </motion.div>
        )}
        </AnimatePresence>
        <motion.div 
            className="p-4 border-t border-gray-200 hidden group-hover:block"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <div className="relative">
              <input type="text" placeholder="Type a message..." className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600">
                  <Send size={18} />
              </button>
          </div>
        </motion.div>
         <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full p-0.5 hidden group-hover:block">
            <ChevronsRight size={16} className="text-gray-500" />
        </div>
      </motion.div>
    </div>
  );
}