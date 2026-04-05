import { BellIcon, ChevronRight, SearchIcon, UserIcon } from 'lucide-react';

const Header = () => (
  <header className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-xl border-gray-100 sticky top-0 z-10">
    <div className="flex items-center space-x-2">
        <ChevronRight className="text-gray-300" />
        <img src="https://placehold.co/20x20/4f46e5/ffffff/png?text=W" alt="Logo" className="rounded-full" />
        <span className="text-lg font-semibold text-gray-800">Local Business</span>
        <ChevronRight className="text-gray-300" />
        <span className="text-gray-500">Dashboard</span>
    </div>
    <div className="items-center space-x-4 hidden xl:flex">
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <BellIcon className="text-gray-500 cursor-pointer hover:text-indigo-600" />
      <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium cursor-pointer">
        <UserIcon className="w-4 h-4" />
      </div>
    </div>
  </header>
);


export default Header
