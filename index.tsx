
import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { ArtStyle, PoseStyle, CameraStyle, LensStyle, GeneratedImage, AspectRatio, ImageResolution } from "./types";
import { generateImageFromPrompt, upscaleImage, removeBackground } from "./services/gemini";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import { AdminDashboard } from "./AdminDashboard";
import { UserData, addImageToUserHistory, clearUserHistory, updateUser } from "./services/auth";
import { 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  History, 
  Trash2,
  Sparkles,
  X,
  Plus,
  Camera,
  Palette,
  Sun,
  Moon,
  Zap,
  Maximize2,
  Eraser,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Key,
  Layers,
  Settings2,
  ChevronRight,
  Monitor,
  User,
  Shield,
  Smartphone,
  Cpu,
  CreditCard,
  QrCode,
  Check,
  Award,
  Crown,
  Eye,
  EyeOff,
  Info,
  ChevronLeft,
  Search,
  ZapOff,
  Wind,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Dna,
  Aperture
} from "lucide-react";

type TabType = 'style' | 'pose' | 'camera' | 'lens';
type ThemeType = 'dark' | 'light' | 'midnight';
type ViewState = 'login' | 'signup' | 'app' | 'admin' | 'subscription';
type ProfilePage = 'identity' | 'device' | 'more';

const SUGGESTION_LIBRARY = [
  "octane render", "highly detailed", "masterpiece", "8k resolution", "trending on artstation",
  "volumetric lighting", "unreal engine 5", "soft bokeh", "extremely intricate", "hyperrealistic",
  "vibrant colors", "muted tones", "dramatic shadows", "neon lighting", "vaporwave aesthetic",
  "mythical", "cybernetic", "ethereal glow", "bokeh background", "film grain", "macro lens",
  "concept art", "digital painting", "surrealism", "minimalist", "anatomically correct"
];

const themes = {
  dark: {
    bg: "bg-[#020617]",
    gradient: "from-indigo-600/10 via-slate-900 to-blue-600/10",
    panel: "bg-slate-900/60 backdrop-blur-3xl border-white/5",
    text: "text-slate-100",
    textMuted: "text-slate-500",
    accent: "indigo",
    button: "from-indigo-600 to-blue-600 shadow-indigo-500/20"
  },
  light: {
    bg: "bg-slate-50",
    gradient: "from-slate-100 via-white to-indigo-50",
    panel: "bg-white/80 backdrop-blur-xl border-slate-200",
    text: "text-slate-900",
    textMuted: "text-slate-400",
    accent: "indigo",
    button: "from-indigo-600 to-blue-600 shadow-indigo-200"
  },
  midnight: {
    bg: "bg-black",
    gradient: "from-purple-900/10 via-black to-indigo-900/10",
    panel: "bg-black/40 backdrop-blur-3xl border-white/10",
    text: "text-zinc-100",
    textMuted: "text-zinc-600",
    accent: "white",
    button: "from-zinc-100 to-zinc-300 text-black shadow-white/5"
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ArtStyle.NONE);
  const [selectedPose, setSelectedPose] = useState<PoseStyle>(PoseStyle.NONE);
  const [selectedCamera, setSelectedCamera] = useState<CameraStyle>(CameraStyle.NONE);
  const [selectedLens, setSelectedLens] = useState<LensStyle>(LensStyle.NONE);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("16:9");
  const [selectedResolution, setSelectedResolution] = useState<ImageResolution>("1K");
  const [activeTab, setActiveTab] = useState<TabType>('style');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showKeySelectionModal, setShowKeySelectionModal] = useState(false);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePage, setProfilePage] = useState<ProfilePage>('identity');
  const [editUser, setEditUser] = useState({ username: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('card');
  const [selectedPlan, setSelectedPlan] = useState<'creator' | 'visionary' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadSlot = useRef<number>(0);
  const t = themes[theme];

  const deviceInfo = useMemo(() => {
    return {
      browser: navigator.userAgent.split(' ')[0],
      os: navigator.platform,
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      cores: navigator.hardwareConcurrency || 'Unknown',
      ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown',
      touch: 'ontouchstart' in window ? 'Support' : 'Not Support'
    };
  }, []);

  useEffect(() => {
    const words = prompt.split(" ");
    const lastWord = words[words.length - 1].toLowerCase();
    
    if (lastWord.length > 1) {
      const filtered = SUGGESTION_LIBRARY.filter(s => s.toLowerCase().includes(lastWord) && !prompt.includes(s));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [prompt]);

  const applySuggestion = (suggestion: string) => {
    const words = prompt.split(" ");
    words[words.length - 1] = suggestion;
    setPrompt(words.join(" ") + ", ");
    setSuggestions([]);
  };

  const handleLoginSuccess = (role: 'admin' | 'user', user?: UserData) => {
    setCurrentView(role === 'admin' ? 'admin' : 'app');
    if (role === 'user' && user) {
      setCurrentUser(user);
      setHistory(user.history || []); 
      setEditUser({ username: user.username, email: user.email, password: user.password });
    }
  };

  const getAIStudio = () => (window as any).aistudio;

  const handleProfileUpdate = () => {
    if (!currentUser) return;
    const result = updateUser(currentUser.username, { 
      username: editUser.username, 
      email: editUser.email, 
      password: editUser.password 
    });
    
    if (result.success && result.user) {
      setCurrentUser(result.user);
      alert("Profile Identity Updated!");
    } else {
      setError(result.message);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && referenceImages.length === 0) return;
    
    if (selectedResolution !== "1K") {
      const hasKey = await getAIStudio().hasSelectedApiKey();
      if (!hasKey) { setShowKeySelectionModal(true); return; }
    }

    setLoading(true);
    setError(null);
    try {
      const base64Image = await generateImageFromPrompt(
        prompt, 
        selectedStyle, 
        selectedPose, 
        selectedCamera, 
        selectedLens,
        referenceImages, 
        selectedAspectRatio,
        selectedResolution
      );
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: base64Image,
        prompt: prompt,
        style: selectedStyle,
        pose: selectedPose,
        camera: selectedCamera,
        lens: selectedLens,
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
        timestamp: Date.now()
      };
      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      if (currentUser) addImageToUserHistory(currentUser.username, newImage);
    } catch (err: any) {
      if (err.message?.includes("entity was not found") || err.message?.includes("403") || err.message?.includes("key")) {
        setShowKeySelectionModal(true);
      }
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!currentImage) return;
    const hasKey = await getAIStudio().hasSelectedApiKey();
    if (!hasKey) { setShowKeySelectionModal(true); return; }
    setProcessingAction('upscale');
    try {
      const base64Image = await upscaleImage(currentImage.url, currentImage.prompt);
      const newImage = { ...currentImage, id: crypto.randomUUID(), url: base64Image, prompt: currentImage.prompt + " (4K)" };
      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      if (currentUser) addImageToUserHistory(currentUser.username, newImage);
    } catch (err: any) { 
        if (err.message?.includes("entity was not found") || err.message?.includes("403")) setShowKeySelectionModal(true);
        setError(err.message); 
    } finally { setProcessingAction(null); }
  };

  const handleRemoveBackground = async () => {
    if (!currentImage) return;
    setProcessingAction('removeBg');
    try {
      const base64Image = await removeBackground(currentImage.url);
      const newImage = { ...currentImage, id: crypto.randomUUID(), url: base64Image, prompt: currentImage.prompt + " (Clean)" };
      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      if (currentUser) addImageToUserHistory(currentUser.username, newImage);
    } catch (err: any) { 
        if (err.message?.includes("entity was not found") || err.message?.includes("403")) setShowKeySelectionModal(true);
        setError(err.message); 
    } finally { setProcessingAction(null); }
  };

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `nanogen-${id}.png`;
    link.click();
  };

  const handleClearHistory = () => {
    if (currentUser) {
      clearUserHistory(currentUser.username);
      setHistory([]);
    }
  };

  const handlePlanSelect = (plan: 'creator' | 'visionary') => {
    setSelectedPlan(plan);
    setTimeout(() => {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (currentView === 'login') return <Login onLogin={handleLoginSuccess} onNavigateToSignUp={() => setCurrentView('signup')} />;
  if (currentView === 'signup') return <SignUp onNavigateToLogin={() => setCurrentView('login')} onSuccess={() => setCurrentView('login')} />;
  if (currentView === 'admin') return <AdminDashboard onLogout={() => setCurrentView('login')} />;

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-all duration-700 selection:bg-indigo-500/30 overflow-hidden flex flex-col relative`}>
      
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} bg-[length:400%_400%] animate-mesh-gradient opacity-40 transition-all duration-1000`} />
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vh] bg-indigo-600/10 blur-[150px] animate-pulse rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vh] bg-blue-600/10 blur-[150px] animate-pulse rounded-full" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vh] bg-violet-600/10 blur-[120px] animate-pulse rounded-full" style={{ animationDelay: '4s' }} />
        </div>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {currentView === 'app' && (
        <>
          <header className={`relative z-50 h-16 px-6 flex items-center justify-between border-b ${t.panel}`}>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                NanoGen <span className="text-indigo-400">Pro</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Sun className="w-4 h-4" /></button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Moon className="w-4 h-4" /></button>
                <button onClick={() => setTheme('midnight')} className={`p-1.5 rounded-full transition-all ${theme === 'midnight' ? 'bg-zinc-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Zap className="w-4 h-4" /></button>
              </div>
              
              <button 
                onClick={() => { setIsProfileOpen(true); setProfilePage('identity'); }}
                className="w-10 h-10 rounded-full bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all overflow-hidden group shadow-xl shadow-indigo-500/10"
              >
                {currentUser ? (
                  <span className="text-sm font-black uppercase">{currentUser.username.charAt(0)}</span>
                ) : (
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative z-10">
            <aside className={`w-80 transition-all duration-500 ease-in-out border-r ${t.panel} relative z-20`}>
              <div className="h-full p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                
                <section className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Reference Mix
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map(i => (
                      <div key={i} onClick={() => { activeUploadSlot.current = i; fileInputRef.current?.click(); }} className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 overflow-hidden">
                        {referenceImages[i] ? (
                          <>
                            <img src={referenceImages[i]} className="w-full h-full object-cover" />
                            <button onClick={(e) => { e.stopPropagation(); setReferenceImages(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <Plus className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        )}
                      </div>
                    ))}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            setReferenceImages(prev => {
                                const n = [...prev];
                                n[activeUploadSlot.current] = res;
                                return n;
                            });
                        };
                        reader.readAsDataURL(file);
                      }
                  }} />
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Wand2 className="w-3 h-3" /> Prompt command
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <textarea 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Unleash your imagination..."
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none placeholder:text-slate-700 transition-all custom-scrollbar"
                      />
                      
                      {suggestions.length > 0 && (
                          <div className="absolute left-0 bottom-full mb-2 w-full p-2 rounded-2xl bg-slate-900/95 backdrop-blur-3xl border border-indigo-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-2">
                              <div className="flex flex-wrap gap-2">
                                  {suggestions.map((s, idx) => (
                                      <button 
                                          key={idx} 
                                          onClick={() => applySuggestion(s)}
                                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-medium text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
                                      >
                                          + {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ratio</span>
                          <span className="text-[9px] font-black uppercase text-indigo-400">{selectedAspectRatio}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(["1:1", "16:9", "9:16", "4:3"] as AspectRatio[]).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setSelectedAspectRatio(ratio)}
                              className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl border transition-all ${
                                selectedAspectRatio === ratio 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                              }`}
                            >
                              {ratio === "1:1" && <Square className="w-3 h-3" />}
                              {ratio === "16:9" && <RectangleHorizontal className="w-3 h-3" />}
                              {ratio === "9:16" && <RectangleVertical className="w-3 h-3" />}
                              {ratio === "4:3" && <RectangleHorizontal className="w-3 h-3 opacity-70 scale-90" />}
                              <span className="text-[8px] font-bold">{ratio}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Res</span>
                          <span className="text-[9px] font-black uppercase text-indigo-400">{selectedResolution}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(["1K", "2K", "4K", "8K"] as ImageResolution[]).map((res) => (
                            <button
                              key={res}
                              onClick={() => setSelectedResolution(res)}
                              className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl border transition-all ${
                                selectedResolution === res 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                              }`}
                            >
                              <Dna className={`w-3 h-3 ${res === "8K" ? "animate-pulse text-yellow-400" : ""}`} />
                              <span className="text-[8px] font-bold">{res}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                    {(['style', 'pose', 'camera', 'lens'] as TabType[]).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                            {tab}
                        </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                      {activeTab === 'style' && Object.values(ArtStyle).map((item) => (
                        <button 
                          key={item} 
                          onClick={() => setSelectedStyle(item as ArtStyle)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${selectedStyle === item ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          {item}
                        </button>
                      ))}
                      {activeTab === 'pose' && Object.values(PoseStyle).map((item) => (
                        <button 
                          key={item} 
                          onClick={() => setSelectedPose(item as PoseStyle)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${selectedPose === item ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          {item}
                        </button>
                      ))}
                      {activeTab === 'camera' && Object.values(CameraStyle).map((item) => (
                        <button 
                          key={item} 
                          onClick={() => setSelectedCamera(item as CameraStyle)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${selectedCamera === item ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          {item}
                        </button>
                      ))}
                      {activeTab === 'lens' && Object.values(LensStyle).map((item) => (
                        <button 
                          key={item} 
                          onClick={() => setSelectedLens(item as LensStyle)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${selectedLens === item ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Aperture className={`w-3 h-3 ${selectedLens === item ? 'text-indigo-400' : 'text-slate-600'}`} />
                            {item}
                          </div>
                        </button>
                      ))}
                  </div>
                </section>

                <button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 transition-all active:scale-95 bg-gradient-to-r ${t.button} disabled:opacity-50 shadow-xl`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Ignite</>}
                </button>
              </div>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-y-auto custom-scrollbar">
                <div className={`relative w-full max-w-4xl min-h-[400px] rounded-[3rem] border ${t.panel} shadow-[0_60px_100px_-20px_rgba(0,0,0,0.8)] flex items-center justify-center group overflow-hidden`}>
                    {currentImage ? (
                        <div className={`w-full h-full relative group animate-in zoom-in-95 fade-in duration-700 flex items-center justify-center`}>
                            <img 
                              src={currentImage.url} 
                              className={`max-w-full max-h-full object-contain ${
                                currentImage.aspectRatio === "9:16" ? 'h-full aspect-[9/16]' : 
                                currentImage.aspectRatio === "16:9" ? 'w-full aspect-[16/9]' : 
                                'aspect-square'
                              }`} 
                              alt="Current Creation" 
                            />
                            <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                                {currentImage.resolution && (
                                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-black uppercase text-indigo-400 border border-indigo-500/30">
                                      {currentImage.resolution} OUTPUT
                                    </div>
                                )}
                                {currentImage.lens && currentImage.lens !== LensStyle.NONE && (
                                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-black uppercase text-violet-400 border border-violet-500/30 flex items-center gap-1.5">
                                      <Aperture className="w-3 h-3" /> {currentImage.lens}
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2.5 rounded-3xl bg-black/80 backdrop-blur-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-6 group-hover:translate-y-0 shadow-2xl">
                                <button onClick={handleUpscale} disabled={!!processingAction} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-600 transition-all">
                                    {processingAction === 'upscale' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Maximize2 className="w-3.5 h-3.5" />} 4K Pro
                                </button>
                                <div className="w-[1px] h-8 bg-white/10 mx-1" />
                                <button onClick={handleRemoveBackground} disabled={!!processingAction} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-600 transition-all">
                                    {processingAction === 'removeBg' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />} Remove BG
                                </button>
                                <div className="w-[1px] h-8 bg-white/10 mx-1" />
                                <button onClick={() => handleDownload(currentImage.url, currentImage.id)} className="p-2.5 rounded-2xl text-white hover:bg-indigo-600 transition-all">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 text-center max-w-sm animate-in fade-in duration-1000">
                            <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center animate-pulse shadow-inner">
                                <ImageIcon className="w-12 h-12 text-indigo-500/40" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Nexus Void</h2>
                                <p className="text-slate-500 text-sm font-medium">Input a command and choose your dimensions to materialize your creative thoughts.</p>
                            </div>
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div className={`mt-10 p-2 rounded-3xl flex items-center gap-4 ${t.panel} max-w-4xl w-full shadow-2xl border border-white/5`}>
                        <div className="flex-1 flex gap-3 overflow-x-auto p-1 custom-scrollbar-hide">
                            {history.map(img => (
                                <button 
                                    key={img.id} 
                                    onClick={() => { 
                                      setCurrentImage(img); 
                                      setPrompt(img.prompt); 
                                      if(img.aspectRatio) setSelectedAspectRatio(img.aspectRatio); 
                                      if(img.resolution) setSelectedResolution(img.resolution);
                                      if(img.style) setSelectedStyle(img.style);
                                      if(img.pose) setSelectedPose(img.pose);
                                      if(img.camera) setSelectedCamera(img.camera);
                                      if(img.lens) setSelectedLens(img.lens);
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 shadow-sm ${currentImage?.id === img.id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={img.url} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowClearHistoryModal(true)} className="p-3 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                )}
            </main>
          </div>
        </>
      )}

      {currentView === 'subscription' && (
        <div className="fixed inset-0 z-[100] bg-[#020617] text-white flex flex-col overflow-y-auto animate-in fade-in duration-500">
          <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-10 bg-[#020617]/80">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-black tracking-tighter uppercase">NanoGen Subscription Plans</h2>
            </div>
            <button onClick={() => setCurrentView('app')} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full p-10 py-16">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter">Accelerate your imagination.</h2>
              <p className="text-slate-500 text-lg">Select a plan to unlock the full potential of NanoGen AI generation.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="p-10 rounded-[3rem] border border-white/5 bg-white/5 flex flex-col items-start text-left group hover:border-white/10 transition-all shadow-xl">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-bold uppercase tracking-widest mb-4">Starter</span>
                <h3 className="text-4xl font-black mb-2 font-mono">$0</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Basic generation for casual creators exploring AI art.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-500" /> 20 Generations / day</li>
                  <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-500" /> Standard Styles</li>
                </ul>
                <button className="w-full py-4 rounded-[1.5rem] bg-white/5 text-slate-400 font-bold opacity-50 cursor-not-allowed uppercase tracking-widest text-[10px]">Current Plan</button>
              </div>

              <div className="p-10 rounded-[3rem] border-2 border-indigo-500 bg-indigo-500/5 relative flex flex-col items-start text-left shadow-[0_0_80px_rgba(99,102,241,0.2)] scale-105">
                <div className="absolute top-0 right-10 -translate-y-1/2 px-5 py-2 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">Most Popular</div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Crown className="w-3.5 h-3.5" /> Creator</span>
                <h3 className="text-4xl font-black mb-2 font-mono uppercase">$19 <span className="text-sm text-slate-500 font-normal">/mo</span></h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Professional tools for power users who demand high quality.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-100"><Check className="w-4 h-4 text-indigo-400" /> Unlimited Generation</li>
                  <li className="flex items-center gap-3 text-sm text-slate-100"><Check className="w-4 h-4 text-indigo-400" /> All Premium Styles</li>
                  <li className="flex items-center gap-3 text-sm text-slate-100"><Check className="w-4 h-4 text-indigo-400" /> 4K Pro Upscaling</li>
                </ul>
                <button onClick={() => handlePlanSelect('creator')} className="w-full py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">Select Plan</button>
              </div>

              <div className="p-10 rounded-[3rem] border border-white/5 bg-white/5 flex flex-col items-start text-left group hover:border-white/10 transition-all shadow-xl">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Award className="w-3.5 h-3.5" /> Visionary</span>
                <h3 className="text-4xl font-black mb-2 font-mono uppercase">$49 <span className="text-sm text-slate-500 font-normal">/mo</span></h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">The ultimate suite for commercial studios and elite artists.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-500" /> Full Commercial Rights</li>
                  <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-500" /> Priority Support</li>
                </ul>
                <button onClick={() => handlePlanSelect('visionary')} className="w-full py-4 rounded-[1.5rem] bg-white/10 text-white font-black hover:bg-white/20 transition-all active:scale-95 uppercase tracking-widest text-[10px]">Select Plan</button>
              </div>
            </div>

            {selectedPlan && (
              <div id="payment-section" className="max-w-xl mx-auto p-12 rounded-[4rem] border border-white/10 bg-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-20 duration-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Secure Nexus Pay</h3>
                  <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                    <button onClick={() => setPaymentMethod('card')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><CreditCard className="w-4 h-4" /> Card</button>
                    <button onClick={() => setPaymentMethod('qr')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${paymentMethod === 'qr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><QrCode className="w-4 h-4" /> QR</button>
                  </div>
                </div>
                <div className="relative z-10">
                  {paymentMethod === 'card' ? (
                    <div className="space-y-6">
                      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-950 text-white flex flex-col gap-14 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full" />
                         <div className="flex justify-between items-start relative z-10"><Smartphone className="w-10 h-10 opacity-60" /><div className="text-xl font-black italic">VISA PRO</div></div>
                         <div className="relative z-10"><p className="text-[10px] opacity-60 mb-1 uppercase tracking-widest font-black">Encrypted Card Array</p><p className="text-2xl font-mono tracking-[0.2em]">**** **** **** 8842</p></div>
                      </div>
                      <div className="space-y-4 text-left">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Holder Identity</label><input type="text" placeholder="John Nexus" className="w-full bg-black/40 border border-white/10 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nexus Expiry</label><input type="text" placeholder="MM / YY" className="w-full bg-black/40 border border-white/10 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access CVV</label><input type="password" placeholder="***" className="w-full bg-black/40 border border-white/10 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" /></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 py-10 animate-in zoom-in-95">
                      <div className="w-64 h-64 bg-white p-6 rounded-[3rem] shadow-[0_0_80px_rgba(255,255,255,0.15)] flex items-center justify-center border-4 border-indigo-500/20"><QrCode className="w-full h-full text-black" /></div>
                      <p className="text-slate-400 text-sm font-medium">Scan with your banking app to authorize pay.</p>
                    </div>
                  )}
                  <button onClick={() => { alert(`Purchase successful!`); setCurrentView('app'); }} className="w-full mt-10 py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-xl">Confirm Transmission <ChevronRight className="w-6 h-6" /></button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
          <div className={`w-full max-w-lg rounded-[3.5rem] border shadow-2xl flex flex-col overflow-hidden h-[44rem] ${t.panel} relative`}>
            
            <header className="p-10 pb-4 flex items-center justify-between relative z-10 border-b border-white/5">
                <div className="flex items-center gap-4">
                  {profilePage !== 'identity' && (
                    <button onClick={() => setProfilePage(profilePage === 'more' ? 'device' : 'identity')} className="p-2.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></button>
                  )}
                  <h3 className="text-3xl font-black uppercase tracking-tighter">
                      {profilePage === 'identity' ? 'Client ID' : profilePage === 'device' ? 'Device Detail' : 'More Info'}
                  </h3>
                </div>
                <button onClick={() => setIsProfileOpen(false)} className="p-2.5 rounded-full bg-white/5 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </header>

            <div className="px-10 py-3 flex gap-1.5 bg-black/15">
              <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${profilePage === 'identity' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10'}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${profilePage === 'device' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10'}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-700 ${profilePage === 'more' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10'}`} />
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col">
                {profilePage === 'identity' && (
                  <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
                     <div className="flex flex-col items-center mb-10">
                        <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-600/40 flex items-center justify-center text-white mb-5 text-4xl font-black">{currentUser.username.charAt(0).toUpperCase()}</div>
                        <div className="px-5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">{currentUser.subscription || 'free'} tier access</div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client ID Gmail</label>
                       <input value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="gmail.nexus@domain.com" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client ID Name</label>
                       <input value={editUser.username} onChange={e => setEditUser({...editUser, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Identity Label" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client ID Password</label>
                       <div className="relative">
                         <input type={showPwd ? 'text' : 'password'} value={editUser.password} onChange={e => setEditUser({...editUser, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Vault Access Key" />
                         <button onClick={() => setShowPwd(!showPwd)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">{showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                       </div>
                     </div>
                     <div className="flex gap-4 pt-6">
                        <button onClick={handleProfileUpdate} className="flex-1 py-5 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Synchronize</button>
                        <button onClick={() => setProfilePage('device')} className="px-8 py-5 rounded-[2rem] bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"><ChevronRight className="w-6 h-6" /></button>
                     </div>
                  </div>
                )}

                {profilePage === 'device' && (
                  <div className="space-y-5 animate-in slide-in-from-right-12 duration-500 h-full flex flex-col">
                     <div className="grid grid-cols-1 gap-4">
                        <div className="p-7 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                           <div className="space-y-1.5"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Host Environment</p><p className="text-lg font-bold text-slate-100">{deviceInfo.os}</p></div>
                           <Cpu className="w-9 h-9 text-indigo-400 opacity-20 group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <div className="p-7 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                           <div className="space-y-1.5"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Transmission Engine</p><p className="text-lg font-bold text-slate-100">{deviceInfo.browser}</p></div>
                           <Monitor className="w-9 h-9 text-indigo-400 opacity-20 group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <div className="p-7 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                           <div className="space-y-1.5"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Pixel Array Density</p><p className="text-lg font-bold text-slate-100">{deviceInfo.resolution}</p></div>
                           <Layers className="w-9 h-9 text-indigo-400 opacity-20 group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-1.5 group hover:bg-white/10 transition-all">
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Logic Threads</p>
                              <p className="text-lg font-bold text-slate-100">{deviceInfo.cores} Cores</p>
                           </div>
                           <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-1.5 group hover:bg-white/10 transition-all">
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Memory Pool</p>
                              <p className="text-lg font-bold text-slate-100">{deviceInfo.ram}</p>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setProfilePage('more')} className="w-full mt-auto py-5 rounded-[2rem] bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/5 group shadow-sm">
                       Extended Data <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                )}

                {profilePage === 'more' && (
                  <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                     <div className="p-10 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/10 space-y-7 relative overflow-hidden group shadow-inner">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center justify-between relative z-10">
                           <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Archival Metrics</h4>
                           <Info className="w-5 h-5 text-indigo-400 opacity-50" />
                        </div>
                        <div className="space-y-6 relative z-10">
                           <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Commissioned On</span><span className="text-sm font-bold text-white">{new Date(currentUser.joinedAt).toLocaleDateString()}</span></div>
                           <div className={`flex justify-between items-center transition-colors ${currentUser.subscription ? 'text-indigo-400' : 'text-slate-500'}`}><span className="text-[10px] font-black uppercase tracking-widest">Subscription Link</span><span className="text-sm font-bold uppercase">{currentUser.subscription || 'unlinked'}</span></div>
                           <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Archived Images</span><span className="text-sm font-bold text-white">{history.length} Units</span></div>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-4 pt-4">
                        <button onClick={() => { setCurrentView('login'); setIsProfileOpen(false); }} className="w-full py-5 rounded-[2rem] border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 shadow-sm"><LogOut className="w-5 h-5" /> Decouple Session</button>
                     </div>
                  </div>
                )}
            </div>

            <footer className="p-10 pt-0 relative z-10 border-t border-white/5 bg-black/30 backdrop-blur-xl">
               <button 
                 onClick={() => { setIsProfileOpen(false); setCurrentView('subscription'); }}
                 className="w-full mt-8 py-6 rounded-[2.5rem] bg-gradient-to-r from-indigo-600 to-violet-700 text-white flex items-center justify-between px-10 shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-[1.04] transition-all group active:scale-95"
               >
                 <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-50 mb-1">Nexus Integration</p>
                    <p className="text-xl font-black uppercase tracking-tight">UPGRADE ACTION</p>
                 </div>
                 <div className="p-3.5 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                   <Crown className="w-8 h-8" />
                 </div>
               </button>
            </footer>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-[110]">
        {showClearHistoryModal && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-300">
              <div className={`w-full max-w-xs rounded-[3rem] border p-12 flex flex-col items-center text-center ${t.panel} shadow-2xl animate-in zoom-in-95`}>
                  <div className="p-6 rounded-full bg-red-500/10 text-red-500 mb-8 border border-red-500/20 shadow-lg shadow-red-500/10"><Trash2 className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Purge Archive?</h3>
                  <p className="text-slate-500 text-xs mb-10 font-medium leading-relaxed">This transmission will irreversibly clear your entire creation log from local storage.</p>
                  <div className="flex flex-col gap-3 w-full">
                      <button onClick={() => { handleClearHistory(); setShowClearHistoryModal(false); }} className="w-full py-5 rounded-3xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-600/30 active:scale-95 transition-all">Confirm Purge</button>
                      <button onClick={() => setShowClearHistoryModal(false)} className="w-full py-5 rounded-3xl border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all text-slate-400">Dismiss</button>
                  </div>
              </div>
          </div>
        )}

        {showKeySelectionModal && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-300">
             <div className={`w-full max-w-md rounded-[4rem] border p-14 flex flex-col items-center text-center ${t.panel} shadow-[0_40px_100px_rgba(0,0,0,0.8)]`}>
                <div className="w-24 h-24 rounded-[3rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-10 shadow-2xl border border-indigo-500/20"><Key className="w-12 h-12" /></div>
                <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Nexus Key Required</h3>
                <p className="text-slate-400 text-sm mb-14 leading-relaxed font-medium">Pro-tier capabilities like 2K, 4K and 8K generation require a specialized project key. Securely connect your credentials to initiate high-fidelity output.</p>
                
                <div className="w-full flex flex-col gap-4">
                    <button onClick={async () => { await getAIStudio().openSelectKey(); setShowKeySelectionModal(false); }} className="w-full py-6 rounded-[2.5rem] bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 active:scale-95">
                      Connect Key Terminal <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowKeySelectionModal(false)} className="w-full py-6 rounded-[2.5rem] border border-white/10 text-[12px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all text-slate-500 active:scale-95">Defer Selection</button>
                </div>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mesh-gradient {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        .animate-mesh-gradient {
          animation: mesh-gradient 20s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
