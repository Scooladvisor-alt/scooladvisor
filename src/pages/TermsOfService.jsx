import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Scale, Shield } from "lucide-react";
import { createPageUrl } from "@/utils";
import SEO from "@/components/shared/SEO";

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <SEO 
        title="Conditions d'Utilisation (CGU) - ScoolAdvisor"
        description="Consultez les conditions générales d'utilisation de ScoolAdvisor. Règles de la communauté, responsabilité et droits des utilisateurs."
        canonicalPath="/TermsOfService"
      />
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("Schools"))}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Conditions d'Utilisation</h1>
          </div>

          <p className="text-slate-600 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptation des Conditions</h2>
              <p>
                En accédant et en utilisant Scooladvisor, vous acceptez d'être lié par les présentes conditions d'utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Utilisation de la Plateforme</h2>
              <p className="mb-3">Les utilisateurs s'engagent à :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir des informations exactes et à jour</li>
                <li>Respecter les autres utilisateurs et la communauté (politesse et bienveillance)</li>
                <li>Ne pas publier de contenu illégal, diffamatoire, offensant ou haineux</li>
                <li>Ne pas spammer les chats (National et École)</li>
                <li>Ne pas usurper l'identité d'une autre personne</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Limiter les modifications de leurs avis et messages (maximum 3 modifications par contenu)</li>
              </ul>
            </section>

            <section>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Avertissement Légal - Responsabilité Personnelle
                    </h3>
                    <p className="text-red-800">
                      <strong>Tout propos diffamatoire, injurieux, discriminatoire ou mensonger est strictement interdit 
                      et punissable par la loi française.</strong> En publiant un avis, vous assumez l'entière responsabilité 
                      de vos propos et de leurs conséquences légales. Scooladvisor se réserve le droit de transmettre 
                      vos informations aux autorités compétentes en cas de plainte ou de violation grave.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Publication d'Avis et Messages</h2>
              <p className="mb-3">Les avis et messages (chats) publiés sur Scooladvisor doivent :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Être basés sur une expérience personnelle réelle (pour les avis)</li>
                <li>Être constructifs, polis et bienveillants (avis et chats)</li>
                <li>Respecter la vie privée des personnes mentionnées (pas de doxing)</li>
                <li>Ne contenir aucun propos haineux, discriminatoire ou sexuel</li>
                <li>Ne pas contenir de fausses informations délibérées</li>
                <li>Ne pas être du spam ou de la publicité non sollicitée</li>
                <li>Ne peuvent être modifiés que 3 fois maximum après publication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Modération Automatisée par IA</h2>
              <p>
                Scooladvisor utilise un système de modération automatique par intelligence artificielle pour garantir 
                la qualité et le respect des contenus publiés. Tous les avis, commentaires et messages de chat (National et École) passent par cette 
                modération avant publication ou modification. Les contenus jugés inappropriés, offensants ou contraires à nos valeurs sont automatiquement refusés par l'IA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Sanctions</h2>
              <p className="mb-3">En cas de non-respect des conditions :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Suppression du contenu non conforme</li>
                <li>Avertissement de l'utilisateur</li>
                <li>Suspension temporaire ou définitive du compte</li>
                <li>Signalement aux autorités compétentes si nécessaire</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Propriété Intellectuelle</h2>
              <p>
                Tous les contenus de Scooladvisor (design, logos, textes) sont protégés par les lois sur la propriété 
                intellectuelle. En publiant du contenu, vous accordez à Scooladvisor une licence d'utilisation, 
                de modification et de diffusion de ce contenu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Limitation de Responsabilité</h2>
              <p>
                Scooladvisor ne peut être tenu responsable des avis publiés par les utilisateurs. La plateforme 
                agit en tant qu'hébergeur et ne peut contrôler tous les contenus publiés en temps réel. 
                Les utilisateurs sont seuls responsables de leurs publications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Modifications des Conditions</h2>
              <p>
                Scooladvisor se réserve le droit de modifier ces conditions d'utilisation à tout moment. 
                Les utilisateurs seront informés des modifications importantes par email ou via la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Droit Applicable</h2>
              <p>
                Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents français.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-3 text-slate-600">
              <Shield className="w-5 h-5 text-blue-600" />
              <p className="text-sm">
                Pour toute question concernant ces conditions, contactez-nous via notre plateforme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}