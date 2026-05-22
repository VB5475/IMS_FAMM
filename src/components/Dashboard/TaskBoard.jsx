import React from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';

function TaskBoard() {
  const dummyTasks = [
    { id: 1, title: 'Review Q1 Performance', status: 'Pending', time: 'Today', color: 'orange' },
    { id: 2, title: 'Update HR Policies', status: 'Completed', time: 'Yesterday', color: 'green' },
    { id: 3, title: 'Client Onboarding - Tech Solutions', status: 'In Progress', time: 'Tomorrow', color: 'blue' },
  ];

  return (
    <div className="erp-card">
      <div className="erp-card-header">
        <h2 className="erp-card-title">
          <ClipboardList size={18} color="#16a34a" />
          Task Board
        </h2>
      </div>
      <div className="erp-card-content">
        <div className="task-list">
          {dummyTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-card-main">
                <h4>{task.title}</h4>
                <p>{task.time}</p>
              </div>
              <div className="task-status">
                {task.status === 'Completed' ? (
                  <CheckCircle size={18} color="#16a34a" />
                ) : (
                  <Clock size={18} color={task.status === 'Pending' ? '#ea580c' : '#2563eb'} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskBoard;
