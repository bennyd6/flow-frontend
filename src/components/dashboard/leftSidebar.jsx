import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';

export default function LeftSidebar({ projects, selectedProject, onSelectProject, onNewProject, onLogout }) {
  const containerVariants = { expanded: { width: '16rem' }, collapsed: { width: '4rem' } };

  return (
    <motion.div
      className="group relative bg-white border-r border-gray-200 flex flex-col"
      initial="collapsed"
      whileHover="expanded"
      variants={containerVariants}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
    >
      <div className="p-4 flex items-center justify-center h-16 border-b border-gray-200">
        <LayoutDashboard className="text-indigo-600 w-8 h-8 flex-shrink-0" />
      </div>
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        <button onClick={onNewProject} className="w-full flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600">
          <PlusCircle className="w-8 h-8 flex-shrink-0" />
          <motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">New Project</motion.span>
        </button>
        <p className="px-2 pt-4 text-xs font-semibold text-gray-400 uppercase hidden group-hover:block">Projects</p>
        {projects.map(project => (
          <a
            key={project._id}
            href="#"
            onClick={(e) => { e.preventDefault(); onSelectProject(project); }}
            className={`flex items-center p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${selectedProject?._id === project._id ? 'bg-indigo-100 text-indigo-600' : ''}`}
          >
            <span className="text-lg w-8 text-center flex-shrink-0">#</span>
            <motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">{project.name}</motion.span>
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <a href="#" onClick={onLogout} className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-8 h-8 flex-shrink-0" />
          <motion.span className="ml-4 font-medium whitespace-nowrap hidden group-hover:block">Logout</motion.span>
        </a>
      </div>
    </motion.div>
  );
}
