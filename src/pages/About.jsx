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
        }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">


      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 sm:py-32 px-4">
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
              className="text-4xl sm:text-6xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">

            <span className="block text-6xl sm:text-8xl font-black italic uppercase tracking-tighter text-slate-900 mb-4 transform -rotate-2 origin-center drop-shadow-sm">
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
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">

            Plus qu’un simple site d’avis, c’est une véritable communauté. Nous donnons aux étudiants et aux parents les clés pour mieux comprendre, choisir et éclairer leur avenir scolaire.
          </motion.p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Card 1 - Dominant */}
          <motion.div variants={itemVariants} className="lg:col-span-7 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-[#FF4D8D]/50 rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform\n" />
            <div className="relative bg-white rounded-2xl p-8 border-2 border-slate-900 h-full flex flex-col">
              <div className="w-16 h-16 bg-gradient-to-tl from-[#FF4D8D] via-[#A78BFA]/80 to-[#3B82F6]/40 rounded-xl flex items-center justify-center mb-6 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transform -rotate-3 group-hover:rotate-0 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase italic tracking-tight">Orienter avec <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#FF4D8D] bg-clip-text text-transparent">FORCE</span></h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                Choisir son avenir, ce n'est pas jouer à la roulette russe. On te file les vraies infos, sans filtre, pour que tu puisses tracer ta route comme un chef. Fini le hasard.
              </p>
            </div>
          </motion.div>

          {/* Card 2 - Compact & Bold */}
          <motion.div variants={itemVariants} className="lg:col-span-5 relative group mt-4 lg:mt-0">
             <div className="absolute inset-0 bg-gradient-to-br from-pink-500/50 to-blue-500/50 rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform\n" />
            <div className="relative bg-white rounded-2xl p-8 border-2 border-slate-900 h-full flex flex-col">
               <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6]/30 via-[#8B5CF6]/70 to-[#3B82F6] rounded-xl flex items-center justify-center mb-6 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transform rotate-3 group-hover:rotate-0 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Pas de Haine,<br />Que du <span className="text-[#8B5CF6]">Vrai</span></h3>
              <p className="text-slate-700 font-medium leading-relaxed">
                On ne casse pas pour le plaisir. On construit. La critique est une arme puissante seulement si elle est constructive et respectueuse.
              </p>
            </div>
          </motion.div>

          {/* Card 3 - Wide & Impactful */}
          <motion.div variants={itemVariants} className="lg:col-span-12 relative group mt-4">
             <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D8D] via-[#A78BFA]/80 to-[#3B82F6]/40 rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform" />
             <div className="relative bg-white rounded-2xl p-8 sm:p-10 border-2 border-slate-900 flex flex-col md:flex-row items-center gap-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-tl from-[#FF4D8D] via-[#A78BFA]/80 to-[#3B82F6]/40 rounded-xl flex items-center justify-center mb-6 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">Plateforme <span className="text-[#3B82F6]">Communautaire</span></h3>
                   <p className="text-lg text-slate-700 font-medium leading-relaxed">
                     Étudiants, parents, profs : on brise les silos. Ici, l'expérience de chacun profite à tous. Un espace d'échange direct et sans filtre pour construire ensemble l'école de demain.
                   </p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Concept Detail */}
      <div className="bg-white px-1 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-12">
            {/* Full width Text Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-4xl mx-auto">

              <div className="relative inline-block">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-30" />
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 relative z-10 uppercase italic tracking-tight">
                  Pourquoi ScoolAdvisor ?
                </h2>
              </div>
              <div className="space-y-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                <p>
                  On a tous connu ce moment d'hésitation devant Parcoursup, ou cette angoisse de ne pas savoir si cette école de commerce vaut vraiment son prix, ou si ce professeur à l'université est pédagogue.
                </p>
                <p>
                  <strong className="text-purple-600 font-bold">Le savoir, c'est le pouvoir.</strong> En partageant massivement nos expériences, nous créons une carte détaillée du paysage éducatif francophone.
                </p>
              </div>
            </motion.div>

            {/* Split Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              {/* Left Column: 3 Widgets */}
              <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6">
                  
                  {/* Widget 1 */}
                  <div className="group bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#10B981] rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase italic text-lg tracking-wide">No Fake Zone</h4>
                        <p className="text-base font-medium text-slate-700 mt-1">Avis vérifiés & modérés. Ici, on ne triche pas.</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 2 */}
                  <div className="group bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#F59E0B] rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
                        <Lightbulb className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase italic text-lg tracking-wide">IA Surpuissante</h4>
                        <p className="text-base font-medium text-slate-700 mt-1">Antonin résume tout. L'essentiel en 2 secondes.</p>
                      </div>
                    </div>
                  </div>

                  {/* Widget 3 */}
                  <div className="group bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#3B82F6] rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 uppercase italic text-lg tracking-wide">L'Outil Ultime</h4>
                        <p className="text-base font-medium text-slate-700 mt-1">Pour ton orientation. Ne choisis plus au hasard.</p>
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

                 <div className="relative w-full h-full min-h-[400px]">
                    <div className="absolute inset-0 bg-slate-900 rounded-[2rem] transform rotate-2" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D8D] via-purple-600 to-blue-600 rounded-[2rem] transform -rotate-1 opacity-90 border-2 border-slate-900" />
                    
                    <div className="relative bg-white rounded-[2rem] border-4 border-slate-900 p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden h-full transform -rotate-2 hover:rotate-0 transition-all duration-500 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                        <span className="text-4xl sm:text-6xl animate-bounce">🎓</span>
                      </div>
                      <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4 uppercase italic">Rejoignez le<br />mouvement</h3>
                      <p className="text-lg text-slate-600 font-medium mb-8">Déjà des milliers d'avis partagés. Ne reste pas sur le côté.</p>
                      <Link to={createPageUrl("Schools")} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-[4px_4px_0px_0px_rgba(148,163,184,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-xl px-8 py-8 sm:px-10 sm:py-6 text-lg sm:text-xl font-bold uppercase tracking-wide border-2 border-transparent">
                          Voir les écoles
                          <ArrowRight className="ml-3 w-6 h-6" />
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
      <div className="py-20 text-center px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Prêt à faire entendre votre voix ?</h2>
        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
          Que vous soyez étudiant actuel ou ancien, votre expérience est précieuse pour les générations futures.
        </p>
        <Link to={createPageUrl("Schools")}>
          <Button variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-background shadow-sm hover:text-accent-foreground border-2 border-purple-200 hover:bg-pink-50 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent px-8 py-2 h-12 rounded-xl text-base font-medium">
            Commencer à explorer
          </Button>
        </Link>
      </div>
      </div>
    </>);

}