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
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Compte banni</h2>
            <p className="text-gray-700 mb-6">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contester le bannissement</DialogTitle>
          </DialogHeader>
          {appealSent ?
          <div className="py-6 text-center">
              <p className="text-green-700 font-medium">Votre contestation a été envoyée. Elle sera examinée par un modérateur.</p>
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
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png"
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
  { id: 'avatar5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png", name: "Avatar Cyan" }];


  const handleSave = () => {
    onAvatarSelected(selectedAvatar);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        {/* Changed DialogHeader as per outline */}
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b rounded-t-3xl relative">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Prends le micro des étudiants
              </span>
            </DialogTitle>
            <span className="text-xs text-slate-500 mt-2 block">
              Chat National
            </span>
          </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4">
          {avatars.map((avatar) =>
          <button
            key={avatar.id}
            onClick={() => setSelectedAvatar(avatar.id)}
            className={`relative p-2 sm:p-4 rounded-xl border-2 transition-all hover:scale-105 ${
            selectedAvatar === avatar.id ?
            'border-purple-600 bg-purple-50 shadow-lg' :
            'border-slate-200 bg-white hover:border-purple-300'}`
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
              <p className="text-xs sm:text-sm font-medium text-center mt-1 sm:mt-2 text-slate-900">{avatar.name}</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 relative">
      <FloatingDecoration />
      
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
      `}</style>
      
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Schools")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d395706ad_Gemini_Generated_Image_3m8bo23m8bo23m8b.png"
                alt="Scooladvisor"
                className="h-14 w-14 sm:h-16 sm:w-16" />

              <span className="text-base sm:text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">Scooladvisor</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                // Extraire le nom de la page pour le prefetch
                const pageName = item.url.split('/').pop()?.split('?')[0] || '';
                return (
                <Link
                  key={item.title}
                  to={item.url}
                  onMouseEnter={() => prefetchPage(pageName)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === item.url ?
                  'bg-blue-50 text-blue-700 font-medium' :
                  'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                  }>

                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                );
              })}

              {user && (user.role === 'moderator' || user.role === 'admin') &&
              <Link
                to={createPageUrl("Moderation")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === createPageUrl("Moderation") ?
                'bg-amber-50 text-amber-700 font-medium' :
                'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                }>

                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">Modération</span>
                </Link>
              }
            </nav>

            <div className="flex items-center gap-1 sm:gap-3 pr-0 min-w-[100px] sm:min-w-[140px] justify-end">
              {loading ? (
                <div className="w-[100px] sm:w-[140px] h-8 bg-slate-200 rounded-lg animate-pulse" />
              ) : user ? (
              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-50 px-2 sm:px-4">
                        <Avatar className="w-8 h-8 border-2 border-blue-100">
                          {user.profile_avatar && user.profile_avatar !== 'letter' ?
                      <AvatarImage src={getAvatarUrl(user.profile_avatar)} /> :
                      null}
                          <AvatarFallback className="bg-transparent">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png" alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-900 hidden sm:block">{user.full_name?.split(' ')[0]}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
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
                  </DropdownMenu>
              ) : (
              <Button
                onClick={handleLogin} className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold">


                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Connexion</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>

                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen &&
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
              {navigationItems.map((item) =>
            <Link
              key={item.title}
              to={item.url}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              location.pathname === item.url ?
              'bg-blue-50 text-blue-700 font-medium' :
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              location.pathname === createPageUrl("Profile") ?
              'bg-blue-50 text-blue-700 font-medium' :
              'text-slate-600 hover:bg-slate-50'}`
              }>

                  <UserIcon className="w-5 h-5" />
                  <span className="text-sm">Mon profil</span>
                </Link>
            }
            </div>
          }
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

      <main className="flex-1">
        <ErrorBoundary>
          <SecurityGuard>
            {children}
          </SecurityGuard>
        </ErrorBoundary>
      </main>

      <Footer />

      {user && showBanDialog &&
      <BanDialog open={showBanDialog} user={user} />
      }
    </div>);

}