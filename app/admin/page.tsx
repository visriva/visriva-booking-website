"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  ShieldCheck,
  Save,
  RefreshCw,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  Magnet,
  Coffee,
  Key,
  Settings,
  FileText,
  DollarSign,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Briefcase,
  Calendar,
  ChevronRight,
  Layers,
  Crown,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIWhatsAppAssistantModal from "@/components/AIWhatsAppAssistantModal";
import { doc, setDoc } from "firebase/firestore";
import {
  subscribePricingMatrix,
  savePricingMatrix,
  subscribeGalleryVisibility,
  saveGalleryVisibility,
  subscribeGalleries,
  addGalleryItem,
  deleteGalleryItem,
  subscribeGlobalContactSettings,
  saveGlobalContactSettings,
  subscribeWebsiteText,
  saveWebsiteText,
  subscribeBookingLeads,
  updateLeadStatus,
  BookingLead,
  subscribePrintPreviewerConfig,
  savePrintPreviewerConfig,
  PrintPreviewerConfig,
  DEFAULT_PRINT_PREVIEWER_CONFIG,
  subscribeBlockedDates,
  saveBlockedDates,
  BlockedDatesConfig,
  DEFAULT_BLOCKED_DATES,
  subscribeGoldenWheelConfig,
  saveGoldenWheelConfig,
  GoldenWheelConfig,
  DEFAULT_GOLDEN_WHEEL_CONFIG,
  WheelPerk,
  DEFAULT_PRICING_MATRIX,
  GlobalPricingMatrix,
  ServicePackage,
  GalleryVisibilityConfig,
  GalleryItem,
  GlobalSettingsConfig,
  DEFAULT_GLOBAL_SETTINGS,
  WebsiteTextConfig,
  DEFAULT_WEBSITE_TEXT,
  compressImageFile,
  db,
  subscribeOperatorConfig,
  saveOperatorConfig,
  OperatorConfig,
  DEFAULT_OPERATOR_CONFIG,
  subscribeFeatureToggles,
  saveFeatureToggles,
  FeatureTogglesConfig,
  DEFAULT_FEATURE_TOGGLES,
  subscribeBentoGridConfig,
  saveBentoGridConfig,
  BentoGridConfig,
  DEFAULT_BENTO_GRID_CONFIG,
  subscribeHeroCardStackConfig,
  saveHeroCardStackConfig,
  HeroCardStackConfig,
  DEFAULT_HERO_CARD_STACK_CONFIG,
  HeroCardItemConfig,
  subscribeAIConciergeConfig,
  saveAIConciergeConfig,
  AIConciergeConfig,
  DEFAULT_AI_CONCIERGE_CONFIG,
  subscribeAIWhatsAppConfig,
  saveAIWhatsAppConfig,
  AIWhatsAppConfig,
  DEFAULT_AI_WHATSAPP_CONFIG,
  subscribeLiveImpactStats,
  saveLiveImpactStats,
  LiveImpactStatsConfig,
  DEFAULT_LIVE_IMPACT_STATS,
  subscribePlannersConfig,
  savePlannersConfig,
  PlannersPageConfig,
  DEFAULT_PLANNERS_CONFIG,
} from "@/lib/firebase";
import { fetchGoogleSheetColumns } from "@/lib/googleSheet";

export default function AdminDashboardPage() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");

  // System Database Status
  const [dbStatus, setDbStatus] = useState<"testing" | "connected" | "disconnected">("connected");

  // Authorized Admin Passwords
  const AUTHORIZED_PASSWORDS = ["jeevan", "drupitha", "punith", "arpitha", "4848", "0315"];

  // Admin Dashboard Tabs: 1. Global Settings | 2. Website Text | 3. Print Previewer | 4. Golden Wheel | 5. Pricing & Services | 6. Gallery Manager | 7. Booking CRM | 8. Feature Toggles | 9. Bento Grid CMS | 10. Service Toggles | 11. Hero Card Studio | 12. AI Concierge CMS | 13. AI WhatsApp CMS | 14. Real Impact Stats CMS | 15. Planners CMS
  const [activeTab, setActiveTab] = useState<
    "globalSettings" | "websiteText" | "printPreviewer" | "goldenWheel" | "pricingServices" | "galleryManager" | "bookingCRM" | "featureToggles" | "bentoGrid" | "serviceToggles" | "heroCardStudio" | "aiConciergeCMS" | "aiWhatsAppCMS" | "impactStatsCMS" | "plannersCMS"
  >("globalSettings");

  // Subtabs inside Pricing & Services
  const [pricingSubTab, setPricingSubTab] = useState<"photoBooth" | "magnets" | "keychains" | "mugs" | "toteTshirt">("photoBooth");
  const [pbHardwareSubTab, setPbHardwareSubTab] = useState<"dslr" | "ipad">("dslr");

  // State Collections
  const [matrix, setMatrix] = useState<GlobalPricingMatrix>(DEFAULT_PRICING_MATRIX);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [websiteText, setWebsiteText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const [operatorConfig, setOperatorConfig] = useState<OperatorConfig>(DEFAULT_OPERATOR_CONFIG);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const [bentoConfig, setBentoConfig] = useState<BentoGridConfig>(DEFAULT_BENTO_GRID_CONFIG);
  const [heroCardsConfig, setHeroCardsConfig] = useState<HeroCardStackConfig>(DEFAULT_HERO_CARD_STACK_CONFIG);
  const [aiConciergeConfig, setAiConciergeConfig] = useState<AIConciergeConfig>(DEFAULT_AI_CONCIERGE_CONFIG);
  const [aiWhatsAppConfig, setAiWhatsAppConfig] = useState<AIWhatsAppConfig>(DEFAULT_AI_WHATSAPP_CONFIG);
  const [impactStats, setImpactStats] = useState<LiveImpactStatsConfig>(DEFAULT_LIVE_IMPACT_STATS);
  const [plannersConfig, setPlannersConfig] = useState<PlannersPageConfig>(DEFAULT_PLANNERS_CONFIG);
  const [newClientBrandInput, setNewClientBrandInput] = useState("");
  const [newWhyCardTitle, setNewWhyCardTitle] = useState("");
  const [newWhyCardDesc, setNewWhyCardDesc] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newPresetChip, setNewPresetChip] = useState("");
  const [fetchingSheetHeaders, setFetchingSheetHeaders] = useState(false);
  const [visibility, setVisibility] = useState<GalleryVisibilityConfig>({
    isPhotoBoothGalleryVisible: true,
    isMagnetGalleryVisible: true,
    isKeychainGalleryVisible: true,
    isMugGalleryVisible: true,
  });
  const [galleriesList, setGalleriesList] = useState<GalleryItem[]>([]);
  const [leadsList, setLeadsList] = useState<Array<BookingLead & { id: string }>>([]);
  const [previewerConfig, setPreviewerConfig] = useState<PrintPreviewerConfig>(DEFAULT_PRINT_PREVIEWER_CONFIG);
  const [blockedDates, setBlockedDates] = useState<BlockedDatesConfig>(DEFAULT_BLOCKED_DATES);
  const [goldenWheelConfig, setGoldenWheelConfig] = useState<GoldenWheelConfig>(DEFAULT_GOLDEN_WHEEL_CONFIG);
  const [newFullyBookedDate, setNewFullyBookedDate] = useState("");
  const [newHighDemandDate, setNewHighDemandDate] = useState("");

  // Add Gallery Photo Form State
  const [newGalCategory, setNewGalCategory] = useState<
    "photo-booth" | "magnet-station" | "keychain-station" | "mug-printing"
  >("photo-booth");
  const [newGalTagline, setNewGalTagline] = useState("");
  const [newGalUrl, setNewGalUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // ── Crop Modal State ─────────────────────────────────────────────────────────
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"showcase" | "gallery">("showcase");
  const [cropSrc, setCropSrc] = useState<string>("");
  // Crop rectangle in % of image (0-100)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [cropDragging, setCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ mx: 0, my: 0, bx: 0, by: 0 });
  const [cropResizing, setCropResizing] = useState(false);
  const [cropResizeStart, setCropResizeStart] = useState({ mx: 0, my: 0, bw: 0, bh: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Feature Inputs State for Packages
  const [featureInputs, setFeatureInputs] = useState<Record<string, string>>({});

  // Toast State
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  // AI WhatsApp Assistant State for Admin Leads
  const [adminAiModalOpen, setAdminAiModalOpen] = useState(false);
  const [adminSelectedLeadForAI, setAdminSelectedLeadForAI] = useState<any>(null);

  // Subscriptions on mount
  useEffect(() => {
    const unsubMatrix = subscribePricingMatrix((data) => {
      if (data) setMatrix(data);
    });
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setGlobalSettings(data);
    });
    const unsubText = subscribeWebsiteText((data) => {
      if (data) setWebsiteText(data);
    });
    const unsubOp = subscribeOperatorConfig((data) => {
      if (data) setOperatorConfig(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    const unsubVis = subscribeGalleryVisibility((data) => {
      if (data) setVisibility(data);
    });
    const unsubGal = subscribeGalleries((items) => {
      if (items) setGalleriesList(items);
    });
    const unsubLeads = subscribeBookingLeads((items) => {
      if (items) setLeadsList(items);
    });
    const unsubPrev = subscribePrintPreviewerConfig((data) => {
      if (data) setPreviewerConfig(data);
    });
    const unsubBlocked = subscribeBlockedDates((data) => {
      if (data) setBlockedDates(data);
    });
    const unsubWheel = subscribeGoldenWheelConfig((data) => {
      if (data) setGoldenWheelConfig(data);
    });
    const unsubBento = subscribeBentoGridConfig((data) => {
      if (data) setBentoConfig(data);
    });
    const unsubHeroCards = subscribeHeroCardStackConfig((data) => {
      if (data) setHeroCardsConfig(data);
    });
    const unsubAIConcierge = subscribeAIConciergeConfig((data) => {
      if (data) setAiConciergeConfig(data);
    });
    const unsubAIWhatsApp = subscribeAIWhatsAppConfig((data) => {
      if (data) setAiWhatsAppConfig(data);
    });
    const unsubImpact = subscribeLiveImpactStats((data) => {
      if (data) setImpactStats(data);
    });
    const unsubPlanners = subscribePlannersConfig((data) => {
      if (data) setPlannersConfig(data);
    });

    return () => {
      unsubMatrix();
      unsubContact();
      unsubText();
      unsubOp();
      unsubToggles();
      unsubVis();
      unsubGal();
      unsubLeads();
      unsubPrev();
      unsubBlocked();
      unsubWheel();
      unsubBento();
      unsubHeroCards();
      unsubAIConcierge();
      unsubAIWhatsApp();
      unsubImpact();
      unsubPlanners();
    };
  }, []);

  const handleSaveBentoConfig = async () => {
    setIsSaving(true);
    const res = await saveBentoGridConfig(bentoConfig);
    setIsSaving(false);
    if (res.success) {
      showToast("Section 1 Bento Grid CMS saved successfully!");
    } else {
      showToast(res.error || "Failed to save Bento Grid settings", true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pin.trim().toLowerCase();
    if (AUTHORIZED_PASSWORDS.includes(entered)) {
      setAuthenticated(true);
      setPinError("");
    } else {
      setPinError("Invalid Admin Password. Please enter an authorized password.");
    }
  };

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(""), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  // --- SAVE HANDLERS ---
  const handleSaveGlobalSettings = async () => {
    setIsSaving(true);
    const res = await saveGlobalContactSettings(globalSettings);
    setIsSaving(false);
    if (res.success) {
      showToast("Global Contact Settings saved & synced across website!");
    } else {
      showToast("Failed to save Global Contact Settings", true);
    }
  };

  const handleSaveWebsiteText = async () => {
    setIsSaving(true);
    const res = await saveWebsiteText(websiteText);
    setIsSaving(false);
    if (res.success) {
      showToast("Website Text & Headings saved & synced across website!");
    } else {
      showToast("Failed to save Website Text", true);
    }
  };

  const handleSaveOperatorConfig = async () => {
    setIsSaving(true);
    const res = await saveOperatorConfig(operatorConfig);
    setIsSaving(false);
    if (res.success) {
      showToast("Crew Command & Google Sheet Settings Saved!");
    } else {
      showToast("Failed to save Crew Command Settings", true);
    }
  };

  const handleSaveFeatureToggles = async () => {
    setIsSaving(true);
    const res = await saveFeatureToggles(featureToggles);
    setIsSaving(false);
    if (res.success) {
      showToast("Master Feature Toggles Saved & Synced Across Website!");
    } else {
      showToast("Failed to save Feature Toggles", true);
    }
  };

  const handleSyncGoogleSheetHeaders = async () => {
    if (!operatorConfig.googleSheetUrl) {
      showToast("Please enter a valid Google Sheet URL first", true);
      return;
    }
    setFetchingSheetHeaders(true);
    const columns = await fetchGoogleSheetColumns(operatorConfig.googleSheetUrl);
    setFetchingSheetHeaders(false);
    setOperatorConfig({ ...operatorConfig, customQuestions: columns });
    showToast(`Successfully synced ${columns.length} question columns from Row 1!`);
  };

  const [showcaseSavedMsg, setShowcaseSavedMsg] = useState("");

  const handleSaveShowcaseCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const res = await saveWebsiteText(websiteText);
    setIsSaving(false);
    if (res.success) {
      setShowcaseSavedMsg("✨ Showcase Photo & Card saved successfully! Live changes synced to www.visriva.com");
      showToast("Showcase Photo & Card saved & updated live on website!");
      setTimeout(() => setShowcaseSavedMsg(""), 6000);
    } else {
      showToast("Failed to save Showcase Photo", true);
    }
  };

  const handleSavePricing = async () => {
    setIsSaving(true);
    const res = await savePricingMatrix(matrix);
    setIsSaving(false);
    if (res.success) {
      showToast("Pricing Matrix saved & synced across website!");
    } else {
      showToast("Failed to save Pricing Matrix", true);
    }
  };

  const handleToggleVisibility = async (key: keyof GalleryVisibilityConfig) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    const res = await saveGalleryVisibility(updated);
    if (res.success) {
      showToast(`Master Gallery toggle updated!`);
    } else {
      showToast("Failed to update visibility toggle", true);
    }
  };

  const handleSavePrintPreviewer = async () => {
    setIsSaving(true);
    const res = await savePrintPreviewerConfig(previewerConfig);
    setIsSaving(false);
    if (res.success) {
      showToast("Interactive Print Previewer settings saved to Cloud Firestore!");
    } else {
      showToast(res.error || "Failed to save print previewer settings", true);
    }
  };

  const handleSaveGoldenWheel = async () => {
    setIsSaving(true);
    const res = await saveGoldenWheelConfig(goldenWheelConfig);
    setIsSaving(false);
    if (res.success) {
      showToast("Golden Wheel settings & perks saved to Cloud Firestore!");
    } else {
      showToast(res.error || "Failed to save Golden Wheel settings", true);
    }
  };

  const handleAddFullyBookedDate = async () => {
    if (!newFullyBookedDate) return;
    const updated = {
      ...blockedDates,
      fullyBookedDates: Array.from(new Set([...(blockedDates.fullyBookedDates || []), newFullyBookedDate])),
    };
    const res = await saveBlockedDates(updated);
    setNewFullyBookedDate("");
    if (res.success) showToast("Fully booked date added & synced!");
  };

  const handleRemoveFullyBookedDate = async (d: string) => {
    const updated = {
      ...blockedDates,
      fullyBookedDates: (blockedDates.fullyBookedDates || []).filter((item) => item !== d),
    };
    const res = await saveBlockedDates(updated);
    if (res.success) showToast("Date removed!");
  };

  const handleAddHighDemandDate = async () => {
    if (!newHighDemandDate) return;
    const updated = {
      ...blockedDates,
      highDemandDates: Array.from(new Set([...(blockedDates.highDemandDates || []), newHighDemandDate])),
    };
    const res = await saveBlockedDates(updated);
    setNewHighDemandDate("");
    if (res.success) showToast("High demand date added & synced!");
  };

  const handleRemoveHighDemandDate = async (d: string) => {
    const updated = {
      ...blockedDates,
      highDemandDates: (blockedDates.highDemandDates || []).filter((item) => item !== d),
    };
    const res = await saveBlockedDates(updated);
    if (res.success) showToast("Date removed!");
  };

  // ── Crop Helpers ─────────────────────────────────────────────────────────────
  const openCropModal = (src: string, target: "showcase" | "gallery") => {
    setCropSrc(src);
    setCropTarget(target);
    setCropBox({ x: 5, y: 5, w: 90, h: 90 });
    setCropModalOpen(true);
  };

  const applyCrop = useCallback(() => {
    const img = cropImgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const sx = (cropBox.x / 100) * naturalW;
    const sy = (cropBox.y / 100) * naturalH;
    const sw = (cropBox.w / 100) * naturalW;
    const sh = (cropBox.h / 100) * naturalH;
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
    if (cropTarget === "showcase") {
      setWebsiteText((prev) => ({ ...prev, whatsIncludedImageUrl: croppedDataUrl }));
    } else {
      setNewGalUrl(croppedDataUrl);
    }
    setCropModalOpen(false);
    showToast("Image cropped & ready! Click Save to publish to live site.");
  }, [cropBox, cropTarget]);

  // Mouse drag to move crop box
  const onCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setCropDragging(true);
    setCropDragStart({ mx: e.clientX, my: e.clientY, bx: cropBox.x, by: cropBox.y });
  };
  const onCropResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCropResizing(true);
    setCropResizeStart({ mx: e.clientX, my: e.clientY, bw: cropBox.w, bh: cropBox.h });
  };
  const onCropMouseMove = useCallback((e: MouseEvent) => {
    const container = cropContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (cropDragging) {
      const dx = ((e.clientX - cropDragStart.mx) / rect.width) * 100;
      const dy = ((e.clientY - cropDragStart.my) / rect.height) * 100;
      setCropBox((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.w, cropDragStart.bx + dx)),
        y: Math.max(0, Math.min(100 - prev.h, cropDragStart.by + dy)),
      }));
    }
    if (cropResizing) {
      const dw = ((e.clientX - cropResizeStart.mx) / rect.width) * 100;
      const dh = ((e.clientY - cropResizeStart.my) / rect.height) * 100;
      setCropBox((prev) => ({
        ...prev,
        w: Math.max(10, Math.min(100 - prev.x, cropResizeStart.bw + dw)),
        h: Math.max(10, Math.min(100 - prev.y, cropResizeStart.bh + dh)),
      }));
    }
  }, [cropDragging, cropResizing, cropDragStart, cropResizeStart]);
  const onCropMouseUp = useCallback(() => {
    setCropDragging(false);
    setCropResizing(false);
  }, []);

  useEffect(() => {
    if (cropDragging || cropResizing) {
      window.addEventListener("mousemove", onCropMouseMove);
      window.addEventListener("mouseup", onCropMouseUp);
      return () => {
        window.removeEventListener("mousemove", onCropMouseMove);
        window.removeEventListener("mouseup", onCropMouseUp);
      };
    }
  }, [cropDragging, cropResizing, onCropMouseMove, onCropMouseUp]);

  // --- GALLERY IMAGE UPLOAD & DELETION HANDLERS ---
  const handleShowcaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        openCropModal(src, "showcase");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err?.message || "Failed to read image file", true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        openCropModal(src, "gallery");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err?.message || "Failed to read image file", true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalUrl.trim()) {
      showToast("Please select an image file or provide an image URL", true);
      return;
    }

    setIsSaving(true);
    const res = await addGalleryItem({
      category: newGalCategory,
      url: newGalUrl.trim(),
      tagline: newGalTagline.trim() || "Visriva Luxury Experience",
    });
    setIsSaving(false);

    if (res.success) {
      setNewGalUrl("");
      setNewGalTagline("");
      showToast("Photo added to gallery & synced to live site!");
    } else {
      showToast(res.error || "Failed to add photo", true);
    }
  };

  const handleDeletePhoto = async (item: GalleryItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.tagline || item.id}"?\n\nThis will remove the file from Firebase Storage and delete the database entry from Firestore.`
    );
    if (!confirmDelete) return;

    setDeletingId(item.id);
    const res = await deleteGalleryItem(item.id, item.url);
    setDeletingId("");

    if (res.success) {
      showToast("Photo successfully deleted from Firebase Storage & Firestore!");
    } else {
      showToast(res.error || "Failed to delete photo", true);
    }
  };

  // --- PACKAGE FEATURE EDITING HELPERS ---
  const handleAddFeature = (serviceKey: string, pkgIndex: number) => {
    const inputKey = `${serviceKey}_${pbHardwareSubTab}_${pkgIndex}`;
    const text = (featureInputs[inputKey] || "").trim();
    if (!text) return;

    const newMatrix = { ...matrix };
    if (serviceKey === "photoBooth") {
      const activePkgs = pbHardwareSubTab === "dslr" ? [...newMatrix.photoBooth.dslrPackages] : [...newMatrix.photoBooth.ipadPackages];
      activePkgs[pkgIndex].features = [...activePkgs[pkgIndex].features, text];
      if (pbHardwareSubTab === "dslr") newMatrix.photoBooth.dslrPackages = activePkgs;
      else newMatrix.photoBooth.ipadPackages = activePkgs;
    } else {
      const key = serviceKey as "magnets" | "mugs" | "keychains";
      const activePkgs = [...newMatrix[key].packages];
      activePkgs[pkgIndex].features = [...activePkgs[pkgIndex].features, text];
      newMatrix[key].packages = activePkgs;
    }

    setMatrix(newMatrix);
    setFeatureInputs({ ...featureInputs, [inputKey]: "" });
  };

  const handleRemoveFeature = (serviceKey: string, pkgIndex: number, featIndex: number) => {
    const newMatrix = { ...matrix };
    if (serviceKey === "photoBooth") {
      const activePkgs = pbHardwareSubTab === "dslr" ? [...newMatrix.photoBooth.dslrPackages] : [...newMatrix.photoBooth.ipadPackages];
      activePkgs[pkgIndex].features = activePkgs[pkgIndex].features.filter((_, i) => i !== featIndex);
      if (pbHardwareSubTab === "dslr") newMatrix.photoBooth.dslrPackages = activePkgs;
      else newMatrix.photoBooth.ipadPackages = activePkgs;
    } else {
      const key = serviceKey as "magnets" | "mugs" | "keychains";
      const activePkgs = [...newMatrix[key].packages];
      activePkgs[pkgIndex].features = activePkgs[pkgIndex].features.filter((_, i) => i !== featIndex);
      newMatrix[key].packages = activePkgs;
    }
    setMatrix(newMatrix);
  };

  // --- PIN AUTHENTICATION GATE ---
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-[#D4AF37]/40 shadow-gold-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gold-gradient text-[#011F15] flex items-center justify-center mx-auto shadow-gold-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-xs text-emerald-100/70">Enter authorized password to access CMS settings.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-xl tracking-widest focus:border-[#D4AF37] focus:outline-none"
              autoFocus
            />
            {pinError && <p className="text-xs text-red-400 font-semibold">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider shadow-gold-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] flex flex-col">
      <Navbar />

      {/* Floating Success & Error Toasts */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* DASHBOARD LAYOUT WITH SIDEBAR */}
      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-3">
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center space-x-2.5 text-[#D4AF37] border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-serif font-bold text-sm uppercase tracking-wider">CMS Master Control</span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab("globalSettings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "globalSettings"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>1. Global Contact &amp; Socials</span>
              </button>

              <button
                onClick={() => setActiveTab("websiteText")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "websiteText"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. Website Copy &amp; Text</span>
              </button>

              <button
                onClick={() => setActiveTab("printPreviewer")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "printPreviewer"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>3. 🎨 Custom Print Frame CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("goldenWheel")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "goldenWheel"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>4. 🎰 Golden Wheel of Perks CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("pricingServices")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "pricingServices"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>5. 💰 Pricing &amp; Package Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("galleryManager")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "galleryManager"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>6. 🖼️ Gallery Manager</span>
              </button>

              <button
                onClick={() => setActiveTab("bookingCRM")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "bookingCRM"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>7. 💼 Booking CRM Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab("featureToggles")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "featureToggles"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>8. ⚙️ Feature Toggles &amp; Crew Config</span>
              </button>

              <button
                onClick={() => setActiveTab("bentoGrid")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "bentoGrid"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>9. 🍱 Homepage Sections 1, 2 &amp; 3 CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("serviceToggles")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "serviceToggles"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>10. 🔌 Services &amp; Navbar Menu Toggles</span>
              </button>

              <button
                onClick={() => setActiveTab("heroCardStudio")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "heroCardStudio"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>11. 🎨 Hero 3D Cards Alignment Studio</span>
              </button>

              <button
                onClick={() => setActiveTab("aiConciergeCMS")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "aiConciergeCMS"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#011F15]" />
                <span>12. 🤖 AI Event Concierge CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("aiWhatsAppCMS")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "aiWhatsAppCMS"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>13. 💬 AI WhatsApp Assistant CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("impactStatsCMS")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "impactStatsCMS"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>14. 📊 Real Impact &amp; Event Tracker CMS</span>
              </button>

              <button
                onClick={() => setActiveTab("plannersCMS")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "plannersCMS"
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm font-extrabold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>15. 🤝 Planners &amp; B2B Portal CMS</span>
              </button>
            </nav>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 text-xs text-emerald-100/70 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cloud Firestore Active</span>
            </div>
            <p className="text-[11px] leading-relaxed">Changes save in real-time to Firestore with local storage backup.</p>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 space-y-6">
          
          {/* TAB 1: GLOBAL SETTINGS (CONTACT INFO & SOCIALS) */}
          {activeTab === "globalSettings" && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Global Contact &amp; Business Info</h2>
                  <p className="text-xs text-emerald-100/70">Update official contact details displayed on Navbar, Footer, and Contact sections.</p>
                </div>
                <button
                  onClick={handleSaveGlobalSettings}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Global Settings</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={globalSettings.contactEmail}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="contact@visriva.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={globalSettings.phoneNumber}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="+91 8884484828"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Physical Address</span>
                  </label>
                  <input
                    type="text"
                    value={globalSettings.physicalAddress}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, physicalAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Indiranagar, Bengaluru, Karnataka 560038"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <FaLinkedin className="w-4 h-4" />
                    <span>LinkedIn URL</span>
                  </label>
                  <input
                    type="url"
                    value={globalSettings.linkedinUrl}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, linkedinUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="https://linkedin.com/company/visriva"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <FaInstagram className="w-4 h-4" />
                    <span>Instagram Profile URL</span>
                  </label>
                  <input
                    type="url"
                    value={globalSettings.instagramUrl || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="https://instagram.com/visrivalivebooth"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span>WhatsApp Number</span>
                  </label>
                  <input
                    type="text"
                    value={globalSettings.whatsappNumber || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                    placeholder="919886000000"
                  />
                  <p className="text-[11px] text-emerald-100/60 font-light">
                    Enter country code + number with no spaces or + sign (e.g. <span className="text-[#D4AF37] font-mono">919886000000</span>). This controls the WhatsApp icon 🟢 and the &quot;Chat via WhatsApp&quot; button in the footer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE TEXT CONTROL */}
          {activeTab === "websiteText" && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Global Website Text &amp; Copy CMS</h2>
                  <p className="text-xs text-emerald-100/70">Dynamically update hero headlines, taglines, and footer copy across live pages.</p>
                </div>
                <button
                  onClick={handleSaveWebsiteText}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Website Text</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Hero Title (H1)</label>
                  <input
                    type="text"
                    value={websiteText.heroTitle}
                    onChange={(e) => setWebsiteText({ ...websiteText, heroTitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-serif text-lg focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={websiteText.heroSubtitle}
                    onChange={(e) => setWebsiteText({ ...websiteText, heroSubtitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Hero Top Badge Tagline</label>
                  <input
                    type="text"
                    value={websiteText.heroTagline}
                    onChange={(e) => setWebsiteText({ ...websiteText, heroTagline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">About / Brand Story Text</label>
                  <textarea
                    rows={3}
                    value={websiteText.aboutText}
                    onChange={(e) => setWebsiteText({ ...websiteText, aboutText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Footer Description Paragraph</label>
                  <textarea
                    rows={3}
                    value={websiteText.footerDescription}
                    onChange={(e) => setWebsiteText({ ...websiteText, footerDescription: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE CUSTOM PRINT FRAME PREVIEWER CMS */}
          {activeTab === "printPreviewer" && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white flex items-center space-x-2">
                    <Palette className="w-6 h-6 text-[#D4AF37]" />
                    <span>3. 🎨 Interactive Custom Print Frame Previewer CMS</span>
                  </h2>
                  <p className="text-xs text-emerald-100/70 mt-1">
                    Toggle previewer on/off, change default print sizes (4x6 card, 2x6 strip, 3x4 magnet), sample photo, and watermark text.
                  </p>
                </div>

                <button
                  onClick={handleSavePrintPreviewer}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Frame Previewer</span>
                </button>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">Master Toggle: Show Previewer on Website</span>
                  <span className="text-xs text-emerald-100/60 block">Turn ON/OFF the live interactive print template preview section on the home page.</span>
                </div>
                <button
                  onClick={() => setPreviewerConfig({ ...previewerConfig, isVisible: !previewerConfig.isVisible })}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
                    previewerConfig.isVisible
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {previewerConfig.isVisible ? "ENABLED ON WEBSITE ✅" : "HIDDEN FROM WEBSITE 🚫"}
                </button>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Default Print Layout Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "4x6", label: "4x6 Classic Card" },
                    { id: "2x6", label: "2x6 Photo Strip" },
                    { id: "3x4", label: "3x4 Magnet Acrylic" },
                    { id: "2x4", label: "2x4 Mini Card" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setPreviewerConfig({ ...previewerConfig, defaultSize: sz.id as any })}
                      className={`p-3 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                        previewerConfig.defaultSize === sz.id
                          ? "bg-[#D4AF37] text-[#011F15] border-[#D4AF37] shadow-gold-sm"
                          : "bg-black/30 text-white/70 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-100/70 pt-1 font-mono">
                  ✂️ <strong>Standard Strip Rule:</strong> Whenever a 2×6 photo strip is printed (DSLR or iPad booth), <strong>2 duplicate strips are automatically printed per session</strong> (1 for guest + 1 for host guestbook).
                </p>
              </div>

              {/* Sample Photo & Watermark text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Sample Image URL</label>
                  <input
                    type="text"
                    value={previewerConfig.previewImageUrl}
                    onChange={(e) => setPreviewerConfig({ ...previewerConfig, previewImageUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Watermark Brand Text</label>
                  <input
                    type="text"
                    value={previewerConfig.customWatermarkText}
                    onChange={(e) => setPreviewerConfig({ ...previewerConfig, customWatermarkText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOLDEN WHEEL OF PERKS CMS */}
          {activeTab === "goldenWheel" && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                    <span>4. 🎰 Golden Wheel of Perks CMS Controls</span>
                  </h2>
                  <p className="text-xs text-emerald-100/70 mt-1">
                    Control floating wheel visibility, button text, modal title, and customize all 6 wheel perks &amp; voucher claim codes.
                  </p>
                </div>

                <button
                  onClick={handleSaveGoldenWheel}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Golden Wheel CMS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Master Toggle ON/OFF */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Golden Wheel Feature Toggle</span>
                    <span className="text-[11px] text-emerald-100/60 font-mono">
                      Show or hide the floating wheel button on visriva.com
                    </span>
                  </div>
                  <button
                    onClick={() => setGoldenWheelConfig({ ...goldenWheelConfig, enabled: !goldenWheelConfig.enabled })}
                    className={`px-4 py-1.5 rounded-full text-xs font-extrabold font-mono transition cursor-pointer ${
                      goldenWheelConfig.enabled
                        ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        : "bg-red-500/30 text-red-300 border border-red-500/40"
                    }`}
                  >
                    {goldenWheelConfig.enabled ? "ENABLED (ON) ✅" : "DISABLED (OFF) ❌"}
                  </button>
                </div>

                {/* Button Label */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Floating Button Text</label>
                  <input
                    type="text"
                    value={goldenWheelConfig.buttonLabel || ""}
                    onChange={(e) => setGoldenWheelConfig({ ...goldenWheelConfig, buttonLabel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Perks List Editor */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                  Wheel Perks &amp; Voucher Claim Codes ({goldenWheelConfig.perks?.length || 0} Perks)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(goldenWheelConfig.perks || []).map((perk, idx) => (
                    <div key={perk.id || idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-[#D4AF37] font-mono">Perk #{idx + 1}</span>
                        <button
                          onClick={() => {
                            const updated = goldenWheelConfig.perks.filter((_, i) => i !== idx);
                            setGoldenWheelConfig({ ...goldenWheelConfig, perks: updated });
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                        >
                          Delete Perk ❌
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-white/70 block">Perk Title (Display on Wheel)</label>
                          <input
                            type="text"
                            value={perk.title}
                            onChange={(e) => {
                              const updated = [...goldenWheelConfig.perks];
                              updated[idx].title = e.target.value;
                              setGoldenWheelConfig({ ...goldenWheelConfig, perks: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-white/70 block">Voucher Code</label>
                            <input
                              type="text"
                              value={perk.code}
                              onChange={(e) => {
                                const updated = [...goldenWheelConfig.perks];
                                updated[idx].code = e.target.value;
                                setGoldenWheelConfig({ ...goldenWheelConfig, perks: updated });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-white/70 block">Badge Color</label>
                            <input
                              type="text"
                              value={perk.color}
                              onChange={(e) => {
                                const updated = [...goldenWheelConfig.perks];
                                updated[idx].color = e.target.value;
                                setGoldenWheelConfig({ ...goldenWheelConfig, perks: updated });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-white/70 block">Perk Description</label>
                          <input
                            type="text"
                            value={perk.description}
                            onChange={(e) => {
                              const updated = [...goldenWheelConfig.perks];
                              updated[idx].description = e.target.value;
                              setGoldenWheelConfig({ ...goldenWheelConfig, perks: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-emerald-100/80 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newPerk: WheelPerk = {
                      id: `perk_${Date.now()}`,
                      title: "🎉 New Custom Perk",
                      code: "VISRIVA-NEW-PERK",
                      color: "#D4AF37",
                      description: "Description for custom perk",
                    };
                    setGoldenWheelConfig({ ...goldenWheelConfig, perks: [...(goldenWheelConfig.perks || []), newPerk] });
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer border border-white/20"
                >
                  + Add Custom Perk
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & SERVICES MATRIX */}
          {activeTab === "pricingServices" && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Pricing &amp; Package Matrix</h2>
                  <p className="text-xs text-emerald-100/70">Configure package tiers, pricing, features, and idle hourly rates.</p>
                </div>
                <button
                  onClick={handleSavePricing}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Pricing Matrix</span>
                </button>
              </div>

              {/* Service Navigation Subtabs */}
              <div className="flex items-center gap-2 flex-wrap border-b border-white/10 pb-4">
                <button
                  onClick={() => setPricingSubTab("photoBooth")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                    pricingSubTab === "photoBooth" ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Photo Booth</span>
                </button>

                <button
                  onClick={() => setPricingSubTab("magnets")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                    pricingSubTab === "magnets" ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Magnet className="w-4 h-4" />
                  <span>Custom Magnets</span>
                </button>

                <button
                  onClick={() => setPricingSubTab("keychains")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                    pricingSubTab === "keychains" ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Keychains</span>
                </button>

                <button
                  onClick={() => setPricingSubTab("mugs")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                    pricingSubTab === "mugs" ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Live Mugs</span>
                </button>

                <button
                  onClick={() => setPricingSubTab("toteTshirt")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                    pricingSubTab === "toteTshirt" ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Tote Bag &amp; T-Shirt</span>
                </button>
              </div>

              {/* Photo Booth Hardware Subtabs */}
              {pricingSubTab === "photoBooth" && (
                <div className="flex items-center space-x-3 bg-white/5 p-1.5 rounded-xl w-fit">
                  <button
                    onClick={() => setPbHardwareSubTab("dslr")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      pbHardwareSubTab === "dslr" ? "bg-[#D4AF37] text-[#011F15]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    DSLR Packages
                  </button>
                  <button
                    onClick={() => setPbHardwareSubTab("ipad")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      pbHardwareSubTab === "ipad" ? "bg-[#D4AF37] text-[#011F15]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    iPad Packages
                  </button>
                </div>
              )}

              {/* Extra Operational Hour Rate (Idle Hourly Rate) Editor */}
              <div className="glass-card p-4 rounded-xl border border-[#D4AF37]/40 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {pricingSubTab === "photoBooth"
                        ? "Photo Booth Extra Hour Rate (₹/hr)"
                        : pricingSubTab === "magnets"
                        ? "Custom Magnets Extra Hour Rate (₹/hr)"
                        : pricingSubTab === "keychains"
                        ? "Metal Keychains Extra Hour Rate (₹/hr)"
                        : "Live Mugs Extra Hour Rate (₹/hr)"}
                    </span>
                  </label>
                  <p className="text-[11px] text-emerald-100/60 font-light">
                    Hourly rate added when an event exceeds 4 operational hours (automatically calculated in booking intake estimator).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-[#D4AF37] font-bold">₹</span>
                  <input
                    type="number"
                    value={
                      pricingSubTab === "photoBooth"
                        ? matrix.photoBooth.idleHourlyRate || 1500
                        : matrix[pricingSubTab].idleHourlyRate || 1500
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newMatrix = { ...matrix };
                      if (pricingSubTab === "photoBooth") {
                        newMatrix.photoBooth.idleHourlyRate = val;
                      } else {
                        newMatrix[pricingSubTab] = { ...newMatrix[pricingSubTab], idleHourlyRate: val };
                      }
                      setMatrix(newMatrix);
                    }}
                    className="w-28 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-[#D4AF37] font-mono font-bold text-sm focus:border-[#D4AF37] outline-none"
                  />
                  <span className="text-xs text-white/70 font-mono">/ hour</span>
                </div>
              </div>

              {/* Active Packages Editor */}
              <div className="space-y-6">
                {(pricingSubTab === "photoBooth"
                  ? pbHardwareSubTab === "dslr"
                    ? matrix.photoBooth.dslrPackages
                    : matrix.photoBooth.ipadPackages
                  : matrix[pricingSubTab].packages
                ).map((pkg, idx) => (
                  <div key={pkg.id || idx} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4 bg-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Package Name</label>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => {
                            const newMatrix = { ...matrix };
                            if (pricingSubTab === "photoBooth") {
                              const pkgs = pbHardwareSubTab === "dslr" ? [...newMatrix.photoBooth.dslrPackages] : [...newMatrix.photoBooth.ipadPackages];
                              pkgs[idx].name = e.target.value;
                              if (pbHardwareSubTab === "dslr") newMatrix.photoBooth.dslrPackages = pkgs;
                              else newMatrix.photoBooth.ipadPackages = pkgs;
                            } else {
                              const pkgs = [...newMatrix[pricingSubTab].packages];
                              pkgs[idx].name = e.target.value;
                              newMatrix[pricingSubTab].packages = pkgs;
                            }
                            setMatrix(newMatrix);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-bold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Price (₹)</label>
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => {
                            const newMatrix = { ...matrix };
                            const num = Number(e.target.value);
                            if (pricingSubTab === "photoBooth") {
                              const pkgs = pbHardwareSubTab === "dslr" ? [...newMatrix.photoBooth.dslrPackages] : [...newMatrix.photoBooth.ipadPackages];
                              pkgs[idx].price = num;
                              if (pbHardwareSubTab === "dslr") newMatrix.photoBooth.dslrPackages = pkgs;
                              else newMatrix.photoBooth.ipadPackages = pkgs;
                            } else {
                              const pkgs = [...newMatrix[pricingSubTab].packages];
                              pkgs[idx].price = num;
                              newMatrix[pricingSubTab].packages = pkgs;
                            }
                            setMatrix(newMatrix);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-[#D4AF37] font-mono font-bold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Duration / Subtitle</label>
                        <input
                          type="text"
                          value={pkg.subtitle || pkg.duration}
                          onChange={(e) => {
                            const newMatrix = { ...matrix };
                            if (pricingSubTab === "photoBooth") {
                              const pkgs = pbHardwareSubTab === "dslr" ? [...newMatrix.photoBooth.dslrPackages] : [...newMatrix.photoBooth.ipadPackages];
                              pkgs[idx].subtitle = e.target.value;
                              if (pbHardwareSubTab === "dslr") newMatrix.photoBooth.dslrPackages = pkgs;
                              else newMatrix.photoBooth.ipadPackages = pkgs;
                            } else {
                              const pkgs = [...newMatrix[pricingSubTab].packages];
                              pkgs[idx].subtitle = e.target.value;
                              newMatrix[pricingSubTab].packages = pkgs;
                            }
                            setMatrix(newMatrix);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-sans text-xs"
                        />
                      </div>
                    </div>

                    {/* Feature Bullets */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Included Features</label>
                      <div className="flex flex-wrap gap-2">
                        {pkg.features.map((feat, fIdx) => (
                          <span key={fIdx} className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white">
                            <span>{feat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(pricingSubTab, idx, fIdx)}
                              className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="text"
                          placeholder="Add new feature bullet..."
                          value={featureInputs[`${pricingSubTab}_${pbHardwareSubTab}_${idx}`] || ""}
                          onChange={(e) =>
                            setFeatureInputs({
                              ...featureInputs,
                              [`${pricingSubTab}_${pbHardwareSubTab}_${idx}`]: e.target.value,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddFeature(pricingSubTab, idx)}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs hover:bg-[#D4AF37] hover:text-[#011F15] transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY MANAGER & MASTER VISIBILITY */}
          {activeTab === "galleryManager" && (
            <div className="space-y-8">
              
              {/* SECTION 0: RECOMMENDED IMAGE DIMENSIONS & FORMAT GUIDE */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 bg-gradient-to-r from-black/60 via-[#01281c]/80 to-black/60 space-y-4">
                <div className="flex items-center space-x-3 text-[#D4AF37]">
                  <Sparkles className="w-6 h-6 flex-shrink-0" />
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">Recommended Image Dimensions &amp; Format Guide</h2>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Use this cheat sheet to prepare your photography assets for optimal resolution and high-speed loading on desktop and mobile screens.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <div className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-wider flex items-center space-x-1.5">
                      <span>📸 1. Showcase Setup Card ("What's Included")</span>
                    </div>
                    <ul className="text-xs text-emerald-100/90 space-y-1 font-sans">
                      <li>• <strong className="text-white">Recommended Dimensions:</strong> 1200 x 900 px (4:3 ratio) or 1200 x 800 px (3:2 ratio)</li>
                      <li>• <strong className="text-white">Display Aspect:</strong> Landscape card container</li>
                      <li>• <strong className="text-white">Supported Formats:</strong> JPG, JPEG, PNG, WebP, iPhone HEIC / HEIF</li>
                      <li>• <strong className="text-white">Auto-Optimization:</strong> Automatically compressed to ~120 KB</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <div className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-wider flex items-center space-x-1.5">
                      <span>🖼️ 2. Service Event Gallery Grid Items</span>
                    </div>
                    <ul className="text-xs text-emerald-100/90 space-y-1 font-sans">
                      <li>• <strong className="text-white">Recommended Dimensions:</strong> 1080 x 1350 px (4:5 portrait) or 1920 x 1080 px (16:9)</li>
                      <li>• <strong className="text-white">Display Aspect:</strong> Responsive masonry grid card</li>
                      <li>• <strong className="text-white">Supported Formats:</strong> JPG, JPEG, PNG, WebP, iPhone HEIC / HEIF</li>
                      <li>• <strong className="text-white">Auto-Optimization:</strong> Automatically compressed to ~120 KB</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* SECTION A: MASTER VISIBILITY TOGGLES */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                    <span>Master Gallery Visibility Switches</span>
                  </h2>
                  <p className="text-xs text-emerald-100/70">Control gallery visibility across the entire website with one master switch or per service.</p>
                </div>

                {/* 🔴 GLOBAL WEBSITE-WIDE MASTER TOGGLE CARD */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  visibility.isGlobalGalleryVisible !== false
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-widest font-mono text-[#D4AF37]">
                        🌐 COMPLETE WEBSITE MASTER TOGGLE
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        visibility.isGlobalGalleryVisible !== false
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border border-red-500/40"
                      }`}>
                        {visibility.isGlobalGalleryVisible !== false ? "🟢 ALL GALLERIES ACTIVE" : "🔴 ALL GALLERIES HIDDEN"}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-white">Hide All Galleries Across Entire Website</h3>
                    <p className="text-xs text-emerald-100/70 max-w-xl leading-relaxed">
                      Turn this OFF to instantly hide every gallery section and button on www.visriva.com (Homepage Portfolio Visualizer + Photo Booth, Magnets, Keychains, and Mugs galleries).
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleVisibility("isGlobalGalleryVisible")}
                    className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 flex-shrink-0 shadow-lg ${
                      visibility.isGlobalGalleryVisible !== false
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 hover:scale-105"
                        : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 hover:scale-105"
                    }`}
                  >
                    {visibility.isGlobalGalleryVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{visibility.isGlobalGalleryVisible !== false ? "GALLERIES: ENABLED" : "GALLERIES: HIDDEN"}</span>
                  </button>
                </div>

                <div className="pt-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Sub-Category Gallery Switches (Individual Control)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-white">Photo Booth Gallery</h4>
                      <p className="text-[11px] text-emerald-100/60">Shows button on /photo-booth page</p>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility("isPhotoBoothGalleryVisible")}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                        visibility.isPhotoBoothGalleryVisible
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {visibility.isPhotoBoothGalleryVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{visibility.isPhotoBoothGalleryVisible ? "VISIBLE" : "HIDDEN"}</span>
                    </button>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-white">Custom Magnets Gallery</h4>
                      <p className="text-[11px] text-emerald-100/60">Shows button on magnet-station page</p>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility("isMagnetGalleryVisible")}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                        visibility.isMagnetGalleryVisible
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {visibility.isMagnetGalleryVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{visibility.isMagnetGalleryVisible ? "VISIBLE" : "HIDDEN"}</span>
                    </button>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-white">Metal Keychains Gallery</h4>
                      <p className="text-[11px] text-emerald-100/60">Shows button on keychain-station page</p>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility("isKeychainGalleryVisible")}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                        visibility.isKeychainGalleryVisible
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {visibility.isKeychainGalleryVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{visibility.isKeychainGalleryVisible ? "VISIBLE" : "HIDDEN"}</span>
                    </button>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-white">Live Mugs Gallery</h4>
                      <p className="text-[11px] text-emerald-100/60">Shows button on mug-printing page</p>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility("isMugGalleryVisible")}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                        visibility.isMugGalleryVisible
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {visibility.isMugGalleryVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{visibility.isMugGalleryVisible ? "VISIBLE" : "HIDDEN"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION B: PHOTO BOOTH SHOWCASE CARD CMS ("What's Included" Photo & Card) */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                      <span>Photo Booth Showcase Card CMS (&quot;What&apos;s Included&quot; Section)</span>
                    </h2>
                    <p className="text-xs text-emerald-100/70">Manage the signature setup photo and details shown in the photo booth guarantee section on the main site.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveShowcaseCard()}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center space-x-2 shadow-gold-md cursor-pointer flex-shrink-0 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#011F15] border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Showcase Photo &amp; Card</span>
                      </>
                    )}
                  </button>
                </div>

                {showcaseSavedMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-xs flex items-center space-x-2 animate-fade-in shadow-lg">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{showcaseSavedMsg}</span>
                  </div>
                )}

                {/* Image Uploader & Crop & Preview */}
                <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/10">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Showcase Card Photo</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37]/30 transition flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Choose File & Crop</span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
                        onChange={handleShowcaseImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-emerald-100/50">or Image URL:</span>
                    <input
                      type="url"
                      value={websiteText.whatsIncludedImageUrl || ""}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedImageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {websiteText.whatsIncludedImageUrl && (
                    <div className="space-y-3 pt-2">
                      {/* Live Website Preview */}
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">⚡ As Seen on Website — Live Preview</p>
                      <div className="relative glass-card rounded-3xl p-3 border border-[#D4AF37]/40 shadow-lg max-w-xs bg-white/5 overflow-hidden">
                        <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={websiteText.whatsIncludedImageUrl}
                            alt="Live Preview"
                            className="w-full h-full object-contain object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-[#011F15] bg-[#D4AF37] px-2 py-0.5 rounded-full mb-1">
                              {websiteText.whatsIncludedBadge || "Signature Station"}
                            </span>
                            <p className="text-white font-bold text-sm leading-tight">{websiteText.whatsIncludedTitle || "Vintage Wooden Booth Setup"}</p>
                            <p className="text-emerald-200/80 text-[9px] mt-0.5">{websiteText.whatsIncludedSubtitle || "Studio Strobe Lighting"}</p>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="text-[8px] font-bold uppercase tracking-widest text-[#D4AF37] bg-black/60 px-2 py-0.5 rounded-full border border-[#D4AF37]/40">visriva.com</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-emerald-100/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>This is exactly how the card looks on the live website. Save Website Text to publish.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Showcase Badge Tagline</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedBadge || ""}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedBadge: e.target.value })}
                      placeholder="Signature Station"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Showcase Card Title</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedTitle || ""}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedTitle: e.target.value })}
                      placeholder="Vintage Wooden Booth Setup"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-serif text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Showcase Subtitle / Specs</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedSubtitle || ""}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedSubtitle: e.target.value })}
                      placeholder="Studio Strobe Lighting • 8-Sec Thermal Dye-Sublimation"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: UPLOAD NEW GALLERY PHOTO */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Upload New Event Photo &amp; Tagline</h2>
                  <p className="text-xs text-emerald-100/70">Upload a photo to Firebase Storage and assign a Playfair Display tagline.</p>
                </div>

                <form onSubmit={handleAddPhoto} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Category</label>
                      <select
                        value={newGalCategory}
                        onChange={(e: any) => setNewGalCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-sans text-sm focus:border-[#D4AF37]"
                      >
                        <option value="photo-booth">Photo Booth</option>
                        <option value="magnet-station">Custom Magnets</option>
                        <option value="keychain-station">Metal Keychains</option>
                        <option value="mug-printing">Live Mugs</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Custom Tagline (Playfair Display)</label>
                      <input
                        type="text"
                        value={newGalTagline}
                        onChange={(e) => setNewGalTagline(e.target.value)}
                        placeholder="e.g. The Leela Palace Royal Wedding"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-serif text-sm focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Select Image File or URL</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37]/30 transition flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Choose & Crop Image</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-emerald-100/50">or enter image URL:</span>
                      <input
                        type="url"
                        value={newGalUrl}
                        onChange={(e) => setNewGalUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {newGalUrl && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">⚡ Gallery Card Preview — As Seen on Website</p>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#D4AF37]/40 max-w-xs bg-black shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={newGalUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">{newGalCategory}</span>
                          <p className="text-white text-sm font-bold mt-1 leading-snug">{newGalTagline || "Visriva Experience"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving || uploadingImage}
                    className="px-6 py-3.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload &amp; Publish to Live Gallery</span>
                  </button>
                </form>
              </div>

              {/* SECTION C: LIVE GALLERY MANAGE & TWO-STEP DELETE */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Active Event Galleries ({galleriesList.length})</h2>
                  <p className="text-xs text-emerald-100/70">Two-step deletion removes file from Firebase Storage and document from Firestore.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleriesList.map((item) => (
                    <div key={item.id} className="glass-card rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40">
                          <img src={item.url} alt={item.tagline} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 inline-block">
                          {item.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-white leading-snug">{item.tagline || "Visriva Experience"}</h4>
                      </div>

                      <button
                        onClick={() => handleDeletePhoto(item)}
                        disabled={deletingId === item.id}
                        className="w-full py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingId === item.id ? "Deleting..." : "Delete Photo"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: BOOKING CRM PIPELINE (KANBAN BOARD) */}
          {activeTab === "bookingCRM" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white flex items-center space-x-2">
                    <Briefcase className="w-6 h-6 text-[#D4AF37]" />
                    <span>Booking Lead CRM Pipeline ({leadsList.length} Leads)</span>
                  </h2>
                  <p className="text-xs text-emerald-100/70 mt-1">
                    Manage client booking inquiries, update status, and track deposits in real-time across your agency pipeline.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 rounded-xl border border-[#D4AF37]/30">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Firestore Real-Time CRM</span>
                </div>
              </div>

              {/* CALENDAR AVAILABILITY & BLOCKED DATES MANAGER */}
              <div className="glass-card rounded-3xl p-6 border border-[#D4AF37]/40 space-y-4 bg-black/40">
                <div className="flex items-center space-x-2 text-[#D4AF37] font-bold text-sm uppercase tracking-wider font-mono">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  <span>📅 Calendar Availability Manager (Live Website Availability Badge)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Fully Booked Dates */}
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider block font-mono">
                      🔴 Blocked / Fully Booked Dates
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={newFullyBookedDate}
                        onChange={(e) => setNewFullyBookedDate(e.target.value)}
                        className="bg-black/60 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <button
                        onClick={handleAddFullyBookedDate}
                        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Add Blocked Date +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(blockedDates.fullyBookedDates || []).map((d) => (
                        <span key={d} className="inline-flex items-center space-x-1.5 bg-red-950/80 text-red-300 border border-red-500/40 text-xs px-2.5 py-1 rounded-lg font-mono">
                          <span>{d}</span>
                          <button onClick={() => handleRemoveFullyBookedDate(d)} className="text-red-400 hover:text-white font-bold ml-1 cursor-pointer">&times;</button>
                        </span>
                      ))}
                      {(!blockedDates.fullyBookedDates || blockedDates.fullyBookedDates.length === 0) && (
                        <span className="text-[11px] text-white/50 italic">No fully booked dates set.</span>
                      )}
                    </div>
                  </div>

                  {/* 2. High Demand Dates */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block font-mono">
                      🟡 High Demand Dates (1 Rig Remaining)
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={newHighDemandDate}
                        onChange={(e) => setNewHighDemandDate(e.target.value)}
                        className="bg-black/60 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <button
                        onClick={handleAddHighDemandDate}
                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Add High Demand +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(blockedDates.highDemandDates || []).map((d) => (
                        <span key={d} className="inline-flex items-center space-x-1.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-lg font-mono">
                          <span>{d}</span>
                          <button onClick={() => handleRemoveHighDemandDate(d)} className="text-amber-400 hover:text-white font-bold ml-1 cursor-pointer">&times;</button>
                        </span>
                      ))}
                      {(!blockedDates.highDemandDates || blockedDates.highDemandDates.length === 0) && (
                        <span className="text-[11px] text-white/50 italic">No high demand dates set.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* KANBAN PIPELINE COLUMNS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                {[
                  { id: "NEW_LEAD", name: "📥 New Leads", color: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
                  { id: "QUOTE_SENT", name: "💬 Quote Sent", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
                  { id: "DEPOSIT_PAID", name: "💳 40% Deposit", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
                  { id: "CONFIRMED", name: "🎉 Confirmed", color: "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" },
                  { id: "COMPLETED", name: "✅ Completed", color: "border-gray-500/40 bg-gray-500/10 text-gray-300" },
                ].map((col) => {
                  const colLeads = leadsList.filter((l) => (l.status || "NEW_LEAD") === col.id);
                  return (
                    <div key={col.id} className="glass-card rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3 min-w-[240px]">
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${col.color}`}>
                          {col.name}
                        </span>
                        <span className="font-mono text-xs text-white/70 font-bold">{colLeads.length}</span>
                      </div>

                      {/* Lead Cards List */}
                      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                        {colLeads.length === 0 ? (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center text-[11px] text-white/40 font-mono">
                            No leads in {col.name}
                          </div>
                        ) : (
                          colLeads.map((lead) => (
                            <div key={lead.id} className="glass-card rounded-xl p-3.5 border border-white/15 bg-black/40 space-y-2.5 shadow-md hover:border-[#D4AF37]/50 transition">
                              <div>
                                <h4 className="font-serif font-bold text-sm text-white leading-tight">
                                  {lead.clientName || "VIP Inquiry"}
                                </h4>
                                <p className="text-[11px] text-[#D4AF37] font-bold mt-0.5">{lead.eventType || "Event"}</p>
                              </div>

                              <div className="space-y-1 text-[11px] text-emerald-100/70 font-mono">
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                                  <span>{lead.eventDate || "Date TBD"}</span>
                                </div>
                                <div className="truncate text-white/90">📍 {lead.venue || "Bengaluru"}</div>
                                <div className="text-[#D4AF37] font-bold">💰 {lead.estimatedBudget || "Quote Pending"}</div>
                                <div>📱 {lead.clientPhone || "No Phone"}</div>
                                {lead.customHashtag && (
                                  <div className="text-emerald-300 font-bold font-serif text-[10px]">✨ {lead.customHashtag}</div>
                                )}
                                {lead.isGstInvoice && (
                                  <div className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    🏢 GST: {lead.companyName || "Corporate"} ({lead.companyGstin || "No GSTIN"})
                                  </div>
                                )}
                                {lead.clientLogoUrl && (
                                  <div className="flex items-center space-x-1 pt-1">
                                    <span className="text-[9px] text-white/50">Logo:</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={lead.clientLogoUrl} alt="Logo" className="w-6 h-6 object-contain bg-black rounded border border-[#D4AF37]/50" />
                                  </div>
                                )}
                              </div>

                              {/* Contract & Invoice Generator Buttons */}
                              <div className="pt-2 border-t border-white/10 space-y-1.5">
                                <a
                                  href={`/contract?leadId=${lead.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-1.5 px-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#011F15] font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-center space-x-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>📜 Open Contract &amp; Invoice</span>
                                </a>

                                <div className="grid grid-cols-2 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminSelectedLeadForAI({
                                        customerName: lead.clientName,
                                        phone: lead.clientPhone,
                                        eventType: lead.eventType,
                                        guestCount: lead.pax ? lead.pax.toString() : "TBD",
                                        location: lead.venue,
                                        selectedServices: lead.services,
                                      });
                                      setAdminAiModalOpen(true);
                                    }}
                                    className="w-full py-1.5 px-2 rounded-lg bg-gold-gradient text-[#011F15] font-extrabold text-[10px] uppercase tracking-wider hover:scale-105 transition shadow-gold-sm flex items-center justify-center space-x-1 cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI Draft</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      const link = `${window.location.origin}/contract?leadId=${lead.id}`;
                                      const msg = `Hello ${lead.clientName || "Valued Client"}! Here is your official Visriva Service Agreement & 40% Deposit Invoice: ${link}`;
                                      window.open(`https://wa.me/${lead.clientPhone ? lead.clientPhone.replace(/[^0-9]/g, "") : "918884484828"}?text=${encodeURIComponent(msg)}`, "_blank");
                                    }}
                                    className="w-full py-1.5 px-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500 hover:text-white font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-center space-x-1 cursor-pointer"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </button>
                                </div>
                              </div>

                              {/* Status Action Buttons */}
                              <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                                <span className="text-[9px] uppercase font-bold text-white/50">Move to:</span>
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                  {col.id !== "QUOTE_SENT" && (
                                    <button
                                      onClick={() => updateLeadStatus(lead.id, "QUOTE_SENT")}
                                      className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500 hover:text-white font-bold transition text-center"
                                    >Quote 💬</button>
                                  )}
                                  {col.id !== "DEPOSIT_PAID" && (
                                    <button
                                      onClick={() => updateLeadStatus(lead.id, "DEPOSIT_PAID")}
                                      className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white font-bold transition text-center"
                                    >Deposit 💳</button>
                                  )}
                                  {col.id !== "CONFIRMED" && (
                                    <button
                                      onClick={() => updateLeadStatus(lead.id, "CONFIRMED")}
                                      className="px-2 py-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#011F15] font-bold transition text-center"
                                    >Confirm 🎉</button>
                                  )}
                                  {col.id !== "COMPLETED" && (
                                    <button
                                      onClick={() => updateLeadStatus(lead.id, "COMPLETED")}
                                      className="px-2 py-1 rounded bg-gray-500/20 text-gray-300 border border-gray-500/40 hover:bg-gray-500 hover:text-white font-bold transition text-center"
                                    >Done ✅</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: FEATURE TOGGLES & CREW COMMAND CONFIG */}
          {activeTab === "featureToggles" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Card 1: Master Feature Enable/Disable Switches */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Master Feature Enable / Disable Switches</h3>
                      <p className="text-xs text-emerald-100/70">Enable or turn off public access to specific features whenever required.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveFeatureToggles}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Feature Switches</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Switch 1: Operator Portal */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">On-Site Crew Command (/operator)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableOperatorPortal}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableOperatorPortal: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether crew technicians can access the live operator dashboard on-site.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableOperatorPortal ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableOperatorPortal ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Switch 2: Guest Gallery */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Guest Photo Portal (/gallery)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableGuestGallery}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableGuestGallery: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether guests can search event PINs and download high-res photo captures.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableGuestGallery ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableGuestGallery ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Switch 3: Print Frame Customizer */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Print Frame Customizer (/frame-customizer)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableFrameCustomizer}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableFrameCustomizer: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether clients can access the live 4x6 print overlay design studio.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableFrameCustomizer ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableFrameCustomizer ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Google Sheet Question Sync & Crew Settings */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Google Sheet Row 1 Question Column Sync</h3>
                      <p className="text-xs text-emerald-100/70">
                        Paste your event Google Sheet link. Row 1 header columns will automatically become active questions in /operator.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveOperatorConfig}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Crew &amp; Sheet Settings</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Google Sheet URL Input */}
                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1.5">
                      Google Sheet URL (Spreadsheet link, Published CSV, or Webhook)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={operatorConfig.googleSheetUrl || ""}
                        onChange={(e) =>
                          setOperatorConfig({ ...operatorConfig, googleSheetUrl: e.target.value })
                        }
                        placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={handleSyncGoogleSheetHeaders}
                        disabled={fetchingSheetHeaders}
                        className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${fetchingSheetHeaders ? "animate-spin" : ""}`} />
                        <span>{fetchingSheetHeaders ? "Syncing..." : "Sync Row 1 Columns"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Columns & Hide/Show Toggles */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h4 className="font-serif text-base font-bold text-[#D4AF37]">
                      Active Question Columns ({operatorConfig.customQuestions?.length || 0})
                    </h4>
                    <p className="text-xs text-emerald-100/70">
                      Check or uncheck fields to show or hide questions in the On-Site Crew Command token manager.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(operatorConfig.customQuestions || []).map((colName, idx) => {
                        const isHidden = (operatorConfig.hiddenFields || []).includes(colName);
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                              !isHidden
                                ? "bg-emerald-950/40 border-emerald-400/40 text-emerald-200 font-semibold"
                                : "bg-black/40 border-white/10 text-white/40 line-through"
                            }`}
                          >
                            <span className="truncate pr-2 font-mono">
                              {idx + 1}. {colName}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const currentHidden = operatorConfig.hiddenFields || [];
                                const newHidden = isHidden
                                  ? currentHidden.filter((f) => f !== colName)
                                  : [...currentHidden, colName];
                                setOperatorConfig({ ...operatorConfig, hiddenFields: newHidden });
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold font-mono uppercase cursor-pointer ${
                                !isHidden ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {!isHidden ? "Visible" : "Hidden"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Crew PIN Credentials & Admin Sync Card */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h4 className="font-serif text-base font-bold text-[#D4AF37] flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-[#D4AF37]" />
                      <span>On-Site Crew Security PIN Credentials</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-emerald-200 mb-1">Dedicated Crew Security PIN</label>
                        <input
                          type="text"
                          value={operatorConfig.pin || "visriva2026"}
                          onChange={(e) =>
                            setOperatorConfig({ ...operatorConfig, pin: e.target.value })
                          }
                          placeholder="e.g. visriva2026"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-mono font-bold focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-3 pt-6">
                        <input
                          type="checkbox"
                          id="allowAdminPass"
                          checked={operatorConfig.allowAdminPass !== false}
                          onChange={(e) =>
                            setOperatorConfig({ ...operatorConfig, allowAdminPass: e.target.checked })
                          }
                          className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                        />
                        <label htmlFor="allowAdminPass" className="text-xs font-semibold text-white cursor-pointer leading-tight">
                          Allow Master Admin Passwords to unlock /operator (jeevan, drupitha, punith, arpitha, 4848, 0315)
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 9: HOMEPAGE SECTIONS 1, 2 & 3 CMS */}
          {activeTab === "bentoGrid" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Card 1: Section 1 CMS - Our Signature Live Stations (Bento Grid) */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Section 1 CMS: Our Signature Live Stations (Bento Grid)</h3>
                      <p className="text-xs text-emerald-100/70">Edit badge text, main heading, descriptions, and show/hide individual station cards.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBentoConfig}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Section 1 CMS</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Section Badge Text</label>
                    <input
                      type="text"
                      value={bentoConfig.badgeText || "Asymmetrical Live Services"}
                      onChange={(e) => setBentoConfig({ ...bentoConfig, badgeText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Main Heading Title</label>
                    <input
                      type="text"
                      value={bentoConfig.headingTitle || "Our Signature Live Stations"}
                      onChange={(e) => setBentoConfig({ ...bentoConfig, headingTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-serif font-bold text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-200 mb-1">Subheading Description</label>
                  <textarea
                    rows={2}
                    value={bentoConfig.subheadingText || ""}
                    onChange={(e) => setBentoConfig({ ...bentoConfig, subheadingText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#D4AF37] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 5 Station Cards Editor */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="font-serif text-base font-bold text-[#D4AF37]">Individual Station Cards ({bentoConfig.cards?.length || 0})</h4>

                  <div className="space-y-4">
                    {(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards).map((card, idx) => (
                      <div key={card.id || idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">Card #{idx + 1}: {card.title}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-emerald-200/70">Show Card</span>
                            <input
                              type="checkbox"
                              checked={card.enabled !== false}
                              onChange={(e) => {
                                const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                                newCards[idx] = { ...newCards[idx], enabled: e.target.checked };
                                setBentoConfig({ ...bentoConfig, cards: newCards });
                              }}
                              className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-emerald-200/70 mb-1">Badge</label>
                            <input
                              type="text"
                              value={card.badgeText || ""}
                              onChange={(e) => {
                                const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                                newCards[idx] = { ...newCards[idx], badgeText: e.target.value };
                                setBentoConfig({ ...bentoConfig, cards: newCards });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-emerald-200/70 mb-1">Card Title</label>
                            <input
                              type="text"
                              value={card.title || ""}
                              onChange={(e) => {
                                const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                                newCards[idx] = { ...newCards[idx], title: e.target.value };
                                setBentoConfig({ ...bentoConfig, cards: newCards });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-emerald-200/70 mb-1">Card Description</label>
                          <textarea
                            rows={2}
                            value={card.description || ""}
                            onChange={(e) => {
                              const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                              newCards[idx] = { ...newCards[idx], description: e.target.value };
                              setBentoConfig({ ...bentoConfig, cards: newCards });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-emerald-200/70 mb-1">CTA Button Text</label>
                            <input
                              type="text"
                              value={card.ctaText || "Explore Station"}
                              onChange={(e) => {
                                const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                                newCards[idx] = { ...newCards[idx], ctaText: e.target.value };
                                setBentoConfig({ ...bentoConfig, cards: newCards });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-emerald-200/70 mb-1">CTA Target Link</label>
                            <input
                              type="text"
                              value={card.ctaUrl || "/photo-booth"}
                              onChange={(e) => {
                                const newCards = [...(bentoConfig.cards || DEFAULT_BENTO_GRID_CONFIG.cards)];
                                newCards[idx] = { ...newCards[idx], ctaUrl: e.target.value };
                                setBentoConfig({ ...bentoConfig, cards: newCards });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs font-mono"
                            />
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Section 2 CMS - What's Included in Every Standard Package */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Section 2 CMS: What&apos;s Included in Package</h3>
                      <p className="text-xs text-emerald-100/70">Edit heading, 6 feature bullet items, showcase photo URL, badge, and title.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveWebsiteText}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Section 2 CMS</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedBadge || "The Visriva Guarantee"}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Section Heading Title</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedHeading || "What's Included in Every Standard Photo Booth Package:"}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-serif font-bold text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 6 Feature Bullet Items Editor */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">6 Feature Bullet Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(websiteText.whatsIncludedItems || DEFAULT_WEBSITE_TEXT.whatsIncludedItems || []).map((itemStr, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] font-mono text-emerald-200/70">Feature #{idx + 1}</label>
                        <input
                          type="text"
                          value={itemStr}
                          onChange={(e) => {
                            const newItems = [...(websiteText.whatsIncludedItems || DEFAULT_WEBSITE_TEXT.whatsIncludedItems || [])];
                            newItems[idx] = e.target.value;
                            setWebsiteText({ ...websiteText, whatsIncludedItems: newItems });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Visual Showcase Card Editor */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">Right Side Showcase Visual Card</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-emerald-200 mb-1">Card Badge</label>
                      <input
                        type="text"
                        value={websiteText.whatsIncludedBadge || "Signature Station"}
                        onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedBadge: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-emerald-200 mb-1">Card Title</label>
                      <input
                        type="text"
                        value={websiteText.whatsIncludedTitle || "Vintage Wooden Booth Setup"}
                        onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-emerald-200 mb-1">Card Subtitle / Specs</label>
                      <input
                        type="text"
                        value={websiteText.whatsIncludedSubtitle || "Studio Strobe Lighting • 8-Sec Thermal Dye-Sublimation"}
                        onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Showcase Photo Image URL</label>
                    <input
                      type="text"
                      value={websiteText.whatsIncludedImageUrl || ""}
                      onChange={(e) => setWebsiteText({ ...websiteText, whatsIncludedImageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Card 3: Section 3 CMS - Why Choose Visriva */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Section 3 CMS: Why Choose Visriva?</h3>
                      <p className="text-xs text-emerald-100/70">Edit section heading, description text, 4 bullet items, and 4 highlight stat boxes.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveWebsiteText}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Section 3 CMS</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={websiteText.whyChooseBadge || "The Visriva Standard"}
                      onChange={(e) => setWebsiteText({ ...websiteText, whyChooseBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Section Heading Title</label>
                    <input
                      type="text"
                      value={websiteText.whyChooseTitle || "Why Choose Visriva?"}
                      onChange={(e) => setWebsiteText({ ...websiteText, whyChooseTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white font-serif font-bold text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-200 mb-1">Section Paragraph Description</label>
                  <textarea
                    rows={3}
                    value={websiteText.whyChooseDescription || ""}
                    onChange={(e) => setWebsiteText({ ...websiteText, whyChooseDescription: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#D4AF37] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 4 Feature Bullets Editor */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">4 Bullet Point Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(websiteText.whyChooseBullets || DEFAULT_WEBSITE_TEXT.whyChooseBullets || []).map((bulletStr, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] font-mono text-emerald-200/70">Bullet #{idx + 1}</label>
                        <input
                          type="text"
                          value={bulletStr}
                          onChange={(e) => {
                            const newBullets = [...(websiteText.whyChooseBullets || DEFAULT_WEBSITE_TEXT.whyChooseBullets || [])];
                            newBullets[idx] = e.target.value;
                            setWebsiteText({ ...websiteText, whyChooseBullets: newBullets });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Highlight Stat Cards Editor */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">4 Luxury Stat Highlight Boxes</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(websiteText.whyChooseHighlights || DEFAULT_WEBSITE_TEXT.whyChooseHighlights || []).map((hItem, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/15 space-y-2">
                        <span className="block text-[10px] font-mono text-[#D4AF37]">Stat #{idx + 1}</span>
                        <div>
                          <label className="block text-[9px] font-mono text-emerald-200/70">Value</label>
                          <input
                            type="text"
                            value={hItem.val}
                            onChange={(e) => {
                              const newH = [...(websiteText.whyChooseHighlights || DEFAULT_WEBSITE_TEXT.whyChooseHighlights || [])];
                              newH[idx] = { ...newH[idx], val: e.target.value };
                              setWebsiteText({ ...websiteText, whyChooseHighlights: newH });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-emerald-200/70">Label</label>
                          <input
                            type="text"
                            value={hItem.label}
                            onChange={(e) => {
                              const newH = [...(websiteText.whyChooseHighlights || DEFAULT_WEBSITE_TEXT.whyChooseHighlights || [])];
                              newH[idx] = { ...newH[idx], label: e.target.value };
                              setWebsiteText({ ...websiteText, whyChooseHighlights: newH });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-white/5 border border-white/10 text-emerald-200 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: INDIVIDUAL SERVICES & NAVBAR MASTER TOGGLES */}
          {activeTab === "serviceToggles" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Card 1: Individual Service Pages Switches */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Individual Service Pages Enable / Disable Switches</h3>
                      <p className="text-xs text-emerald-100/70">Turn off specific service pages or hide them from the Booking Engine and Navbar when unavailable.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveFeatureToggles}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Service Toggles</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Service 1: Instant Photo Booth */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Instant Photo Booth (/photo-booth)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enablePhotoBoothService !== false}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enablePhotoBoothService: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether Photo Booth appears in Navbar, Booking Engine, and /photo-booth landing page.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enablePhotoBoothService !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enablePhotoBoothService !== false ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Service 2: Fridge Magnet Station */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Fridge Magnet Station (/services/magnet-station)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableMagnetService !== false}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableMagnetService: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether Fridge Magnet Station appears in Navbar, Booking Engine, and service page.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableMagnetService !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableMagnetService !== false ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Service 3: Keychain Station */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Keychain Station (/services/keychain-station)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableKeychainService !== false}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableKeychainService: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether Keychain Station appears in Navbar, Booking Engine, and service page.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableKeychainService !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableKeychainService !== false ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Service 4: Live Mug Printing */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Live Mug Printing (/services/mug-printing)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableMugService !== false}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableMugService: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether Live Mug Printing appears in Navbar, Booking Engine, and service page.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableMugService !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableMugService !== false ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>

                  {/* Service 5: Tote Bag & T-Shirt Station */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Tote Bag &amp; T-Shirt Station (/services/tote-tshirt-station)</span>
                      <input
                        type="checkbox"
                        checked={featureToggles.enableToteTshirtService !== false}
                        onChange={(e) =>
                          setFeatureToggles({ ...featureToggles, enableToteTshirtService: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Controls whether Tote Bag &amp; T-Shirt Station appears in Navbar, Booking Engine, and service page.
                    </p>
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.enableToteTshirtService !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                      {featureToggles.enableToteTshirtService !== false ? "ACTIVE / ONLINE" : "DISABLED BY ADMIN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Navbar Menu Customization */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Navbar Menu Controls</h3>
                      <p className="text-xs text-emerald-100/70">Show or hide special portal links inside the top website navigation menu.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveFeatureToggles}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Navbar Settings</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 max-w-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Show Crew Command (/operator) in Navbar</span>
                    <input
                      type="checkbox"
                      checked={featureToggles.showOperatorInNavbar !== false}
                      onChange={(e) =>
                        setFeatureToggles({ ...featureToggles, showOperatorInNavbar: e.target.checked })
                      }
                      className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-emerald-100/70 leading-relaxed">
                    Adds a direct link to the On-Site Crew Command Center (/operator) inside the site header menu.
                  </p>
                  <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold ${featureToggles.showOperatorInNavbar !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                    {featureToggles.showOperatorInNavbar !== false ? "VISIBLE IN NAVBAR" : "HIDDEN FROM NAVBAR"}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 11: HERO 3D CARDS ALIGNMENT & CLICK REDIRECT STUDIO */}
          {activeTab === "heroCardStudio" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                        <Palette className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        Hero 3D Cards Alignment &amp; Redirect Studio
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Customize card positions, vertical step offsets, rotational tilt angles, horizontal nudges, and toggle whether clicking on cards redirects guests to service pages.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setHeroCardsConfig(DEFAULT_HERO_CARD_STACK_CONFIG)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const res = await saveHeroCardStackConfig(heroCardsConfig);
                        setIsSaving(false);
                        if (res.success) {
                          setSuccessToast("✅ Hero 3D Card Stack settings saved successfully!");
                          setTimeout(() => setSuccessToast(""), 4000);
                        } else {
                          setErrorToast(`❌ Save error: ${res.error}`);
                          setTimeout(() => setErrorToast(""), 4000);
                        }
                      }}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Card Stack Studio</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Click Redirection Control Card */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-white">Master Hero Cards Click Redirection</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${heroCardsConfig.enableCardRedirect !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                        {heroCardsConfig.enableCardRedirect !== false ? "REDIRECT ENABLED" : "REDIRECT DISABLED (VISUAL ONLY)"}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      When turned ON, clicking any hero card on the homepage opens its service URL page. When turned OFF, cards operate purely as visual interactive 3D display cards.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={heroCardsConfig.enableCardRedirect !== false}
                    onChange={(e) =>
                      setHeroCardsConfig({ ...heroCardsConfig, enableCardRedirect: e.target.checked })
                    }
                    className="w-6 h-6 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              {/* Individual Card Alignment Sliders Studio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Sliders for each of the 5 cards */}
                <div className="space-y-4">
                  {[
                    { key: "mugs", title: "1. Live Mug Printing", badge: "Sublimation", icon: Coffee, href: "/services/mug-printing" },
                    { key: "keychains", title: "2. Bespoke Keychains", badge: "Keepsake", icon: Key, href: "/services/keychain-station" },
                    { key: "magnets", title: "3. Custom Fridge Magnets", badge: "Bespoke", icon: Layers, href: "/services/magnet-station" },
                    { key: "totes", title: "4. Tote Bag & T-Shirt Station", badge: "Canvas Press", icon: ShoppingBag, href: "/services/tote-tshirt-station" },
                    { key: "photo-booth", title: "5. Instant Photo Booth", badge: "Flagship", icon: Camera, href: "/photo-booth" },
                  ].map((cardDef) => {
                    const item: HeroCardItemConfig = heroCardsConfig.cards[cardDef.key] || {
                      id: cardDef.key,
                      topPx: 0,
                      rotateDeg: 0,
                      horizontalOffsetPx: 0,
                      scale: 1,
                      redirectOnClick: true,
                    };

                    const Icon = cardDef.icon;

                    const updateItem = (field: keyof HeroCardItemConfig, val: any) => {
                      const updatedCards = {
                        ...heroCardsConfig.cards,
                        [cardDef.key]: {
                          ...item,
                          [field]: val,
                        },
                      };
                      setHeroCardsConfig({ ...heroCardsConfig, cards: updatedCards });
                    };

                    return (
                      <div key={cardDef.key} className="glass-card rounded-2xl p-5 border border-white/10 space-y-3.5 bg-black/40">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-white block">{cardDef.title}</span>
                              <span className="text-[10px] text-emerald-200/60 font-mono block">Link: {cardDef.href}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                const defaultCard = DEFAULT_HERO_CARD_STACK_CONFIG.cards[cardDef.key] || {
                                  id: cardDef.key,
                                  topPx: 0,
                                  rotateDeg: 0,
                                  horizontalOffsetPx: 0,
                                  scale: 1,
                                  redirectOnClick: true,
                                };
                                setHeroCardsConfig({
                                  ...heroCardsConfig,
                                  cards: {
                                    ...heroCardsConfig.cards,
                                    [cardDef.key]: { ...defaultCard },
                                  },
                                });
                              }}
                              title="Reset this card back to default alignment"
                              className="px-2.5 py-1 rounded-lg border border-white/20 bg-white/5 text-[11px] font-bold text-emerald-200 hover:bg-white/15 hover:text-white transition cursor-pointer flex items-center space-x-1"
                            >
                              <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                              <span>Reset Card</span>
                            </button>

                            <div className="flex items-center space-x-1.5 border-l border-white/15 pl-2.5">
                              <span className="text-[10px] text-white/70 font-semibold">Clickable:</span>
                              <input
                                type="checkbox"
                                checked={item.redirectOnClick !== false}
                                onChange={(e) => updateItem("redirectOnClick", e.target.checked)}
                                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {/* Top Offset Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-emerald-100/80 font-mono text-[11px]">
                              <span>Top Offset:</span>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min="-20"
                                  max="350"
                                  value={item.topPx}
                                  onChange={(e) => updateItem("topPx", Number(e.target.value))}
                                  className="w-14 bg-black/60 border border-[#D4AF37]/50 rounded px-1.5 py-0.5 text-right text-[#D4AF37] font-bold text-xs"
                                />
                                <span className="text-[#D4AF37] font-bold">px</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="-20"
                              max="350"
                              value={item.topPx}
                              onChange={(e) => updateItem("topPx", Number(e.target.value))}
                              className="w-full accent-[#D4AF37] cursor-pointer"
                            />
                          </div>

                          {/* Horizontal Nudge Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-emerald-100/80 font-mono text-[11px]">
                              <span>Left/Right Offset:</span>
                              <span className="text-[#D4AF37] font-bold">{item.horizontalOffsetPx}px</span>
                            </div>
                            <input
                              type="range"
                              min="-80"
                              max="80"
                              value={item.horizontalOffsetPx}
                              onChange={(e) => updateItem("horizontalOffsetPx", Number(e.target.value))}
                              className="w-full accent-[#D4AF37] cursor-pointer"
                            />
                          </div>

                          {/* Rotation Angle Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-emerald-100/80 font-mono text-[11px]">
                              <span>Rotation Tilt:</span>
                              <span className="text-[#D4AF37] font-bold">{item.rotateDeg}°</span>
                            </div>
                            <input
                              type="range"
                              min="-30"
                              max="30"
                              value={item.rotateDeg}
                              onChange={(e) => updateItem("rotateDeg", Number(e.target.value))}
                              className="w-full accent-[#D4AF37] cursor-pointer"
                            />
                          </div>

                          {/* Scale Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-emerald-100/80 font-mono text-[11px]">
                              <span>Scale Ratio:</span>
                              <span className="text-[#D4AF37] font-bold">{item.scale}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.7"
                              max="1.3"
                              step="0.05"
                              value={item.scale}
                              onChange={(e) => updateItem("scale", Number(e.target.value))}
                              className="w-full accent-[#D4AF37] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Text Content Editor */}
                        <div className="pt-3 border-t border-white/10 space-y-2.5">
                          <div className="flex items-center space-x-1.5 text-xs text-[#D4AF37] font-bold">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Card Text &amp; Description CMS</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-100/70 block">Card Title</label>
                              <input
                                type="text"
                                value={item.customTitle !== undefined ? item.customTitle : cardDef.title}
                                onChange={(e) => updateItem("customTitle", e.target.value)}
                                placeholder={cardDef.title}
                                className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:border-[#D4AF37] outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-emerald-100/70 block">Badge Tag</label>
                              <input
                                type="text"
                                value={item.customBadge !== undefined ? item.customBadge : cardDef.badge}
                                onChange={(e) => updateItem("customBadge", e.target.value)}
                                placeholder={cardDef.badge}
                                className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-[#D4AF37] font-bold text-xs focus:border-[#D4AF37] outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-emerald-100/70 block">Card Description</label>
                            <textarea
                              rows={2}
                              value={item.customDesc !== undefined ? item.customDesc : ""}
                              onChange={(e) => updateItem("customDesc", e.target.value)}
                              placeholder="Enter custom card description text..."
                              className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs leading-relaxed focus:border-[#D4AF37] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-emerald-100/70 block">Footer Tag (Optional)</label>
                            <input
                              type="text"
                              value={item.customFooter !== undefined ? item.customFooter : ""}
                              onChange={(e) => updateItem("customFooter", e.target.value)}
                              placeholder="e.g. Full-Frame Optics • Instant QR Gallery"
                              className="w-full bg-[#011F15] border border-white/20 rounded-lg px-2.5 py-1.5 text-emerald-200 text-xs focus:border-[#D4AF37] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Live Interactive Card Canvas Preview Box */}
                <div className="glass-card rounded-3xl p-6 border border-[#D4AF37]/30 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Live 3D Card Stack Preview Canvas</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400/30">
                      Interactive Live Studio
                    </span>
                  </div>

                  {/* Canvas Container */}
                  <div className="relative w-full h-[520px] bg-[#011F15] rounded-2xl border border-white/15 overflow-hidden flex items-center justify-center p-4">
                    {[
                      { key: "mugs", title: "Live Mug Printing", badge: "Sublimation", icon: Coffee, isFlag: false },
                      { key: "keychains", title: "Bespoke Keychains", badge: "Keepsake", icon: Key, isFlag: false },
                      { key: "magnets", title: "Custom Fridge Magnets", badge: "Bespoke", icon: Layers, isFlag: false },
                      { key: "totes", title: "Tote Bag & T-Shirt Station", badge: "Canvas Press", icon: ShoppingBag, isFlag: false },
                      { key: "photo-booth", title: "Instant Photo Booth", badge: "Flagship", icon: Camera, isFlag: true },
                    ].map((cardDef, idx) => {
                      const item = heroCardsConfig.cards[cardDef.key] || {
                        id: cardDef.key,
                        topPx: idx * 14,
                        rotateDeg: idx % 2 === 0 ? -4 : 4,
                        horizontalOffsetPx: 0,
                        scale: 1,
                        redirectOnClick: true,
                      };
                      const Icon = cardDef.icon;
                      const zIndex = (idx + 1) * 10;
                      const isClickable = heroCardsConfig.enableCardRedirect !== false && item.redirectOnClick !== false;

                      const displayTitle = item.customTitle || cardDef.title;
                      const displayBadge = item.customBadge || cardDef.badge;

                      return (
                        <div
                          key={cardDef.key}
                          style={{
                            top: `${item.topPx + 10}px`,
                            transform: `translateX(${item.horizontalOffsetPx}px) rotate(${item.rotateDeg}deg) scale(${item.scale})`,
                            zIndex,
                          }}
                          className={`absolute w-72 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-transform duration-300 ${
                            cardDef.isFlag
                              ? "border-[#D4AF37]/60 bg-[#022419]"
                              : "border-white/20 bg-[#01281c]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cardDef.isFlag ? "bg-gold-gradient text-[#011F15]" : "bg-black/50 text-[#D4AF37]"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                              {displayBadge}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white line-clamp-1">{displayTitle}</h4>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-[9px] font-mono text-emerald-200/70">
                            <span>Top: {item.topPx}px</span>
                            <span>Rot: {item.rotateDeg}°</span>
                            <span className={isClickable ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {isClickable ? "Link ON" : "Link OFF"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-emerald-100/60 leading-relaxed text-center italic">
                    💡 Tip: Move the sliders on the left to see live real-time position updates on this canvas. Click &quot;Save Card Stack Studio&quot; to apply directly to the website homepage!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: AI EVENT CONCIERGE SYSTEM PROMPTS & PRESETS CMS */}
          {activeTab === "aiConciergeCMS" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        AI Event Concierge Prompts &amp; Presets CMS
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Customize how Gemini 1.5 analyzes event requests, edit preset prompt chips, and update default fallback recommendations.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setAiConciergeConfig(DEFAULT_AI_CONCIERGE_CONFIG)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const res = await saveAIConciergeConfig(aiConciergeConfig);
                        setIsSaving(false);
                        if (res.success) {
                          setSuccessToast("✅ AI Concierge settings permanently saved to Cloud Firestore!");
                          setTimeout(() => setSuccessToast(""), 4000);
                        } else {
                          setErrorToast(`❌ Save error: ${res.error}`);
                          setTimeout(() => setErrorToast(""), 4000);
                        }
                      }}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save AI Concierge CMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-white">AI Event Concierge Banner Status</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${aiConciergeConfig.enabled !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                        {aiConciergeConfig.enabled !== false ? "WIDGET ENABLED" : "WIDGET DISABLED"}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Toggle whether the AI Event Concierge widget is visible on the homepage hero and booking engine.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={aiConciergeConfig.enabled !== false}
                    onChange={(e) =>
                      setAiConciergeConfig({ ...aiConciergeConfig, enabled: e.target.checked })
                    }
                    className="w-6 h-6 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              {/* System Prompt Editor */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                <label className="font-bold text-sm text-white block">
                  Gemini AI Concierge System Prompt Instructions
                </label>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  These instructions tell Gemini AI how to analyze event requests, calculate hourly souvenir capacities, and recommend station setups.
                </p>
                <textarea
                  rows={8}
                  value={aiConciergeConfig.systemPrompt}
                  onChange={(e) =>
                    setAiConciergeConfig({ ...aiConciergeConfig, systemPrompt: e.target.value })
                  }
                  className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-xs font-mono text-white leading-relaxed focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Preset Chips Editor */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="font-bold text-sm text-white">Preset Prompt Chips Editor</h3>
                <p className="text-xs text-emerald-100/70">
                  Manage the quick preset buttons displayed inside the AI Concierge drawer for users.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetChip}
                    onChange={(e) => setNewPresetChip(e.target.value)}
                    placeholder="Enter new preset prompt chip..."
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    onClick={() => {
                      if (!newPresetChip.trim()) return;
                      setAiConciergeConfig({
                        ...aiConciergeConfig,
                        presetChips: [...(aiConciergeConfig.presetChips || []), newPresetChip.trim()],
                      });
                      setNewPresetChip("");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#011F15] font-extrabold text-xs uppercase cursor-pointer"
                  >
                    Add Chip +
                  </button>
                </div>

                <div className="space-y-2">
                  {(aiConciergeConfig.presetChips || []).map((chip, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="text-white font-mono">✨ {chip}</span>
                      <button
                        onClick={() => {
                          const updated = aiConciergeConfig.presetChips.filter((_, i) => i !== idx);
                          setAiConciergeConfig({ ...aiConciergeConfig, presetChips: updated });
                        }}
                        className="text-rose-400 hover:text-rose-300 font-bold px-2 py-1 cursor-pointer"
                      >
                        Remove ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fallback Settings Editor */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="font-bold text-sm text-white">Default Fallback Recommendation (Offline Backup)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-100/70 block">Fallback Title</label>
                    <input
                      type="text"
                      value={aiConciergeConfig.fallbackTitle}
                      onChange={(e) => setAiConciergeConfig({ ...aiConciergeConfig, fallbackTitle: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-100/70 block">Fallback Tagline</label>
                    <input
                      type="text"
                      value={aiConciergeConfig.fallbackTagline}
                      onChange={(e) => setAiConciergeConfig({ ...aiConciergeConfig, fallbackTagline: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-[#D4AF37] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[11px] text-emerald-100/70 block">Fallback Reasoning Text</label>
                  <textarea
                    rows={2}
                    value={aiConciergeConfig.fallbackReasoning}
                    onChange={(e) => setAiConciergeConfig({ ...aiConciergeConfig, fallbackReasoning: e.target.value })}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-white text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: AI WHATSAPP ASSISTANT SYSTEM PROMPTS & TEMPLATES CMS */}
          {activeTab === "aiWhatsAppCMS" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        AI WhatsApp Assistant Prompts &amp; Templates CMS
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Configure Gemini AI WhatsApp messaging instructions, VIP quote templates, confirmation checklists, and follow-up incentives.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setAiWhatsAppConfig(DEFAULT_AI_WHATSAPP_CONFIG)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const res = await saveAIWhatsAppConfig(aiWhatsAppConfig);
                        setIsSaving(false);
                        if (res.success) {
                          setSuccessToast("✅ AI WhatsApp settings permanently saved to Cloud Firestore!");
                          setTimeout(() => setSuccessToast(""), 4000);
                        } else {
                          setErrorToast(`❌ Save error: ${res.error}`);
                          setTimeout(() => setErrorToast(""), 4000);
                        }
                      }}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save AI WhatsApp CMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-white">AI WhatsApp Assistant Status</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${aiWhatsAppConfig.enabled !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"}`}>
                        {aiWhatsAppConfig.enabled !== false ? "ASSISTANT ACTIVE" : "ASSISTANT DISABLED"}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      Toggle whether the AI WhatsApp Draft button is active inside /operator and /admin CRM.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={aiWhatsAppConfig.enabled !== false}
                    onChange={(e) =>
                      setAiWhatsAppConfig({ ...aiWhatsAppConfig, enabled: e.target.checked })
                    }
                    className="w-6 h-6 accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              {/* System Prompt Editor */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                <label className="font-bold text-sm text-white block">
                  Gemini AI WhatsApp System Prompt Instructions
                </label>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  Instructions for Gemini AI on tone, emoji usage, and custom WhatsApp bolding for client drafts.
                </p>
                <textarea
                  rows={5}
                  value={aiWhatsAppConfig.systemPrompt}
                  onChange={(e) =>
                    setAiWhatsAppConfig({ ...aiWhatsAppConfig, systemPrompt: e.target.value })
                  }
                  className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-xs font-mono text-white leading-relaxed focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Fallback WhatsApp Template Editors */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
                <h3 className="font-bold text-sm text-white">Default WhatsApp Message Templates (Fallback)</h3>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D4AF37] block">1. VIP Quote Pitch Template</label>
                  <textarea
                    rows={6}
                    value={aiWhatsAppConfig.defaultVipQuote}
                    onChange={(e) =>
                      setAiWhatsAppConfig({ ...aiWhatsAppConfig, defaultVipQuote: e.target.value })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl p-3 text-xs font-sans text-white leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-300 block">2. Booking Confirmation &amp; Setup Template</label>
                  <textarea
                    rows={6}
                    value={aiWhatsAppConfig.defaultConfirmation}
                    onChange={(e) =>
                      setAiWhatsAppConfig({ ...aiWhatsAppConfig, defaultConfirmation: e.target.value })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl p-3 text-xs font-sans text-white leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-300 block">3. Follow-Up &amp; Exclusive Offer Template</label>
                  <textarea
                    rows={6}
                    value={aiWhatsAppConfig.defaultFollowUp}
                    onChange={(e) =>
                      setAiWhatsAppConfig({ ...aiWhatsAppConfig, defaultFollowUp: e.target.value })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl p-3 text-xs font-sans text-white leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              OPTION 14: REAL IMPACT & EVENT TRACK RECORD CMS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "impactStatsCMS" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        Real Impact &amp; Event Track Record CMS
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Update your real completed event numbers, souvenir prints, guests served, and company partners live. Saves permanently to Cloud Firestore.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setImpactStats(DEFAULT_LIVE_IMPACT_STATS)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset to 0 (Clean Slate)</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const res = await saveLiveImpactStats(impactStats);
                        setIsSaving(false);
                        if (res.success) {
                          setSuccessToast("✅ Real Impact Track Record permanently saved to Cloud Firestore!");
                          setTimeout(() => setSuccessToast(""), 4000);
                        } else {
                          setErrorToast(`❌ Save error: ${res.error}`);
                          setTimeout(() => setErrorToast(""), 4000);
                        }
                      }}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Impact CMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="glass-card rounded-3xl p-5 border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Honest Track Record System Active
                    </h4>
                    <p className="text-[11px] text-emerald-100/70">
                      No fake numbers are hardcoded on the site. When values are 0, the site displays your studio capabilities &amp; guarantees. Update these numbers as you execute events!
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase border border-emerald-400/40">
                  REAL TIME SYNC
                </span>
              </div>

              {/* 4 Metric Counters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Events Executed */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                      1. Total Events Executed
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {impactStats.eventsExecuted} Events
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={impactStats.eventsExecuted}
                    onChange={(e) =>
                      setImpactStats({
                        ...impactStats,
                        eventsExecuted: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-lg font-mono text-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Total real completed events executed by Visriva across Bengaluru &amp; Pune.
                  </p>
                </div>

                {/* 2. Souvenirs Printed */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                      2. Total Keepsakes &amp; Souvenirs Delivered
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {impactStats.souvenirsDelivered.toLocaleString("en-IN")} Prints
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={impactStats.souvenirsDelivered}
                    onChange={(e) =>
                      setImpactStats({
                        ...impactStats,
                        souvenirsDelivered: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-lg font-mono text-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Total photos, magnets, keychains, mugs &amp; apparel printed live on-site.
                  </p>
                </div>

                {/* 3. Guests Served */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                      3. Total Guests Served
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {impactStats.guestsServed.toLocaleString("en-IN")} Guests
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={impactStats.guestsServed}
                    onChange={(e) =>
                      setImpactStats({
                        ...impactStats,
                        guestsServed: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-lg font-mono text-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Estimated total guests entertained across all completed celebrations.
                  </p>
                </div>

                {/* 4. Corporate Clients Count */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                      4. Total Corporate Clients / Agencies
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {impactStats.corporateClientsCount} Clients
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={impactStats.corporateClientsCount}
                    onChange={(e) =>
                      setImpactStats({
                        ...impactStats,
                        corporateClientsCount: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-lg font-mono text-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Number of corporate brands &amp; luxury event agencies served.
                  </p>
                </div>
              </div>

              {/* Company Brands / Clients Worked With List */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                    <span>Companies &amp; Partner Brands Worked With</span>
                  </h3>
                  <p className="text-xs text-emerald-100/60">
                    Add company names or event agencies you have executed live printing for.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClientBrandInput}
                    onChange={(e) => setNewClientBrandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newClientBrandInput.trim()) {
                        e.preventDefault();
                        const trimmed = newClientBrandInput.trim();
                        if (!impactStats.clientBrands?.includes(trimmed)) {
                          setImpactStats({
                            ...impactStats,
                            clientBrands: [...(impactStats.clientBrands || []), trimmed],
                            corporateClientsCount: (impactStats.clientBrands || []).length + 1,
                          });
                        }
                        setNewClientBrandInput("");
                      }
                    }}
                    placeholder="e.g. Infosys, Wipro, Taj Hotels, Luxury Weddings Co..."
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-emerald-100/40 focus:border-[#D4AF37] outline-none"
                  />
                  <button
                    onClick={() => {
                      const trimmed = newClientBrandInput.trim();
                      if (trimmed && !impactStats.clientBrands?.includes(trimmed)) {
                        setImpactStats({
                          ...impactStats,
                          clientBrands: [...(impactStats.clientBrands || []), trimmed],
                          corporateClientsCount: (impactStats.clientBrands || []).length + 1,
                        });
                        setNewClientBrandInput("");
                      }
                    }}
                    disabled={!newClientBrandInput.trim()}
                    className="px-5 py-2.5 bg-gold-gradient text-[#011F15] rounded-xl font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Partner Brand</span>
                  </button>
                </div>

                {/* Brands Chip List */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(!impactStats.clientBrands || impactStats.clientBrands.length === 0) ? (
                    <p className="text-xs text-emerald-100/40 italic">
                      No partner companies added yet. Type a company name above and press Add!
                    </p>
                  ) : (
                    impactStats.clientBrands.map((brand, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold"
                      >
                        <span>{brand}</span>
                        <button
                          onClick={() => {
                            const updated = impactStats.clientBrands.filter((_, i) => i !== idx);
                            setImpactStats({
                              ...impactStats,
                              clientBrands: updated,
                              corporateClientsCount: updated.length,
                            });
                          }}
                          className="text-white/40 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              OPTION 15: PLANNERS & B2B PARTNER PORTAL CMS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "plannersCMS" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        Planners &amp; B2B Partner Portal CMS
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/70">
                      Customize every word, title, badge, advantage card, net rate description, and FAQ on the /planners partner portal.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setPlannersConfig(DEFAULT_PLANNERS_CONFIG)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const res = await savePlannersConfig(plannersConfig);
                        setIsSaving(false);
                        if (res.success) {
                          setSuccessToast("✅ Planners B2B CMS settings permanently saved to Cloud Firestore!");
                          setTimeout(() => setSuccessToast(""), 4000);
                        } else {
                          setErrorToast(`❌ Save error: ${res.error}`);
                          setTimeout(() => setErrorToast(""), 4000);
                        }
                      }}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Planners CMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Hero Section Copy Editor */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">
                  1. Hero Section Headlines &amp; Badge
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">Eyebrow Badge Text</label>
                    <input
                      type="text"
                      value={plannersConfig.heroBadge}
                      onChange={(e) => setPlannersConfig({ ...plannersConfig, heroBadge: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">Hero Title Prefix</label>
                    <input
                      type="text"
                      value={plannersConfig.heroTitlePrefix}
                      onChange={(e) => setPlannersConfig({ ...plannersConfig, heroTitlePrefix: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#D4AF37] block">Hero Title Highlight Word (Gold)</label>
                    <input
                      type="text"
                      value={plannersConfig.heroTitleHighlight}
                      onChange={(e) => setPlannersConfig({ ...plannersConfig, heroTitleHighlight: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-[#D4AF37] font-bold outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">Hero Subtitle Paragraph</label>
                  <textarea
                    rows={3}
                    value={plannersConfig.heroSubtitle}
                    onChange={(e) => setPlannersConfig({ ...plannersConfig, heroSubtitle: e.target.value })}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white outline-none focus:border-[#D4AF37] leading-relaxed"
                  />
                </div>
              </div>

              {/* 2. Why Partner Advantage Cards */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">
                    2. Why Partner Advantage Cards (Grid)
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    {(plannersConfig.whyPartnerCards || []).length} Cards
                  </span>
                </div>

                {/* Grid of existing cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(plannersConfig.whyPartnerCards || []).map((card, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => {
                            const updated = [...(plannersConfig.whyPartnerCards || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setPlannersConfig({ ...plannersConfig, whyPartnerCards: updated });
                          }}
                          className="font-bold text-xs text-white bg-transparent outline-none border-b border-transparent focus:border-[#D4AF37] w-full mr-2"
                        />
                        <button
                          onClick={() => {
                            const updated = (plannersConfig.whyPartnerCards || []).filter((_, i) => i !== idx);
                            setPlannersConfig({ ...plannersConfig, whyPartnerCards: updated });
                          }}
                          className="text-white/40 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={card.desc}
                        onChange={(e) => {
                          const updated = [...(plannersConfig.whyPartnerCards || [])];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setPlannersConfig({ ...plannersConfig, whyPartnerCards: updated });
                        }}
                        className="w-full bg-transparent text-[11px] text-emerald-100/70 outline-none border border-white/5 rounded-lg p-2 leading-relaxed focus:border-[#D4AF37]"
                      />
                    </div>
                  ))}
                </div>

                {/* Add new advantage card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white">Add New Advantage Card</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Card Title (e.g. Priority Date Hold)"
                      value={newWhyCardTitle}
                      onChange={(e) => setNewWhyCardTitle(e.target.value)}
                      className="bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description text..."
                      value={newWhyCardDesc}
                      onChange={(e) => setNewWhyCardDesc(e.target.value)}
                      className="bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newWhyCardTitle.trim()) {
                        setPlannersConfig({
                          ...plannersConfig,
                          whyPartnerCards: [
                            ...(plannersConfig.whyPartnerCards || []),
                            { title: newWhyCardTitle.trim(), desc: newWhyCardDesc.trim() },
                          ],
                        });
                        setNewWhyCardTitle("");
                        setNewWhyCardDesc("");
                      }
                    }}
                    disabled={!newWhyCardTitle.trim()}
                    className="px-4 py-2 bg-gold-gradient text-[#011F15] rounded-xl font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Card</span>
                  </button>
                </div>
              </div>

              {/* 3. Net Vendor Rates Pitch Copy */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">
                  3. Net Vendor Rates Privacy Pitch
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">Section Eyebrow Tag</label>
                    <input
                      type="text"
                      value={plannersConfig.netRatesTitle}
                      onChange={(e) => setPlannersConfig({ ...plannersConfig, netRatesTitle: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">Main Heading</label>
                    <input
                      type="text"
                      value={plannersConfig.netRatesSubtitle}
                      onChange={(e) => setPlannersConfig({ ...plannersConfig, netRatesSubtitle: e.target.value })}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">Pitch Description</label>
                  <textarea
                    rows={3}
                    value={plannersConfig.netRatesDescription}
                    onChange={(e) => setPlannersConfig({ ...plannersConfig, netRatesDescription: e.target.value })}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white outline-none focus:border-[#D4AF37] leading-relaxed"
                  />
                </div>
              </div>

              {/* 4. Partner FAQs */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">
                    4. Partner FAQs
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    {(plannersConfig.faqs || []).length} FAQs
                  </span>
                </div>

                <div className="space-y-3">
                  {(plannersConfig.faqs || []).map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...(plannersConfig.faqs || [])];
                            updated[idx] = { ...updated[idx], question: e.target.value };
                            setPlannersConfig({ ...plannersConfig, faqs: updated });
                          }}
                          className="font-bold text-xs text-white bg-transparent outline-none border-b border-transparent focus:border-[#D4AF37] w-full mr-2"
                        />
                        <button
                          onClick={() => {
                            const updated = (plannersConfig.faqs || []).filter((_, i) => i !== idx);
                            setPlannersConfig({ ...plannersConfig, faqs: updated });
                          }}
                          className="text-white/40 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...(plannersConfig.faqs || [])];
                          updated[idx] = { ...updated[idx], answer: e.target.value };
                          setPlannersConfig({ ...plannersConfig, faqs: updated });
                        }}
                        className="w-full bg-transparent text-[11px] text-emerald-100/70 outline-none border border-white/5 rounded-lg p-2 leading-relaxed focus:border-[#D4AF37]"
                      />
                    </div>
                  ))}
                </div>

                {/* Add new FAQ */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white">Add New Partner FAQ</h4>
                  <input
                    type="text"
                    placeholder="Question (e.g. Can we co-brand print frames?)"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Answer details..."
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white outline-none leading-relaxed"
                  />
                  <button
                    onClick={() => {
                      if (newFaqQ.trim()) {
                        setPlannersConfig({
                          ...plannersConfig,
                          faqs: [...(plannersConfig.faqs || []), { question: newFaqQ.trim(), answer: newFaqA.trim() }],
                        });
                        setNewFaqQ("");
                        setNewFaqA("");
                      }
                    }}
                    disabled={!newFaqQ.trim()}
                    className="px-4 py-2 bg-gold-gradient text-[#011F15] rounded-xl font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add FAQ Item</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <Footer />

      {/* AI WHATSAPP ASSISTANT MODAL FOR ADMIN LEADS */}
      <AIWhatsAppAssistantModal
        isOpen={adminAiModalOpen}
        onClose={() => setAdminAiModalOpen(false)}
        leadData={adminSelectedLeadForAI || {}}
      />

      {/* ── CROP MODAL ──────────────────────────────────────────────────── */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#040e09] border border-[#D4AF37]/40 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Crop Your Image</h3>
                <p className="text-xs text-emerald-100/60 mt-0.5">Drag the golden box to reposition. Drag the corner handle to resize.</p>
              </div>
              <button
                onClick={() => setCropModalOpen(false)}
                className="text-white/50 hover:text-white transition text-2xl leading-none px-2"
              >&times;</button>
            </div>

            {/* Crop Area */}
            <div
              ref={cropContainerRef}
              className="relative rounded-2xl overflow-hidden bg-black select-none"
              style={{ maxHeight: "420px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt="Crop source"
                className="w-full h-full object-contain block"
                style={{ maxHeight: "420px", userSelect: "none", pointerEvents: "none" }}
                draggable={false}
              />
              {/* Dark overlay outside crop box */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom,
                    rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.6) ${cropBox.y}%,
                    transparent ${cropBox.y}%, transparent ${cropBox.y + cropBox.h}%,
                    rgba(0,0,0,0.6) ${cropBox.y + cropBox.h}%, rgba(0,0,0,0.6) 100%)`,
                  pointerEvents: "none",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right,
                    rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) ${cropBox.x}%,
                    transparent ${cropBox.x}%, transparent ${cropBox.x + cropBox.w}%,
                    rgba(0,0,0,0.4) ${cropBox.x + cropBox.w}%, rgba(0,0,0,0.4) 100%)`,
                  pointerEvents: "none",
                }}
              />
              {/* Crop Box */}
              <div
                onMouseDown={onCropMouseDown}
                className="absolute border-2 border-[#D4AF37] cursor-move"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.w}%`,
                  height: `${cropBox.h}%`,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.0)",
                }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
                {/* Corner handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#D4AF37] rounded-sm" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#D4AF37] rounded-sm" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#D4AF37] rounded-sm" />
                {/* Resize handle (bottom-right) */}
                <div
                  onMouseDown={onCropResizeMouseDown}
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#D4AF37] rounded-sm cursor-se-resize flex items-center justify-center"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 7L7 1M4 7L7 4M7 7V7" stroke="#011F15" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                {/* Dimensions label */}
                <div className="absolute -top-6 left-0 text-[9px] font-mono text-[#D4AF37] whitespace-nowrap">
                  {Math.round(cropBox.w)}% × {Math.round(cropBox.h)}%
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-emerald-100/50 flex-1">
                {cropTarget === "showcase" ? "Cropping for Showcase / What's Included card" : "Cropping for Gallery photo"}
              </p>
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition"
              >Cancel</button>
              <button
                onClick={applyCrop}
                className="px-6 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase tracking-wider shadow-lg hover:scale-105 transition flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
