import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

export default function TaskManagement() {
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all'
  });

  const [openDropdown, setOpenDropdown] = useState(null);

  const [tasks, setTasks] = useState({
    todo: [
      {
        id: 'task-1',
        title: 'Validate Table Header Wording',
        description: 'Table header showing incorrect number of columns',
        priority: 'high',
        assignee: 'QA Team'
      },
      {
        id: 'task-2',
        title: 'Fix Login Button Alignment',
        description: 'Login button is not centered properly on mobile view',
        priority: 'medium',
        assignee: 'Dev Team'
      }
    ],
    inProgress: [
      {
        id: 'task-3',
        title: 'Update Dashboard Charts',
        description: 'Charts are not displaying correct data for last month',
        priority: 'low',
        assignee: 'QA Team'
      },
      {
        id: 'task-4',
        title: 'API Response Time Optimization',
        description: 'API taking too long to respond, need to optimize queries',
        priority: 'high',
        assignee: 'Dev Team'
      }
    ],
    done: [
      {
        id: 'task-5',
        title: 'Setup CI/CD Pipeline',
        description: 'Configure automated testing and deployment pipeline',
        priority: 'high',
        assignee: 'Dev Team'
      },
      {
        id: 'task-6',
        title: 'Documentation Update',
        description: 'Update API documentation with new endpoints',
        priority: 'low',
        assignee: 'QA Team'
      }
    ]
  });

  const [activeId, setActiveId] = useState(null);

  // 🔹 TAMBAHAN: state role user
  const [role, setRole] = useState(null);

  // 🔹 TAMBAHAN: ambil role dari backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setRole(data.role); // "qa" atau "developer"
        }
      } catch (err) {
        console.error("Error fetch /auth/me di TaskManagement:", err);
      }
    };

    fetchUser();
  }, []);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Find which container a task belongs to
  const findContainer = (id) => {
    if (id in tasks) {
      return id;
    }
    return Object.keys(tasks).find((key) =>
      tasks[key].some((task) => task.id === id)
    );
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setTasks((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((task) => task.id === active.id);
      const overIndex = overItems.findIndex((task) => task.id === over.id);

      let newIndex;
      if (over.id in prev) {
        // Dropping over a container (column)
        newIndex = overItems.length;
      } else {
        // Dropping over another task
        newIndex = overIndex >= 0 ? overIndex : 0;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter((task) => task.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeItems[activeIndex],
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) {
      setActiveId(null);
      return;
    }

    const activeIndex = tasks[activeContainer].findIndex((task) => task.id === active.id);
    const overIndex = tasks[overContainer].findIndex((task) => task.id === over.id);

    if (activeIndex !== overIndex) {
      setTasks((prev) => ({
        ...prev,
        [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
      }));
    }

    setActiveId(null);
  };

  const TaskCard = ({ task, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white rounded-lg p-4 mb-3 border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 text-gray-400">
            {/* Grip Vertical Icon - SVG */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>
        <h6 className="font-semibold text-sm mb-2">{task.title}</h6>
        <p className="text-xs text-gray-600 mb-3">{task.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {/* User Icon - SVG */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{task.assignee}</span>
        </div>
      </div>
    );
  };

  const Column = ({ columnId, title, tasks: columnTasks, bgColor }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: columnId,
    });

    return (
      <div className={`${bgColor} rounded-xl p-4`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
            {columnTasks.length}
          </span>
        </div>
        <SortableContext
          items={columnTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div 
            ref={setNodeRef}
            className={`space-y-3 min-h-[400px] transition-all rounded-lg ${
              isOver ? 'bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400' : ''
            }`}
          >
            {columnTasks.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <div className="text-center">
                  {/* Inbox Icon - SVG */}
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Drop tasks here</p>
                </div>
              </div>
            ) : (
              columnTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  // Custom Dropdown Component
  const CustomDropdown = ({ icon, value, options, dropdownKey, filterType }) => {
    const dropdownRef = useRef(null);
    const isOpen = openDropdown === dropdownKey;
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setOpenDropdown(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {/* Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
          
          <span className="text-left flex-1">{selectedOption?.label || 'Select...'}</span>
          
          {/* Chevron Down Icon */}
          <svg 
            className={`w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    [filterType]: option.value
                  }));
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer ${
                  value === option.value ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get the active task for drag overlay
  const activeTask = activeId
    ? Object.values(tasks)
        .flat()
        .find((task) => task.id === activeId)
    : null;

  // Options for dropdowns
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'todo', label: 'To Do' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

  const assigneeOptions = [
    { value: 'all', label: 'All Assigneed' },
    { value: 'qa', label: 'QA Team' },
    { value: 'dev', label: 'Dev Team' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className="flex-grow ml-[290px] p-8 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Task Management</h1>
        <p className="text-gray-500 mt-1">Track and manage your testing and development tasks</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Status dropdown selalu tampil */}
        <CustomDropdown
          dropdownKey="status"
          filterType="status"
          icon={
            <svg 
              className="w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
          value={filters.status}
          options={statusOptions}
        />

        {/* 🔹 Assignee dropdown HANYA tampil kalau bukan developer */}
        {role !== "developer" && (
          <CustomDropdown
            dropdownKey="assignee"
            filterType="assignee"
            icon={
              <svg 
                className="w-5 h-5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            value={filters.assignee}
            options={assigneeOptions}
          />
        )}

        <CustomDropdown
          dropdownKey="priority"
          filterType="priority"
          icon={
            <svg 
              className="w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          }
          value={filters.priority}
          options={priorityOptions}
        />
      </div>

      {/* Drag and Drop Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
        {/* Info Circle Icon - SVG */}
        <svg 
          className="w-5 h-5 text-blue-500 flex-shrink-0"
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Drag and drop tasks between columns to update their status
        </p>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Column
            columnId="todo"
            title="To Do"
            tasks={tasks.todo}
            bgColor="bg-gray-50"
          />
          <Column
            columnId="inProgress"
            title="In Progress"
            tasks={tasks.inProgress}
            bgColor="bg-yellow-50"
          />
          <Column
            columnId="done"
            title="Done"
            tasks={tasks.done}
            bgColor="bg-green-50"
          />
        </div>

        {/* Drag Overlay - shows the task being dragged */}
        <DragOverlay>
          {activeTask ? (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-400 shadow-2xl rotate-2 scale-105">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityClass(activeTask.priority)}`}>
                  {activeTask.priority}
                </span>
                <div className="flex items-center gap-1 text-gray-400">
                  {/* Grip Vertical Icon - SVG */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
              </div>
              <h6 className="font-semibold text-sm mb-2">{activeTask.title}</h6>
              <p className="text-xs text-gray-600 mb-3">{activeTask.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {/* User Icon - SVG */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{activeTask.assignee}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
