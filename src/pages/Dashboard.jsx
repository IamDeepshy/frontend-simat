import React from "react";
import ChartSection from "../components/Chart";
import Header from "../components/Header";
import { Navigate } from "react-router-dom";
  

export default function Dashboard() {
  const stats = [
    {
      title: "Total Test Cases",
      value: "1,234",
      icon: "/assets/icon/list.svg",
      bgColor: "bg-[#EFF6FF]",
    },
    {
      title: "Total Test Passed",
      value: "1,234",
      icon: "/assets/icon/passed.svg",
      bgColor: "bg-[#F0FDF4]",
    },
    {
      title: "Total Test Failed",
      value: "1,234",
      icon: "/assets/icon/failed.svg",
      bgColor: "bg-[#FEF2F2]",
    },
    {
      title: "In Progress Task",
      value: "1,234",
      icon: "/assets/icon/progress.svg",
      bgColor: "bg-[#FEFCE8]",
    },
  ];

  const suites = [
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
    { id: "AT-CORE-0034", status: "passed", passed: 15, total: 0, percentage: 100 },
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
    { id: "AT-CORE-0034", status: "failed", passed: 18, total: 2, percentage: 90 },
  ];

  return (
    <div className="flex-grow ml-[290px] p-4 min-h-screen overflow-y-auto">
      {/* Header Section */}
      <Header />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div>
              <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
            <div className={`${stat.bgColor} w-[60px] h-[48px] rounded-xl flex items-center justify-center shadow-sm`}>
              <img src={stat.icon} alt={stat.title} className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <ChartSection />

      {/* Suites Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
        <h4 className="font-semibold text-lg mb-4">Suites</h4>
        <div className="space-y-3">
          {suites.map((suite, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`w-2 h-2 rounded-full ${suite.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h6 className="font-medium flex-1">{suite.id}</h6>
              <span className="text-sm text-teal-600">{suite.passed}/{suite.total}</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-500 h-2 rounded-full" 
                  style={{ width: `${suite.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">{suite.percentage}%</span>
            </div>
          ))}
        </div>
        
        <button className="w-full bg-black text-white py-3 rounded-lg mt-4 hover:bg-gray-800 transition-colors">
          View All Suites
        </button>
      </div>
    </div>
  );
}