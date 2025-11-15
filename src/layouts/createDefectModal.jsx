import React, { useState } from 'react';

const CreateDefectModal = ({ isOpen, onClose, testCaseName, onCreateDefect }) => {
  const [formData, setFormData] = useState({
    defectTitle: '',
    assignedTo: '',
    priority: '',
    status: 'todo',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});

  const developers = [
    { id: 'dev1', name: 'Anang Programmer' },
    { id: 'dev2', name: 'Ani Programmer' },
    { id: 'dev3', name: 'Ali Programmer' },
    { id: 'dev4', name: 'Budi Developer' },
    { id: 'dev5', name: 'Citra QA' }
  ];

  const priorities = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statuses = [
    { value: 'todo', label: 'To Do' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Create defect data
      const defectData = {
        id: `defect-${Date.now()}`,
        title: formData.defectTitle,
        description: formData.additionalNotes || `Defect from test: ${testCaseName}`,
        assignee: developers.find(dev => dev.id === formData.assignedTo)?.name || '',
        priority: formData.priority,
        status: formData.status,
        testCase: testCaseName,
        createdAt: new Date().toISOString()
      };

      // Call parent callback
      if (onCreateDefect) {
        onCreateDefect(defectData);
      }

      // Reset form and close
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      defectTitle: '',
      assignedTo: '',
      priority: '',
      status: 'todo',
      additionalNotes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Assign to Developer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Developer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all ${
                    errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a developer</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
                {/* Chevron Down Icon */}
                <svg 
                  className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {errors.assignedTo && (
                <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
              )}
            </div>

            {/* Priority and Status - Two Columns */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all ${
                      errors.priority ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select priority</option>
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                  {/* Chevron Down Icon */}
                  <svg 
                    className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.priority && (
                  <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  {/* Chevron Down Icon */}
                  <svg 
                    className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Describe the issue, steps to reproduce, expected vs actual behavior..."
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
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