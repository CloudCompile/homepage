import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Mic, Settings, X, MapPin, 
  Thermometer, User, Clock, Github, 
  Chrome, Mail, MessageSquare, MonitorPlay,
  Youtube, Music, StickyNote, Image as ImageIcon,
  Quote, Edit3, Zap, Globe, MessageCircle
} from 'lucide-react';

/* Glassmorphic Dashboard v3.0 - AI Integration
  Features:
  - Real-time Analog & Digital Clock
  - Weather Widget (OpenWeatherMap API + Fallback/Mock)
  - Google Search with Voice Support
  - Persisted Settings (LocalStorage)
  - Quick Notes (Auto-saved)
  - Wallpaper Switcher (Presets + AI Generation)
  - Smart Greetings
  - Daily Quote
  - AI Chat Widget (Pollinations/OpenAI)
  - Experimental AI Web Search Widget (Pollinations/Gemini-Search)
  - Custom Profile Picture URL
*/

const WALLPAPERS = [
  { name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Midnight City', url: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Forest Mist', url: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000&auto=format&fit=crop' },
  { name: 'Ocean Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop' },
];

const DEFAULT_SETTINGS = {
  userName: 'Guest',
  userEmail: 'guest@example.com',
  apiKey: '', // OpenWeatherMap API Key
  pollinationsApiKey: '', // Pollinations AI Key
  profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`,
  location: 'Rochester, MN',
  isAutoLocation: false,
  is24Hour: false,
  unit: 'F',
  wallpaper: WALLPAPERS[0].url,
  aiSearchModel: 'gemini-search',
};

const APPS = [
  { name: 'Chrome', url: 'https://www.google.com', icon: <Chrome size={32} />, color: 'bg-blue-500' },
  { name: 'GitHub', url: 'https://github.com', icon: <Github size={32} />, color: 'bg-gray-800' },
  { name: 'ChatGPT', url: 'https://chatgpt.com', icon: <MessageSquare size={32} />, color: 'bg-teal-600' },
  { name: 'YouTube', url: 'https://youtube.com', icon: <Youtube size={32} />, color: 'bg-red-600' },
  { name: 'Spotify', url: 'https://open.spotify.com', icon: <Music size={32} />, color: 'bg-green-500' },
  { name: 'Pollinations', url: 'https://chat.pollinations.ai', icon: <MonitorPlay size={32} />, color: 'bg-purple-600' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: <Mail size={32} />, color: 'bg-red-500' },
];

const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Your time is limited, don't waste it living someone else's life.",
  "Creativity is intelligence having fun.",
  "Simplicity is the ultimate sophistication."
];

export default function App() {
  // State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dashboardSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [notes, setNotes] = useState(() => localStorage.getItem('dashboardNotes') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);

  // AI States
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiChatResponse, setAiChatResponse] = useState('');
  const [isAIChatting, setIsAIChatting] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResponse, setAiSearchResponse] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [wallpaperPrompt, setWallpaperPrompt] = useState('');
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null); // For non-critical errors/messages

  // Effects
  useEffect(() => {
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('dashboardNotes', notes);
  }, [notes]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Random quote on load
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [settings.location, settings.apiKey, settings.unit, settings.isAutoLocation]);


  // --- AI Logic ---

  // Unified Pollinations Chat API Caller (used for general chat and web search)
  const callPollinationsChatAPI = async (prompt, model, isSearch = false) => {
    if (!settings.pollinationsApiKey) return isSearch 
        ? setAiSearchResponse("Error: Pollinations API Key not set in settings.") 
        : setAiChatResponse("Error: Pollinations API Key not set in settings.");
    
    isSearch ? setIsAISearching(true) : setIsAIChatting(true);
    
    const apiUrl = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
    const maxRetries = 3;
    
    const payload = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
    };
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.pollinationsApiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error("Authentication failed. Check your API key.");
                if (res.status === 429 && attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; 
                }
                throw new Error(`API call failed with status: ${res.status}`);
            }

            const data = await res.json();
            const responseText = data.choices?.[0]?.message?.content || "No response received from AI.";
            
            isSearch ? setAiSearchResponse(responseText) : setAiChatResponse(responseText);
            return responseText;

        } catch (error) {
            const errMsg = `AI Error: ${error.message}`;
            isSearch ? setAiSearchResponse(errMsg) : setAiChatResponse(errMsg);
            return errMsg;
        } finally {
             // Set loading false on success or after last attempt
             if (attempt === maxRetries - 1 || (!isAIChatting && !isAISearching)) { 
                 isSearch ? setIsAISearching(false) : setIsAIChatting(false);
             }
        }
    }
};

const handleAIChatSubmit = (e) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;
    setAiChatResponse('Thinking...');
    callPollinationsChatAPI(aiChatQuery, 'openai', false);
    setAiChatQuery('');
};

const handleAISearchSubmit = (e) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiSearchResponse('Searching the web...');
    callPollinationsChatAPI(aiSearchQuery, settings.aiSearchModel, true);
    setAiSearchQuery('');
};

const handleGenerateWallpaper = async () => {
    if (!wallpaperPrompt.trim()) {
      setSettingsMessage('Please enter a description for the wallpaper.');
      return;
    }
    if (!settings.pollinationsApiKey) {
      setSettingsMessage('Pollinations API Key is required to generate images.');
      return;
    }
    
    setIsGeneratingWallpaper(true);
    setSettingsMessage('Generating image... this may take up to a minute.');
    
    const model = 'nanobanana-pro';
    const suffix = ", 16:9 background, wallpaper, 4k";
    const finalPrompt = `${wallpaperPrompt}${suffix}`;
    const apiUrl = `https://enter.pollinations.ai/api/generate/image`;

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.pollinationsApiKey}`
            },
            body: JSON.stringify({
                prompt: finalPrompt,
                model: model,
                width: 1920, 
                height: 1080,
            })
        });

        if (!res.ok) throw new Error(`Status: ${res.status}`);
        
        const data = await res.json();
        const imageUrl = data.url; 

        if (imageUrl) {
            setSettings(prev => ({ ...prev, wallpaper: imageUrl }));
            setSettingsMessage('Wallpaper successfully generated and applied!');
            setWallpaperPrompt('');
        } else {
             throw new Error('No image URL returned.');
        }

    } catch (error) {
        setSettingsMessage(`Image generation error. Check prompt and key. (${error.message})`);
        setSettings(prev => ({ ...prev, wallpaper: WALLPAPERS[0].url })); 
    } finally {
        setIsGeneratingWallpaper(false);
    }
};

  // --- Weather Logic ---
  const fetchWeather = async () => {
    setLoadingWeather(true);
    if (!settings.apiKey) {
      // Mock Data
      setTimeout(() => {
        setWeather({
          temp: settings.unit === 'F' ? 72 : 22,
          condition: 'Clear Sky',
          location: 'Rochester, MN (Mock)',
          icon: '01d',
          humidity: 45,
          wind: 12
        });
        setLoadingWeather(false);
      }, 800);
      return;
    }

    try {
      let query = `q=${settings.location}`;
      if (settings.isAutoLocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        query = `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
      }
      const units = settings.unit === 'F' ? 'imperial' : 'metric';
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${settings.apiKey}&units=${units}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      setWeather({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].description,
        location: data.name,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        wind: data.wind.speed
      });
    } catch (err) {
      setWeather({
        temp: '--',
        condition: 'API Error',
        location: 'Check Key',
        icon: 'unknown',
        humidity: 0,
        wind: 0
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  // --- Search Logic ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return console.error("Voice search not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(true);
    recognition.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setSearchQuery(txt);
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(txt)}`;
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- Greeting Logic ---
  const getGreeting = () => {
    const hrs = currentTime.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const profileImage = settings.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.userName}`;

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center font-sans text-white transition-all duration-700 ease-in-out"
         style={{ backgroundImage: `url('${settings.wallpaper}')` }}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"></div>
      
      {/* Main Container */}
      <div className="relative z-10 w-full h-screen flex flex-col p-4 md:p-8">
        
        {/* Top Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          
          {/* Left Column: Icons & Notes */}
          <div className="flex flex-col items-start space-y-6">
             <div className="flex space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 cursor-pointer transition-all shadow-lg border border-white/10 group">
                  <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 cursor-pointer transition-all shadow-lg border border-white/10"
                     onClick={() => setShowSettings(true)}>
                   <Settings className="w-5 h-5 text-white/90" />
                </div>
             </div>

             {/* Quick Notes Widget */}
             <div className="w-64 hidden md:flex flex-col bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-white/70">
                   <StickyNote className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase tracking-wider">Quick Notes</span>
                </div>
                <textarea 
                  className="bg-transparent border-none outline-none text-sm text-white/90 placeholder-white/30 resize-none h-32 scrollbar-hide"
                  placeholder="Type your thoughts here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  spellCheck="false"
                />
             </div>
          </div>

          {/* Center Column: Greeting, Search & AI Widgets */}
          <div className="flex flex-col items-center justify-center pt-10 md:pt-32">
             <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2 drop-shadow-lg text-center">
               {getGreeting()}, <span className="font-semibold text-white/90">{settings.userName}</span>
             </h1>
             <p className="text-white/60 mb-8 font-light text-lg">What would you like to explore?</p>

             {/* Google Search Bar */}
             <form onSubmit={handleSearch} className="w-full max-w-xl relative group mb-4">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Search className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Google"
                  className="w-full py-4 pl-12 pr-14 rounded-full bg-white/80 backdrop-blur-xl border border-white/40 text-gray-800 placeholder-gray-500 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 focus:bg-white transition-all text-lg"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                   <button 
                    type="button" 
                    onClick={startVoiceSearch}
                    className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-blue-500'}`}
                   >
                      <Mic className="w-5 h-5" />
                   </button>
                </div>
             </form>

             {/* AI Web Search Bar (Experimental) */}
             <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl transition-colors mb-4">
                <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-300" /> 
                  Experimental AI Web Search ({settings.aiSearchModel})
                </h4>
                <form onSubmit={handleAISearchSubmit} className="relative group mb-3">
                    <input 
                      type="text" 
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      placeholder="Ask the AI a live question..."
                      className="w-full py-2 px-3 rounded-lg bg-white/30 backdrop-blur-xl border border-white/40 text-white placeholder-white/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white/40 transition-all text-sm pr-10"
                    />
                    <button 
                        type="submit" 
                        disabled={isAISearching}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full ${isAISearching ? 'bg-blue-400 animate-spin' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
                    >
                        <Zap className="w-4 h-4 text-white" />
                    </button>
                </form>
                {aiSearchResponse && (
                    <p className={`text-xs p-2 rounded-lg ${isAISearching ? 'text-white/70' : 'bg-white/20 text-white/90'} whitespace-pre-wrap max-h-24 overflow-y-auto`}>
                        {isAISearching ? "Waiting for response..." : aiSearchResponse}
                    </p>
                )}
             </div>

             {/* AI Chat Bar */}
             <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl transition-colors">
                <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-teal-300" /> 
                  AI Chat (OpenAI)
                </h4>
                <form onSubmit={handleAIChatSubmit} className="relative group mb-3">
                    <input 
                      type="text" 
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      placeholder="Ask a general question..."
                      className="w-full py-2 px-3 rounded-lg bg-white/30 backdrop-blur-xl border border-white/40 text-white placeholder-white/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white/40 transition-all text-sm pr-10"
                    />
                    <button 
                        type="submit" 
                        disabled={isAIChatting}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full ${isAIChatting ? 'bg-teal-400 animate-spin' : 'bg-teal-500 hover:bg-teal-600'} transition-colors`}
                    >
                        <MessageCircle className="w-4 h-4 text-white" />
                    </button>
                </form>
                {aiChatResponse && (
                    <p className={`text-xs p-2 rounded-lg ${isAIChatting ? 'text-white/70' : 'bg-white/20 text-white/90'} whitespace-pre-wrap max-h-24 overflow-y-auto`}>
                        {isAIChatting ? "Waiting for response..." : aiChatResponse}
                    </p>
                )}
             </div>

          </div>

          {/* Right Column: Profile, Clock, Weather */}
          <div className="flex flex-col items-end space-y-4">
             {/* Profile Avatar */}
             <div className="relative group cursor-pointer" onClick={() => setShowSettings(true)}>
                <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden shadow-xl hover:scale-105 transition-transform">
                  <img src={profileImage} alt="User" className="w-full h-full object-cover bg-white/10" onError={(e) => e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${settings.userName}`} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-transparent shadow-sm"></div>
             </div>

             {/* Analog Clock Widget */}
             <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative flex items-center justify-center group hover:border-white/20 transition-all">
                <AnalogClock time={currentTime} />
                <div className="absolute bottom-8 flex flex-col items-center pointer-events-none">
                   <span className="text-2xl font-light tracking-wider drop-shadow-md">
                     {formatTime(currentTime, settings.is24Hour)}
                   </span>
                   <span className="text-xs text-white/60 uppercase tracking-widest mt-1">
                     {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                   </span>
                </div>
             </div>

             {/* Weather Widget */}
             <div className="w-48 p-4 rounded-3xl bg-white/20 backdrop-blur-lg border border-white/10 shadow-xl flex flex-col text-white relative overflow-hidden transition-all hover:bg-white/25 group">
                {/* Shine effect */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 blur-2xl rounded-full pointer-events-none group-hover:bg-white/20 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <h3 className="text-sm font-medium opacity-90 truncate max-w-[100px]" title={weather?.location}>{weather?.location || 'Loading...'}</h3>
                     <h1 className="text-4xl font-light mt-1">{weather?.temp ?? '--'}°</h1>
                   </div>
                   <div className="flex flex-col items-end">
                      {weather?.icon && (
                         <img 
                           src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                           alt="weather" 
                           className="w-12 h-12 drop-shadow-md transform group-hover:scale-110 transition-transform"
                         />
                      )}
                   </div>
                </div>
                <div className="flex justify-between items-end text-xs opacity-70">
                   <span>{weather?.condition || '...'}</span>
                   <span>H: {weather?.humidity}%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Area: Quote & Dock */}
        <div className="mt-auto flex flex-col items-center w-full">
           
           {/* Daily Quote */}
           <div className="mb-6 flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors cursor-default">
              <Quote className="w-4 h-4 rotate-180" />
              <p className="text-sm font-light italic text-center max-w-lg">"{quote}"</p>
              <Quote className="w-4 h-4" />
           </div>

           {/* Dock */}
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-3xl flex items-center space-x-2 md:space-x-4 shadow-2xl mb-4 md:mb-8 hover:bg-white/15 transition-colors">
              {APPS.map((app, idx) => (
                 <a 
                   key={idx} 
                   href={app.url} 
                   target="_blank" 
                   rel="noreferrer"
                   className="group relative flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:-translate-y-2"
                 >
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${app.color} bg-gradient-to-br from-white/20 to-transparent overflow-hidden ring-1 ring-white/10`}>
                       {app.icon}
                    </div>
                    {/* Tooltip */}
                    <span className="absolute -top-12 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap backdrop-blur-sm pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                      {app.name}
                    </span>
                    {/* Active Indicator */}
                    <div className="absolute -bottom-1 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                 </a>
              ))}
           </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-2xl border border-white/50 text-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white/50">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <Settings className="w-5 h-5" /> Settings
                 </h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                 
                 {settingsMessage && (
                    <div className="p-3 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-medium">
                        {settingsMessage}
                    </div>
                 )}

                 {/* Profile Section */}
                 <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3 h-3" /> Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 ml-1">Display Name</label>
                          <input 
                            className="w-full p-3 rounded-xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all"
                            placeholder="Your Name"
                            value={settings.userName}
                            onChange={(e) => setSettings({...settings, userName: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 ml-1">Profile Picture URL</label>
                          <input 
                            className="w-full p-3 rounded-xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all"
                            placeholder="Image URL (or leave blank for Avatar)"
                            value={settings.profilePictureUrl}
                            onChange={(e) => setSettings({...settings, profilePictureUrl: e.target.value})}
                          />
                       </div>
                    </div>
                 </section>

                 {/* API Keys Section */}
                 <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-3 h-3" /> API Keys (Required for Live Data/AI)
                    </h3>
                    
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <label className="text-xs font-medium text-blue-800">OpenWeatherMap Key (for Weather)</label>
                        <input 
                          type="password"
                          className="w-full bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none pb-2 text-sm font-mono text-blue-900 placeholder-blue-300 transition-colors"
                          placeholder="Paste OpenWeatherMap API Key here..."
                          value={settings.apiKey}
                          onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                        <label className="text-xs font-medium text-teal-800">Pollinations API Key (for AI)</label>
                        <input 
                          type="password"
                          className="w-full bg-transparent border-b border-teal-200 focus:border-teal-500 outline-none pb-2 text-sm font-mono text-teal-900 placeholder-teal-300 transition-colors"
                          placeholder="Paste Pollinations API Key here..."
                          value={settings.pollinationsApiKey}
                          onChange={(e) => setSettings({...settings, pollinationsApiKey: e.target.value})}
                        />
                    </div>
                 </section>

                 {/* Weather Configuration Section */}
                 <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Thermometer className="w-3 h-3" /> Weather Configuration
                    </h3>
                    <div className="flex items-center gap-4">
                       <div className="flex bg-gray-100 p-1 rounded-lg">
                          {['C', 'F'].map((u) => (
                             <button 
                               key={u}
                               onClick={() => setSettings({...settings, unit: u})}
                               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.unit === u ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                °{u}
                             </button>
                          ))}
                       </div>
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                             type="checkbox" 
                             checked={settings.isAutoLocation}
                             onChange={(e) => setSettings({...settings, isAutoLocation: e.target.checked})}
                             className="w-4 h-4 rounded text-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-600">Auto-Detect Location</span>
                       </label>
                    </div>

                    {!settings.isAutoLocation && (
                       <input 
                         className="w-full p-3 rounded-xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all"
                         placeholder="City Name (e.g. Tokyo)"
                         value={settings.location}
                         onChange={(e) => setSettings({...settings, location: e.target.value})}
                       />
                    )}
                 </section>

                 {/* Wallpaper Section */}
                 <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Wallpaper Presets
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {WALLPAPERS.map((wp, i) => (
                          <div 
                             key={i}
                             onClick={() => {
                               setSettings({...settings, wallpaper: wp.url});
                               setSettingsMessage('Preset wallpaper applied.');
                             }}
                             className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${settings.wallpaper === wp.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}`}
                          >
                             <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                          </div>
                       ))}
                    </div>

                    {/* AI Wallpaper Generator */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                       <h4 className="text-sm font-bold text-gray-600 flex items-center gap-1">Generate Wallpaper (nanobanana-pro)</h4>
                       <input 
                         className="w-full p-3 rounded-xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                         placeholder="e.g., A minimalist synthwave landscape, digital art"
                         value={wallpaperPrompt}
                         onChange={(e) => setWallpaperPrompt(e.target.value)}
                         disabled={isGeneratingWallpaper}
                       />
                       <button 
                         onClick={handleGenerateWallpaper} 
                         disabled={isGeneratingWallpaper || !settings.pollinationsApiKey}
                         className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                       >
                         {isGeneratingWallpaper ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Generating...
                            </>
                         ) : (
                            <>
                              <ImageIcon className="w-4 h-4" /> Generate 16:9 Image
                            </>
                         )}
                       </button>
                    </div>
                 </section>

                 {/* System Section */}
                 <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3 h-3" /> System Preferences
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                       <span className="text-sm font-medium text-gray-700">24-Hour Clock Format</span>
                       <button 
                         onClick={() => setSettings({...settings, is24Hour: !settings.is24Hour})}
                         className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.is24Hour ? 'bg-blue-500' : 'bg-gray-300'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.is24Hour ? 'translate-x-5' : 'translate-x-0'}`}></div>
                       </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                       <span className="text-sm font-medium text-gray-700">AI Search Model</span>
                       <select 
                          value={settings.aiSearchModel}
                          onChange={(e) => setSettings({...settings, aiSearchModel: e.target.value})}
                          className="p-1.5 rounded-lg bg-white border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                       >
                          <option value="gemini-search">Gemini-Search</option>
                          <option value="perplexity-fast">Perplexity-Fast</option>
                       </select>
                    </div>
                 </section>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button onClick={() => setShowSettings(false)} className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all shadow-lg active:scale-95">
                    Close Settings
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper: Analog Clock
function AnalogClock({ time }) {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secDeg = (seconds / 60) * 360;
  const minDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = ((hours % 12 + minutes / 60) / 12) * 360;

  return (
    <div className="absolute inset-0 rounded-full border-4 border-white/5 overflow-hidden">
      {/* Markers */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="absolute w-1 h-3 bg-white/40 left-1/2 top-2 origin-bottom transform -translate-x-1/2"
          style={{ transform: `translateX(-50%) rotate(${i * 30}deg) translateY(2px)`, transformOrigin: '50% 88px' }}
        />
      ))}

      {/* Hands */}
      <div 
        className="absolute bottom-1/2 left-1/2 w-1.5 h-12 bg-white rounded-full origin-bottom -translate-x-1/2 shadow-lg"
        style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
      />
      <div 
        className="absolute bottom-1/2 left-1/2 w-1 h-16 bg-blue-300/80 rounded-full origin-bottom -translate-x-1/2 shadow-lg"
        style={{ transform: `translateX(-50%) rotate(${minDeg}deg)` }}
      />
      <div 
        className="absolute bottom-1/2 left-1/2 w-0.5 h-20 bg-red-400 rounded-full origin-bottom -translate-x-1/2 shadow-md transition-transform duration-[50ms]"
        style={{ transform: `translateX(-50%) rotate(${secDeg}deg)` }}
      />
      <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-md border-2 border-gray-800 z-10"></div>
    </div>
  );
}

// Helper: Format Time
function formatTime(date, is24) {
   let hours = date.getHours();
   const minutes = date.getMinutes().toString().padStart(2, '0');
   if (!is24) {
      // ampm is technically unused in the return string, but the conversion is correct.
      hours = hours % 12;
      hours = hours ? hours : 12; 
      return `${hours}:${minutes}`;
   }
   return `${hours.toString().padStart(2, '0')}:${minutes}`;
}
