"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, RefreshCw, CheckCircle2, XCircle, Clock, 
  ExternalLink, Code, Search
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to sync templates");
    } finally {
      setSyncing(false);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">WhatsApp Templates</h1>
          <p className="text-warm-500 text-sm mt-1">
            Manage your Meta approved message templates
          </p>
        </div>
        <div className="flex gap-2">
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
            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:bg-[#1fa952] transition-colors cursor-pointer disabled:opacity-50"
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
          <p className="text-warm-500 text-sm mt-1">Try syncing with Meta to fetch your approved templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, i) => {
            const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
            const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-5 border-b border-warm-100 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-warm-900 truncate pr-2">{template.templateName}</h3>
                    {getStatusBadge(template.status)}
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
                          {headerComponent.format === 'IMAGE' ? '📷 [Image Header]' : headerComponent.text}
                        </div>
                      )}
                      
                      <div className="text-warm-800 whitespace-pre-wrap">
                        {bodyComponent?.text || "No body content"}
                      </div>
                    </div>
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
