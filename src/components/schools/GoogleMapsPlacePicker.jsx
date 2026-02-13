import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search, AlertCircle } from "lucide-react";
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
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (open) {
      if (!apiKey) {
        loadApiKey();
      } else if (mapRef.current && !map) {
        initializeMap();
      }
    } else {
      // Reset tout quand on ferme
      setMap(null);
      setMarker(null);
      setSelectedPlace(null);
      setSearchQuery("");
      setError(null);
      setLoading(true);
      mapInitialized.current = false;
    }
  }, [open, apiKey, map]);

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
    return components.find((c) => c.types.includes("locality"))?.long_name ||
    components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name || "";
  };

  const handleConfirm = () => {
    if (selectedPlace) {
      console.log("📍 Place confirmed:", selectedPlace);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#FF4D8D]" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Rechercher sur Google Maps
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4">
          {error &&
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
                className="pl-9 h-10" />

            </div>
            <Button onClick={handleSearch} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Carte */}
          <div className="relative w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {loading &&
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Chargement de la carte...</p>
                </div>
              </div>
            }
            <div ref={mapRef} className="w-full h-full bg-slate-100" />
          </div>

          {/* Établissement sélectionné */}
          {selectedPlace &&
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">📍 Établissement sélectionné</p>
                  {selectedPlace.name && (
                    <p className="text-base font-bold text-purple-700 mb-2">{selectedPlace.name}</p>
                  )}
                  <p className="text-sm text-slate-700">{selectedPlace.fullAddress}</p>
                  <p className="text-xs text-slate-500 mt-1">Ville : {selectedPlace.city}</p>
                </div>
              </div>
            </div>
          }

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlace}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white">

              <MapPin className="w-4 h-4 mr-2" />
              Confirmer cette adresse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}