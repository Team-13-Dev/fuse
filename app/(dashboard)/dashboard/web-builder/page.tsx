import { 
  ChevronDown, Monitor, Tablet, Smartphone, 
  Leaf, BarChart, Plus, CheckCircle2,
  Menu, Square, LayoutGrid, List, AlignJustify, MessageSquare, ArrowRight
} from 'lucide-react';

export default function WebsiteBuilder() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-6">
          <h1 className="text-lg font-bold text-gray-900">Website Builder</h1>
          <div className="w-px h-6 bg-gray-300"></div>
          <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            Editor: The Local Business v2
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="flex items-center space-x-6">
          {/* Device Toggles */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button className="p-1.5 bg-white rounded shadow-sm text-gray-900">
              <Monitor className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-900">
              <Tablet className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-900">
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Preview
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors">
            Publish
          </button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT WORKSPACE (Canvas) */}
        <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          
          {/* Your Stores Section */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Your Stores</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Manage All</button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Active Store Card */}
              <div className="bg-white border-2 border-blue-500 rounded-xl p-3 flex items-center w-64 shadow-sm relative cursor-pointer">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">The Local Business...</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Editing Now</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-blue-500 absolute right-4" />
              </div>

              {/* Inactive Store Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center w-64 opacity-80 cursor-pointer hover:border-gray-300">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mr-3">
                  <BarChart className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">The Local Business</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Edited 1d ago</p>
                </div>
              </div>

              {/* New Site Button */}
              <button className="border-2 border-dashed border-gray-300 rounded-xl h-16 flex items-center justify-center w-48 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">New Site</span>
              </button>
            </div>
          </div>

          {/* Website Canvas Preview */}
          <div className="px-8 pb-12 flex justify-center">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              
              {/* Canvas: Header */}
              <div className="px-8 py-6 flex justify-between items-center">
                <div className="text-lg font-bold">
                  <span className="text-blue-600">The Local Business</span>
                </div>
                <nav className="flex space-x-6 text-sm font-medium text-gray-600">
                  <a href="#" className="hover:text-gray-900">Shop</a>
                  <a href="#" className="hover:text-gray-900">About</a>
                  <a href="#" className="hover:text-gray-900">Journal</a>
                  <a href="#" className="hover:text-gray-900">Contact</a>
                </nav>
              </div>

              {/* Canvas: Hero Section (using gradient instead of image) */}
              <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-center py-24 px-8 relative overflow-hidden">
                 {/* Decorative background circles to mimic depth */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl font-extrabold text-white mb-4">Local Business.</h2>
                  <p className="text-teal-50 max-w-lg mx-auto mb-8 text-lg">
                    Delivering the best quality right to your doorstep, every single day.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md transition-colors">
                    Shop items
                  </button>
                </div>
              </div>

              {/* Canvas: Products Section */}
              <div className="px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Best Sellers</h3>
                  <a href="#" className="text-blue-600 font-medium flex items-center text-sm hover:underline">
                    See all products <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {/* Product 1 */}
                  <div className="bg-[#8C9C81] aspect-square rounded-xl flex flex-col items-center justify-end pb-8 relative group cursor-pointer shadow-inner">
                    <div className="w-16 h-24 bg-white rounded-md shadow-lg flex items-center justify-center font-serif text-3xl text-gray-300 border border-gray-100">I</div>
                  </div>
                  {/* Product 2 */}
                  <div className="bg-[#425946] aspect-square rounded-xl flex flex-col items-center justify-end pb-8 relative group cursor-pointer shadow-inner">
                    <div className="w-12 h-16 bg-white rounded-md shadow-lg flex items-center justify-center font-serif text-xl text-gray-300 border border-gray-100 z-10">2</div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-4 bg-yellow-600 rounded-sm opacity-50 blur-sm"></div>
                  </div>
                  {/* Add Product Area */}
                  <button className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl aspect-square flex flex-col items-center justify-center text-blue-400 hover:bg-blue-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-200/50 rounded-full flex items-center justify-center mb-3">
                      <Plus className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-blue-400">ADD PRODUCT</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR (Tools & Settings) */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-bold text-gray-900">Building Blocks</h2>
            <p className="text-xs text-gray-500 mt-1 mb-6">Drag elements onto the canvas</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <Menu className="w-6 h-6 text-gray-400 mb-3" />
                <span className="text-xs font-semibold text-gray-700">Header</span>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <Square className="w-6 h-6 text-blue-500 mb-3 fill-blue-500" />
                <span className="text-xs font-semibold text-gray-700">Hero Section</span>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <LayoutGrid className="w-6 h-6 text-gray-400 mb-3" />
                <span className="text-xs font-semibold text-gray-700">Product Grid</span>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <List className="w-6 h-6 text-gray-400 mb-3" />
                <span className="text-xs font-semibold text-gray-700">Contact Form</span>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <AlignJustify className="w-6 h-6 text-gray-400 mb-3" />
                <span className="text-xs font-semibold text-gray-700">Footer</span>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all bg-gray-50/50">
                <MessageSquare className="w-6 h-6 text-gray-400 mb-3" />
                <span className="text-xs font-semibold text-gray-700">Testimonials</span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-gray-100">
            <h2 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-5">Quick Styles</h2>
            
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-gray-700">Primary Hue</span>
              <div className="flex space-x-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 ring-2 ring-blue-500/30 ring-offset-1 cursor-pointer"></div>
                <div className="w-5 h-5 rounded-full bg-green-500 cursor-pointer hover:opacity-80"></div>
                <div className="w-5 h-5 rounded-full bg-orange-500 cursor-pointer hover:opacity-80"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Font Family</span>
              <div className="border border-gray-200 rounded text-xs px-3 py-1.5 text-gray-600 bg-gray-50 cursor-pointer hover:bg-gray-100">
                Inter Sans
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}