"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, RefreshCw, CheckCircle2, XCircle, Clock, 
  ExternalLink, Code, Search, Trash2, Plus, X, Check,
  Sparkles, AlertCircle, Info, FileText, Image as ImageIcon,
  ChevronRight, Laptop, HelpCircle
} from "lucide-react";
import { useAdminAlert } from "@/components/admin/AdminAlertProvider";

interface Template {
  id: string;
  templateName: string;
  category: string;
  language: string;
  status: string;
  components: any;
  variables: string[];
  createdAt: string;
  approvedAt: string | null;
}

interface Preset {
  id: string;
  title: string;
  description: string;
  templateName: string;
  category: string;
  headerType: "NONE" | "TEXT" | "IMAGE";
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: any[];
}

const UTILITY_PRESETS: Preset[] = [
  {
    id: "order_confirmation2",
    title: "Order Confirmed",
    description: "Send automatically when order is accepted by restaurant",
    templateName: "order_confirmation2",
    category: "MARKETING",
    headerType: "TEXT",
    headerText: "Order Accepted",
    bodyText: "Hello {{1}}, your order {{2}} has been confirmed and is being processed! Thank you for ordering from Hello Pizza Cafe. We are preparing it fresh.",
    footerText: "Hello Pizza Cafe",
    buttons: [
      { type: "URL", text: "Track Order", url: "https://hello-pizza-cafe.vercel.app/orders" }
    ]
  },
  {
    id: "order_preparing3",
    title: "Order Preparing",
    description: "Send when order is sent to the kitchen",
    templateName: "order_preparing3",
    category: "MARKETING",
    headerType: "TEXT",
    headerText: "Order Preparing",
    bodyText: "Hi {{1}}, our kitchen staff is preparing your delicious order {{2}} right now! We will notify you as soon as it is baked and ready for delivery.",
    footerText: "Hello Pizza Cafe"
  },
  {
    id: "order_out_for_delivery2",
    title: "Out for Delivery",
    description: "Send when order is picked up by rider",
    templateName: "order_out_for_delivery2",
    category: "MARKETING",
    headerType: "TEXT",
    headerText: "Out for Delivery",
    bodyText: "Great news {{1}}! Your hot order {{2}} is out for delivery. Your rider {{3}} (phone: {{4}}) is on their way. Get ready to feast!",
    footerText: "Hello Pizza Cafe",
    buttons: [
      { type: "URL", text: "Call Rider", url: "tel:{{4}}" }
    ]
  },
  {
    id: "order_delivered2",
    title: "Order Delivered",
    description: "Send when order is delivered successfully",
    templateName: "order_delivered2",
    category: "MARKETING",
    headerType: "TEXT",
    headerText: "Order Delivered",
    bodyText: "Yum! Your order {{2}} has been delivered to {{1}}. Enjoy your meal! We would love to hear your feedback. Please leave us a review.",
    footerText: "Hello Pizza Cafe",
    buttons: [
      { type: "URL", text: "Submit Review", url: "https://hello-pizza-cafe.vercel.app/reviews" }
    ]
  },
  {
    id: "order_cancelled3",
    title: "Order Cancelled",
    description: "Send if order is rejected or cancelled",
    templateName: "order_cancelled3",
    category: "MARKETING",
    headerType: "TEXT",
    headerText: "Order Cancelled",
    bodyText: "Hello {{1}}, we regret to inform you that your order {{2}} has been cancelled. Reason: {{3}}. If you have questions, please reach out directly.",
    footerText: "Hello Pizza Cafe Support"
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const { showConfirm } = useAdminAlert();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Toasts
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/templates");
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/templates/sync");
      if (res.ok) {
        const data = await res.json();
        triggerToast(data.message || "Templates synced successfully!", "success");
        await fetchTemplates();
      } else {
        triggerToast("Failed to sync with Meta templates", "error");
      }
    } catch (error) {
      triggerToast("Failed to sync templates", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to delete '${name}'? This will remove it from Meta and local DB. (Note: You cannot reuse the name for 30 days on Meta).`, "Delete Template", { confirmLabel: "Delete", type: "danger" });
    if (!confirmed) {
      return;
    }
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast(`Template '${name}' deleted successfully.`, "success");
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        const errData = await res.json();
        triggerToast(errData.error || "Failed to delete template", "error");
      }
    } catch (error: any) {
      triggerToast(error.message || "Error deleting template", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.templateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 text-xs font-bold bg-[#25D366]/10 text-[#25D366] px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'PENDING':
      default:
        return <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">WhatsApp Templates</h1>
          <p className="text-warm-500 text-sm mt-1">
            Manage, sync, and create approved message templates for order notifications and marketing campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => router.push("/admin/templates/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#cc1530] transition-colors cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Create Template
          </motion.button>
          <motion.button
            onClick={() => router.push("/admin/whatsapp-logs")}
            className="flex items-center gap-2 px-4 py-2.5 bg-warm-100 hover:bg-warm-200 border border-warm-200 rounded-xl text-sm font-bold text-warm-800 transition-colors cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <AlertCircle className="w-4 h-4 text-primary animate-pulse" />
            Logs & Diagnostics
          </motion.button>
          <a 
            href="https://business.facebook.com/wa/manage/message-templates/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Meta Manager
          </a>
          <motion.button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1fa952] transition-colors cursor-pointer disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? 'Syncing...' : 'Sync with Meta'}
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center bg-white p-4 rounded-2xl border border-warm-200/60 shadow-sm max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-warm-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all placeholder:text-warm-400"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60 shadow-sm">
          <div className="w-8 h-8 border-3 border-[#25D366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-warm-700">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60 shadow-sm">
          <MessageSquare className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="font-semibold text-warm-700">No templates found</p>
          <p className="text-warm-500 text-sm mt-1">Try creating a template or syncing with Meta to fetch approved templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, i) => {
            const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
            const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
            const footerComponent = template.components?.find((c: any) => c.type === 'FOOTER');
            const buttonsComponent = template.components?.find((c: any) => c.type === 'BUTTONS');
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="p-5 border-b border-warm-100 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-warm-900 truncate pr-2" title={template.templateName}>
                      {template.templateName}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(template.status)}
                      <button
                        onClick={() => handleDelete(template.id, template.templateName)}
                        disabled={deletingId === template.id}
                        className="p-1 text-warm-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete template"
                      >
                        {deletingId === template.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warm-500 bg-warm-100 px-2 py-0.5 rounded">{template.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warm-500 bg-warm-100 px-2 py-0.5 rounded">{template.language}</span>
                  </div>

                  <div className="bg-[#EFEAE2] rounded-xl p-4 relative font-sans text-sm shadow-inner min-h-[120px]">
                    {/* Fake WA Message Bubble */}
                    <div className="bg-white rounded-tr-xl rounded-b-xl p-3 shadow-sm max-w-[90%] relative">
                      <div className="absolute top-0 -left-2 w-0 h-0 border-t-[0px] border-t-transparent border-r-[10px] border-r-white border-b-[10px] border-b-transparent"></div>
                      
                      {headerComponent && (
                        <div className="font-bold text-warm-900 mb-2 border-b border-warm-100 pb-2">
                          {headerComponent.format === 'IMAGE' ? (
                            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-warm-100 mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={headerComponent.example?.header_handle?.[0] || "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg"} 
                                alt="Header Preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback in case Meta link expired
                                  (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg";
                                }}
                              />
                            </div>
                          ) : (
                            headerComponent.text
                          )}
                        </div>
                      )}
                      
                      <div className="text-warm-800 whitespace-pre-wrap leading-relaxed text-xs">
                        {bodyComponent?.text || "No body content"}
                      </div>

                      {footerComponent && (
                        <div className="text-warm-400 text-[10px] mt-1.5 border-t border-warm-50 pt-1">
                          {footerComponent.text}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Action Buttons */}
                    {buttonsComponent?.buttons && (
                      <div className="mt-2 space-y-1 max-w-[90%]">
                        {buttonsComponent.buttons.map((btn: any, btnIdx: number) => (
                          <div 
                            key={btnIdx} 
                            className="bg-white rounded-xl py-1.5 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-100 hover:bg-warm-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>{btn.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-warm-50 p-4 border-t border-warm-100">
                  <div className="flex items-center gap-2 text-xs font-medium text-warm-600">
                    <Code className="w-4 h-4 text-warm-400" />
                    Variables: {template.variables?.length || 0}
                  </div>
                  {template.variables?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {template.variables.map((v, idx) => (
                        <span key={idx} className="bg-white border border-warm-200 text-warm-600 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {`{{${idx+1}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
