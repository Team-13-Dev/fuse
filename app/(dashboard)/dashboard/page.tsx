"use client"
import MainTabs from './components/dashboard-main-tabs';
import Header from './components/dashboard-header';
import AddProductDialog from '@/app/components/common/AddProductDialog';

const handleTest = async () => {
  const res = await fetch("/api/customers/create", {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({})
  });
  const data = await res.json();

  console.log(data);
}

const ChartIcon = (props : any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10"></path>
    <path d="M18 20V4"></path>
    <path d="M6 20v-4"></path>
  </svg>
);

const TimerIcon = (props : any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const CreditCardIcon = (props : any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const ChevronRight = (props : any) => (
  <svg {...props} xmlns="http://www.w3.org=" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const CircleIcon = (props : any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

// --- Data Structure Mocks ---
const METRIC_CARDS_DATA = [
  {
    title: "Number of Orders",
    value: "128",
    change: "+20%",
    period: "from last month",
    icon: ChartIcon,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  {
    title: "Average Revenue",
    value: "403 EGP",
    change: "+8%",
    period: "from last month",
    icon: TimerIcon,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Total Revenue",
    value: "31,250",
    change: "+15%",
    period: "from last month",
    icon: CreditCardIcon,
    iconColor: "text-teal-500",
    bgColor: "bg-teal-50",
  },
];

const AGENTS_DATA = [
  { name: "Astra", percentage: 38, totalCalls: 122, callMinutes: 187, creditsSpent: "14,320" },
  { name: "Zeus", percentage: 24, totalCalls: 76, callMinutes: 110, creditsSpent: "8,500" },
  { name: "Orus", percentage: 15, totalCalls: 48, callMinutes: 70, creditsSpent: "5,000" },
  { name: "Kore", percentage: 12, totalCalls: 38, callMinutes: 55, creditsSpent: "3,800" },
];

const LANGUAGE_DATA = [
  { lang: "Affiliate", usage: "45%" },
  { lang: "Direct Store", usage: "30%" },
  { lang: "Website", usage: "15%" },
  { lang: "Cold Calls", usage: "10%" },
];

// --- Sub-Components ---

const MetricCard = ({ title, value, change, period, icon: Icon, iconColor, bgColor } : { title: string, value: string , change: any, period: any, icon: any, iconColor: string, bgColor: string}) => (
  <div className="flex-1 min-w-0 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`p-2 rounded-full ${bgColor}`}>
        <Icon className={`${iconColor}`} />
      </div>
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">
        <span className="font-semibold text-green-600">{change}</span> {period}
      </p>
    </div>
  </div>
);

const AgentUsagePanel = () => {
  const totalPercentage = AGENTS_DATA.reduce((sum, agent) => sum + agent.percentage, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Most Called Agents</h3>
          <p className="text-5xl font-bold text-gray-900 mt-1">{totalPercentage}%</p>
          <p className="text-sm text-gray-500">Call Usage</p>
        </div>
        <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Full stats
          <ChevronRight className="ml-1" />
        </button>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full mt-4 flex overflow-hidden">
        {AGENTS_DATA.map((agent, index) => (
          <div
            key={agent.name}
            style={{ width: `${agent.percentage}%`, backgroundColor: getAgentColor(index) }}
            className="h-full"
            title={`${agent.name}: ${agent.percentage}%`}
          />
        ))}
      </div>

      <div className="mt-6 grow overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Agent</th>
              <th className="py-2">Total Calls</th>
              <th className="py-2">Call Minutes</th>
              <th className="py-2">Credits Spent</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS_DATA.map((agent, index) => (
              <tr key={agent.name} className="border-t border-gray-100">
                <td className="py-3 flex items-center">
                  <CircleIcon className={`w-2 h-2 mr-2`} style={{ color: getAgentColor(index) }} />
                  <span className="font-medium text-gray-900">{agent.name}</span>
                  <span className="ml-2 text-gray-500">{agent.percentage}%</span>
                </td>
                <td className="py-3 text-gray-700">{agent.totalCalls}</td>
                <td className="py-3 text-gray-700">{agent.callMinutes}</td>
                <td className="py-3 text-gray-700">{agent.creditsSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LanguageUsagePanel = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-xl font-semibold text-gray-800">Income Streams</h3>
    <p className="text-4xl font-bold text-gray-900 mt-2">4</p>
    <p className="text-sm text-gray-500">Streams</p>

    <div className="mt-6 space-y-3">
      {LANGUAGE_DATA.map((item, index) => (
        <div key={item.lang}>
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <CircleIcon className={`w-2 h-2 mr-2`} style={{ color: getLanguageColor(index) }} />
              {item.lang}
            </div>
            <span className="font-semibold text-gray-900">{item.usage}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: item.usage,
                backgroundColor: getLanguageColor(index),
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function for consistent colors
const getAgentColor = (index : number) => {
  const colors = ["#4f46e5", "#ec4899", "#f97316", "#10b981"]; // Indigo, Pink, Orange, Emerald
  return colors[index % colors.length];
};

const getLanguageColor = (index : number) => {
  const colors = ["#10b981", "#4f46e5", "#f97316", "#ec4899"]; // Emerald, Indigo, Orange, Pink
  return colors[index % colors.length];
};


const StaticLineChart = () => {
  // Static SVG to visually replicate the complex chart from the image.
  // The viewport (0, 0) to (100, 40) is used for easy percentage-based positioning.
  const CHART_HEIGHT = 40;
  const CHART_WIDTH = 100;

  const lines = [
    {
      data: "M0 6 C20 6, 30 6, 50 12 S80 18, 100 14", // Purple/Calls
      stroke: "#9333ea",
      name: "Number of Calls"
    },
    {
      data: "M0 14 C15 14, 30 14, 50 18 S70 12, 100 8", // Orange/Duration
      stroke: "#f97316",
      name: "Average Duration"
    },
    {
      data: "M0 16 C25 16, 45 10, 65 10 S80 16, 100 16", // Teal/Credits
      stroke: "#14b8a6",
      name: "Credits Spent"
    },
    {
      data: "M0 10 C20 10, 40 18, 60 14 S85 8, 100 6", // Blue/Other Metric
      stroke: "#3b82f6",
      name: "Other Metric"
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-2 justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Monthly Call Performance Overview</h2>
        <div className="flex space-x-4 text-sm text-gray-600">
          {lines.map((line) => (
            <div key={line.name} className="flex items-center">
              <CircleIcon className="mr-1" style={{ color: line.stroke }} />
              <span>{line.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-96">
        {/* Y-Axis Labels and Horizontal Grid Lines */}
        <div className="absolute inset-y-0 left-0 w-full pr-10 text-xs text-gray-400">
          {[10, 8, 6, 4, 2, 0].map((label, index) => (
            <div
              key={label}
              className="absolute right-full -translate-x-2"
              style={{
                top: `${(index / 5) * 80 + 5}%`, // Distribute labels evenly
                transform: `translateY(-50%)`,
              }}
            >
              {label}
            </div>
          ))}
          {/* Horizontal Grid Lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={`grid-${i}`}
              className="absolute border-t border-gray-200 w-full"
              style={{ top: `${(i / 5) * 80 + 5}%` }}
            />
          ))}
        </div>

        {/* SVG Chart Area */}
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-4/5 mt-5"
        >
          {lines.map((line) => (
            <path
              key={line.name}
              d={line.data}
              fill="none"
              stroke={line.stroke}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>Jun 01</span>
          <span>Jun 08</span>
          <span>Jun 15</span>
          <span>Jun 22</span>
          <span>Jun 29</span>
        </div>
      </div>
    </div>
  );
};


// --- Main Layout Components ---


// --- App Component ---
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <MainTabs />

      <main className="p-8 max-w-400 mx-auto">
        {/* Main Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* 1. Key Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {METRIC_CARDS_DATA.map((card) => (
            <MetricCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <StaticLineChart />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">Quick Actions</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your agents and credits.</p>
              <div className="mt-4 space-y-2">
                <AddProductDialog />
                <button onClick={() => handleTest()} className="w-full text-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150">
                  Add Coupons
                </button>
              </div>
            </div>
            {/* Language Usage Panel */}
            <LanguageUsagePanel />
          </div>

          {/* Agent Usage Panel (Under Chart on mobile/tablet, full width under all on desktop) */}
          <div className="lg:col-span-8">
            <AgentUsagePanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;