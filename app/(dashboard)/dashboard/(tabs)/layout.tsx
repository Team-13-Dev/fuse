import React from 'react'
import MainTabs from '../components/dashboard-main-tabs'
import Header from '../components/dashboard-header'

const layout = ({ children } : { children: React.ReactNode }) => {
  return (
    <div>
        <div className='sticky top-0 left-0'>
            <Header />
            <MainTabs />
        </div>
        {
        children
        }
    </div>
  )
}

export default layout
