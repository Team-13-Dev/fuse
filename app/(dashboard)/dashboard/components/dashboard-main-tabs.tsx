"use client"

import { useState } from 'react'
const MainTabs = () => {
  const tabs = [
    "Dashboard",
    "Transactions",
    "Reviews & Surveys",
    "Orders",
    "Team",
    "Affiliate Programs",
    "Integrations",
    "Products",
    "Campaigns",
    "Customers",
    "Coupons"
  ];
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="hidden lg:flex flex-nowrap space-x-8 border-b border-gray-200 px-8 bg-white">
      {tabs.map((tab) => (
        <a
          href='/dashboard/customers'
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`py-3 text-sm font-medium transition-all duration-150 flex-nowrap ${
            activeTab === tab
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
          }`}
        >
          {tab}
        </a>
      ))}
    </div>
  );
};

export default MainTabs
