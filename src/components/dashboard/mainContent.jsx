import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, UserPlus, PlusCircle, Video, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // ✨ 1. Import useNavigate

const StatusBadge = ({ status, onClick }) => {
  const statusStyles = { 'ongoing': 'bg-blue-100 text-blue-700 hover:bg-blue-200', 'completed': 'bg-green-100 text-green-700', 'pending': 'bg-gray-100 text-gray-600 hover:bg-gray-200', 'review': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' };
  return <button onClick={onClick} className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${statusStyles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>;
};

const EmptyState = () => (
  <motion.div className="text-center flex flex-col items-center justify-center h-full text-gray-400" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
    <FolderKanban size={64} className="mb-4" /><h2 className="text-xl font-semibold text-gray-600">No Project Selected</h2><p>Select a project or create a new one to get started.</p>
  </motion.div>
);


export default function MainContent({ selectedProject, tasks, currentUser, isCallActive, onOpenModal, onOpenStatusModal }) {
  const navigate = useNavigate(); // ✨ 2. Initialize navigate
  
  const isTeamLead = selectedProject && currentUser && selectedProject.teamLead._id === currentUser._id;
  const isTeamMember = selectedProject && currentUser && (isTeamLead || selectedProject.team.some(member => member._id === currentUser._id));
  const filteredTasks = isTeamLead ? tasks : tasks.filter(task => task.assignedTo._id === currentUser?._id);

  const handleDownloadReport = () => {
    if (!selectedProject) return;
    let reportContent = `Project Report: ${selectedProject.name}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    reportContent += `Description: ${selectedProject.description}\n\nTeam Lead: ${selectedProject.teamLead.name}\nTeam Members:\n`;
    selectedProject.team.forEach(member => { reportContent += `  - ${member.name}\n`; });
    reportContent += `\nTasks Summary:\n\n`;
    tasks.forEach(task => {
        reportContent += `Task: ${task.title}\n  - Status: ${task.status}\n  - Assigned to: ${task.assignedTo.name}\n  - Due Date: ${new Date(task.dueDate).toLocaleDateString()}\n\n`;
    });
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.name}-Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <AnimatePresence mode="wait">
        {!selectedProject ? <EmptyState key="empty" /> : (
          <motion.div key={selectedProject._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
             <div className="flex justify-between items-center mb-6">
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">{selectedProject.name}</h1>
                  <p className="text-gray-500 mt-1">{selectedProject.description}</p>
               </div>
               <div className="flex items-center space-x-2">
                 {isTeamMember && (
                      // ✨ 3. UPDATE: Change onClick to navigate to the new route
                      <button onClick={() => navigate(`/project/${selectedProject._id}/call`)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${isCallActive ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'}`}>
                          <Video size={16} /><span>{isCallActive ? 'Join Call' : 'Start Video Call'}</span>
                      </button>
                  )}
                 {isTeamLead && <>
                    <button onClick={() => onOpenModal(m => ({...m, team: true}))} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"><UserPlus size={16} /><span>Manage Team</span></button>
                    <button onClick={() => onOpenModal(m => ({...m, task: true}))} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"><PlusCircle size={16} /><span>New Task</span></button>
                    <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"><Download size={16} /><span>Download Report</span></button>
                 </>}
               </div>
             </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                    <div className="col-span-4">Task</div><div className="col-span-2">Status</div><div className="col-span-2">Assigned By</div><div className="col-span-2">Assigned To</div><div className="col-span-2">Due Date</div>
                </div>
                <div>{filteredTasks.map((task) => <motion.div key={task._id} className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 text-sm"><div className="col-span-4 font-semibold">{task.title}</div><div className="col-span-2"><StatusBadge status={task.status} onClick={() => onOpenStatusModal(task)} /></div><div className="col-span-2">{task.assignedBy.name}</div><div className="col-span-2">{task.assignedTo.name}</div><div className="col-span-2 text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</div></motion.div>)}</div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
