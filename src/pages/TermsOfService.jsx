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
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Responsabilité de l'Utilisateur</h2>
              <p className="mb-3">
                L'utilisateur s'engage à publier des avis objectifs, honnêtes et respectueux, basés sur une expérience personnelle réelle.
              </p>
              <p className="mb-3 font-semibold">Sont strictement interdits :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les propos diffamatoires, injurieux ou calomnieux</li>
                <li>Les contenus discriminatoires (origine, religion, orientation sexuelle, handicap, etc.)</li>
                <li>Les atteintes à la vie privée d'autrui (divulgation d'informations personnelles)</li>
                <li>Les fausses informations ou accusations mensongères</li>
                <li>Le harcèlement ou intimidation sous toute forme</li>
                <li>Les contenus à caractère sexuel, violent ou haineux</li>
                <li>Le spam, la publicité non sollicitée ou les contenus commerciaux</li>
              </ul>
              <p className="mt-3 text-sm italic text-slate-600">
                Les avis et messages peuvent être modifiés jusqu'à 3 fois maximum après leur publication initiale.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Modération et Contrôle des Contenus</h2>
              <p className="mb-3">
                <strong>ScoolAdvisor se réserve le droit exclusif de refuser, modifier, masquer ou supprimer tout contenu publié sur la plateforme, 
                sans préavis ni justification préalable.</strong>
              </p>
              <p className="mb-3">
                Tous les avis, commentaires et messages de chat passent par un système de modération automatique par intelligence artificielle 
                avant publication ou modification. Les contenus jugés inappropriés, offensants ou contraires à nos valeurs sont automatiquement refusés.
              </p>
              <p className="mb-3">
                Une modération humaine complémentaire peut intervenir à tout moment pour examiner les contenus signalés ou suspects.
              </p>
              <p className="text-sm italic text-slate-600">
                La plateforme met tout en œuvre pour garantir un environnement respectueux, mais ne peut garantir l'absence totale de contenus inappropriés 
                compte tenu du volume de publications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Droit de Suppression des Personnes Mentionnées</h2>
              <p className="mb-3">
                <strong>Toute personne (enseignant, personnel éducatif ou autre) mentionnée ou notée sur la plateforme dispose d'un droit 
                de suppression immédiate de ses données personnelles et des contenus la concernant.</strong>
              </p>
              <p className="mb-3">
                Cette demande peut être formulée à tout moment via la page de contact ou par email. ScoolAdvisor s'engage à traiter 
                ces demandes dans les plus brefs délais et à supprimer définitivement les informations concernées.
              </p>
              <p className="text-sm italic text-slate-600">
                Conformément au RGPD et à la loi Informatique et Libertés, toute personne dispose également d'un droit d'accès, 
                de rectification et d'opposition sur ses données personnelles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Droit de Réponse</h2>
              <p>
                <strong>Toute personne notée ou mentionnée dans un avis dispose d'un droit de réponse.</strong> Cette réponse pourra être publiée 
                sur son profil ou associée aux contenus la concernant. Pour exercer ce droit, veuillez nous contacter via la page de contact.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Signalement de Contenu Illicite</h2>
              <p className="mb-3">
                Tout contenu illicite, diffamatoire, injurieux ou contraire aux présentes conditions peut être signalé directement 
                via les boutons de signalement disponibles sur la plateforme, ou par email à l'adresse indiquée sur notre page de contact.
              </p>
              <p className="mb-3">
                Les signalements sont traités dans les plus brefs délais. Les contenus manifestement illicites sont supprimés 
                immédiatement. Les autres signalements font l'objet d'une analyse par notre équipe de modération.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Sanctions en Cas de Non-Respect</h2>
              <p className="mb-3">
                <strong>Le compte utilisateur peut être suspendu temporairement ou définitivement en cas d'abus, de manquements répétés 
                ou de violation grave des présentes conditions.</strong>
              </p>
              <p className="mb-3">Les sanctions applicables comprennent :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Suppression immédiate du contenu non conforme</li>
                <li>Avertissement écrit de l'utilisateur</li>
                <li>Suspension temporaire du compte (durée variable selon la gravité)</li>
                <li>Bannissement définitif de la plateforme</li>
                <li>Transmission des informations aux autorités compétentes en cas d'infraction pénale</li>
                <li>Poursuites judiciaires si nécessaire</li>
              </ul>
              <p className="mt-3 text-sm italic text-slate-600">
                L'utilisateur dispose d'un droit de contestation de toute sanction via notre système de réclamation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Finalité de la Plateforme</h2>
              <p className="mb-3">
                <strong>ScoolAdvisor a pour vocation d'améliorer l'expérience éducative par le partage d'avis pédagogiques constructifs 
                et le dialogue au sein de la communauté éducative.</strong>
              </p>
              <p className="mb-3">
                La plateforme vise à :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Permettre aux élèves et étudiants de partager leurs expériences scolaires de manière authentique</li>
                <li>Aider les futurs élèves et leurs familles dans leurs choix d'orientation</li>
                <li>Favoriser le dialogue constructif entre les membres de la communauté éducative</li>
                <li>Contribuer à l'amélioration continue de la qualité de l'enseignement</li>
                <li>Valoriser les bons enseignants et établissements</li>
              </ul>
              <p className="mt-3 text-sm italic text-slate-600">
                Tout usage détourné de la plateforme à des fins de dénigrement, de harcèlement ou contraires à cette finalité 
                sera sanctionné.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Propriété Intellectuelle</h2>
              <p>
                Tous les contenus de ScoolAdvisor (design, logos, textes, code source) sont protégés par les lois sur la propriété 
                intellectuelle. En publiant du contenu, vous accordez à ScoolAdvisor une licence d'utilisation, 
                de modification et de diffusion de ce contenu dans le cadre du fonctionnement de la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Responsabilité Limitée de la Plateforme</h2>
              <p className="mb-3">
                <strong>ScoolAdvisor agit en tant qu'intermédiaire technique et hébergeur de contenus générés par les utilisateurs.</strong> 
                La plateforme ne peut être tenue responsable des avis, commentaires et messages publiés par les utilisateurs.
              </p>
              <p className="mb-3">
                ScoolAdvisor ne garantit pas :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>L'exactitude, la véracité ou la fiabilité des informations publiées par les utilisateurs</li>
                <li>La disponibilité permanente et ininterrompue de la plateforme</li>
                <li>L'absence totale de contenus inappropriés malgré la modération</li>
                <li>Les résultats ou décisions pris sur la base des informations de la plateforme</li>
              </ul>
              <p className="mt-3">
                <strong>Les utilisateurs sont seuls responsables de leurs publications et de leurs conséquences juridiques.</strong> 
                Toute personne s'estimant lésée par un contenu publié doit contacter directement son auteur ou exercer ses recours 
                légaux. ScoolAdvisor coopérera avec les autorités compétentes en cas de procédure judiciaire.
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