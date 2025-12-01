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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <SEO
        title="ScoolAdvisor - C'est quoi ? Notre mission et nos valeurs"
        description="Découvrez la mission de ScoolAdvisor : apporter de la transparence dans l'éducation et aider étudiants et parents à faire les meilleurs choix d'orientation."
        canonicalPath="/About" />


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

            Scool quoi ? <br />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              ScoolAdvisor.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">

            Plus qu'un site d'avis, c'est une communauté. Nous redonnons le pouvoir aux étudiants et aux parents pour éclairer l'avenir scolaire de chacun.
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
          className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-[#FF4D8D]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Orienter avec justesse</h3>
            <p className="text-slate-600 leading-relaxed">
              Choisir son école ou ses professeurs ne devrait pas être un pari. Nous offrons des retours d'expérience authentiques pour permettre à chacun de construire son parcours en toute confiance.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Bienveillance avant tout</h3>
            <p className="text-slate-600 leading-relaxed">
              Ici, on ne "casse" pas pour le plaisir. On construit. Les avis sont là pour aider les établissements à s'améliorer et les futurs élèves à savoir où ils mettent les pieds, toujours dans le respect.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Pour tous les acteurs</h3>
            <p className="text-slate-600 leading-relaxed">
              Étudiants, parents, professeurs, administrations : ScoolAdvisor est le terrain d'entente où le dialogue s'ouvre pour une éducation plus transparente et plus humaine.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Concept Detail */}
      <div className="bg-white px-1 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1">

              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-30" />
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 relative z-10">
                  Pourquoi ScoolAdvisor ?
                </h2>
              </div>
              <div className="space-y-6 text-lg text-slate-600">
                <p>
                  On a tous connu ce moment d'hésitation devant Parcoursup, ou cette angoisse de ne pas savoir si cette école de commerce vaut vraiment son prix, ou si ce professeur à l'université est pédagogue.
                </p>
                <p>
                  <strong className="text-purple-600">Le savoir, c'est le pouvoir.</strong> En partageant massivement nos expériences, nous créons une carte détaillée du paysage éducatif francophone.
                </p>
                <ul className="space-y-4 mt-4">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span>Des avis vérifiés et modérés pour éviter les faux profils.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <span>Une IA (Antonin) pour résumer l'essentiel en un clin d'œil.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span>Un outil indispensable pour l'orientation scolaire et pro.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative w-full">

               {/* Abstract Illustration representation */}
               <div className="relative w-full max-w-md mx-auto my-4 sm:my-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D8D] via-purple-600 to-blue-600 rounded-[2rem] rotate-6 opacity-10 transform translate-y-2" />
                  <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-bounce">
                      <span className="text-3xl sm:text-4xl">🎓</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Rejoignez le mouvement</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Déjà des milliers d'avis partagés.</p>
                    <Link to={createPageUrl("Schools")} className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-[#FF4D8D] to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all rounded-full px-6 py-6 sm:px-8 sm:py-6 text-base sm:text-lg">
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
    </div>);

}