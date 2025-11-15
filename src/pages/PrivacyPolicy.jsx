
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Lock, Eye, Database, UserCheck } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
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
            <Lock className="w-8 h-8 text-green-600" />
            <h1 className="text-4xl font-bold text-slate-900">Politique de Confidentialité</h1>
          </div>

          <p className="text-slate-600 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <p className="text-green-900">
              <strong>Scooladvisor respecte votre vie privée.</strong> Cette politique explique comment nous collectons, 
              utilisons et protégeons vos données personnelles.
            </p>
          </div>

          <div className="space-y-8 text-slate-700">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-slate-900">1. Données Collectées</h2>
              </div>
              <p className="mb-3">Nous collectons les informations suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Informations d'identification :</strong> nom, prénom, adresse email</li>
                <li><strong>Données de navigation :</strong> pages visitées, temps passé, actions effectuées</li>
                <li><strong>Avis et commentaires :</strong> contenus publiés sur la plateforme</li>
                <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, appareil utilisé</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-slate-900">2. Utilisation des Données</h2>
              </div>
              <p className="mb-3">Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Publier et gérer vos avis et commentaires</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Assurer la sécurité de la plateforme et lutter contre les abus</li>
                <li>Modérer automatiquement les contenus via notre IA</li>
                <li>Vous envoyer des notifications importantes (optionnel)</li>
                <li>Réaliser des statistiques anonymisées</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-semibold text-slate-900">3. Protection des Données</h2>
              </div>
              <p className="mb-3">Nous mettons en œuvre des mesures de sécurité pour protéger vos données :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement des données sensibles (HTTPS)</li>
                <li>Stockage sécurisé sur des serveurs protégés</li>
                <li>Accès limité aux données par le personnel autorisé</li>
                <li>Sauvegardes régulières</li>
                <li>Surveillance continue des tentatives d'intrusion</li>
                <li>Modération automatique par IA des contenus</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Partage des Données</h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
                <p className="text-blue-900 font-medium">
                  <strong>Scooladvisor ne vend jamais vos données personnelles à des tiers.</strong>
                </p>
              </div>
              <p className="mb-3">Vos données peuvent être partagées uniquement dans les cas suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Avec votre consentement explicite</li>
                <li>Pour se conformer à des obligations légales</li>
                <li>Pour protéger les droits et la sécurité de Scooladvisor et de ses utilisateurs</li>
                <li>Avec des prestataires techniques sous contrat de confidentialité (hébergement, analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
              <p>
                Scooladvisor utilise des cookies pour améliorer votre expérience. Ces cookies permettent de :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Maintenir votre session de connexion</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser le trafic et l'utilisation de la plateforme</li>
              </ul>
              <p className="mt-3">
                Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais cela peut limiter 
                certaines fonctionnalités.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-semibold text-slate-900">6. Vos Droits (RGPD)</h2>
              </div>
              <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de limitation :</strong> limiter l'utilisation de vos données</li>
              </ul>
              <p className="mt-3 text-sm">
                Pour exercer ces droits, contactez-nous directement via la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Conservation des Données</h2>
              <p>
                Vos données personnelles sont conservées tant que votre compte est actif. Après suppression de votre compte, 
                vos données sont supprimées dans un délai de 30 jours, sauf obligation légale de conservation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Données des Mineurs</h2>
              <p>
                Scooladvisor est destiné aux personnes de plus de 13 ans. Si vous avez connaissance qu'un mineur de moins 
                de 13 ans a créé un compte, veuillez nous en informer immédiatement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Modifications de la Politique</h2>
              <p>
                Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications importantes seront 
                notifiées par email ou via la plateforme. La date de dernière mise à jour est indiquée en haut de cette page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
                contactez-nous directement via la plateforme.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-3 text-slate-600">
              <Lock className="w-5 h-5 text-green-600" />
              <p className="text-sm">
                <strong>Votre vie privée est importante pour nous.</strong> Nous nous engageons à protéger vos données 
                et à respecter la législation en vigueur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
