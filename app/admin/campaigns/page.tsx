/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, Users, LayoutTemplate, Calendar, 
  Play, CheckCircle2, Clock, X, RefreshCw,
  XCircle, AlertTriangle, Info, Eye,
  Trash2, Search, Pause
} from "lucide-react";
import { useAdminAlert } from "@/components/admin/AdminAlertProvider";

interface Campaign {
  id: string;
  name: string;
  type: string;
  templateName: string;
  status: string;
  targetType: string;
  targetGroup?: string | null;
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  createdAt: string;
  sentAt: string | null;
}

interface MessageLog {
  id: string;
  phone: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const { showAlert, showConfirm } = useAdminAlert();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/campaigns");
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch {
      console.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  const isProcessingRef = useRef(false);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 10000); // Poll every 10s for updates
    
    // Check if redirecting from loyalty monitor with pre-filled batch tag
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setShowWizard(true);
    }
    
    return () => clearInterval(interval);
  }, []);

  // Auto-drive active sending campaigns sequentially (mount-only loop to prevent race conditions)
  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    const checkAndProcess = async () => {
      if (!active) return;
      try {
        // Fetch latest campaigns directly to see if any is sending
        const res = await fetch("/api/admin/campaigns");
        if (res.ok && active) {
          const list: Campaign[] = await res.json();
          const sendingCampaign = list.find(c => c.status === "sending");
          
          if (sendingCampaign) {
            // Process exactly one batch
            await fetch(`/api/admin/campaigns/${sendingCampaign.id}?action=send-batch`, {
              method: "POST",
            });
            // Refresh the UI
            await fetchCampaigns();
          }
        }
      } catch (err) {
        console.error("Error in campaign driver loop:", err);
      } finally {
        if (active) {
          // Wait 2 seconds before the next check
          timerId = setTimeout(checkAndProcess, 2000);
        }
      }
    };

    // Start the loop
    timerId = setTimeout(checkAndProcess, 1000);

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);

  const handleStartCampaign = async (id: string) => {
    const confirmed = await showConfirm("Are you sure you want to send this campaign now? Messages will be sent to all recipients.", "Send Campaign", { confirmLabel: "Send Now", type: "warning" });
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/campaigns/${id}?action=send`, { method: "POST" });
      if (res.ok) {
        showAlert("Campaign started successfully!", "success");
        fetchCampaigns();
      } else {
        showAlert("Failed to start campaign", "error");
      }
    } catch (error) {
      console.error("Failed to start campaign:", error);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to delete campaign '${name}'? This will delete all its delivery logs too.`, "Delete Campaign", { confirmLabel: "Delete", type: "danger" });
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        showAlert("Campaign deleted successfully", "success");
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } else {
        showAlert("Failed to delete campaign", "error");
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  const handleTogglePause = async (id: string, shouldPause: boolean) => {
    try {
      const action = shouldPause ? "pause" : "resume";
      const res = await fetch(`/api/admin/campaigns/${id}?action=${action}`, { method: "POST" });
      if (res.ok) {
        showAlert(shouldPause ? "Campaign paused successfully!" : "Campaign resumed successfully!", "success");
        fetchCampaigns();
      } else {
        const data = await res.json();
        showAlert(data.error || "Failed to change campaign state", "error");
      }
    } catch (error: any) {
      console.error("Failed to change campaign state:", error);
      showAlert(error.message || "An error occurred", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sending':
        return <span className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5 animate-pulse" /> Sending</span>;
      case 'paused':
        return <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full"><Pause className="w-3.5 h-3.5 text-amber-500" /> Paused</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-xs font-bold bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> Failed</span>;
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
            Send bulk WhatsApp messages to customers and track real-time delivery and error logs.
          </p>
        </div>
        <motion.button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </motion.button>
      </div>

      {/* Campaign Active Alert warning banner */}
      {campaigns.some(c => c.status === "sending") && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-amber-50/90 border border-amber-250 p-4 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <span className="font-bold block text-sm mb-0.5">Campaign Sending Active</span>
            Please **keep this browser tab active** and do not close it. The system is sending bulk WhatsApp messages in secure, serverless-safe batches to protect delivery rates. Real-time progress is shown below.
          </div>
        </motion.div>
      )}

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
              className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all relative ${
                campaign.status === "failed" ? "border-red-200" : "border-warm-200/60"
              }`}
            >
              <div className="p-5 border-b border-warm-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-warm-900 text-base truncate pr-2" title={campaign.name}>
                    {campaign.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getStatusBadge(campaign.status)}
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                      className="p-1 text-warm-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2.5 mt-3 text-xs">
                  <div className="flex items-center gap-2 text-warm-600">
                    <LayoutTemplate className="w-3.5 h-3.5 text-warm-400" />
                    <span className="font-medium">Template:</span> <span className="truncate max-w-[120px] font-mono">{campaign.templateName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-warm-600">
                    <Users className="w-3.5 h-3.5 text-warm-400" />
                    <span className="font-medium">Target:</span> {campaign.targetType === 'all' ? 'All Opt-in Customers' : `Group: ${campaign.targetGroup}`}
                  </div>
                  <div className="flex items-center gap-2 text-warm-600">
                    <Calendar className="w-3.5 h-3.5 text-warm-400" />
                    <span className="font-medium">Created:</span> {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {campaign.status === 'draft' ? (
                <div className="p-4 bg-warm-50 border-t border-warm-100 flex justify-end">
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-warm-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer w-full justify-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    Send Campaign Now
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-warm-50 border-t border-warm-100 space-y-3">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    <div>
                      <p className="text-base font-black text-warm-900">{campaign.totalRecipients}</p>
                      <p className="text-[8px] font-bold text-warm-500 uppercase tracking-widest mt-0.5">Target</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-blue-600">{campaign.sent}</p>
                      <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Sent</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-[#25D366]">{campaign.delivered}</p>
                      <p className="text-[8px] font-bold text-[#25D366] uppercase tracking-widest mt-0.5">Dlvd</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-emerald-600">{campaign.read}</p>
                      <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Read</p>
                    </div>
                    <div>
                      <p className={`text-base font-black ${campaign.failed > 0 ? "text-red-650" : "text-warm-400"}`}>{campaign.failed}</p>
                      <p className="text-[8px] font-bold text-warm-500 uppercase tracking-widest mt-0.5">Failed</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {campaign.totalRecipients > 0 && (
                    <div className="h-1.5 w-full bg-warm-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: `${(campaign.sent / campaign.totalRecipients) * 100}%` }} />
                      <div className="h-full bg-[#25D366]" style={{ width: `${(campaign.delivered / campaign.totalRecipients) * 100}%`, marginLeft: `-${(campaign.sent / campaign.totalRecipients) * 100}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${(campaign.failed / campaign.totalRecipients) * 100}%`, marginLeft: `-${(campaign.delivered / campaign.totalRecipients) * 100}%` }} />
                    </div>
                  )}

                  {campaign.status === 'sending' && (
                    <button
                      onClick={() => handleTogglePause(campaign.id, true)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Pause className="w-3 h-3 fill-white text-white" /> Pause Campaign
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleTogglePause(campaign.id, false)}
                      className="w-full py-1.5 bg-primary hover:bg-[#cc1530] rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white text-white" /> Resume Campaign
                    </button>
                  )}

                  {/* Logs inspector button */}
                  <button
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="w-full py-1.5 bg-white border border-warm-200 rounded-lg text-[10px] font-bold text-warm-600 hover:bg-warm-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-warm-400" /> View Delivery Logs / Errors
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Campaign Creation Wizard */}
      <AnimatePresence>
        {showWizard && (
          <CampaignWizard onClose={() => setShowWizard(false)} onComplete={fetchCampaigns} />
        )}
      </AnimatePresence>

      {/* Campaign Logs Modal */}
      <AnimatePresence>
        {selectedCampaignId && (
          <CampaignLogsModal 
            campaignId={selectedCampaignId} 
            onClose={() => setSelectedCampaignId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Campaign creation Wizard Component
function CampaignWizard({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) {
  const { showAlert } = useAdminAlert();
  const [loading, setLoading] = useState(false);
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any>({ total: 0 });
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetGroup, setTargetGroup] = useState("regular");
  const [headerImage, setHeaderImage] = useState("");
  const [bodyParameters, setBodyParameters] = useState<string[]>([]);
  const [bonusPoints, setBonusPoints] = useState(0);

  // Prefill tag if redirecting from loyalty monitor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillTag = params.get("tag");
    if (prefillTag) {
      setTargetType("tag");
      setTargetGroup(prefillTag);
      setName(`Expiring Points Notification - ${prefillTag}`);
    }
  }, []);

  const selectedTemplate = templates.find(t => t.templateName === templateName);
  const requiresImageHeader = selectedTemplate?.components?.some((c: any) => c.type === 'HEADER' && c.format === 'IMAGE');

  // Photo Presets
  const PHOTO_PRESETS = [
    { title: "Special Pizza", url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg" },
    { title: "Margherita", url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg" },
    { title: "Veggie Olive", url: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Pizza_with_peppers_and_olives.jpg" }
  ];
  
  // Fetch initial data
  useEffect(() => {
    async function init() {
      try {
        const [tplRes, cstRes, tagsRes] = await Promise.all([
          fetch("/api/admin/templates"),
          fetch("/api/admin/customers?limit=1&optIn=true"),
          fetch("/api/admin/customers/tags")
        ]);
        
        if (tplRes.ok) {
          const tpls = await tplRes.json();
          setTemplates(tpls.filter((t: any) => t.status === 'APPROVED'));
        }
        if (cstRes.ok) {
          const csts = await cstRes.json();
          setCustomers({ total: csts.pagination?.total || 0 });
        }
        if (tagsRes.ok) {
          setUniqueTags(await tagsRes.json());
        }
      } catch {
        // fail silently
      }
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
          targetGroup: (targetType === 'group' || targetType === 'tag') ? targetGroup : undefined,
          headerImage: requiresImageHeader ? headerImage : undefined,
          bodyParameters,
          bonusPoints
        })
      });
      if (res.ok) {
        onComplete();
        onClose();
      } else {
        showAlert("Failed to create campaign", "error");
      }
    } catch {
      showAlert("An error occurred while creating the campaign", "error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-warm-100 transition-colors"
        >
          <X className="w-5 h-5 text-warm-500" />
        </button>

        <h2 className="text-xl font-bold text-warm-900 mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Create Marketing Campaign
        </h2>

        <div className="space-y-5 text-sm">
          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pizza Sunday Special Offer"
              className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Bonus Points (Optional)</label>
            <input
              type="number"
              value={bonusPoints || ""}
              onChange={e => setBonusPoints(parseInt(e.target.value) || 0)}
              placeholder="e.g. 10 bonus points (0 to disable)"
              className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Select Approved Template</label>
            <select
              value={templateName}
              onChange={e => {
                const nameVal = e.target.value;
                setTemplateName(nameVal);
                if (nameVal) {
                  const selected = templates.find(t => t.templateName === nameVal);
                  if (selected?.headerImageUrl) {
                    setHeaderImage(selected.headerImageUrl);
                  } else {
                    const headerComp = selected?.components?.find((c: any) => c.type === 'HEADER' && c.format === 'IMAGE');
                    if (headerComp && headerComp.example?.header_handle?.[0]) {
                      const handle = headerComp.example.header_handle[0];
                      if (handle.includes("fbcdn.net") || handle.includes("whatsapp.net")) {
                        setHeaderImage(PHOTO_PRESETS[0].url);
                      } else {
                        setHeaderImage(handle);
                      }
                    } else {
                      setHeaderImage(PHOTO_PRESETS[0].url);
                    }
                  }

                  if (selected && selected.variables && selected.variables.length > 0) {
                    if (nameVal === "loyalty_balance_update") {
                      setBodyParameters(["{bonus_points}", "{expiry_date}", "Special Loyalty Bonus"]);
                    } else if (nameVal === "loyalty_balance_update_v2") {
                      setBodyParameters(["{expiry_date}"]);
                    } else {
                      setBodyParameters(selected.variables.map((_: any, i: number) => i === 0 ? "{name}" : ""));
                    }
                  } else {
                    setBodyParameters([]);
                  }
                } else {
                  setHeaderImage("");
                  setBodyParameters([]);
                }
              }}
              className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Choose an approved template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.templateName}>
                  {t.templateName} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {requiresImageHeader && (
            <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl space-y-3">
              <div className="flex items-start gap-2 text-xs text-amber-850">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Permanent Image Required:</span> Meta&apos;s default template example URLs expire quickly. You must use a permanent, public image URL (like from Cloudinary or Unsplash) so that your marketing campaign sends successfully!
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase">Image Header Link URL</label>
                <input
                  type="text"
                  value={headerImage}
                  onChange={e => setHeaderImage(e.target.value)}
                  placeholder="Paste permanent image URL here..."
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10 font-mono"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-warm-500 mb-1.5 uppercase tracking-wider">Or Select Stable Pizza Preset Banner:</p>
                <div className="grid grid-cols-3 gap-2">
                  {PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeaderImage(preset.url)}
                      className={`p-2 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 bg-white cursor-pointer ${
                        headerImage === preset.url ? "border-primary text-primary bg-primary/5" : "border-warm-200 hover:border-warm-300"
                      }`}
                    >
                      <div className="w-full h-8 rounded overflow-hidden bg-warm-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                      </div>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTemplate?.variables?.length > 0 && (
            <div className="bg-warm-100 p-4 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider">Template Variables</label>
              <p className="text-[10px] text-warm-500 mb-2">Use <code className="bg-white px-1 py-0.5 rounded text-primary border border-warm-200">{"{name}"}</code> to automatically insert the customer&apos;s name.</p>
              
              {templateName === "loyalty_balance_update_v2" && (
                <div className="bg-white border border-warm-200 p-3.5 rounded-xl space-y-1.5 shadow-sm">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">Points to Credit (Wallet Only)</label>
                  <input
                    type="number"
                    value={bonusPoints || ""}
                    onChange={e => setBonusPoints(parseInt(e.target.value) || 0)}
                    placeholder="Enter loyalty points to credit (e.g. 50)"
                    className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                  <p className="text-[9px] text-warm-500 leading-relaxed">
                    Note: To comply with Meta's UTILITY template guidelines, the points amount is not shown in the WhatsApp message text, but it will be successfully added to the customer's wallet balance.
                  </p>
                </div>
              )}
              
              {selectedTemplate.variables.map((v: string, idx: number) => (
                <div key={idx}>
                  <label className="block text-[10px] font-bold text-warm-600 mb-1">{`{{${idx + 1}}} - ${v}`}</label>
                  <input
                    type="text"
                    value={bodyParameters[idx] || ""}
                    onChange={e => {
                      const newParams = [...bodyParameters];
                      newParams[idx] = e.target.value;
                      setBodyParameters(newParams);
                      
                      // Auto-sync bonusPoints when the user types into a {bonus_points} slot
                      // Check if this parameter was originally {bonus_points} by checking the template defaults
                      if (templateName === "loyalty_balance_update" && idx === 0) {
                        const parsed = parseInt(e.target.value);
                        if (!isNaN(parsed) && parsed > 0) {
                          setBonusPoints(parsed);
                        }
                      }
                    }}
                    placeholder={`Value for {{${idx + 1}}}`}
                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Target Audience Selection</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setTargetType('all')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'all' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900 text-sm">All Opt-in</p>
                  {targetType === 'all' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Send to all {customers.total} opted-in customers</p>
              </div>
              <div 
                onClick={() => setTargetType('group')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'group' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900 text-sm">Customer Group</p>
                  {targetType === 'group' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Target a specific customer segment</p>
              </div>
              <div 
                onClick={() => { 
                  setTargetType('tag'); 
                  if (uniqueTags.length > 0 && !uniqueTags.includes(targetGroup)) {
                    setTargetGroup(uniqueTags[0]);
                  } else if (uniqueTags.length === 0) {
                    setTargetGroup('pos-customer');
                  }
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'tag' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900 text-sm">🏷️ Target by Tag</p>
                  {targetType === 'tag' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Target customers containing a specific tag/batch</p>
              </div>
              <div 
                onClick={() => setTargetType('expiring')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${targetType === 'expiring' ? 'border-primary bg-primary/5' : 'border-warm-200 bg-white hover:border-warm-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-warm-900 text-sm">⏳ Expiring Points</p>
                  {targetType === 'expiring' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-warm-500">Target customers with points expiring in 5 days</p>
              </div>
            </div>
          </div>

          {targetType === 'group' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Select Segment Group</label>
              <select
                value={targetGroup}
                onChange={e => setTargetGroup(e.target.value)}
                className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
              >
                <option value="regular">Regular Customers</option>
                <option value="new">New Customers</option>
                <option value="vip">VIP Customers</option>
              </select>
            </motion.div>
          )}

          {targetType === 'tag' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Select Tag / Batch</label>
              {uniqueTags.length > 0 ? (
                <select
                  value={targetGroup || ""}
                  onChange={e => setTargetGroup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                >
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-warm-50 rounded-xl text-xs text-warm-550 border border-warm-200">
                  No tags found in database. Make sure you tag/batch customers first!
                </div>
              )}
            </motion.div>
          )}

          <div className="pt-6 border-t border-warm-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-warm-700 hover:bg-warm-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name || !templateName}
              className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-[#cc1530] transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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

// Campaign Logs details Inspector Modal
function CampaignLogsModal({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getFriendlyErrorMessage = (error: string) => {
    if (error.includes("maintain healthy ecosystem engagement")) {
      return "Meta Limit: Recipient has received too many marketing templates recently from other brands. Try again in 24 hours.";
    }
    if (error.includes("Message undeliverable")) {
      return "Delivery Failed: Number has no WhatsApp, has blocked you, or (if using a Meta Developer Test Account) the recipient number has not been added to 'Allowed Test Numbers' in the Facebook Developer Console.";
    }
    return error;
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const url = `/api/admin/campaigns/${campaignId}${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCampaignName(data.name);
          setLogs(data.messageLogs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [campaignId, searchQuery]);

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
        className="bg-white rounded-3xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden relative z-10 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-warm-100 flex items-center justify-between bg-warm-50/50">
          <div>
            <h2 className="text-lg font-bold text-warm-900">Campaign Logs</h2>
            <p className="text-xs text-warm-500 mt-0.5">Campaign: <span className="font-semibold">{campaignName || "Loading..."}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warm-100 text-warm-400 hover:text-warm-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-warm-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              placeholder="Search by mobile number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-warm-50 border-0 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400 font-sans"
            />
          </div>
        </div>

        {/* Logs list / Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex flex-col justify-center items-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
              <p className="text-xs text-warm-550">Fetching logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <Info className="w-10 h-10 text-warm-300 mb-2" />
              <p className="text-sm font-bold text-warm-800">
                {searchQuery ? "No matching logs found" : "No logs recorded yet"}
              </p>
              <p className="text-xs text-warm-500 max-w-xs mt-1">
                {searchQuery 
                  ? `No message logs matched "${searchQuery}". Please check the phone number.` 
                  : "This campaign hasn't sent any messages or the logs have expired."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-xs font-bold text-warm-550 mb-2 uppercase tracking-wider">Recipient Logs (Newest First)</p>
              <div className="border border-warm-100 rounded-2xl overflow-hidden divide-y divide-warm-100 text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-white hover:bg-warm-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-warm-900 font-mono">{log.phone}</p>
                      <p className="text-[10px] text-warm-400">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {log.status === "sent" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">Sent</span>
                      )}
                      {log.status === "delivered" && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">Delivered</span>
                      )}
                      {log.status === "read" && (
                        <span className="bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">Read</span>
                      )}
                      {log.status === "failed" && (
                        <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-650" /> Failed
                        </span>
                      )}
                      
                      {log.errorMessage && (
                        <p className="text-[11px] font-medium text-red-650 bg-red-50/50 border border-red-100 rounded-lg p-2 max-w-sm mt-1">
                          Reason: {getFriendlyErrorMessage(log.errorMessage)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-warm-50/50 border-t border-warm-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-warm-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
