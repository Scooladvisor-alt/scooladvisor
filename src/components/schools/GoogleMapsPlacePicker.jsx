import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

export default function GoogleMapsPlacePicker({ open, onOpenChange, onPlaceSelected }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    if (open && mapRef.current) {
      initializeMap();
    }
  }, [open]);

  const initializeMap = async () => {
    setLoading(true);
    try {
      const loader = new Loader({
        apiKey: "GOOGLE_MAPS_API_KEY",
        version: "weekly",
        libraries: ["places"]
      });

      const { Map } = await loader.importLibrary("maps");
      const { Marker } = await loader.importLibrary("marker");
      const { PlacesService } = await loader.importLibrary("places");

      // Centre par défaut sur la France
      const defaultCenter = { lat: 46.603354, lng: 1.888334 };

      const mapInstance = new Map(mapRef.current, {
        center: defaultCenter,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      const markerInstance = new Marker({
        map: mapInstance,
        visible: false
      });

      setMap(mapInstance);
      setMarker(markerInstance);
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
              address: extractStreetAddress(place),
              city: extractCity(place),
              fullAddress: place.formatted_address,
              location: { lat: location.lat(), lng: location.lng() }
            });
          }
        });
      });

    } catch (error) {
      console.error("Error loading Google Maps:", error);
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
    const streetNumber = components.find(c => c.types.includes("street_number"))?.long_name || "";
    const route = components.find(c => c.types.includes("route"))?.long_name || "";
    return `${streetNumber} ${route}`.trim() || place.formatted_address.split(",")[0];
  };

  const extractCity = (place) => {
    const components = place.address_components || [];
    return components.find(c => c.types.includes("locality"))?.long_name || 
           components.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "";
  };

  const handleConfirm = () => {
    if (selectedPlace) {
      onPlaceSelected(selectedPlace);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Rechercher sur Google Maps
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4">
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
                className="pl-9 h-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Carte */}
          <div className="relative w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden border border-slate-200">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Adresse sélectionnée */}
          {selectedPlace && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-slate-900 mb-1">Adresse sélectionnée :</p>
              <p className="text-sm text-slate-700">{selectedPlace.fullAddress}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlace}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Confirmer cette adresse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}