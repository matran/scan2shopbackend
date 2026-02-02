'use client'

import { useEffect, useState } from 'react'
import { Package, Users, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react'

interface Analytics {
  stats: {
    totalUsers: number
    totalProducts: number
    totalOrders: number
  }
  recentOrders: any[]
  topProducts: any[]
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/dashboard/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: analytics?.stats.totalUsers || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Total Products',
      value: analytics?.stats.totalProducts || 0,
      icon: Package,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      change: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: analytics?.stats.totalOrders || 0,
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      change: '+23.1%',
      trend: 'up',
    },
    {
      title: 'Revenue',
      value: 'KSh 0',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      change: '+0%',
      trend: 'neutral',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.4s ease-out;
        }

        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card:hover {
          transform: translateY(-4px) scale(1.02);
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .order-row {
          transition: all 0.2s ease;
        }

        .order-row:hover {
          transform: scale(1.01);
          background: rgba(16, 185, 129, 0.03);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`stat-card bg-gradient-to-br ${stat.bgGradient} rounded-2xl shadow-lg border border-white/50 p-6 relative overflow-hidden animate-scale-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                    stat.trend === 'down' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-600 mt-1">Latest transactions from your store</p>
            </div>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-200">
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.recentOrders.slice(0, 5).map((order, idx) => (
                <tr key={order.id} className="order-row" style={{ animationDelay: `${idx * 50}ms` }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      #{order.id.substring(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {order.user.firstName?.charAt(0)}{order.user.lastName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {order.user.firstName} {order.user.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      KSh {order.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' :
                      'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        order.status === 'COMPLETED' ? 'bg-green-500' :
                        order.status === 'PENDING' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {analytics?.recentOrders.slice(0, 5).map((order, idx) => (
            <div key={order.id} className="p-4 hover:bg-emerald-50/30 transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {order.user.firstName?.charAt(0)}{order.user.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-gray-500">
                      #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-900">
                  KSh {order.totalAmount.toFixed(2)}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {(!analytics?.recentOrders || analytics.recentOrders.length === 0) && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recent orders found</p>
            <p className="text-sm text-gray-400 mt-1">Orders will appear here once customers start shopping</p>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900">Top Selling Products</h2>
          <p className="text-sm text-gray-600 mt-1">Best performing items this month</p>
        </div>
        <div className="p-6">
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topProducts.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group border border-transparent hover:border-purple-200"
                >
                  <div className="flex items-center flex-1 min-w-0 gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-purple-700 transition-colors">
                        {item.product?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                        KSh {item.product?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-gray-900 text-base sm:text-lg">
                      {item.count}
                    </p>
                    <p className="text-xs text-gray-500">sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No product data available</p>
              <p className="text-sm text-gray-400 mt-1">Sales data will appear here as orders are processed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}