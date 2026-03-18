import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Fonction pour détecter si une adresse est en France via OpenStreetMap Nominatim (gratuit, pas de clé API)
async function isLocationInFrance(city, address) {
    const searchQuery = `${city}, ${address}`.trim();
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=1`,
            {
                headers: {
                    'User-Agent': 'ScoolAdvisor/1.0'
                }
            }
        );
        
        if (!response.ok) {
            console.log("Nominatim API error, defaulting to France");
            return true; // En cas d'erreur, on considère que c'est en France
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].address) {
            const country = data[0].address.country;
            const countryCode = data[0].address.country_code;
            
            console.log(`Detected country: ${country} (${countryCode}) for "${searchQuery}"`);
            
            // Vérifier si c'est la France
            if (countryCode === 'fr' || country?.toLowerCase() === 'france') {
                return true;
            }
            return false;
        }
        
        // Si aucun résultat, on vérifie manuellement avec des patterns connus
        return checkFrenchPatterns(city, address);
        
    } catch (error) {
        console.error("Error calling Nominatim:", error);
        return checkFrenchPatterns(city, address);
    }
}

// Vérification de secours avec des patterns français connus
function checkFrenchPatterns(city, address) {
    const fullText = `${city} ${address}`.toLowerCase();
    
    // Indicateurs de France (codes postaux français, régions, etc.)
    const frenchIndicators = [
        /\b\d{5}\b/, // Code postal français à 5 chiffres
        /\bfrance\b/,
        /\bparis\b/,
        /\blyon\b/,
        /\bmarseille\b/,
        /\btoulouse\b/,
        /\bnice\b/,
        /\bnantes\b/,
        /\bstrasbourg\b/,
        /\bmontpellier\b/,
        /\bbordeaux\b/,
        /\blille\b/,
        /\brennes\b/,
        /\breims\b/,
        /\ble havre\b/,
        /\bsaint-étienne\b/,
        /\btoulon\b/,
        /\bgrenoble\b/,
        /\bdijon\b/,
        /\bangers\b/,
        /\bnîmes\b/,
        /\bîle-de-france\b/,
        /\bauvergne\b/,
        /\bbrittany\b/,
        /\bbretagne\b/,
        /\bnormandie\b/,
        /\bprovence\b/,
        /\boccitanie\b/
    ];
    
    // Indicateurs internationaux
    const internationalIndicators = [
        /\bunited states\b/,
        /\busa\b/,
        /\bunited kingdom\b/,
        /\buk\b/,
        /\bengland\b/,
        /\bgermany\b/,
        /\bspain\b/,
        /\bitaly\b/,
        /\bcanada\b/,
        /\bbelgium\b/,
        /\bswitzerland\b/,
        /\bluxembourg\b/,
        /\bnetherlands\b/,
        /\blondon\b/,
        /\bnew york\b/,
        /\bberlin\b/,
        /\bmadrid\b/,
        /\bbarcelona\b/,
        /\brome\b/,
        /\bmilan\b/,
        /\bamsterdam\b/,
        /\bbrussels\b/,
        /\bbruxelles\b/,
        /\bgeneva\b/,
        /\bgenève\b/,
        /\bzurich\b/,
        /\bdubai\b/,
        /\bsingapore\b/,
        /\bhong kong\b/,
        /\btokyo\b/,
        /\bshanghai\b/,
        /\bbeijing\b/,
        /\bsydney\b/,
        /\bmelbourne\b/,
        /\bmontreal\b/,
        /\btoronto\b/,
        /\bvancouver\b/
    ];
    
    // Si on trouve un indicateur international, c'est international
    for (const pattern of internationalIndicators) {
        if (pattern.test(fullText)) {
            return false; // Pas en France
        }
    }

    // Ajout de détection de pays générique (noms de pays en anglais/français courants)
    const countryPatterns = [
        /\b(deutschland|italia|españa|maroc|tunisie|algérie|china|japan|korea|australia|brasil|russia|india)\b/i
    ];
    
    for (const pattern of countryPatterns) {
        if (pattern.test(fullText)) {
            return false;
        }
    }
    
    // Si on trouve un indicateur français, c'est en France
    for (const pattern of frenchIndicators) {
        if (pattern.test(fullText)) {
            return true; // En France
        }
    }
    
    // Par défaut, on considère que c'est en France
    return true;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Récupérer les données de l'école depuis le body
        const { schoolId } = await req.json();
        
        if (!schoolId) {
            return Response.json({ error: 'schoolId is required' }, { status: 400 });
        }
        
        // Récupérer l'école
        const schools = await base44.asServiceRole.entities.School.filter({ id: schoolId });
        
        if (!schools || schools.length === 0) {
            return Response.json({ error: 'School not found' }, { status: 404 });
        }
        
        const school = schools[0];
        
        // Vérifier si l'école est en France
        const isInFrance = await isLocationInFrance(school.city || '', school.address || '');
        
        // Mettre à jour la région
        const newRegion = isInFrance ? '' : 'International';
        
        // Seulement mettre à jour si la région change (ou si c'était "international" minuscule)
        if (school.region !== newRegion && school.region !== 'International') {
            await base44.asServiceRole.entities.School.update(schoolId, {
                region: newRegion
            });
            
            console.log(`School "${school.name}" region updated to: ${newRegion || 'France (empty)'}`);
        }
        
        return Response.json({
            success: true,
            schoolId: schoolId,
            schoolName: school.name,
            city: school.city,
            isInFrance: isInFrance,
            region: newRegion || 'France'
        });
        
    } catch (error) {
        console.error("Error in detectInternationalSchool:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});