import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const STUDY_LEVELS = [
  {
    id: "college",
    label: "Collège",
    emoji: "🏫",
    description: "6e → 3e",
    avatar: "avatar6",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1b286b7dd_a-human-schoolboy-inspired-by-a-famous-comic-stude.png",
    gradient: "from-orange-400 to-red-400",
  },
  {
    id: "lycee",
    label: "Lycée",
    emoji: "📚",
    description: "2nde → Terminale",
    avatar: "avatar7",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/fd729e269_an-anonymous-student-with-a-james-bond-inspired-au.png",
    gradient: "from-yellow-400 to-orange-400",
  },
  {
    id: "universite",
    label: "Université",
    emoji: "🎓",
    description: "Licence / Master / Doctorat",
    avatar: "avatar8",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/538606372_image.png",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "ecole_commerce",
    label: "École de commerce",
    emoji: "💼",
    description: "Business / Management",
    avatar: "avatar9",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c3f498768_a-premium-abstract-student-goat-avatar-symbolizing.png",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "ecole_ingenieur",
    label: "École d'ingénieur",
    emoji: "⚙️",
    description: "Ingénierie / Tech",
    avatar: "avatar10",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a9d36d153_image-2.png",
    gradient: "from-slate-500 to-slate-700",
  },
  {
    id: "ecole_privee",
    label: "École privée",
    emoji: "🌟",
    description: "École privée / Autre",
    avatar: "avatar3",
    avatarUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    gradient: "from-purple-400 to-pink-500",
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
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-3xl">👋</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Bienvenue sur Scooladvisor !
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Choisis ton niveau d'études pour personnaliser ton avatar
          </p>
        </div>

        {/* Grid 2 colonnes × 3 lignes */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-3">
          {STUDY_LEVELS.map((level) => {
            const isSelected = selected === level.id;
            return (
              <button
                key={level.id}
                onClick={() => setSelected(level.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center ${
                  isSelected
                    ? "border-[#FF4D8D] bg-pink-50 dark:bg-pink-950/20 shadow-lg scale-[1.02]"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md"
                }`}
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${level.gradient} p-0.5`}>
                  <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                    <img
                      src={level.avatarUrl}
                      alt={level.label}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Label */}
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                    {level.emoji} {level.label}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                    {level.description}
                  </div>
                </div>

                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-r from-[#FF4D8D] to-purple-500 flex items-center justify-center shadow">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1">
          <AnimatePresence>
            {selectedLevel && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/10 rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <img src={selectedLevel.avatarUrl} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Ton avatar sera{" "}
                  <strong className="text-purple-600 dark:text-purple-400">{selectedLevel.label}</strong>{" "}
                  🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:opacity-90 text-white font-semibold h-11 rounded-xl disabled:opacity-40"
          >
            {loading ? "Enregistrement..." : selected ? "C'est parti ! 🚀" : "Choisis ton niveau"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}