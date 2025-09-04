import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Stethoscope, 
  Users, 
  LayoutDashboard,
  Plus,
  Search,
  Bell,
  MessageSquare,
  History
} from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: location.pathname === '/',
    },
    {
      name: 'Patients',
      href: '/patients',
      icon: Users,
      current: location.pathname.startsWith('/patients'),
    },
    {
      name: 'Transcript Processor',
      href: '/transcript',
      icon: MessageSquare,
      current: location.pathname.startsWith('/transcript'),
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: History,
      current: location.pathname.startsWith('/sessions'),
    },
  ];

  const quickActions = [
    {
      name: 'New Patient',
      href: '/patients/new',
      icon: Plus,
    },
    {
      name: 'Process Transcript',
      href: '/transcript',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-medical-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                Clinical Assistant
              </h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients, notes..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors space-x-1"
                >
                  <action.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{action.name}</span>
                </Link>
              ))}
              
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-6">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    item.current
                      ? 'bg-medical-100 text-medical-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5',
                      item.current
                        ? 'text-medical-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>Clinical Assistant v1.0</p>
              <p className="mt-1">AI-powered medical documentation</p>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;