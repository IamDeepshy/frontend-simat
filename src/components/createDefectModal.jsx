  import React, { useState, useRef, useEffect } from 'react';
  import Swal from "sweetalert2";

  const CreateDefectModal = ({ isOpen, onClose, testCaseName, testSpecId }) => {
    const [formData, setFormData] = useState({
      defectTitle: '',
      assignedTo: '',
      priority: '',
      additionalNotes: ''
    });

    const [errors, setErrors] = useState({});
    
    // State untuk track dropdown mana yang open
    const [openDropdown, setOpenDropdown] = useState(null);
    
    // Refs untuk detect click outside
    const assigneeRef = useRef(null);
    const priorityRef = useRef(null);

    const [developers, setDevelopers] = useState([]);

    const priorities = [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ];

    // Ambil data role developer
    useEffect(() => {
      const fetchDevelopers = async () => {
        try {
          const res = await fetch(
            "http://localhost:3000/api/developers",
            {
              credentials: "include"
            }
          );

          const data = await res.json();
          setDevelopers(data);
        } catch (err) {
          console.error(err);
        }
      };

      fetchDevelopers();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (assigneeRef.current && !assigneeRef.current.contains(event.target)) {
          if (openDropdown === 'assignee') setOpenDropdown(null);
        }
        if (priorityRef.current && !priorityRef.current.contains(event.target)) {
          if (openDropdown === 'priority') setOpenDropdown(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    // Get display text for selected values
    const getAssigneeLabel = () => {
      const dev = developers.find(d => String(d.id) === String(formData.assignedTo));
      return dev ? dev.username : 'Select a developer';
    };
    

    const getPriorityLabel = () => {
      const priority = priorities.find(p => p.value === formData.priority);
      return priority ? priority.label : 'Select priority';
    };

    // Handle dropdown selection
    const handleDropdownSelect = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
      
      // Close dropdown
      setOpenDropdown(null);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    };

    const validateForm = () => {
      const newErrors = {};

      if (!formData.defectTitle.trim()) {
        newErrors.defectTitle = 'Defect title is required';
      }

      if (!formData.assignedTo) {
        newErrors.assignedTo = 'Please select a developer';
      }

      if (!formData.priority) {
        newErrors.priority = 'Please select a priority';
      }

      if (!formData.additionalNotes.trim()) {
        newErrors.additionalNotes = 'Additional notes are required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Pastikan testSpecId ada (kalau kosong, backend pasti gagal)
      if (!testSpecId) {
        setErrors((prev) => ({
          ...prev,
          submit: "Id test spec kosong.",
        }));
        return;
      }

      if (!validateForm()) return;

      const devUsername =
          developers.find((dev) => String(dev.id) === String(formData.assignedTo))?.username || "";

      try {

        // Payload ke backend 
        const payload = {
          testSpecId: Number(testSpecId),
          title: formData.defectTitle,
          assignDevId: Number(formData.assignedTo),
          priority: formData.priority,
          status: "To Do",
          notes:
            formData.additionalNotes?.trim() || "",
        };

        // Call API backend
        const res = await fetch("http://localhost:3000/api/defects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create defect.");

        handleClose();

        await Swal.fire({
            title: "Create defect succesful",
            icon: "success",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: true,
            html: `
              <p class="text-sm text-gray-500">
                Defect report from test: <b>${testCaseName}</b><br/>
                successfully created and assigned to <b>${devUsername}</b>.
              </p>
            `,
            confirmButtonText: 'OK',
            buttonsStyling: false,
            customClass: {
              confirmButton:
                'bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800',
            },
        });

      } catch (err) {
        console.error(err);
        setErrors((prev) => ({ ...prev, submit: err.message }));
        
        await Swal.fire({
          title: "Create defect failed",
          icon: "error",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: true,
          html: `
            <p class="text-sm text-gray-500">
              ${err.message}
            </p>
          `,
          confirmButtonText: "OK",
                    buttonsStyling: false,
          customClass: {
            confirmButton:
              'bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800',
          },
        });
      }
    };

    const handleClose = () => {
      setFormData({
        defectTitle: '',
        assignedTo: '',
        priority: '',
        additionalNotes: ''
      });
      setErrors({});
      setOpenDropdown(null); // Close any open dropdown
      onClose();
    };

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Hide scrollbar for Chrome, Safari, Opera */}
            <style>{`
              .bg-white::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Defect Report</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Report a defect from failed test: <span className="font-medium text-gray-700">{testCaseName}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                {/* Close Icon - SVG */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Defect Title */}
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Defect Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="defectTitle"
                  value={formData.defectTitle}
                  onChange={handleChange}
                  placeholder="e.g., Table header showing incorrect number of columns"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.defectTitle ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.defectTitle && (
                  <p className="text-red-500 text-xs mt-1">{errors.defectTitle}</p>
                )}
              </div>

              {/* Assign to Developer - DROPDOWN */}
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Assign to Developer <span className="text-red-500">*</span>
                </label>
                <div ref={assigneeRef} className="relative">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left flex items-center justify-between ${
                      errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                    } ${!formData.assignedTo ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    <span>{getAssigneeLabel()}</span>
                    {/* Chevron Icon */}
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'assignee' ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Options */}
                  {openDropdown === 'assignee' && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {developers.map((dev, index) => (
                        <button
                          key={dev.id}
                          type="button"
                          onClick={() => handleDropdownSelect('assignedTo', String(dev.id))}
                          className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                            String(formData.assignedTo) === String(dev.id) ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-900'
                          } ${index === 0 ? 'rounded-t-xl' : ''} ${index === developers.length - 1 ? 'rounded-b-xl' : ''}`}
                        >
                          {dev.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.assignedTo && (
                  <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
                )}
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div ref={priorityRef} className="relative">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left flex items-center justify-between ${
                      errors.priority ? 'border-red-500' : 'border-gray-300'
                    } ${!formData.priority ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    <span>{getPriorityLabel()}</span>
                    {/* Chevron Icon */}
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'priority' ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Options */}
                  {openDropdown === 'priority' && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {priorities.map((priority, index) => (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => handleDropdownSelect('priority', priority.value)}
                          className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                            formData.priority === priority.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-900'
                          } ${index === 0 ? 'rounded-t-xl' : ''} ${index === priorities.length - 1 ? 'rounded-b-xl' : ''}`}
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.priority && (
                  <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
                )}
              </div> 

              {/* Additional Notes */}
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Additional Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Describe the issue, steps to reproduce, expected vs actual behavior..."
                  rows="4"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.additionalNotes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.additionalNotes && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.additionalNotes}
                  </p>
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                {/* Info Icon - SVG */}
                <svg 
                  className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                  A task will be automatically created in <strong>Task Management</strong> and assigned to the selected developer.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
                >
                  Create Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

  export default CreateDefectModal;