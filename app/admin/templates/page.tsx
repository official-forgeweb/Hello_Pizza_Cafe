"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, RefreshCw, CheckCircle2, XCircle, Clock, 
  ExternalLink, Code, Search, Trash2, Plus, X, Check,
  Sparkles, AlertCircle, Info, FileText, Image as ImageIcon,
  ChevronRight, Laptop, HelpCircle
} from "lucide-react";

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
    if (!confirm(`Are you sure you want to delete '${name}'? This will remove it from Meta and local DB. (Note: You cannot reuse the name for 30 days on Meta).`)) {
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#cc1530] transition-colors cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Create Template
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

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTemplateModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={() => {
              setShowCreateModal(false);
              fetchTemplates();
              triggerToast("Template submitted to Meta and created successfully!", "success");
            }}
            triggerToast={triggerToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component
function CreateTemplateModal({ 
  onClose, 
  onSuccess,
  triggerToast 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  triggerToast: (msg: string, type: "success" | "error") => void;
}) {
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("UTILITY");
  const [language, setLanguage] = useState("en_US");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttonType, setButtonType] = useState<"NONE" | "URL">("NONE");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const handleApplyPreset = (preset: Preset) => {
    setName(preset.templateName);
    setCategory(preset.category);
    setHeaderType(preset.headerType);
    setHeaderText(preset.headerText || "");
    setBodyText(preset.bodyText);
    setFooterText(preset.footerText || "");
    
    if (preset.buttons && preset.buttons.length > 0) {
      setButtonType("URL");
      setButtonText(preset.buttons[0].text);
      setButtonUrl(preset.buttons[0].url);
    } else {
      setButtonType("NONE");
      setButtonText("");
      setButtonUrl("");
    }
    
    setActiveTab("custom");
    triggerToast(`Preset '${preset.title}' loaded. You can now edit and submit.`, "success");
  };

  const handleInsertVariable = () => {
    // Find variables count currently in body text
    const matches = bodyText.match(/\{\{(\d+)\}\}/g);
    const nextVarIndex = matches ? new Set(matches).size + 1 : 1;
    setBodyText(prev => prev + ` {{${nextVarIndex}}}`);
  };

  // Mock template rendering for preview
  const getMockedBodyText = () => {
    let mock = bodyText;
    mock = mock.replace(/\{\{1\}\}/g, "Rahul Sharma");
    mock = mock.replace(/\{\{2\}\}/g, "OD-98214");
    mock = mock.replace(/\{\{3\}\}/g, "Amit Kumar (Rider)");
    mock = mock.replace(/\{\{4\}\}/g, "+91 98765 43210");
    mock = mock.replace(/\{\{5\}\}/g, "Address address");
    return mock || "Write some body content...";
  };

  const handleSubmit = async () => {
    // Name validation
    const nameRegex = /^[a-z0-9_]+$/;
    if (!name) {
      triggerToast("Template Name is required", "error");
      return;
    }
    if (!nameRegex.test(name)) {
      triggerToast("Template Name must contain only lowercase letters, numbers, and underscores (e.g. order_confirmation)", "error");
      return;
    }
    if (!bodyText) {
      triggerToast("Body text is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Build components JSON schema for Meta API
      const components: any[] = [];

      // 1. Header
      if (headerType === "TEXT" && headerText) {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: headerText
        });
      } else if (headerType === "IMAGE") {
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: [headerImageUrl]
          }
        });
      }

      // 2. Body
      components.push({
        type: "BODY",
        text: bodyText
      });

      // 3. Footer
      if (footerText) {
        components.push({
          type: "FOOTER",
          text: footerText
        });
      }

      // 4. Buttons
      if (buttonType === "URL" && buttonText && buttonUrl) {
        components.push({
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: buttonText,
              url: buttonUrl
            }
          ]
        });
      }

      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: name,
          category,
          language,
          components
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errData = await res.json();
        triggerToast(errData.error || "Failed to submit template to Meta", "error");
      }
    } catch (error: any) {
      triggerToast(error.message || "Failed to submit template", "error");
    } finally {
      setSubmitting(false);
    }
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
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden relative z-10 shadow-2xl border border-warm-100"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-warm-100 flex items-center justify-between bg-warm-50/50">
          <div>
            <h2 className="text-xl font-bold text-warm-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Create Meta Message Template
            </h2>
            <p className="text-xs text-warm-500 mt-0.5">Define your template layout and submit it directly for Meta approval</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warm-100 text-warm-400 hover:text-warm-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 border-b border-warm-100 flex gap-4 bg-white">
          <button
            onClick={() => setActiveTab("preset")}
            className={`py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "preset" ? "border-primary text-primary" : "border-transparent text-warm-500 hover:text-warm-800"
            }`}
          >
            Utility Order Presets
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "custom" ? "border-primary text-primary" : "border-transparent text-warm-500 hover:text-warm-800"
            }`}
          >
            Template Builder
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-warm-50/30">
          
          {/* LEFT: Builder Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 border-r border-warm-100">
            {activeTab === "preset" ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-800">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Utility Presets:</span> These templates are pre-designed for Hello Pizza Cafe's automatic order notifications. Click any preset to load it into the custom builder, review details, and send to Meta with one click.
                  </div>
                </div>

                <div className="space-y-3">
                  {UTILITY_PRESETS.map((preset) => (
                    <div 
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="bg-white border border-warm-200/80 rounded-xl p-4 hover:border-primary hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 pr-4">
                        <p className="font-bold text-warm-900 text-sm group-hover:text-primary transition-colors">{preset.title}</p>
                        <p className="text-xs text-warm-500">{preset.description}</p>
                        <code className="text-[10px] bg-warm-100 text-warm-700 px-1.5 py-0.5 rounded font-mono block w-fit">
                          Name: {preset.templateName}
                        </code>
                      </div>
                      <ChevronRight className="w-4 h-4 text-warm-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Custom Builder Form
              <div className="space-y-4 text-sm">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Template Name</label>
                    <input
                      type="text"
                      placeholder="e.g. order_confirmation"
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-mono"
                    />
                    <span className="text-[10px] text-warm-400 mt-1 block">Only lowercase, numbers, and underscores allowed</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                    >
                      <option value="UTILITY">Utility (Order Notifications)</option>
                      <option value="MARKETING">Marketing (Promotions/Offers)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="en_US">English (en_US)</option>
                      <option value="hi_IN">Hindi (hi_IN)</option>
                      <option value="es_ES">Spanish (es_ES)</option>
                      <option value="en">English Generic (en)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Header Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["NONE", "TEXT", "IMAGE"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setHeaderType(type)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            headerType === type 
                              ? "bg-primary/5 border-primary text-primary" 
                              : "bg-white border-warm-200 text-warm-600 hover:border-warm-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conditional Headers */}
                {headerType === "TEXT" && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Header Text</label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Order Confirmed! 🍕"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                    />
                    <span className="text-[10px] text-warm-450 mt-1 block">Maximum 60 characters. Can include emojis.</span>
                  </div>
                )}

                {headerType === "IMAGE" && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Example Image URL (Required for Approval)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-mono text-xs"
                    />
                    <span className="text-[10px] text-warm-450 mt-1 block">Provide a sample image URL for Meta review (e.g. Unsplash URL)</span>
                  </div>
                )}

                {/* Body Component */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider">Body Text</label>
                    <button
                      type="button"
                      onClick={handleInsertVariable}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-[#cc1530] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variable `{"{{x}}"}`
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Hello {{1}}, your order {{2}} is confirmed..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none leading-relaxed"
                  />
                  <div className="bg-warm-100 p-2.5 rounded-xl text-[10px] text-warm-600 mt-1.5 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-warm-700"><Info className="w-3.5 h-3.5 text-warm-500" /> Variable Guidelines:</p>
                    <p>Use sequence markers like `{"{{1}}"}` for customer name, `{"{{2}}"}` for order number, etc.</p>
                  </div>
                </div>

                {/* Footer Component */}
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Footer Text (Optional)</label>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="e.g. Hello Pizza Cafe Support"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-warm-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <span className="text-[10px] text-warm-450 mt-1 block">Rendered in tiny font at the bottom (Max 60 chars)</span>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-warm-100 pt-4">
                  <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Call to Action Buttons</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="btnType" 
                        checked={buttonType === "NONE"}
                        onChange={() => setButtonType("NONE")}
                        className="text-primary focus:ring-primary"
                      /> None
                    </label>
                    <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="btnType" 
                        checked={buttonType === "URL"}
                        onChange={() => setButtonType("URL")}
                        className="text-primary focus:ring-primary"
                      /> Website Link URL
                    </label>
                  </div>

                  {buttonType === "URL" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Button Label (e.g. Track Order)"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-warm-255 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="URL Link (e.g. https://...)"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-warm-255 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* RIGHT: Live Preview Panel */}
          <div className="w-full md:w-80 bg-[#efeae2] p-6 flex flex-col justify-center items-center relative overflow-hidden select-none shrink-0 border-t md:border-t-0 md:border-l border-warm-200">
            {/* Background WhatsApp Doodle Texture simulation */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <span className="text-[10px] font-bold text-warm-500 uppercase tracking-widest absolute top-3 left-4 bg-white/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-warm-200/50">Live WhatsApp Preview</span>

            {/* Chat bubble wrapper */}
            <div className="w-full max-w-[280px] bg-white rounded-tr-xl rounded-b-xl p-3 shadow-md border border-warm-100/30 relative text-xs mt-3">
              <div className="absolute top-0 -left-2 w-0 h-0 border-t-[0px] border-t-transparent border-r-[10px] border-r-white border-b-[10px] border-b-transparent"></div>
              
              {/* Preview Header */}
              {headerType === "TEXT" && headerText && (
                <div className="font-bold text-warm-900 border-b border-warm-100 pb-1.5 mb-1.5">
                  {headerText}
                </div>
              )}
              {headerType === "IMAGE" && (
                <div className="w-full h-28 rounded-lg overflow-hidden bg-warm-100 mb-2 border border-warm-200/20 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={headerImageUrl || "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg"} 
                    alt="Mock Header" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg";
                    }}
                  />
                </div>
              )}

              {/* Preview Body */}
              <div className="text-warm-850 whitespace-pre-wrap leading-relaxed font-sans">
                {/* Dynamically highlight variables in body preview */}
                {getMockedBodyText().split(/(\[.*?\]|Rahul Sharma|OD-98214|Amit Kumar \(Rider\)|tel:\+91 98765 43210|\+91 98765 43210)/g).map((part, index) => {
                  const highlights = ["Rahul Sharma", "OD-98214", "Amit Kumar (Rider)", "+91 98765 43210"];
                  if (highlights.includes(part)) {
                    return (
                      <span key={index} className="bg-primary/10 text-primary font-semibold px-1 py-0.5 rounded text-[11px]">
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </div>

              {/* Preview Footer */}
              {footerText && (
                <div className="text-warm-400 text-[10px] mt-2 border-t border-warm-100/50 pt-1">
                  {footerText}
                </div>
              )}
            </div>

            {/* Preview Buttons */}
            {buttonType === "URL" && buttonText && (
              <div className="w-full max-w-[280px] mt-1.5 space-y-1">
                <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-200/50 flex items-center justify-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-500" />
                  <span>{buttonText}</span>
                </div>
              </div>
            )}

            {/* Notice */}
            <div className="mt-6 text-center text-[10px] text-warm-500 max-w-[240px] leading-relaxed">
              *Preview replaces standard tags (e.g. `{"{{1}}"}`) with mock customer parameters.
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-warm-100 flex justify-between items-center bg-warm-50/50">
          <div className="flex items-center gap-1 text-[11px] text-warm-500">
            <HelpCircle className="w-4 h-4 text-warm-400" />
            Meta template approval takes 2-24 hours.
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-100 hover:text-warm-800 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            
            {activeTab === "custom" && (
              <button
                onClick={handleSubmit}
                disabled={submitting || !name || !bodyText}
                className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#cc1530] transition-all shadow-md shadow-primary/10 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Submit to Meta
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
