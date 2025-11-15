import React, { useState, useEffect } from "react";
import { School } from "@/entities/School";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, Search, Loader2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AddSchoolDialog({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "lycee",
    address: "",
    city: "",
    region: "",
  });

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche dans les bases de données officielles françaises (annuaire de l'éducation nationale, établissements d'enseignement supérieur) les établissements dont le nom contient "${query}".
        
Retourne UNIQUEMENT les établissements réels trouvés dans les sources officielles suivantes :
- Annuaire de l'éducation nationale (collèges et lycées)
- Établissements d'enseignement supérieur (universités, écoles d'ingénieurs, écoles de commerce)

Pour chaque établissement trouvé, retourne les informations suivantes dans le format JSON demandé.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            establishments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { 
                    type: "string",
                    enum: ["college", "lycee", "universite", "ecole_privee", "ecole_commerce", "ecole_ingenieur"]
                  },
                  address: { type: "string" },
                  city: { type: "string" },
                  postal_code: { type: "string" },
                  region: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response?.establishments && response.establishments.length > 0) {
        setSuggestions(response.establishments.slice(0, 8));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error searching establishments:", err);
      setSuggestions([]);
    }
    setSearching(false);
  };

  const selectSuggestion = (establishment) => {
    setFormData({
      name: establishment.name,
      type: establishment.type || "lycee",
      address: establishment.address || "",
      city: establishment.city || "",
      region: establishment.region || "",
    });
    setShowManualForm(true);
    setSuggestions([]);
    setSearchQuery("");
  };

  const sendToModerationWebhook = async (schoolData) => {
    try {
      const response = await fetch('https://n8n.srv996204.hstgr.cloud/webhook/fea1f7e8-a1c0-40fb-a64b-c330dbe1e73d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'school_creation',
          school_id: schoolData.id,
          school_name: schoolData.name,
          school_type: schoolData.type,
          city: schoolData.city,
          created_by: schoolData.created_by,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      const action = result?.output?.action || result?.action;
      
      if (action === 'delete') {
        await School.delete(schoolData.id);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error sending to moderation webhook:", error);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await base44.auth.me();
      
      if (user.email !== 'antownin@gmail.com') {
        const existingSchools = await School.filter({ created_by: user.email });
        if (existingSchools.length >= 3) {
          setError("Vous avez atteint la limite de 3 établissements ajoutés.");
          setLoading(false);
          return;
        }
      }
      
      const newSchool = await School.create({
        ...formData,
        status: "approved",
        average_rating: 0,
        review_count: 0,
        created_by: user.email
      });
      
      const isApproved = await sendToModerationWebhook(newSchool);
      
      if (!isApproved) {
        setError("Cette demande d'ajout d'établissement a été refusée. Merci de vérifier les informations.");
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setFormData({ name: "", type: "lycee", address: "", city: "", region: "" });
        setShowManualForm(false);
        setSearchQuery("");
        setSuggestions([]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      if (err.message && err.message.includes('authentication')) {
         setError("Vous devez être connecté pour ajouter un établissement.");
      } else if (err.message) {
         setError(`Erreur lors de l'ajout de l'établissement: ${err.message}`);
      } else {
         setError("Erreur lors de l'ajout de l'établissement");
      }
      console.error("Error creating school:", err);
    }
    setLoading(false);
  };

  const typeLabels = {
    college: "Collège",
    lycee: "Lycée",
    universite: "Université",
    ecole_privee: "École privée",
    ecole_commerce: "École de commerce",
    ecole_ingenieur: "École d'ingénieurs"
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setShowManualForm(false);
        setSearchQuery("");
        setSuggestions([]);
        setFormData({ name: "", type: "lycee", address: "", city: "", region: "" });
        setError(null);
        setSuccess(false);
      }
    }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Ajouter un établissement</DialogTitle>
        </DialogHeader>

        {success && (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Établissement ajouté ! Il est maintenant visible sur le site.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showManualForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher un établissement officiel</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Tapez le nom de l'établissement..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Recherche dans les bases officielles : collèges, lycées, universités, écoles d'ingénieurs et de commerce
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="border border-slate-200 rounded-lg max-h-80 overflow-y-auto">
                {suggestions.map((establishment, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(establishment)}
                    className="w-full p-4 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">{establishment.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[establishment.type] || establishment.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {establishment.address && `${establishment.address}, `}
                          {establishment.postal_code && `${establishment.postal_code} `}
                          {establishment.city}
                        </p>
                        {establishment.region && (
                          <p className="text-xs text-slate-500 mt-1">{establishment.region}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 3 && !searching && suggestions.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun établissement trouvé dans les bases officielles.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualForm(true)}
                className="w-full"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Ajouter manuellement un établissement
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'établissement *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Lycée Victor Hugo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'établissement *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                  placeholder="Paris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  placeholder="Île-de-France"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                placeholder="12 rue de l'École, 75001 Paris"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowManualForm(false);
                  setFormData({ name: "", type: "lycee", address: "", city: "", region: "" });
                  setError(null);
                }}
              >
                Retour à la recherche
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Envoi en cours..." : "Ajouter l'établissement"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}