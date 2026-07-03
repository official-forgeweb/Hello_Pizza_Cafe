"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Check, RefreshCw, Plus, Info, Image as ImageIcon,
  HelpCircle, Laptop, Upload, Globe, AlertCircle, FileText, ChevronRight
} from "lucide-react";

interface Preset {
  id: string;
  title: string;
  description: string;
  templateName: string;
  category: string;
  headerType: "NONE" | "TEXT" | "IMAGE";
  headerText?: string;
  headerImageUrl?: string;
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
    category: "UTILITY",
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
    category: "UTILITY",
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
    category: "UTILITY",
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
    category: "UTILITY",
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
    category: "UTILITY",
    headerType: "TEXT",
    headerText: "Order Cancelled",
    bodyText: "Hello {{1}}, we regret to inform you that your order {{2}} has been cancelled. Reason: {{3}}. If you have questions, please reach out directly.",
    footerText: "Hello Pizza Cafe Support"
  },
  {
    id: "loyalty_balance_update",
    title: "Loyalty Points Credit",
    description: "Send when points are credited (Meta-compliant UTILITY category wording)",
    templateName: "loyalty_balance_update",
    category: "UTILITY",
    headerType: "TEXT",
    headerText: "Balance Update",
    bodyText: "Hello, your loyalty points balance has been updated. We have credited {{1}} points to your account. These points will expire on {{2}}. Note: {{3}}. You can view your updated wallet balance details using the link below.",
    footerText: "Hello Pizza Cafe",
    buttons: [
      { type: "URL", text: "View Wallet", url: "https://hello-pizza-cafe.vercel.app/loyalty?{{1}}" }
    ]
  },
  {
    id: "loyalty_balance_update_v2",
    title: "Loyalty Points Credit V2 (Utility Image + CTA)",
    description: "Send when points are credited. Contains image header, View Wallet and Call Us buttons.",
    templateName: "loyalty_balance_update_v2",
    category: "UTILITY",
    headerType: "IMAGE",
    headerImageUrl: "https://res.cloudinary.com/dsk80td7v/image/upload/v1783054054/hello-pizza/campaigns/z1tksjgl9tyzetifolmw.png",
    bodyText: "*TRANSACTION ALERT*\nDear Customer,\nYour wallet has been credited successfully\n\nExpires on {{1}}\n\nThanks for choosing Hello Pizza cafe!",
    footerText: "Hello Pizza Cafe",
    buttons: [
      { type: "URL", text: "View Wallet", url: "https://hello-pizza-cafe.vercel.app/loyalty?{{1}}" },
      { type: "PHONE_NUMBER", text: "Call Us", phone_number: "+918505907905" }
    ]
  },
  {
    id: "pos_order_receipt_v2",
    title: "POS Order Receipt V2 (With Loyalty Points)",
    description: "Send after purchase at POS with loyalty points credited details (UTILITY category)",
    templateName: "pos_order_receipt_v2",
    category: "UTILITY",
    headerType: "NONE",
    bodyText: "Receipt from *Hello Pizza Cafe* 🍕\n\nAmount Paid: ₹{{1}}\nPoints Credited: {{2}} Pts\n\nMade fresh. Served hot.\nFor Support or Order Details:\n📞*8586076383*\n🌐https://hello-pizza-cafe.vercel.app/\n\nHope to welcome you again soon ✨",
    footerText: "",
    buttons: []
  },
  {
    id: "loyalty_verification_otp",
    title: "Loyalty Redeem OTP",
    description: "Send when customer requests an OTP to redeem points during POS checkout (Meta Authentication category)",
    templateName: "loyalty_verification_otp",
    category: "AUTHENTICATION",
    headerType: "NONE",
    bodyText: "*{{1}}* is your verification code. For your security, do not share this code.",
    footerText: "Expires in 5 minutes.",
    buttons: [
      { type: "COPY_CODE", text: "Copy Code" }
    ]
  },
  {
    id: "loyalty_points_redeemed",
    title: "Loyalty Points Redeemed",
    description: "Send after customer successfully redeems loyalty points at POS checkout",
    templateName: "loyalty_points_redeemed",
    category: "UTILITY",
    headerType: "TEXT",
    headerText: "Redemption Success",
    bodyText: "You have successfully redeemed {{1}} loyalty points on your purchase! Your remaining loyalty balance is {{2}} points, which will be valid until {{3}}. Thank you for ordering from Hello Pizza Cafe!",
    footerText: "Hello Pizza Cafe"
  }
];

const MARKETING_PRESETS: Preset[] = [
  {
    id: "product_promotion",
    title: "Product Promotion",
    description: "Promote items with an eye-catching image, description, and action link",
    templateName: "promo_special_pizza",
    category: "MARKETING",
    headerType: "IMAGE",
    headerImageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    bodyText: "Hey {{1}}, check out our delicious Pizza of the Month! Get an exclusive discount of 20% by using the promo code below at checkout. Fresh toppings, hand-stretched crust, and direct delivery to your home! 🍕🎉",
    footerText: "Valid for a limited time only",
    buttons: [
      { type: "URL", text: "Order Now & Save", url: "https://hello-pizza-cafe.vercel.app/menu" }
    ]
  },
  {
    id: "new_product_launch",
    title: "New Product Launch",
    description: "Introduce exciting new menu additions to your customers",
    templateName: "launch_new_crust",
    category: "MARKETING",
    headerType: "IMAGE",
    headerImageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    bodyText: "Big news, {{1}}! We just launched our brand new stuffed-crust gourmet series! Double the cheese, double the crunch. Try it today and receive a complimentary side item on us.",
    footerText: "Hello Pizza Cafe New Releases",
    buttons: [
      { type: "URL", text: "See What's New", url: "https://hello-pizza-cafe.vercel.app/menu" }
    ]
  },
  {
    id: "weekend_discount",
    title: "Weekend Special Offer",
    description: "Send weekend deal notifications to drive store traffic",
    templateName: "weekend_treat_20",
    category: "MARKETING",
    headerType: "IMAGE",
    headerImageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=800",
    bodyText: "Hey {{1}}! Weekends are made for pizza. Order family-sized pizzas today and get a flat 20% off plus free delivery. Grab your slices now!",
    footerText: "Hello Pizza Cafe Weekend Special",
    buttons: [
      { type: "URL", text: "Claim Discount", url: "https://hello-pizza-cafe.vercel.app/menu" }
    ]
  }
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [presetTab, setPresetTab] = useState<"utility" | "marketing">("utility");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING"); // Default category is marketing
  const [language, setLanguage] = useState("en_US");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttonType, setButtonType] = useState<"NONE" | "URL" | "COPY_CODE">("NONE");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApplyPreset = (preset: Preset) => {
    setName(preset.templateName);
    setCategory(preset.category);
    setHeaderType(preset.headerType);
    setHeaderText(preset.headerText || "");
    setHeaderImageUrl(preset.headerImageUrl || "https://upload.wikimedia.org/wikipedia/commons/9/91/Pizza-3007395.jpg");
    setBodyText(preset.bodyText);
    setFooterText(preset.footerText || "");
    
    if (preset.buttons && preset.buttons.length > 0) {
      const btn = preset.buttons[0];
      setButtonType(btn.type === "COPY_CODE" ? "COPY_CODE" : "URL");
      setButtonText(btn.text);
      setButtonUrl(btn.url || "");
    } else {
      setButtonType("NONE");
      setButtonText("");
      setButtonUrl("");
    }
    
    triggerToast(`Preset '${preset.title}' loaded successfully.`, "success");
  };

  const handleInsertVariable = () => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g);
    const nextVarIndex = matches ? new Set(matches).size + 1 : 1;
    setBodyText(prev => prev + ` {{${nextVarIndex}}}`);
  };

  const getMockedBodyText = () => {
    let mock = bodyText;
    const lowerName = name.toLowerCase();
    if (lowerName === "pos_order_receipt" || lowerName === "pos_order_receipt_v2") {
      mock = mock.replace(/\{\{1\}\}/g, "450");
      mock = mock.replace(/\{\{2\}\}/g, "22");
    } else if (lowerName === "loyalty_balance_update_v2") {
      mock = mock.replace(/\{\{1\}\}/g, "2026-08-02");
    } else if (lowerName.includes("otp") || lowerName.includes("verify")) {
      mock = mock.replace(/\{\{1\}\}/g, "123456");
    } else if (lowerName.includes("redeem") || lowerName.includes("deduct")) {
      mock = mock.replace(/\{\{1\}\}/g, "150");
      mock = mock.replace(/\{\{2\}\}/g, "350");
      mock = mock.replace(/\{\{3\}\}/g, "2026-07-22");
    } else if (lowerName.includes("points_credit") || lowerName.includes("points_update") || lowerName.includes("balance_update")) {
      mock = mock.replace(/\{\{1\}\}/g, "500");
      mock = mock.replace(/\{\{2\}\}/g, "2026-07-16");
      mock = mock.replace(/\{\{3\}\}/g, "Special Loyalty Bonus");
    } else if (lowerName.includes("loyalty")) {
      mock = mock.replace(/\{\{1\}\}/g, "Rahul Sharma");
      mock = mock.replace(/\{\{2\}\}/g, "500");
      mock = mock.replace(/\{\{3\}\}/g, "2026-07-16");
      mock = mock.replace(/\{\{4\}\}/g, "Special Loyalty Bonus");
    } else {
      mock = mock.replace(/\{\{1\}\}/g, "Rahul Sharma");
      mock = mock.replace(/\{\{2\}\}/g, "OD-98214");
      mock = mock.replace(/\{\{3\}\}/g, "Amit Kumar (Rider)");
      mock = mock.replace(/\{\{4\}\}/g, "+91 98765 43210");
      mock = mock.replace(/\{\{5\}\}/g, "123 Cafe Street, Faridabad");
    }
    return mock || "Write some body content...";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      if (data.url) {
        setHeaderImageUrl(data.url);
        triggerToast("Image uploaded successfully!", "success");
      } else {
        throw new Error("Invalid response URL");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Failed to upload image to Cloudinary", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const nameRegex = /^[a-z0-9_]+$/;
    if (!name) {
      triggerToast("Template Name is required", "error");
      return;
    }
    if (!nameRegex.test(name)) {
      triggerToast("Template Name must contain only lowercase letters, numbers, and underscores (e.g. launch_promo)", "error");
      return;
    }
    if (!bodyText) {
      triggerToast("Body text is required", "error");
      return;
    }

    setSubmitting(true);
    try {
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
      if (name === "loyalty_balance_update_v2") {
        components.push({
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "View Wallet",
              url: "https://hello-pizza-cafe.vercel.app/loyalty?{{1}}"
            },
            {
              type: "PHONE_NUMBER",
              text: "Call Us",
              phone_number: "+918505907905"
            }
          ]
        });
      } else if (buttonType === "URL" && buttonText && buttonUrl) {
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
      } else if (buttonType === "COPY_CODE" && buttonText) {
        components.push({
          type: "BUTTONS",
          buttons: [
            {
              type: "COPY_CODE",
              text: buttonText
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
        triggerToast("Template submitted to Meta and created successfully!", "success");
        setTimeout(() => {
          router.push("/admin/templates");
        }, 1500);
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
            <Info className={`w-4 h-4 ${toast.type === "success" ? "text-emerald-600" : "text-red-600"}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/templates")}
          className="p-2 bg-white border border-warm-200 rounded-xl text-warm-600 hover:bg-warm-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Create Meta Message Template
          </h1>
          <p className="text-warm-500 text-sm mt-0.5">
            Configure your message templates, body variables, action buttons, and image headers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Preset Selector */}
          <div className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-warm-100 pb-3">
              <h2 className="font-bold text-warm-900 text-base">Select Template Preset</h2>
              <div className="flex bg-warm-100 p-1 rounded-xl">
                <button
                  onClick={() => setPresetTab("utility")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    presetTab === "utility" ? "bg-white text-primary shadow-sm" : "text-warm-600"
                  }`}
                >
                  Utility Presets
                </button>
                <button
                  onClick={() => setPresetTab("marketing")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    presetTab === "marketing" ? "bg-white text-primary shadow-sm" : "text-warm-600"
                  }`}
                >
                  Marketing Presets
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(presetTab === "utility" ? UTILITY_PRESETS : MARKETING_PRESETS).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="bg-warm-50/50 hover:bg-white border border-warm-200 hover:border-primary rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-warm-900 text-sm group-hover:text-primary transition-colors">
                        {preset.title}
                      </span>
                      {preset.headerType === "IMAGE" && (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                          Image Header
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warm-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-warm-100">
                    <code className="text-[9px] text-warm-500 font-mono">
                      {preset.templateName}
                    </code>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Load Preset <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Builder Form */}
          <div className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm space-y-6">
            <h2 className="font-bold text-warm-900 text-base border-b border-warm-100 pb-3">
              Template Builder
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. promo_weekend_pizza"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                />
                <span className="text-[10px] text-warm-400 mt-1 block">
                  Only lowercase letters, numbers, and underscores allowed
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="MARKETING">Marketing (Promotions/Offers)</option>
                  <option value="UTILITY">Utility (Order Notifications)</option>
                  <option value="AUTHENTICATION">Authentication (OTPs/Verification)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="en_US">English (en_US)</option>
                  <option value="hi_IN">Hindi (hi_IN)</option>
                  <option value="es_ES">Spanish (es_ES)</option>
                  <option value="en">English Generic (en)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                  Header Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["NONE", "TEXT", "IMAGE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHeaderType(type)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

            {/* TEXT Header Details */}
            {headerType === "TEXT" && (
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                  Header Text
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Special Weekend Deal! 🍕"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
                />
                <span className="text-[10px] text-warm-400 mt-1 block">
                  Maximum 60 characters. Supports emojis.
                </span>
              </div>
            )}

            {/* IMAGE Header Details & Upload */}
            {headerType === "IMAGE" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider">
                  Header Image Source
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-warm-200/80 rounded-2xl p-4 flex flex-col items-center justify-center bg-warm-50/30 min-h-[140px] text-center relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-xs font-bold text-warm-700">Uploading to Cloudinary...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-warm-400 mx-auto" />
                        <p className="text-xs font-bold text-warm-800">Upload Header Image</p>
                        <p className="text-[10px] text-warm-500">Supports PNG, JPG, JPEG</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 px-4 py-1.5 bg-white border border-warm-250 hover:bg-warm-50 text-warm-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Choose File
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-bold text-warm-600 mb-1.5">Or Paste Image URL</span>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={headerImageUrl}
                        onChange={(e) => setHeaderImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10 font-mono"
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Meta review guidelines require a valid header handle or publicly accessible image URL to approve templates with images.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Body Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider">
                  Body Text
                </label>
                <button
                  type="button"
                  onClick={handleInsertVariable}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-[#cc1530] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variable `{"{{x}}"}`
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Hi {{1}}, get 20% off our new Pizza launch today!..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
              />
              <div className="bg-warm-50 border border-warm-200 p-3 rounded-xl text-[10px] text-warm-600 mt-2 space-y-1">
                <p className="font-bold text-warm-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-warm-500" /> Variable Guidelines:
                </p>
                <p>Use `{"{{1}}"}` for customer name, `{"{{2}}"}` for code/coupon, etc. Meta requires examples for variables, which our backend will auto-populate.</p>
              </div>
            </div>

            {/* Footer */}
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">
                Footer Text (Optional)
              </label>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Hello Pizza Cafe Support"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
              />
              <span className="text-[10px] text-warm-400 mt-1 block">
                Displayed in tiny font at the bottom of the template bubble (Max 60 characters).
              </span>
            </div>

            {/* Buttons / CTA */}
            <div className="border-t border-warm-100 pt-4 space-y-3">
              <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider">
                Call To Action Button
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                  <input
                    type="radio"
                    name="btnType"
                    checked={buttonType === "NONE"}
                    onChange={() => setButtonType("NONE")}
                    className="text-primary focus:ring-primary"
                  />
                  None
                </label>
                <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                  <input
                    type="radio"
                    name="btnType"
                    checked={buttonType === "URL"}
                    onChange={() => setButtonType("URL")}
                    className="text-primary focus:ring-primary"
                  />
                  Website Link URL
                </label>
                <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                  <input
                    type="radio"
                    name="btnType"
                    checked={buttonType === "COPY_CODE"}
                    onChange={() => setButtonType("COPY_CODE")}
                    className="text-primary focus:ring-primary"
                  />
                  Copy Code (Authentication Only)
                </label>
              </div>

              {buttonType === "URL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Button Label (e.g. Order Now)"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="URL Link (e.g. https://...)"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10 font-mono"
                    />
                  </div>
                </div>
              )}
              {buttonType === "COPY_CODE" && (
                <div className="max-w-md">
                  <input
                    type="text"
                    placeholder="Button Label (e.g. Copy Code)"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full px-3 py-2 bg-warm-50/50 border border-warm-200 focus:border-primary rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <span className="text-[10px] text-warm-400 mt-1 block">
                    Copy Code button text can be up to 25 characters.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right WhatsApp Preview Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+2rem)] space-y-4">
          <div className="bg-[#efeae2] rounded-[2rem] p-6 flex flex-col items-center justify-center relative overflow-hidden select-none border border-warm-200/50 min-h-[380px] shadow-sm">
            {/* Background Texture simulation */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <span className="text-[10px] font-bold text-warm-500 uppercase tracking-widest absolute top-4 left-4 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-warm-200/30">
              Live WhatsApp Preview
            </span>

            {/* Chat Bubble */}
            <div className="w-full max-w-[270px] bg-white rounded-tr-xl rounded-b-xl p-3 shadow-md border border-warm-100/30 relative text-xs mt-4">
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
              <div className="text-warm-800 whitespace-pre-wrap leading-relaxed font-sans">
                {getMockedBodyText().split(/(\[.*?\]|Rahul Sharma|OD-98214|Amit Kumar \(Rider\)|123 Cafe Street, Faridabad|\+91 98765 43210|500|2026-07-16|Special Loyalty Bonus|123456|150|350|2026-07-22)/g).map((part, index) => {
                  const highlights = ["Rahul Sharma", "OD-98214", "Amit Kumar (Rider)", "+91 98765 43210", "123 Cafe Street, Faridabad", "500", "2026-07-16", "Special Loyalty Bonus", "123456", "150", "350", "2026-07-22"];
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

            {/* Preview Button */}
            {name === "loyalty_balance_update_v2" ? (
              <div className="w-full max-w-[270px] space-y-1 mt-1">
                <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-200/50 flex items-center justify-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-500" />
                  <span>View Wallet</span>
                </div>
                <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-200/50 flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Call Us</span>
                </div>
              </div>
            ) : (
              <>
                {buttonType === "URL" && buttonText && (
                  <div className="w-full max-w-[270px] mt-1">
                    <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-200/50 flex items-center justify-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-blue-500" />
                      <span>{buttonText}</span>
                    </div>
                  </div>
                )}
                {buttonType === "COPY_CODE" && buttonText && (
                  <div className="w-full max-w-[270px] mt-1">
                    <div className="bg-white rounded-xl py-2 px-3 text-center text-xs font-semibold text-blue-600 shadow-sm border border-warm-200/50 flex items-center justify-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{buttonText}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 text-center text-[10px] text-warm-500 max-w-[220px] leading-relaxed">
              *Preview replaces template tags (e.g. `{"{{1}}"}`) with sample customer properties for display.
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-[2rem] p-6 border border-warm-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-[11px] text-warm-500">
              <HelpCircle className="w-4 h-4 text-warm-400 shrink-0" />
              Templates are validated and approved by Meta Graph API.
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/templates")}
                className="flex-1 px-4 py-2.5 bg-warm-100 text-warm-750 hover:bg-warm-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !name || !bodyText}
                className="flex-1 px-4 py-2.5 bg-primary text-white hover:bg-[#cc1530] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
