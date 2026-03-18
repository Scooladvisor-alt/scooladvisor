import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, Star, MessageCircle, HandHeart, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/shared/SEO";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <>
      <SEO
        title="À propos de ScoolAdvisor - Notre Mission"
        description="ScoolAdvisor est le réseau social des étudiants. Remerciez vos professeurs, partagez ce que vous ressentez vraiment. Une communauté fondée sur l'amour et la bienveillance."
        canonicalPath="/About"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ScoolAdvisor",
          "description": "Le réseau social des étudiants - Avis authentiques sur écoles et professeurs",
          "url": window.location.origin
        }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

        {/* Hero */}
        <div className="relative overflow-hidden py-16 sm:py-28 px-4">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[15%] w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-pink-100 dark:border-slate-700 shadow-sm mb-8">
              <Heart className="w-4 h-4 text-[#FF4D8D] fill-[#FF4D8D]" />
              <span className="text-sm font-semibold bg-gradient-to-r from-[#FF4D8D] to-purple-600 bg-clip-text text-transparent">
                L'amour au cœur de l'éducation
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              <span className="block text-5xl sm:text-7xl italic uppercase tracking-tighter mb-3 transform -rotate-1 drop-shadow-sm">
                SCOOL QUOI ?
              </span>
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent text-3xl sm:text-5xl">
                ScoolAdvisor.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
              Un endroit pour dire merci. Pour exprimer ce qu'on ressent vraiment. Pour honorer ceux qui ont compté.
            </motion.p>
          </div>
        </div>

        {/* Message principal */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/10 dark:from-[#FF4D8D]/5 dark:via-purple-500/5 dark:to-blue-500/5 rounded-3xl p-8 sm:p-14 border border-pink-100 dark:border-slate-700 shadow-xl text-center mb-12">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-[#FF4D8D] to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white mb-6 leading-tight">
              ScoolAdvisor, c'est d'abord<br />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">un acte d'amour.</span>
            </h2>
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              On a tous eu ce prof qui a tout changé. Celui qui t'a donné confiance, qui t'a poussé à te dépasser, qui t'a simplement écouté. ScoolAdvisor, c'est l'endroit où tu peux enfin lui dire <strong className="text-slate-800 dark:text-white">merci</strong>.
            </p>
          </motion.div>

          {/* 3 valeurs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">

            <motion.div variants={itemVariants} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/60 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FF4D8D] to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl uppercase italic mb-2">Dire Merci</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Remercie tes professeurs qui ont marqué ta vie. Un mot peut tout changer pour eux aussi.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/60 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl uppercase italic mb-2">S'exprimer Vrai</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Partage ce que tu ressens vraiment, avec sincérité et respect. Ton vécu compte et il aide les autres.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/60 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl uppercase italic mb-2">Construire Ensemble</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Une communauté bienveillante où chaque avis aide un autre élève à mieux choisir son avenir.
              </p>
            </motion.div>
          </motion.div>

          {/* Bloc "pas de haine" */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/80 dark:bg-slate-800/80 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-700 shadow-xl mb-12">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="shrink-0 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg text-4xl">
                🚫
              </div>
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white mb-3 uppercase italic text-center sm:text-left">
                  Ici, la haine n'a pas sa place.
                </h3>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-center sm:text-left">
                  ScoolAdvisor, c'est <strong className="text-slate-800 dark:text-white">la critique constructive, le retour sincère, le mot bienveillant</strong>. Pas un défouloir. On construit, on n'écrase pas. Chaque commentaire passe par notre modération pour que cet espace reste sain, juste et utile pour tous.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Citation inspirante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14">
            <div className="relative inline-block">
              <span className="text-6xl sm:text-8xl text-pink-200 dark:text-pink-900 font-black absolute -top-4 -left-4 select-none">"</span>
              <p className="text-xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed px-8 sm:px-16 relative z-10">
                Un prof peut changer une vie. Dis-le-lui.
              </p>
              <span className="text-6xl sm:text-8xl text-pink-200 dark:text-pink-900 font-black absolute -bottom-8 -right-4 select-none">"</span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center">
            <Link to={createPageUrl("Schools")}>
              <Button className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all rounded-2xl px-8 py-4 sm:px-12 sm:py-5 text-base sm:text-lg font-bold">
                <Heart className="w-5 h-5 mr-2 fill-white" />
                Trouver mon école
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}