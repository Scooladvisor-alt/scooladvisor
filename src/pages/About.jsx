import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, Shield, Users, GraduationCap, ArrowRight, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/shared/SEO";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <>
      <SEO 
        title="À propos de ScoolAdvisor - Notre Mission"
        description="ScoolAdvisor est le réseau social des étudiants. Partagez votre expérience, notez vos établissements et professeurs. Une communauté authentique et transparente."
        canonicalPath="/About"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ScoolAdvisor",
          "description": "Le réseau social des étudiants - Avis authentiques sur écoles et professeurs",
          "url": window.location.origin
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">


      {/* Hero Section */}
      <div className="relative overflow-hidden py-12 sm:py-32 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-pink-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-[30%] right-[20%] w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-100 shadow-sm mb-8">

            <Sparkles className="w-4 h-4 text-[#FF4D8D]" />
            <span className="text-sm font-medium bg-gradient-to-r from-[#FF4D8D] to-purple-600 bg-clip-text text-transparent">
              La transparence au service de l'éducation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-6xl md:text-7xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">

            <span className="block text-5xl sm:text-8xl font-black italic uppercase tracking-tighter text-slate-900 mb-2 sm:mb-4 transform -rotate-2 origin-center drop-shadow-sm">
              SCOOL QUOI ?
            </span>
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              ScoolAdvisor.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-10">

            Plus qu’un site d’avis, c’est une communauté. Pour mieux comprendre, choisir et éclairer ton avenir.
          </motion.p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 pb-12 sm:pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">

          {/* Card 1 - Dominant */}
          <motion.div variants={itemVariants} className="lg:col-span-7 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-rose-200 rounded-2xl blur-lg opacity-40 transform translate-x-2 translate-y-2 group-hover:opacity-60 transition-all" />
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/50 shadow-xl h-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:border-pink-200 transition-colors">
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#FF4D8D] to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-tight text-center sm:text-left">Orienter avec <span className="bg-gradient-to-r from-[#FF4D8D] to-pink-600 bg-clip-text text-transparent">Force</span></h3>
                <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed text-center sm:text-left">
                  Fini le hasard. On te file les vraies infos pour tracer ta route.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2 - Compact & Bold */}
          <motion.div variants={itemVariants} className="lg:col-span-5 relative group mt-0 lg:mt-0">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-2xl blur-lg opacity-40 transform translate-x-2 translate-y-2 group-hover:opacity-60 transition-all" />
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/50 shadow-xl h-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:border-purple-200 transition-colors">
               <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#8B5CF6] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 uppercase italic text-center sm:text-left">Pas de Haine,<br/>Que du <span className="bg-gradient-to-r from-[#8B5CF6] to-purple-600 bg-clip-text text-transparent">Vrai</span></h3>
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed text-center sm:text-left">
                  On construit, on ne casse pas. La critique constructive est notre arme.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3 - Wide & Impactful */}
          <motion.div variants={itemVariants} className="lg:col-span-12 relative group mt-0">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl blur-lg opacity-40 transform translate-x-2 translate-y-2 group-hover:opacity-60 transition-all" />
             <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 sm:p-10 border border-white/50 shadow-xl flex flex-col md:flex-row items-center gap-4 sm:gap-8 h-full hover:border-blue-200 transition-colors">
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#3B82F6] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white shrink-0" />
                </div>
                <div>
                   <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 uppercase italic text-center sm:text-left">Plateforme <span className="bg-gradient-to-r from-[#3B82F6] to-blue-600 bg-clip-text text-transparent">Communautaire</span></h3>
                   <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed text-center sm:text-left">
                     Étudiants, parents, profs : on brise les silos. Un espace sans filtre pour l'école de demain.
                   </p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Concept Detail */}
      <div className="relative px-1 py-12 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-white/0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-8 sm:gap-12">
            {/* Full width Text Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto">

              <div className="relative inline-block">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-30" />
                <h2 className="text-2xl sm:text-5xl font-black text-slate-800 mb-4 sm:mb-6 relative z-10 uppercase italic tracking-tight">
                  Pourquoi ScoolAdvisor ?
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-6 text-base sm:text-xl text-slate-600 leading-relaxed">
                <p>
                  Hésitation Parcoursup ? Doute sur une école ?
                </p>
                <p>
                  <strong className="text-purple-600 font-bold">Le savoir, c'est le pouvoir.</strong> On crée ensemble la carte de l'éducation.
                </p>
              </div>
            </motion.div>

            {/* Split Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-start">
              {/* Left Column: 2 Widgets */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4 sm:space-y-6">

                  {/* Widget 1 - IA */}
                  <div className="group bg-white/60 backdrop-blur-md border border-white/50 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl hover:bg-white/80 transition-all">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#F59E0B] to-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform shadow-lg shadow-amber-200">
                        <Lightbulb className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase italic text-base sm:text-lg tracking-wide">IA Surpuissante</h4>
                        <p className="text-sm sm:text-base font-medium text-slate-600 mt-1">Antonin résume tout en 2s.</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 2 - Outil */}
                  <div className="group bg-white/60 backdrop-blur-md border border-white/50 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl hover:bg-white/80 transition-all">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#3B82F6] to-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-lg shadow-blue-200">
                        <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase italic text-base sm:text-lg tracking-wide">L'Outil Ultime</h4>
                        <p className="text-sm sm:text-base font-medium text-slate-600 mt-1">Ne choisis plus au hasard.</p>
                      </div>
                    </div>
                  </div>
              </motion.div>

              {/* Right Column: Movement Widget */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative w-full h-full">

                 <div className="relative w-full h-full min-h-[300px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 rounded-[2rem] transform rotate-2 blur-xl opacity-20" />

                    <div className="relative bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-hidden h-full transform -rotate-1 hover:rotate-0 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-purple-200">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-50 to-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white">
                        <span className="text-3xl sm:text-4xl animate-bounce">🎓</span>
                      </div>
                      <h3 className="text-xl sm:text-3xl font-black text-slate-800 mb-3 uppercase italic tracking-tight">
                        Rejoignez le<br/>
                        <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">Mouvement</span>
                      </h3>
                      <p className="text-base sm:text-lg text-slate-600 font-medium mb-6 max-w-xs">Déjà des milliers d'avis partagés. Ne reste pas sur le côté.</p>
                      <Link to={createPageUrl("Schools")} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all rounded-xl px-6 py-6 sm:px-8 sm:py-4 text-base sm:text-lg font-bold uppercase tracking-wide border border-white/20">
                          Voir les écoles
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Call to Action */}
      <div className="py-12 sm:py-20 text-center px-4">
        <h2 className="text-xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">Prêt à faire entendre ta voix ?</h2>
        <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 max-w-xl mx-auto">
          Ton expérience est précieuse pour les autres.
        </p>
        <Link to={createPageUrl("Schools")}>
          <Button variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-background shadow-sm hover:text-accent-foreground border-2 border-purple-200 hover:bg-pink-50 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent px-6 sm:px-8 py-2 h-10 sm:h-12 rounded-xl text-sm sm:text-base font-medium">
            Commencer
          </Button>
        </Link>
      </div>
      </div>
    </>
  );
}