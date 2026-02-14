import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search, AlertCircle, UserIcon } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GoogleMapsPlacePicker({ open, onOpenChange, onPlaceSelected }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [user, setUser] = useState(null);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (open) {
      // Reset d'abord au cas où on réouvre
      mapInitialized.current = false;
      setLoading(true);
      setSelectedPlace(null);
      setSearchQuery("");
      setError(null);
      
      // Charger l'utilisateur
      checkUser();
      
      if (!apiKey) {
        loadApiKey();
      } else {
        // Attendre que le DOM soit prêt puis charger la carte
        setTimeout(() => {
          if (mapRef.current && !mapInitialized.current) {
            initializeMap();
          }
        }, 100);
      }
    } else {
      // Reset complet quand on ferme
      setMap(null);
      setMarker(null);
      setSelectedPlace(null);
      setSearchQuery("");
      setError(null);
      setLoading(true);
      mapInitialized.current = false;
    }
  }, [open]);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  };

  // Charger la carte quand l'API key est disponible
  useEffect(() => {
    if (open && apiKey && mapRef.current && !mapInitialized.current) {
      initializeMap();
    }
  }, [apiKey, open]);

  const loadApiKey = async () => {
    try {
      const response = await base44.functions.invoke('getGoogleMapsApiKey');
      if (response.data?.apiKey) {
        setApiKey(response.data.apiKey);
      } else {
        setError("Clé API Google Maps non disponible");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading API key:", err);
      setError("Impossible de charger Google Maps");
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!apiKey || !mapRef.current || mapInitialized.current) return;

    console.log("🗺️ Initializing Google Maps...");
    setLoading(true);
    setError(null);
    
    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: "weekly",
        libraries: ["places", "geocoding", "marker"]
      });

      await loader.load();
      
      // Centre par défaut sur la France
      const defaultCenter = { lat: 46.603354, lng: 1.888334 };

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      const markerInstance = new google.maps.Marker({
        map: mapInstance,
        visible: false,
        draggable: false
      });

      console.log("✅ Google Maps initialized successfully");
      
      setMap(mapInstance);
      setMarker(markerInstance);
      mapInitialized.current = true;
      setLoading(false);

      // Click sur la carte pour placer un marqueur et récupérer l'adresse
      mapInstance.addListener("click", async (e) => {
        const location = e.latLng;
        markerInstance.setPosition(location);
        markerInstance.setVisible(true);

        // Géocodage inverse pour obtenir l'adresse
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === "OK" && results[0]) {
            const place = results[0];
            setSelectedPlace({
              name: place.name || "",
              address: extractStreetAddress(place),
              city: extractCity(place),
              fullAddress: place.formatted_address,
              location: { lat: location.lat(), lng: location.lng() }
            });
          }
        });
      });

    } catch (err) {
      console.error("Error loading Google Maps:", err);
      setError("Erreur lors du chargement de Google Maps");
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;

    const service = new google.maps.places.PlacesService(map);

    service.textSearch(
      {
        query: searchQuery,
        region: "fr"
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
          const place = results[0];
          const location = place.geometry.location;

          map.setCenter(location);
          map.setZoom(17);
          marker.setPosition(location);
          marker.setVisible(true);

          setSelectedPlace({
            name: place.name || "",
            address: extractStreetAddress(place),
            city: extractCity(place),
            fullAddress: place.formatted_address,
            location: { lat: location.lat(), lng: location.lng() }
          });
        }
      }
    );
  };

  const extractStreetAddress = (place) => {
    const components = place.address_components || [];
    const streetNumber = components.find((c) => c.types.includes("street_number"))?.long_name || "";
    const route = components.find((c) => c.types.includes("route"))?.long_name || "";
    return `${streetNumber} ${route}`.trim() || place.formatted_address.split(",")[0];
  };

  const extractCity = (place) => {
    const components = place.address_components || [];
    
    // Essayer plusieurs types pour maximiser les chances de trouver la ville
    let city = components.find((c) => c.types.includes("locality"))?.long_name ||
    components.find((c) => c.types.includes("postal_town"))?.long_name ||
    components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name ||
    components.find((c) => c.types.includes("sublocality"))?.long_name ||
    components.find((c) => c.types.includes("sublocality_level_1"))?.long_name || "";
    
    // Si toujours vide, essayer d'extraire depuis formatted_address
    if (!city && place.formatted_address) {
      // Format typique: "Adresse, 77680 Roissy-en-Brie, France"
      const parts = place.formatted_address.split(',').map(p => p.trim());
      
      // Chercher la partie qui contient le code postal (5 chiffres)
      for (let part of parts) {
        const match = part.match(/^\d{5}\s+(.+)$/);
        if (match) {
          city = match[1].trim();
          break;
        }
      }
    }
    
    console.log("🏙️ Ville extraite:", city, "depuis formatted_address:", place.formatted_address);
    return city;
  };

  const handleConfirm = () => {
    if (selectedPlace) {
      console.log("📍 Place confirmed:", selectedPlace);
      console.log("🏙️ City extracted:", selectedPlace.city);
      onPlaceSelected({
        name: selectedPlace.name,
        address: selectedPlace.address,
        city: selectedPlace.city
      });
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleLogin = async () => {
    try {
      const currentUrl = window.location.href;
      await base44.auth.redirectToLogin(currentUrl);
    } catch (error) {
      console.error("Error during login redirect:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl p-0 [&>button]:hidden">
        <div className="p-2 sm:p-3 space-y-2 overflow-y-auto max-h-[95vh]">
          {error && !user &&
          <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          }

          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                ref={searchBoxRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Rechercher un établissement, une adresse..."
                className="pl-9 h-9"
                disabled={!user} />

            </div>
            <Button 
              onClick={handleSearch} 
              size="icon"
              disabled={!user}
              className="h-9 w-9 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Établissement sélectionné - MAINTENANT AU DESSUS */}
          <div className={`p-1.5 rounded-lg border-2 transition-all ${
            selectedPlace 
              ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-lg ${
                selectedPlace 
                  ? 'bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500' 
                  : 'bg-slate-300'
              }`}>
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                {selectedPlace ? (
                  <>
                    {selectedPlace.name && (
                      <p className="text-sm font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent mb-0.5">{selectedPlace.name}</p>
                    )}
                    <p className="text-[10px] sm:text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis">{selectedPlace.fullAddress}</p>
                  </>
                ) : (
                  <p className="text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent italic">📍 Recherchez ou cliquez sur la carte</p>
                )}
              </div>
            </div>
          </div>

          {/* Carte */}
          <div className="relative w-full h-[50vh] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {loading && !user &&
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Chargement...</p>
                </div>
              </div>
            }
            {!user && !loading &&
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm z-10">
                <div className="text-center max-w-sm px-4">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Connexion requise</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Pour utiliser Google Maps et ajouter un établissement, veuillez vous connecter.
                    </p>
                    <Button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white font-semibold">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Se connecter
                    </Button>
                  </div>
                </div>
              </div>
            }
            <div ref={mapRef} className="w-full h-full bg-slate-100" />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} className="h-8 text-xs">
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlace || !user}
              className="h-8 text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white">

              <MapPin className="w-3 h-3 mr-1" />
              Confirmer cette adresse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}