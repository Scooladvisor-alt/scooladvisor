import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { detectInternationalSchool } from "@/functions/detectInternationalSchool";
import { security } from "../shared/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, MapPin, School } from "lucide-react";
import { toast } from "sonner";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";
import GoogleMapsPlacePicker from "./GoogleMapsPlacePicker";
import confetti from 'canvas-confetti';

export default function AddSchoolDialog({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "lycee",
    address: "",
    city: "",
    isInternational: false
  });
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  const [notSchoolWarning, setNotSchoolWarning] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [isAddressManuallyChanged, setIsAddressManuallyChanged] = useState(false);
  const [showMapsPicker, setShowMapsPicker] = useState(false);

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setAddressLoading(true);
    try {
      // Utilisation de l'API Adresse Gouv (gratuit, précis pour la France)
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      const suggestions = (data.features || []).map((feature) => ({
        label: feature.properties.label,
        street: feature.properties.name,
        city: feature.properties.city,
        postcode: feature.properties.postcode,
        context: feature.properties.context
      }));
      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error searching address:", error);
      setAddressSuggestions([]);
    }
    setAddressLoading(false);
  };



  useEffect(() => {
    const savedData = localStorage.getItem('pending_school_submission');
    if (savedData && open) {
      try {
        const parsed = JSON.parse(savedData);
        // Fusionner avec les valeurs par défaut
        setFormData(prev => ({ ...prev, ...parsed }));
        // Clean up immediately after restoring to avoid re-restoring if cancelled
        localStorage.removeItem('pending_school_submission');
      } catch (e) {
        console.error("Failed to parse saved school submission", e);
        localStorage.removeItem('pending_school_submission');
      }
    }
  }, [open]);

  useEffect(() => {
    if (formData.address && isAddressManuallyChanged) {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
      addressTimeoutRef.current = setTimeout(() => {
        searchAddress(formData.address);
      }, 300);
    } else if (!formData.address) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  }, [formData.address, isAddressManuallyChanged]);

  const cityInputRef = useRef(null);

  const handleAddressSelected = (place) => {
    setIsAddressManuallyChanged(false);
    setFormData({
      ...formData,
      address: place.street || place.label,
      city: place.city || ''
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);

    setTimeout(() => {
      if (cityInputRef.current) {
        cityInputRef.current.focus();
      }
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setShowAddressSuggestions(false);
        // Garde le texte entré par l'utilisateur, ne le réinitialise pas
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSchoolPrefix = (type) => {
    const prefixes = {
      'lycee': 'Lycée ',
      'college': 'Collège ',
      'universite': 'Université '
    };
    return prefixes[type] || '';
  };

  const hasLockedPrefix = (type) => {
    return ['lycee', 'college', 'universite'].includes(type);
  };

  useEffect(() => {
    if (hasLockedPrefix(formData.type)) {
      const prefix = getSchoolPrefix(formData.type);
      if (!formData.name.startsWith(prefix)) {
        const userInput = formData.name.replace(/^(Lycée |Collège |Université )/i, '');
        setFormData((prev) => ({ ...prev, name: prefix + userInput }));
      }
    }
  }, [formData.type]);

  const handleNameChange = (value) => {
    if (notSchoolWarning) setNotSchoolWarning(false);
    if (hasLockedPrefix(formData.type)) {
      const prefix = getSchoolPrefix(formData.type);
      
      // Si la valeur est plus courte que le préfixe ou ne commence pas par le préfixe
      if (value.length < prefix.length || !value.startsWith(prefix)) {
        // Extraire uniquement ce que l'utilisateur a tapé (sans les anciens préfixes)
        const userInput = value.replace(/^(Lycée |Collège |Université |Lycée|Collège|Université)/i, '').trim();
        value = prefix + userInput;
      }
    }
    setFormData({ ...formData, name: value });
  };

  const capitalizeWords = (str) => {
    return str.
    split(' ').
    map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).
    join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      let user = null;
      try {
        user = await base44.auth.me();
      } catch (error) {
        user = null;
      }

      if (!requireAuth(user, "ajouter cet établissement")) {
        localStorage.setItem('pending_school_submission', JSON.stringify(formData));
        return;
      }

      // Whitelist : le nom DOIT contenir un mot-clé scolaire reconnu
      const SCHOOL_KEYWORDS_WHITELIST = [
        'lycée', 'lycee', 'collège', 'college', 'université', 'universite',
        'ecole', 'école', 'institut', 'ipec', 'inseec', 'ifsi', 'ifas',
        'cfa', 'mfr', 'erea', 'segpa', 'ufa',
        'formation', 'enseignement', 'pedagogie', 'pédagogie',
        'preparatoire', 'préparatoire', 'classe prépa', 'classe prepa',
        'bts ', 'iut ', 'cpge', 'bac pro',
        'académie', 'academie', 'campus', 'faculty', 'faculté', 'faculte',
        'grande ecole', 'grande école', 'business school', 'engineering school',
        'high school', 'middle school', 'primary school', 'elementary school',
        'saint-', 'notre-dame', 'sainte-'
      ];
      const lowerName = formData.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Retirer accents pour comparaison
      const lowerNameRaw = formData.name.toLowerCase();

      // Types qui forcément impliquent un établissement scolaire (le type est déjà la validation)
      const typeIsSchool = ['lycee', 'college', 'universite', 'ecole_privee', 'ecole_commerce', 'ecole_ingenieur'].includes(formData.type);

      if (!typeIsSchool) {
        // Si le type n'est pas dans la liste scolaire, vérifier le nom aussi
        const hasSchoolKeyword = SCHOOL_KEYWORDS_WHITELIST.some(kw =>
          lowerName.includes(kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
          lowerNameRaw.includes(kw)
        );
        if (!hasSchoolKeyword) {
          setNotSchoolWarning(true);
          setLoading(false);
          return;
        }
      }
      setNotSchoolWarning(false);

      // SECURITY: Sanitize inputs
      const cleanName = security.sanitize(formData.name);
      const cleanAddress = security.sanitize(formData.address);
      const cleanCity = security.sanitize(formData.city);

      if (!cleanName || !cleanAddress || !cleanCity) {
        setError("Données invalides détectées.");
        setLoading(false);
        return;
      }

      // Vérifier que le nom contient plus que juste le préfixe du type
      if (hasLockedPrefix(formData.type)) {
        const prefix = getSchoolPrefix(formData.type);
        const nameWithoutPrefix = cleanName.substring(prefix.length).trim();
        
        // Vérifier que le nom n'est pas vide, ne contient pas que des espaces, et a au moins 2 caractères
        if (!nameWithoutPrefix || nameWithoutPrefix.length < 2 || /^\s+$/.test(nameWithoutPrefix)) {
          toast.error(`Veuillez entrer un nom complet et valide pour l'établissement (minimum 2 caractères après "${prefix.trim()}").`);
          nameInputRef.current?.focus();
          setLoading(false);
          return;
        }
      } else {
        // Pour les autres types sans préfixe verrouillé
        const trimmedName = cleanName.trim();
        if (trimmedName.length < 3 || /^\s+$/.test(trimmedName)) {
          toast.error("Veuillez entrer un nom valide pour l'établissement (minimum 3 caractères).");
          nameInputRef.current?.focus();
          setLoading(false);
          return;
        }
      }

      // SECURITY: Improved duplicate check (Server-side filter first) with robust normalization
      // Normalisation stricte pour éviter les doublons (ex: "Roissy-en-Brie" vs "Roissy en Brie")
      const normalizeString = (str) => {
        return str
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève les accents
          .replace(/[^a-z0-9]/g, ""); // Enlève TOUT sauf lettres et chiffres (espaces, tirets, virgules, etc.)
      };

      const normalizedNewCity = normalizeString(cleanCity);
      const normalizedNewAddress = normalizeString(cleanAddress);
      const normalizedNewName = normalizeString(cleanName);

      // Récupérer toutes les écoles (ou filtrer large si possible, mais ici on veut être sûr)
      // On filtre d'abord par ville normalisée si possible, mais comme on ne peut pas normaliser dans la requête DB,
      // on récupère les écoles qui "ressemblent" ou on fait une recherche plus large si possible.
      // Pour l'instant, on récupère les écoles de la ville exacte pour commencer, mais on va aussi
      // vérifier s'il n'y a pas d'autres écoles avec des noms similaires globalement ou dans des villes proches si on pouvait.
      // Limitation technique: on ne peut filtrer que sur les champs exacts.
      // On va donc récupérer TOUTES les écoles (ou un grand nombre) pour faire la vérification en mémoire si la base n'est pas trop énorme,
      // ou mieux, on essaie de filtrer par le début du nom de la ville ou du code postal si on l'avait.
      
      // Stratégie robuste : On récupère toutes les écoles (si < 10000 ça va).
      // Si trop lourd, on se contente de la ville exacte fournie par l'utilisateur ET on avertit.
      // Ici, on va récupérer toutes les écoles pour être sûr à 100% (le user a dit "plus jamais").
      const allSchools = await base44.entities.School.list(); // Potentiellement lourd mais nécessaire pour la garantie absolue demandée
      
      const duplicate = allSchools.find((school) => {
        if (school.is_deleted) return false;

        const schoolNormName = normalizeString(school.name);
        const schoolNormCity = normalizeString(school.city);
        const schoolNormAddress = normalizeString(school.address);

        // Check 1: Même nom normalisé ET même ville normalisée
        if (schoolNormName === normalizedNewName && schoolNormCity === normalizedNewCity) return true;

        // Check 2: Même adresse normalisée ET même ville normalisée (même si le nom diffère légèrement)
        if (schoolNormAddress === normalizedNewAddress && schoolNormCity === normalizedNewCity) return true;

        return false;
      });

      if (duplicate) {
        setError(`Cet établissement existe déjà : ${duplicate.name} à ${duplicate.city}`);
        setLoading(false);
        return;
      }

      const capitalizedName = capitalizeWords(cleanName);

      const newSchool = await base44.entities.School.create({
        name: capitalizedName,
        type: formData.type,
        address: cleanAddress,
        city: cleanCity,
        region: formData.isInternational ? "International" : "",
        status: "approved", // Optimistic UI: approved by default for schools
        average_rating: 0,
        review_count: 0,
        is_deleted: false
      });

      // Appeler la fonction de détection automatique seulement si pas déjà marqué international
      if (!formData.isInternational) {
        try {
          await detectInternationalSchool({ schoolId: newSchool.id });
        } catch (err) {
          console.log("Detection internationale non critique:", err);
        }
      }

      // Confetti rose et bleu éparpillés
      const colors = ['#FF4D8D', '#A855F7', '#3B82F6'];
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: colors
      };
      
      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }
      
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      setTimeout(() => {
        setFormData({ name: "Lycée ", type: "lycee", address: "", city: "", isInternational: false });
        setIsAddressManuallyChanged(false);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      console.error("Error creating school:", err);
      setError("Erreur lors de l'ajout de l'établissement");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setFormData({
          name: "Lycée ",
          type: "lycee",
          address: "",
          city: "",
          isInternational: false
        });
        setError(null);
        setSuccess(false);
        setIsAddressManuallyChanged(false);
      }
    }}>
      <DialogContent className="max-w-[96vw] sm:max-w-2xl h-auto rounded-2xl p-0 flex flex-col overflow-hidden">
        <DialogHeader className="text-center flex-shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Ton établissement est absent ?
            </span>
            <p className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-400 mt-1">Sois celui qui le fait débarquer ! 🚀</p>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 space-y-3 sm:space-y-4">

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="type" className="text-sm sm:text-base font-medium">Type d'établissement *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                const newPrefix = getSchoolPrefix(value);
                const oldPrefix = getSchoolPrefix(formData.type);
                let newName = formData.name;

                if (hasLockedPrefix(formData.type) && formData.name.startsWith(oldPrefix)) {
                  newName = formData.name.substring(oldPrefix.length);
                }

                if (hasLockedPrefix(value)) {
                  newName = newPrefix + newName.replace(/^(Lycée |Collège |Université )/i, '');
                }

                setFormData({ ...formData, type: value, name: newName });
              }}>

              <SelectTrigger id="type" className="h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Sélectionnez un type">
                  {formData.type === "college" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#3498DB] text-white border-[#3498DB]">
                      Collège
                    </span>
                  ) : formData.type === "lycee" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#1ABC9C] text-white border-[#1ABC9C]">
                      Lycée
                    </span>
                  ) : formData.type === "universite" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#27AE60] text-white border-[#27AE60]">
                      Université
                    </span>
                  ) : formData.type === "ecole_privee" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#F39C12] text-white border-[#F39C12]">
                      École privée
                    </span>
                  ) : formData.type === "ecole_commerce" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#E74C3C] text-white border-[#E74C3C]">
                      École de commerce
                    </span>
                  ) : formData.type === "ecole_ingenieur" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#FF6B35] text-white border-[#FF6B35]">
                      École d'ingénieurs
                    </span>
                  ) : (
                    <span className="text-slate-600">Sélectionnez un type</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="college">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#3498DB] text-white border-[#3498DB]">
                    Collège
                  </span>
                </SelectItem>
                <SelectItem value="lycee">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#1ABC9C] text-white border-[#1ABC9C]">
                    Lycée
                  </span>
                </SelectItem>
                <SelectItem value="universite">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#27AE60] text-white border-[#27AE60]">
                    Université
                  </span>
                </SelectItem>
                <SelectItem value="ecole_privee">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#F39C12] text-white border-[#F39C12]">
                    École privée
                  </span>
                </SelectItem>
                <SelectItem value="ecole_commerce">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#E74C3C] text-white border-[#E74C3C]">
                    École de commerce
                  </span>
                </SelectItem>
                <SelectItem value="ecole_ingenieur">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#FF6B35] text-white border-[#FF6B35]">
                    École d'ingénieurs
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={() => setShowMapsPicker(true)}
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 hover:bg-gradient-to-r hover:from-pink-500/30 hover:via-purple-500/30 hover:to-blue-500/30 text-black dark:text-white border-2 border-black dark:border-white shadow-lg shadow-purple-300/50 dark:shadow-purple-900/50 relative overflow-hidden hover:shadow-xl transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 active:scale-95"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-black dark:text-white relative z-10" />
            <span className="font-semibold text-sm sm:text-base relative z-10">Trouver mon école sur Google Maps</span>
          </Button>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base font-medium">Nom de l'établissement *</Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (hasLockedPrefix(formData.type)) {
                  const prefix = getSchoolPrefix(formData.type);
                  const cursorPosition = e.target.selectionStart;

                  // Pour Backspace: empêcher si curseur <= longueur du préfixe
                  if (e.key === 'Backspace' && cursorPosition <= prefix.length) {
                    e.preventDefault();
                  }
                  // Pour Delete et ArrowLeft: empêcher si curseur < longueur du préfixe
                  if ((e.key === 'Delete' || e.key === 'ArrowLeft') && cursorPosition < prefix.length) {
                    e.preventDefault();
                  }
                }
              }}
              onClick={(e) => {
                if (hasLockedPrefix(formData.type)) {
                  const prefix = getSchoolPrefix(formData.type);
                  if (e.target.selectionStart < prefix.length) {
                    e.target.setSelectionRange(prefix.length, prefix.length);
                  }
                }
              }}
              required
              placeholder={hasLockedPrefix(formData.type) ? `${getSchoolPrefix(formData.type)}Victor Hugo` : "École de management..."}
              className="h-11 sm:h-12 text-sm sm:text-base text-slate-900 dark:text-white" />

          </div>

          <div className="space-y-1 sm:space-y-2 relative" ref={addressInputRef}>
            <Label htmlFor="address" className="text-sm sm:text-base font-medium">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => {
                setIsAddressManuallyChanged(true);
                setFormData({ ...formData, address: e.target.value });
              }}
              required
              placeholder="10 rue de la République"
              className="h-11 sm:h-12 text-sm sm:text-base text-slate-900 dark:text-white" />

            {addressLoading &&
            <div className="absolute right-3 top-9">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            }
            
            {showAddressSuggestions && addressSuggestions.length > 0 &&
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                {addressSuggestions.map((place, index) =>
              <button
                key={index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddressSelected(place);
                }}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-2">

                    <span className="text-blue-500 mt-0.5">📍</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{place.label}</p>
                      {place.context && <p className="text-xs text-slate-500">{place.context}</p>}
                    </div>
                  </button>
              )}
              </div>
            }
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="city" className="text-sm sm:text-base font-medium">Ville *</Label>
            <div className="flex gap-2 sm:gap-3">
              <Input
                id="city"
                ref={cityInputRef}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="Paris"
                className="h-11 sm:h-12 text-sm sm:text-base flex-1 text-slate-900 dark:text-white" />

              <div className="flex items-center space-x-2 px-3 sm:px-4 bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-700 whitespace-nowrap h-11 sm:h-12">
                <Checkbox
                  id="isInternational"
                  checked={formData.isInternational}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInternational: checked })} />

                <label
                  htmlFor="isInternational"
                  className="text-sm sm:text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700 dark:text-slate-300">

                  Hors France
                </label>
              </div>
            </div>
          </div>
          </div>

          <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {notSchoolWarning && (
              <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
                <School className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Scooladvisor est réservé aux établissements scolaires (collèges, lycées, universités…). Ce type de lieu ne peut pas être ajouté.</span>
              </div>
            )}
            {error ? (
              <Alert variant="destructive" className="w-full border-red-300 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-400 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white text-base sm:text-lg h-12 sm:h-14 font-bold shadow-lg active:scale-95 transition-transform">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : "Ajouter l'établissement"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
      
      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
      
      <GoogleMapsPlacePicker
        open={showMapsPicker}
        onOpenChange={setShowMapsPicker}
        onPlaceSelected={(place) => {
          console.log("🎯 Place reçu dans AddSchoolDialog:", place);
          setIsAddressManuallyChanged(false);
          
          // Capitaliser correctement le nom de l'école et la ville
          const schoolName = place.name ? capitalizeWords(place.name) : formData.name;
          const capitalizedCity = place.city ? capitalizeWords(place.city) : "";
          
          console.log("📝 Mise à jour du formulaire avec ville:", capitalizedCity);
          
          setFormData({
            ...formData,
            name: schoolName,
            address: place.address,
            city: capitalizedCity
          });
          setShowMapsPicker(false);
        }}
      />
    </Dialog>);

}