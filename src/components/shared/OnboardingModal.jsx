import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const STUDY_LEVELS = [
  {
    id: "college",
    label: "Collège",
    emoji: "🏫",
    description: "Je suis au collège (6e → 3e)",
    avatar: "avatar6",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1b286b7dd_a-human-schoolboy-inspired-by-a-famous-comic-stude.png",
    gradient: "from-orange-400 to-red-400",
  },
  {
    id: "lycee",
    label: "Lycée",
    emoji: "📚",
    description: "Je suis au lycée (2nde → Terminale)",
    avatar: "avatar3",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    gradient: "from-yellow-400 to-orange-400",
  },
  {
    id: "universite",
    label: "Université",
    emoji: "🎓",
    description: "Je suis à l'université (Licence / Master / Doctorat)",
    avatar: "avatar1",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "ecole_commerce",
    label: "École de commerce",
    emoji: "💼",
    description: "Je suis en école de commerce / management",
    avatar: "avatar9",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c3f498768_a-premium-abstract-student-goat-avatar-symbolizing.png",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "ecole_ingenieur",
    label: "École d'ingénieur",
    emoji: "⚙️",
    description: "Je suis en école d'ingénieur",
    avatar: "avatar8",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/538606372_image.png",
    gradient: "from-slate-500 to-slate-700",
  },
  {
    id: "ecole_privee",
    label: "École privée",
    emoji: "🌟",
    description: "Je suis dans une école privée",
    avatar: "avatar2",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    id: "autre",
    label: "Autre",
    emoji: "✨",
    description: "Autre formation / situation",
    avatar: "avatar4",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png",
    gradient: "from-green-400 to-cyan-500",
  },
];

export default function OnboardingModal({ open, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    const level = STUDY_LEVELS.find((l) => l.id === selected);
    await base44.auth.updateMe({
      profile_avatar: level.avatar,
      study_level: level.id,
      onboarding_done: true,
    });
    onComplete();
  };

  const selectedLevel = STUDY_LEVELS.find((l) => l.id === selected);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Bienvenue sur Scooladvisor !
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tu es plutôt quel type d'étudiant ?
          </p>
        </div>

        {/* Choices */}
        <div className="p-4 space-y-2">
          {STUDY_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                selected === level.id
                  ? "border-[#FF4D8D] bg-pink-50 dark:bg-pink-950/20 shadow-md"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600"
              }`}
            >
              {/* Avatar preview */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${level.gradient} p-0.5 flex-shrink-0`}>
                <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                  <img src={level.avatarUrl} alt={level.label} className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {level.emoji} {level.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {level.description}
                </div>
              </div>
              {selected === level.id && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FF4D8D] to-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <AnimatePresence>
            {selectedLevel && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/10 rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <img src={selectedLevel.avatarUrl} alt="" className="w-10 h-10 object-contain" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Ton avatar sera <strong className="text-purple-600 dark:text-purple-400">{selectedLevel.label}</strong> 🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:opacity-90 text-white font-semibold h-11 rounded-xl"
          >
            {loading ? "Enregistrement..." : "C'est parti ! 🚀"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}