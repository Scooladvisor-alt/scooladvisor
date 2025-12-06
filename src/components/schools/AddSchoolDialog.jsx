import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { detectInternationalSchool } from "@/functions/detectInternationalSchool";
import { security } from "../shared/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  });

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);

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
      const suggestions = (data.features || []).map(feature => ({
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
    if (formData.address) {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
      addressTimeoutRef.current = setTimeout(() => {
        searchAddress(formData.address);
      }, 300);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  }, [formData.address]);

  const cityInputRef = useRef(null);

  const handleAddressSelected = (place) => {
    setFormData({
      ...formData,
      address: place.street || place.label,
      city: place.city || '',
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    
    // Focus sur le champ ville si pas rempli automatiquement
    setTimeout(() => {
      if (cityInputRef.current && !place.city) {
        cityInputRef.current.focus();
      }
    }, 50);
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

  const capitalizeWords = (str) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // SECURITY: Sanitize inputs
      const cleanName = security.sanitize(formData.name);
      const cleanAddress = security.sanitize(formData.address);
      const cleanCity = security.sanitize(formData.city);

      if (!cleanName || !cleanAddress || !cleanCity) {
         setError("Données invalides détectées.");
         setLoading(false);
         return;
      }

      // SECURITY: Improved duplicate check (Server-side filter first)
      const existingSchoolsInCity = await base44.entities.School.filter({ city: cleanCity });
      const normalizedNewAddress = `${cleanAddress}||${cleanCity}`.toLowerCase().trim();
      
      const duplicate = existingSchoolsInCity.find(school => {
        const normalizedExistingAddress = `${school.address}||${school.city}`.toLowerCase().trim();
        return normalizedExistingAddress === normalizedNewAddress || school.name.toLowerCase() === cleanName.toLowerCase();
      });

      if (duplicate) {
        setError(`Cet établissement existe déjà : ${duplicate.name}`);
        setLoading(false);
        return;
      }

      const capitalizedName = capitalizeWords(cleanName);

      const newSchool = await base44.entities.School.create({
        name: capitalizedName,
        type: formData.type,
        address: cleanAddress,
        city: cleanCity,
        region: "", // Sera mis à jour automatiquement
        status: "approved",
        average_rating: 0,
        review_count: 0,
        is_deleted: false
      });

      // Appeler la fonction de détection automatique France/International
      try {
        await detectInternationalSchool({ schoolId: newSchool.id });
      } catch (err) {
        console.log("Detection internationale non critique:", err);
      }

      setSuccess(true);
      setTimeout(() => {
        setFormData({ name: "", type: "lycee", address: "", city: "" });
        setSuccess(false);
        onOpenChange(false);
        // Force le rechargement pour afficher immédiatement le nouvel établissement
        window.location.reload();
      }, 1500);
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
          name: "", 
          type: "lycee",
          address: "", 
          city: "",
        });
        setError(null);
        setSuccess(false);
      }
    }}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Ton établissement est absent ?
            </span>
            <p className="text-sm sm:text-base font-normal text-slate-600 mt-2">Sois celui qui le fait débarquer ! 🚀</p>
          </DialogTitle>
        </DialogHeader>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">
              Établissement ajouté avec succès ! 🎉
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nom de l'établissement *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="Lycée Victor Hugo"
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="type" className="text-xs sm:text-sm">Type d'établissement *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({...formData, type: value})}
            >
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

          <div className="space-y-1 sm:space-y-2 relative" ref={addressInputRef}>
            <Label htmlFor="address" className="text-xs sm:text-sm">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="10 rue de la République"
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            {addressLoading && (
              <div className="absolute right-3 top-9">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
            
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                {addressSuggestions.map((place, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddressSelected(place);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-2"
                  >
                    <span className="text-blue-500 mt-0.5">📍</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{place.label}</p>
                      {place.context && <p className="text-xs text-slate-500">{place.context}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="city" className="text-xs sm:text-sm">Ville *</Label>
            <Input
              id="city"
              ref={cityInputRef}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              placeholder="Paris"
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 mt-4 sm:mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white text-xs sm:text-sm h-8 sm:h-10 font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                "Ajouter l'établissement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}