"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, Users, LayoutTemplate, Calendar, 
  BarChart, Play, CheckCircle2, Clock, Check, X, RefreshCw
} from "lucide-react";
import AdminToasts from "@/components/admin/Toast";

interface Campaign {
  id: string;
  name: string;
  type: string;
  templateName: string;
  status: string;
  targetType: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  createdAt: string;
  sentAt: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/campaigns");
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 15000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const handleStartCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to send this campaign now?")) return;
    
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" });
      if (res.ok) {
        fetchCampaigns();
      } else {
        alert("Failed to start campaign");
      }
    } catch (error) {
      console.error("Failed to start campaign:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sending':
        return <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5 animate-pulse" /> Sending</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-xs font-bold bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case 'draft':
      default:
        return <span className="flex items-center gap-1 text-xs font-bold bg-warm-200 text-warm-700 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Marketing Campaigns</h1>
          <p className="text-warm-500 text-sm mt-1">
            Send bulk WhatsApp messages and track performance
          </p>
        </div>
        <motion.button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </motion.button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60 shadow-sm">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-warm-700">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <p className="font-semibold text-warm-900 text-lg">No campaigns yet</p>
          <p className="text-warm-500 text-sm mt-1 mb-6 max-w-sm">Create your first marketing campaign to engage with your customers via WhatsApp.</p>
          <motion.button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-[#cc1530] transition-all cursor-pointer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" /> Create Campaign
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-5 border-b border-warm-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-warm-900 text-lg truncate pr-2">{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-warm-600">
                    <LayoutTemplate className="w-4 h-4 text-warm-400" />
                    <span className="font-medium">Template:</span> <span className="truncate">{campaign.templateName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-warm-600">
                    <Users className="w-4 h-4 text-warm-400" />
                    <span className="font-medium">Target:</span> {campaign.targetType === 'all' ? 'All Opt-in Customers' : `Group: ${campaign.targetType}`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-warm-600">
                    <Calendar className="w-4 h-4 text-warm-400" />
                    <span className="font-medium">Created:</span> {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {campaign.status === 'draft' ? (
                <div className="p-4 bg-warm-50 border-t border-warm-100 flex justify-end">
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-warm-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors cursor-pointer w-full justify-center"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Send Campaign Now
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-warm-50 border-t border-warm-100">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-black text-warm-900">{campaign.totalRecipients}</p>
                      <p className="text-[9px] font-bold text-warm-500 uppercase tracking-widest mt-0.5">Target</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-blue-600">{campaign.sent}</p>
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Sent</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-[#25D366]">{campaign.delivered}</p>
                      <p className="text-[9px] font-bold text-[#25D366] uppercase tracking-widest mt-0.5">Dlvd</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-600">{campaign.read}</p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Read</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {campaign.totalRecipients > 0 && (
                    <div className="mt-4 h-1.5 w-full bg-warm-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: `${(campaign.sent / campaign.totalRecipients) * 100}%` }} />
                      <div className="h-full bg-[#25D366]" style={{ width: `${(campaign.delivered / campaign.totalRecipients) * 100}%`, marginLeft: `-${(campaign.sent / campaign.totalRecipients) * 100}%` }} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Campaign Creation Wizard (Simplified Modal) */}
      <AnimatePresence>
        {showWizard && (
          <CampaignWizard onClose={() => setShowWizard(false)} onComplete={fetchCampaigns} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignWizard({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any>({ total: 0, byGroup: {} });
  
  // Form State
  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetGroup, setTargetGroup] = useState("regular");
  const [headerImage, setHeaderImage] = useState("");

  const selectedTemplate = templates.find(t => t.templateName === templateName);
  const requiresImageHeader = selectedTemplate?.components?.some((c: any) => c.type === 'HEADER' && c.format === 'IMAGE');

  useEffect(() => {
    if (templateName) {
      const selected = templates.find(t => t.templateName === templateName);
      const headerComp = selected?.components?.find((c: any) => c.type === 'HEADER' && c.format === 'IMAGE');
      if (headerComp && headerComp.example?.header_handle?.[0]) {
        setHeaderImage(headerComp.example.header_handle[0]);
      } else {
        setHeaderImage("");
      }
    } else {
      setHeaderImage("");
    }
  }, [templateName, templates]);
  
  // Fetch initial data
  useEffect(() => {
    async function init() {
      try {
        const [tplRes, cstRes] = await Promise.all([
          fetch("/api/admin/templates"),
          fetch("/api/admin/customers?limit=1&optIn=true") // Just to get total opted in
        ]);
        
        if (tplRes.ok) {
          const tpls = await tplRes.json();
          setTemplates(tpls.filter((t: any) => t.status === 'APPROVED'));
        }
        if (cstRes.ok) {
          const csts = await cstRes.json();
          setCustomers({ total: csts.pagination?.total || 0, byGroup: {} });
        }
      } catch (e) {}
    }
    init();
  }, []);

  const handleCreate = async () => {
    if (!name || !templateName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateName,
          targetType,
          targetGroup: targetType === 'group' ? targetGroup : undefined,
          headerImage: requiresImageHeader ? headerImage : undefined
        })
      });
      if (res.ok) {
        onComplete();
        onClose();
      } else {
        alert("Failed to create campaign");
      }
    } catch (e) {
      alert("Error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl relative z-10 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-warm-100 transition-colors"
        >
          <X className="w-5 h-5 text-warm-500" />
        </button>

        <h2 className="text-2xl font-bold text-warm-900 mb-6">Create Campaign</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-warm-700 mb-2">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Diwali Special Offer"
              className="w-full px-4 py-3 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-warm-700 mb-2">Select Template</label>
            <select
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full px-4 py-3 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Choose an approved template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.templateName}>{t.templateName}</option>
              ))}
            </select>
          </div>

          {requiresImageHeader && (
            <div>
              <label className="block text-sm font-bold text-warm-700 mb-2">Header Image URL</label>
              <input
                type="text"
                value={headerImage}
                onChange={e => setHeaderImage(e.target.value)}
                placeholder="Paste image URL here or leave default..."
                className="w-full px-4 py-3 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm text-warm-700 font-mono"
              />
              <p className="text-[11px] text-warm-500 mt-1">This template requires a header image. You can paste any image URL or keep Meta's default template image.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-warm-700 mb-2">Target Audience</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setTargetType('all')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'all' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900">All Opt-in</p>
                  {targetType === 'all' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Send to all {customers.total} opted-in customers</p>
              </div>
              <div 
                onClick={() => setTargetType('group')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'group' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900">Specific Group</p>
                  {targetType === 'group' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Target a specific customer segment</p>
              </div>
            </div>
          </div>

          {targetType === 'group' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-sm font-bold text-warm-700 mb-2">Select Group</label>
              <select
                value={targetGroup}
                onChange={e => setTargetGroup(e.target.value)}
                className="w-full px-4 py-3 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="regular">Regular Customers</option>
                <option value="new">New Customers</option>
                <option value="vip">VIP Customers</option>
              </select>
            </motion.div>
          )}

          <div className="pt-6 border-t border-warm-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-warm-700 hover:bg-warm-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name || !templateName}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-[#cc1530] transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
