"use client"

import Sidebar from "./components/dashboard-sidebar"
const Layout = ({ children }: { children: React.ReactNode}) => {

  return (
    <div className="h-screen flex">
        <Sidebar />
        <div className="overflow-y-auto w-full">
            {children}
        </div>
    </div>
  )
}

export default Layout
