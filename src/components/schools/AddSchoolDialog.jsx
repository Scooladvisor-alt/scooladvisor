import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { detectInternationalSchool } from "@/functions/detectInternationalSchool";
import { security } from "../shared/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const [isAddressManuallyChanged, setIsAddressManuallyChanged] = useState(false);

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
    if (hasLockedPrefix(formData.type)) {
      const prefix = getSchoolPrefix(formData.type);
      if (!value.startsWith(prefix)) {
        value = prefix + value.replace(/^(Lycée |Collège |Université )/i, '');
      }
      if (value.length < prefix.length) {
        value = prefix;
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

      if (!user) {
        localStorage.setItem('pending_school_submission', JSON.stringify(formData));
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // SECURITY: Sanitize inputs
      const cleanName = security.sanitize(formData.name);
      const cleanAddress = security.sanitize(formData.address);
      const cleanCity = security.sanitize(formData.city);

      if (!cleanName || !cleanAddress || !cleanCity) {
        setError("Données invalides détectées.");
        setLoading(false);
        return;
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
        setError(`Cet établissement existe déjà (ID: ${duplicate.id}) : ${duplicate.name} à ${duplicate.city}`);
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

      setSuccess(true);
      setTimeout(() => {
        setFormData({ name: "Lycée ", type: "lycee", address: "", city: "", isInternational: false });
        setSuccess(false);
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
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Ton établissement est absent ?
            </span>
            <p className="text-sm sm:text-base font-normal text-slate-600 mt-2">Sois celui qui le fait débarquer ! 🚀</p>
          </DialogTitle>
        </DialogHeader>

        {success &&
        <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">
              Établissement ajouté avec succès ! 🎉
            </AlertDescription>
          </Alert>
        }

        {error &&
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        }

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="type" className="text-xs sm:text-sm">Type d'établissement *</Label>
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

              <SelectTrigger id="type" className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="college">Collège</SelectItem>
                <SelectItem value="lycee">Lycée</SelectItem>
                <SelectItem value="universite">Université</SelectItem>
                <SelectItem value="ecole_privee">École privée</SelectItem>
                <SelectItem value="ecole_commerce">École de commerce</SelectItem>
                <SelectItem value="ecole_ingenieur">École d'ingénieurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nom de l'établissement *</Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (hasLockedPrefix(formData.type)) {
                  const prefix = getSchoolPrefix(formData.type);
                  const cursorPosition = e.target.selectionStart;
                  if (cursorPosition < prefix.length && (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft')) {
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
              placeholder={hasLockedPrefix(formData.type) ? `${getSchoolPrefix(formData.type)}Victor Hugo` : "École de Commerce de Paris"}
              className="h-9 sm:h-10 text-xs sm:text-sm" />

          </div>

          <div className="space-y-1 sm:space-y-2 relative" ref={addressInputRef}>
            <Label htmlFor="address" className="text-xs sm:text-sm">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => {
                setIsAddressManuallyChanged(true);
                setFormData({ ...formData, address: e.target.value });
              }}
              required
              placeholder="10 rue de la République"
              className="h-9 sm:h-10 text-xs sm:text-sm" />

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
            <Label htmlFor="city" className="text-xs sm:text-sm">Ville *</Label>
            <div className="flex gap-2 sm:gap-3">
              <Input
                id="city"
                ref={cityInputRef}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="Paris"
                className="h-9 sm:h-10 text-xs sm:text-sm flex-1" />

              <div className="flex items-center space-x-2 px-3 bg-gradient-to-r from-pink-100 to-blue-100 rounded-lg border border-blue-200 whitespace-nowrap">
                <Checkbox
                  id="isInternational"
                  checked={formData.isInternational}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInternational: checked })} />

                <label
                  htmlFor="isInternational"
                  className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700">

                  Hors France
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs sm:text-sm h-8 sm:h-10">

              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white text-xs sm:text-sm h-8 sm:h-10 font-semibold shadow-md">

              {loading ?
              <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Ajout en cours...
                </> :

              "Ajouter l'établissement"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}