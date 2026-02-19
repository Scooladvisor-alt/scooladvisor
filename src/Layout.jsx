import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  School,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Mic, // Added Mic icon
  HelpCircle // Added HelpCircle icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from
"@/components/ui/dropdown-menu";
import Footer from "./components/shared/Footer";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import SecurityGuard from "@/components/shared/SecurityGuard";
import FloatingDecoration from "@/components/shared/FloatingDecoration";
import { prefetchPage } from "@/components/shared/LinkPrefetch";
import BottomTabBar from "@/components/mobile/BottomTabBar";


const BanDialog = ({ open, user }) => {
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [appealSent, setAppealSent] = useState(false);
  const [showMainDialog, setShowMainDialog] = useState(true);

  useEffect(() => {
    if (open) {
      setShowMainDialog(true);
      setShowAppeal(false);
      setAppealSent(false);
    }
  }, [open]);

  if (!open || !user) return null;

  const handleAppealClick = () => {
    setShowMainDialog(false);
    setShowAppeal(true);
  };

  const handleAppealSubmit = async () => {
    if (appealMessage.trim().length < 20) {
      toast.error("Veuillez détailler votre contestation (20 caractères min).");
      return;
    }
    setLoading(true);
    try {
      await base44.entities.BanAppeal.create({
        user_email: user.email,
        user_id: user.id,
        appeal_message: appealMessage
      });
      setAppealSent(true);
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'envoi de votre contestation.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => base44.auth.logout().then(() => window.location.reload());

  return (
    <>
      {showMainDialog &&
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Compte banni</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Votre compte a été suspendu pour non-respect de nos conditions d'utilisation.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={handleAppealClick} variant="outline">
                Contester cette décision
              </Button>
              <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      }

      <Dialog open={showAppeal} onOpenChange={(isOpen) => {
        setShowAppeal(isOpen);
        if (!isOpen) setShowMainDialog(true);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Contester le bannissement</DialogTitle>
          </DialogHeader>
          {appealSent ?
          <div className="py-6 text-center">
              <p className="text-green-700 dark:text-green-400 font-medium">Votre contestation a été envoyée. Elle sera examinée par un modérateur.</p>
              <Button onClick={handleLogout} className="mt-4">OK</Button>
            </div> :

          <>
              <div className="py-4">
                <Textarea
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                placeholder="Expliquez pourquoi vous pensez que cette décision est une erreur..."
                rows={5} />

              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => {setShowAppeal(false);setShowMainDialog(true);}}>Annuler</Button>
                <Button onClick={handleAppealSubmit} disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer la contestation"}
                </Button>
              </DialogFooter>
            </>
          }
        </DialogContent>
      </Dialog>
    </>);

};

const navigationItems = [
{
  title: "Accueil",
  url: createPageUrl("Schools"),
  icon: School
},
{
  title: "Scool quoi ?",
  url: createPageUrl("About"),
  icon: HelpCircle
}];


const getAvatarUrl = (avatar) => {
  const avatarUrls = {
    avatar1: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png",
    avatar2: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png",
    avatar3: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    avatar4: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png",
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png",
    avatar6: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1b286b7dd_a-human-schoolboy-inspired-by-a-famous-comic-stude.png",
    avatar7: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/fd729e269_an-anonymous-student-with-a-james-bond-inspired-au.png",
    avatar8: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/538606372_image.png",
    avatar9: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c3f498768_a-premium-abstract-student-goat-avatar-symbolizing.png",
    avatar10: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a9d36d153_image-2.png"
  };
  // Default to avatar3 (yellow) if avatar is 'letter' or undefined
  if (!avatar || avatar === 'letter') {
    return avatarUrls.avatar3;
  }
  return avatarUrls[avatar] || avatarUrls.avatar3;
};

function AvatarSelectionDialog({ open, onOpenChange, currentAvatar, onAvatarSelected, userInitial }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar && currentAvatar !== 'letter' ? currentAvatar : 'avatar3');

  const avatars = [
  { id: 'avatar1', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png", name: "Avatar Bleu" },
  { id: 'avatar2', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png", name: "Avatar Violet" },
  { id: 'avatar3', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png", name: "Avatar Jaune" },
  { id: 'avatar4', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png", name: "Avatar Vert" },
  { id: 'avatar5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png", name: "Avatar Cyan" },
  { id: 'avatar6', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1b286b7dd_a-human-schoolboy-inspired-by-a-famous-comic-stude.png", name: "Avatar Comic" },
  { id: 'avatar7', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/fd729e269_an-anonymous-student-with-a-james-bond-inspired-au.png", name: "Avatar Agent" },
  { id: 'avatar8', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/538606372_image.png", name: "Avatar Robot" },
  { id: 'avatar9', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c3f498768_a-premium-abstract-student-goat-avatar-symbolizing.png", name: "Avatar GOAT" },
  { id: 'avatar10', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a9d36d153_image-2.png", name: "Avatar Cool" }];


  const handleSave = () => {
    onAvatarSelected(selectedAvatar);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b rounded-t-3xl relative">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Choisir mon avatar
              </span>
            </DialogTitle>
          </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4">
          {avatars.map((avatar) =>
          <button
            key={avatar.id}
            onClick={() => setSelectedAvatar(avatar.id)}
            className={`relative p-2 sm:p-4 rounded-xl border-2 transition-all hover:scale-105 ${
            selectedAvatar === avatar.id ?
            'border-purple-600 bg-purple-50 dark:bg-purple-900 shadow-lg' :
            'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-400'}`
            }>

              {avatar.url ?
            <img
              src={avatar.url}
              alt={avatar.name}
              className="w-full h-20 sm:h-32 object-contain rounded-lg" /> :


            <div className="w-full h-20 sm:h-32 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-4xl sm:text-6xl font-bold text-white">{userInitial}</span>
                </div>
            }
              <p className="text-xs sm:text-sm font-medium text-center mt-1 sm:mt-2 text-slate-900 dark:text-slate-100">{avatar.name}</p>
              {selectedAvatar === avatar.id &&
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
            }
            </button>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm">
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs sm:text-sm">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);


  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Ne jamais bannir le compte admin
      if (currentUser && currentUser.is_banned && currentUser.email !== 'antownin@gmail.com') {
        setShowBanDialog(true);
      }
    } catch (error) {
      console.log("User not authenticated");
      setUser(null);
      if (location.pathname === createPageUrl("Schools")) {
        setShowLoginMessage(true);
        setTimeout(() => setShowLoginMessage(false), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.reload();
    }
  };

  const handleLogin = async () => {
    try {
      const currentUrl = window.location.href;
      await base44.auth.redirectToLogin(currentUrl);
    } catch (error) {
      console.error("Error during login redirect:", error);
    }
  };

  const showDecoration = location.pathname === createPageUrl("Schools") || location.pathname === "/" || location.pathname === createPageUrl("About");

  return (
    <div 
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 relative"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {showDecoration && <FloatingDecoration />}
      
      <style>{`
        @media (min-width: 640px) {
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #999;
          }
        }
        
        @media (max-width: 639px) {
          ::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }
        }

        /* Mobile WebView Optimizations */
        main {
          overscroll-behavior: none;
        }

        button, [role="button"], .lucide-react, svg {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        p, span, div, a, h1, h2, h3, h4, h5, h6, li, label {
          user-select: text;
          -webkit-user-select: text;
        }
        
        @keyframes subtle-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .animate-subtle-shine {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: subtle-shine 3s ease-in-out infinite;
        }

        /* PREVENTION DU ZOOM SUR MOBILE POUR LES INPUTS */
        @media screen and (max-width: 767px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
        
        /* iOS Safe Area & Smooth Scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        body {
          overscroll-behavior: contain;
          user-select: text;
          -webkit-user-select: text;
        }

        `}</style>
      
      <header 
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm"
        style={{
          paddingTop: 'max(0px, calc(env(safe-area-inset-top) - 16px))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Schools")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d395706ad_Gemini_Generated_Image_3m8bo23m8bo23m8b.png"
                alt="Scooladvisor"
                className="h-14 w-14 sm:h-16 sm:w-16" />

              <span className="text-base sm:text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">Scooladvisor</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-3 pr-0 min-w-[100px] sm:min-w-[140px] justify-end">
              {loading ?
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" /> :
              user ?
              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 hover:bg-transparent">
                        <Avatar className="w-10 h-10 border-2 border-blue-100 cursor-pointer hover:border-purple-300 transition-all">
                          {user.profile_avatar && user.profile_avatar !== 'letter' ?
                      <AvatarImage src={getAvatarUrl(user.profile_avatar)} /> :
                      null}
                          <AvatarFallback className="bg-transparent">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png" alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      
                      {navigationItems.map((item) => (
                        <DropdownMenuItem key={item.title} onClick={() => navigate(item.url)} className="cursor-pointer">
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.title}
                        </DropdownMenuItem>
                      ))}
                      
                      {(user.role === 'moderator' || user.role === 'admin') &&
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(createPageUrl("Moderation"))} className="cursor-pointer">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Modération
                          </DropdownMenuItem>
                        </>
                      }
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))} className="cursor-pointer">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Mon profil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> :

              <Button
                onClick={handleLogin} className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold">


                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Connexion</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
              }
            </div>
          </div>

          <AnimatePresence>
          {mobileMenuOpen &&
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }} className="bg-white/95 mt-2 mb-1 ml-1 pr-2 pb-2 rounded-xl md:hidden absolute top-16 right-4 w-56 backdrop-blur-md shadow-xl border border-slate-200 z-50">

              {navigationItems.map((item) =>
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                location.pathname === item.url ?
                'bg-gradient-to-r from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/10 text-slate-900 font-medium' :
                'text-slate-600 hover:bg-slate-50'}`
                }>
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
              )}

              {user && (user.role === 'moderator' || user.role === 'admin') &&
              <Link
                to={createPageUrl("Moderation")}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                location.pathname === createPageUrl("Moderation") ?
                'bg-amber-50 text-amber-700 font-medium' :
                'text-slate-600 hover:bg-slate-50'}`
                }>
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm">Modération</span>
                  </Link>
              }
              
              {user &&
              <Link
                to={createPageUrl("Profile")}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                location.pathname === createPageUrl("Profile") ?
                'bg-gradient-to-r from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/10 text-slate-900 font-medium' :
                'text-slate-600 hover:bg-slate-50'}`
                }>
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm">Mon profil</span>
                  </Link>
              }
            </motion.div>
            }
        </AnimatePresence>
        </div>
      </header>

      <AnimatePresence>
        {showLoginMessage && !user &&
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              type: "spring",
              damping: 12,
              stiffness: 100
            }
          }}
          exit={{
            y: -100,
            opacity: 0,
            transition: { duration: 0.5 }
          }}
          className="flex justify-center px-4 py-2">

            <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-md px-3 py-1.5 sm:px-6 sm:py-3 max-w-2xl">
              <div className="absolute inset-0 rounded-xl animate-subtle-shine" />
              
              <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <p className="text-white font-medium text-xs sm:text-base text-center sm:text-left">
                  Ta voix compte. Rejoins-nous. 😉
                </p>
                <Button
                onClick={handleLogin}
                size="sm"
                className="bg-white text-purple-700 hover:bg-gray-100 font-semibold shadow-md whitespace-nowrap text-xs h-7 sm:h-9 sm:text-sm">

                  Se connecter
                </Button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <main className="flex-1 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ErrorBoundary>
              <SecurityGuard>
                {children}
              </SecurityGuard>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      
      <BottomTabBar />

      {user && showBanDialog &&
      <BanDialog open={showBanDialog} user={user} />
      }
    </div>);

}