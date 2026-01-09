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



  const [activeId, setActiveId] = useState(null);

  // state user
  const [user, setUser] = useState(null);

  // ambil role dari backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data); // { username, role }
        }
      } catch (err) {
        console.error("Error fetch /auth/me di TaskManagement:", err);
      }
    };

    fetchUser();
  }, []);

  const role = user?.role;
  const username = user?.username;

  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "dev") return;

    const fetchDevelopers = async () => {
      const res = await fetch("http://localhost:3000/api/developers", {
        credentials: "include",
      });
      if (res.ok) setDevelopers(await res.json());
    };

    fetchDevelopers();
  }, [user]);

  const [tasksByColumn, setTasksByColumn] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });

  useEffect(() => {
  if (!user) return;

  const fetchTasks = async () => {
      const params = new URLSearchParams({
        status: filters.status,
        priority: filters.priority,
      });

      // QA boleh filter assignee
      if (user.role !== "dev") {
        params.set("assignee", filters.assignee);
      }

      const res = await fetch(
        `http://localhost:3000/api/task-management?${params.toString()}`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const list = await res.json();

      const mapStatus = (s) => {
        const v = (s || "").toLowerCase().trim();
        if (v === "todo" || v === "to do") return "todo";
        if (v === "inprogress" || v === "in progress") return "inProgress";
        if (v === "done") return "done";
        return null;
      };

      const grouped = { todo: [], inProgress: [], done: [] };
      for (const t of list) {
        const key = mapStatus(t.status);
        if (key) grouped[key].push(t);
      }
      setTasksByColumn(grouped);

    };

    fetchTasks();
  }, [user, filters.status, filters.priority, filters.assignee]);



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
      case 'High': return 'bg-[#FFCDCF] text-[#BD0108]';
      case 'Medium': return 'bg-[#FFEAD2] text-[#FF6200]';
      case 'Low': return 'bg-[#EFEFEF] text-[#757373]';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Find which container a task belongs to
  const findContainer = (id) => {
    if (id in tasksByColumn) return id;

    return Object.keys(tasksByColumn).find((key) =>
      tasksByColumn[key].some((task) => task.id === id)
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

    setTasksByColumn((prev) => {
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

    const activeIndex = tasksByColumn[activeContainer].findIndex((task) => task.id === active.id);
    const overIndex = tasksByColumn[overContainer].findIndex((task) => task.id === over.id);

    if (activeIndex !== overIndex) {
      setTasksByColumn((prev) => ({
        ...prev,
        [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
      }));
    }

    setActiveId(null);
  };

  const TaskCard = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: String(task.id) });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      // task card
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white rounded-lg p-4 mb-3 border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <span className={`px-3 py-1 rounded text-sm font-semibold uppercase ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 text-gray-400">
            {/* Grip Vertical Icon - SVG */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>
        {task.suiteName && (
          <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 mb-2 truncate max-w-full">
            {task.suiteName}
          </span>
        )}
        <h6 className="font-semibold mb-2">{task.title}</h6>
        <p className="text-sm font-medium text-gray-600 mb-3 break-words whitespace-pre-wrap">{task.notes}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {/* User Icon - SVG */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{task.assignDev}</span>
        </div>
      </div>
    );
  };

  const Column = ({ columnId, title, tasks: columnTasks, bgColor, stColor }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: columnId,
    });

    return (
      <div className={`${bgColor} rounded-xl p-4 ring-1 ring-gray-200`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className={`${stColor} px-3 py-1 rounded-lg text-sm font-medium ring-1 ring-black/5`}>
            {columnTasks.length}
          </span>
        </div>
        <SortableContext
          items={columnTasks.map((task) => String(task.id) )}
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
            className={`w-4 h-4 text-gray-400 absolute right-4 transition-transform ${ isOpen ? 'rotate-180' : ''}`}
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
    ? Object.values(tasksByColumn)
        .flat()
        .find((task) => String(task.id) === String(activeId))
    : null;

  // Options for dropdowns
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' }
  ];

  const assigneeOptions = [
    { value: "all", label: "All Assignee" },
      ...developers.map((d) => ({ value: d.username, label: d.username })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className="flex-grow ml-[260px] pt-4 pb-8 pr-8 pl-8 min-h-screen overflow-y-auto">
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

        {/* Assignee dropdown HANYA tampil kalau bukan developer */}
        {user?.role !== "dev" && ( 
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


      {/* tip hanya tampil kalau role developer */}
      {user?.role === "dev" && (
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
      )}

      {/* Kanban Board with Drag & Drop */}
      <DndContext
        sensors={user?.role === "dev" ? sensors : []}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Column
            columnId="todo"
            title="To Do"
            tasks={tasksByColumn.todo}
            stColor="bg-[#FFFFFF]"
            bgColor="bg-[#F5F5F5]"
          />
          <Column
            columnId="inProgress"
            title="In Progress"
            tasks={tasksByColumn.inProgress}
            stColor="bg-[#FDFFDB]"
            bgColor="bg-[#F5F5F5]"
          />
          <Column
            columnId="done"
            title="Done"
            tasks={tasksByColumn.done}
            stColor="bg-[#E5FFE8]"
            bgColor="bg-[#F5F5F5]"
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
              {task.suiteName && (
                <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 mb-2 truncate max-w-full">
                {task.suiteName}
                </span>
              )}
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
