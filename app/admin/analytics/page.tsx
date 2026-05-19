"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Send, CheckCircle2, XCircle, Clock, 
  MessageSquare, TrendingUp, Calendar, ArrowUpRight
} from "lucide-react";

interface AnalyticsData {
  todayStats: {
    sent: number;
    delivered: number;
    failed: number;
  };
  campaignsActive: number;
  deliveryRate: number;
  recentMessages: any[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics/whatsapp");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <CheckCircle2 className="w-4 h-4 text-[#25D366]" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'sent':
      default:
        return <CheckCircle2 className="w-4 h-4 text-warm-400" />; // single tick
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">WhatsApp Analytics</h1>
          <p className="text-warm-500 text-sm mt-1">
            Real-time performance metrics for your messaging campaigns
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-warm-100 rounded-xl mb-4" />
              <div className="h-8 bg-warm-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-warm-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 mb-4">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-black text-warm-900">{data.todayStats.sent}</p>
              <p className="text-sm font-bold text-warm-500 mt-1">Messages Sent Today</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#25D366]/10 mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
              </div>
              <p className="text-3xl font-black text-warm-900">{data.todayStats.delivered}</p>
              <p className="text-sm font-bold text-warm-500 mt-1">Delivered Today</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 mb-4 relative z-10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-black text-warm-900 relative z-10">{data.deliveryRate}%</p>
              <p className="text-sm font-bold text-warm-500 mt-1 relative z-10">Overall Delivery Rate</p>
              
              {data.deliveryRate >= 95 && (
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-warm-900">{data.campaignsActive}</p>
              <p className="text-sm font-bold text-warm-500 mt-1">Active Campaigns</p>
            </motion.div>
          </div>

          {/* Recent Messages Log */}
          <div className="bg-white rounded-2xl border border-warm-200/60 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-warm-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-warm-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Recent Message Log
                </h3>
                <p className="text-xs text-warm-500 mt-1">Live feed of WhatsApp interactions</p>
              </div>
            </div>
            
            <div className="divide-y divide-warm-100">
              {data.recentMessages.length === 0 ? (
                <div className="p-8 text-center text-warm-500 text-sm">
                  No messages sent recently.
                </div>
              ) : (
                data.recentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 md:px-6 hover:bg-warm-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#cc1530] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.customer?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-warm-900 text-sm">{msg.customer?.name || 'Unknown'}</p>
                          <span className="text-[10px] bg-warm-200 text-warm-700 px-1.5 py-0.5 rounded font-mono">
                            {msg.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-warm-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            {msg.messageType === 'marketing' ? 'Marketing' : 'Order Update'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-warm-200 rounded-lg shadow-sm">
                        {getStatusIcon(msg.status)}
                        <span className="text-xs font-bold text-warm-700 capitalize">{msg.status}</span>
                      </div>
                      {msg.campaign && (
                        <span className="text-[10px] text-warm-400">Campaign: {msg.campaign.name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
