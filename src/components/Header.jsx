import React from "react";

export default function Header() {
  return (
    <div className="flex justify-between items-center bg-white rounded-[20px] shadow-sm overflow-hidden">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">Hello, QA!</h1>
        <p className="text-gray-500 text-lg mt-1">It's good to see you again.</p>
      </div>
      
      <img 
        src="/assets/image/header.png" 
        alt="Header Illustration" 
        className="w-[500px] p-2"
      />
    </div>
  );
}