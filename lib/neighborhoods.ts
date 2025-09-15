// lib/neighborhoods.ts - București Neighborhoods Detection & Local Tips
export type City = {
  id: string;
  name: string;
  nameEn: string;
  polygon: [number, number][]; // [lat, lon]
};

export interface Neighborhood {
  id: string;
  name: string;
  nameEn: string;
  center: { lat: number; lon: number };
  radius: number; // meters
  description: string;
  descriptionEn: string;
  landmarks: string[];
  weatherTips: {
    sunny: string[];
    rainy: string[];
    cold: string[];
    hot: string[];
  };
  weatherTipsEn: {
    sunny: string[];
    rainy: string[];
    cold: string[];
    hot: string[];
  };
  localSpots: {
    terraces: string[];
    indoor: string[];
    parks: string[];
    culture: string[];
  };
}

export const BUCHAREST_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: 'centrul-vechi',
    name: 'Centrul Vechi',
    nameEn: 'Old Town',
    center: { lat: 44.4301, lon: 26.1063 },
    radius: 800,
    description: 'Inima istorică a Bucureștiului',
    descriptionEn: 'Historic heart of Bucharest',
    landmarks: ['Curtea Veche', 'Hanul lui Manuc', 'Strada Lipscani'],
    weatherTips: {
      sunny: [
        'Caru\' cu Bere are terasă perfectă pentru vremea asta!',
        'Pasajul Macca-Vilacrosse oferă umbră dacă se înfierbântă',
        'Terasele din Lipscani sunt ideale pentru o cafea'
      ],
      rainy: [
        'Hanul lui Manuc are arcade acoperite',
        'Pasajul Macca-Vilacrosse te protejează de ploaie',
        'Muzeul Curtea Veche e perfect pentru o zi ploioasă'
      ],
      cold: [
        'Crama Domnească e caldă și atmosferică',
        'Cafenelele din Lipscani au încălzire bună',
        'Centrul Vechi are multe spații interioare'
      ],
      hot: [
        'Pasajul Macca-Vilacrosse e cel mai răcoros loc',
        'Terasele cu umbră din Lipscani sunt perfecte',
        'Evită pavajul - caută umbra clădirilor'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Caru\' cu Bere has a perfect terrace for this weather!',
        'Macca-Vilacrosse Passage offers shade if it gets too hot',
        'Lipscani terraces are ideal for coffee'
      ],
      rainy: [
        'Hanul lui Manuc has covered arcades',
        'Macca-Vilacrosse Passage protects from rain',
        'Curtea Veche Museum is perfect for a rainy day'
      ],
      cold: [
        'Crama Domnească is warm and atmospheric',
        'Lipscani cafes have good heating',
        'Old Town has many indoor spaces'
      ],
      hot: [
        'Macca-Vilacrosse Passage is the coolest spot',
        'Shaded terraces in Lipscani are perfect',
        'Avoid the pavement - seek building shade'
      ]
    },
    localSpots: {
      terraces: ['Caru\' cu Bere', 'Hanul lui Manuc', 'Lipscani 9'],
      indoor: ['Muzeul Curtea Veche', 'Crama Domnească', 'Pasajul Macca-Vilacrosse'],
      parks: [],
      culture: ['Muzeul Curtea Veche', 'Biserica Stavropoleos', 'Hanul lui Manuc']
    }
  },
  {
    id: 'herastrau',
    name: 'Herăstrău',
    nameEn: 'Herastrau',
    center: { lat: 44.4672, lon: 26.0824 },
    radius: 1200,
    description: 'Zona verde premium cu parcul cel mai mare',
    descriptionEn: 'Premium green area with the largest park',
    landmarks: ['Parcul Herăstrău', 'Arcul de Triumf', 'Muzeul Satului'],
    weatherTips: {
      sunny: [
        'Parcul Herăstrău e perfect pentru plimbări însorite',
        'Terasele de pe lac au vedere spectaculoasă',
        'Aleile cu copaci oferă umbră naturală'
      ],
      rainy: [
        'Muzeul Satului are multe clădiri acoperite',
        'Cafenelele din parc au terase acoperite',
        'Evită aleile principale - sunt alunecoase'
      ],
      cold: [
        'Plimbarea rapidă pe lac încălzește',
        'Cafenelele din parc au încălzire',
        'Aleile protejate de vânt sunt mai calde'
      ],
      hot: [
        'Umbra copacilor seculari e perfectă',
        'Briza de pe lac răcorește',
        'Evită zonele deschise la amiază'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Herăstrău Park is perfect for sunny walks',
        'Lake terraces have spectacular views',
        'Tree-lined paths offer natural shade'
      ],
      rainy: [
        'Village Museum has many covered buildings',
        'Park cafes have covered terraces',
        'Avoid main paths - they\'re slippery'
      ],
      cold: [
        'Brisk walk around the lake warms you up',
        'Park cafes have heating',
        'Wind-protected paths are warmer'
      ],
      hot: [
        'Shade of ancient trees is perfect',
        'Lake breeze provides cooling',
        'Avoid open areas at noon'
      ]
    },
    localSpots: {
      terraces: ['Terasa Herăstrău', 'Berăria H', 'Casa Doina'],
      indoor: ['Muzeul Satului', 'Casa Vernescu', 'Cafenelele din parc'],
      parks: ['Parcul Herăstrău', 'Aleile cu copaci', 'Zona lacului'],
      culture: ['Muzeul Satului', 'Casa Vernescu', 'Arcul de Triumf']
    }
  },
  {
    id: 'calea-victoriei',
    name: 'Calea Victoriei',
    nameEn: 'Calea Victoriei',
    center: { lat: 44.4378, lon: 26.0969 },
    radius: 600,
    description: 'Bulevard istoric cu arhitectură elegantă',
    descriptionEn: 'Historic boulevard with elegant architecture',
    landmarks: ['Ateneul Român', 'Palatul CEC', 'Muzeul de Artă'],
    weatherTips: {
      sunny: [
        'Terasele elegante sunt perfecte pentru prânz',
        'Plimbarea pe Calea Victoriei e spectaculoasă',
        'Grădina Cișmigiu e la 2 minute pentru umbră'
      ],
      rainy: [
        'Galeriile și pasajele te protejează',
        'Muzeele sunt ideale pentru zile ploioase',
        'Cafenelele elegante au atmosferă caldă'
      ],
      cold: [
        'Magazinele și galeriile sunt încălzite',
        'Cafenelele de lux au încălzire excelentă',
        'Plimbarea rapidă între obiective încălzește'
      ],
      hot: [
        'Umbra clădirilor istorice e răcoroasă',
        'Intrările în muzee oferă aer condiționat',
        'Evită asfaltul - aleargă pe trotuare'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Elegant terraces are perfect for lunch',
        'Walking on Calea Victoriei is spectacular',
        'Cișmigiu Garden is 2 minutes away for shade'
      ],
      rainy: [
        'Galleries and passages protect you',
        'Museums are ideal for rainy days',
        'Elegant cafes have warm atmosphere'
      ],
      cold: [
        'Shops and galleries are heated',
        'Luxury cafes have excellent heating',
        'Quick walk between sights warms you up'
      ],
      hot: [
        'Shade of historic buildings is cooling',
        'Museum entrances offer air conditioning',
        'Avoid asphalt - stick to sidewalks'
      ]
    },
    localSpots: {
      terraces: ['Terasa Ateneului', 'Cafeneaua Veche', 'Gradina Verona'],
      indoor: ['Muzeul de Artă', 'Ateneul Român', 'Galeriile Lafayette'],
      parks: ['Grădina Cișmigiu'],
      culture: ['Ateneul Român', 'Muzeul de Artă', 'Palatul CEC']
    }
  },
  {
    id: 'piata-universitatii',
    name: 'Piața Universității',
    nameEn: 'University Square',
    center: { lat: 44.4355, lon: 26.1010 },
    radius: 500,
    description: 'Centrul academic și cultural',
    descriptionEn: 'Academic and cultural center',
    landmarks: ['Universitatea din București', 'Teatrul Național', 'Intercontinental'],
    weatherTips: {
      sunny: [
        'Terasele din jurul pieței sunt animate',
        'Grădina Cișmigiu e foarte aproape',
        'Plimbarea spre Centrul Vechi e plăcută'
      ],
      rainy: [
        'Teatrul Național are foaier elegant',
        'Pasajele subterane conectează zonele',
        'Cafenelele din Universitate sunt calduroase'
      ],
      cold: [
        'Clădirile universitare sunt încălzite',
        'Cafenelele studențești sunt primitoare',
        'Metroul e la 2 minute pentru încălzire'
      ],
      hot: [
        'Umbra clădirilor mari e perfectă',
        'Fântânile din piață răcoresc aerul',
        'Evită piața la amiază - caută umbra'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Terraces around the square are lively',
        'Cișmigiu Garden is very close',
        'Walk to Old Town is pleasant'
      ],
      rainy: [
        'National Theatre has elegant foyer',
        'Underground passages connect areas',
        'University cafes are cozy'
      ],
      cold: [
        'University buildings are heated',
        'Student cafes are welcoming',
        'Metro is 2 minutes away for warmth'
      ],
      hot: [
        'Shade of large buildings is perfect',
        'Square fountains cool the air',
        'Avoid square at noon - seek shade'
      ]
    },
    localSpots: {
      terraces: ['Terasa Intercontinental', 'Cafeneaua Universității', 'Gradina Verona'],
      indoor: ['Teatrul Național', 'Universitatea', 'Librăriile din zonă'],
      parks: ['Grădina Cișmigiu'],
      culture: ['Teatrul Național', 'Universitatea', 'Muzeul de Istorie']
    }
  },
  {
    id: 'piata-romana',
    name: 'Piața Romană',
    nameEn: 'Roman Square',
    center: { lat: 44.4513, lon: 26.0857 },
    radius: 600,
    description: 'Zonă comercială vibrantă cu multe cafenele',
    descriptionEn: 'Vibrant commercial area with many cafes',
    landmarks: ['Piața Romană', 'Parcul Icoanei', 'Strada Dorobanti'],
    weatherTips: {
      sunny: [
        'Terasele din Piața Romană sunt perfecte',
        'Parcul Icoanei oferă umbră și verdeață',
        'Strada Dorobanti e ideală pentru shopping'
      ],
      rainy: [
        'Galeriile comerciale te protejează',
        'Cafenelele din zonă sunt calduroase',
        'Metroul e foarte aproape'
      ],
      cold: [
        'Magazinele sunt încălzite perfect',
        'Cafenelele au atmosferă caldă',
        'Plimbarea rapidă între magazine încălzește'
      ],
      hot: [
        'Parcul Icoanei are umbră excelentă',
        'Cafenelele cu aer condiționat sunt perfecte',
        'Evită asfaltul - aleargă pe aleile din parc'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Roman Square terraces are perfect',
        'Icoanei Park offers shade and greenery',
        'Dorobanti Street is ideal for shopping'
      ],
      rainy: [
        'Commercial galleries protect you',
        'Local cafes are cozy',
        'Metro is very close'
      ],
      cold: [
        'Shops are perfectly heated',
        'Cafes have warm atmosphere',
        'Quick walk between shops warms you up'
      ],
      hot: [
        'Icoanei Park has excellent shade',
        'Air-conditioned cafes are perfect',
        'Avoid asphalt - stick to park paths'
      ]
    },
    localSpots: {
      terraces: ['Terasa Romană', 'Cafenelele din Dorobanti', 'Parcul Icoanei'],
      indoor: ['Galeriile comerciale', 'Cafenelele din zonă', 'Magazinele'],
      parks: ['Parcul Icoanei'],
      culture: ['Teatrul Nottara', 'Galeriile de artă']
    }
  },
  {
    id: 'baneasa',
    name: 'Băneasa',
    nameEn: 'Baneasa',
    center: { lat: 44.5041, lon: 26.0824 },
    radius: 1000,
    description: 'Zonă rezidențială premium cu spații verzi',
    descriptionEn: 'Premium residential area with green spaces',
    landmarks: ['Băneasa Shopping City', 'Pădurea Băneasa', 'Aeroportul Băneasa'],
    weatherTips: {
      sunny: [
        'Pădurea Băneasa e perfectă pentru plimbări',
        'Terasele din Băneasa Shopping sunt excelente',
        'Zonele verzi oferă aer curat'
      ],
      rainy: [
        'Băneasa Shopping City e imens și acoperit',
        'Cafenelele din mall sunt calduroase',
        'Evită pădurea când plouă'
      ],
      cold: [
        'Mall-ul are încălzire excelentă',
        'Plimbarea rapidă în pădure încălzește',
        'Restaurantele sunt calduroase'
      ],
      hot: [
        'Pădurea oferă umbră naturală perfectă',
        'Mall-ul are aer condiționat',
        'Evită zonele asfaltate'
      ]
    },
    weatherTipsEn: {
      sunny: [
        'Baneasa Forest is perfect for walks',
        'Baneasa Shopping terraces are excellent',
        'Green areas offer clean air'
      ],
      rainy: [
        'Baneasa Shopping City is huge and covered',
        'Mall cafes are cozy',
        'Avoid the forest when raining'
      ],
      cold: [
        'Mall has excellent heating',
        'Brisk forest walk warms you up',
        'Restaurants are warm'
      ],
      hot: [
        'Forest offers perfect natural shade',
        'Mall has air conditioning',
        'Avoid paved areas'
      ]
    },
    localSpots: {
      terraces: ['Băneasa Shopping terraces', 'Restaurantele din zonă'],
      indoor: ['Băneasa Shopping City', 'Cafenelele din mall'],
      parks: ['Pădurea Băneasa', 'Zonele verzi'],
      culture: ['Muzeul Aviației', 'Galeriile din mall']
    }
  }
];

export const CITIES: City[] = [
  {
    id: 'bucharest',
    name: 'București',
    nameEn: 'Bucharest',
    // poligon aproximativ al orașului (bounding box suficient pentru MVP)
    polygon: [
      [44.55, 26.02],
      [44.55, 26.25],
      [44.28, 26.25],
      [44.28, 26.02],
    ],
  },
];

// Point-in-polygon algorithm
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

export function detectCity(lat: number, lon: number): City | null {
  for (const c of CITIES) {
    if (pointInPolygon([lat, lon], c.polygon)) return c;
  }
  return null;
}

// Calculate distance between two coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Detect neighborhood based on coordinates
export function detectNeighborhood(lat: number, lon: number): Neighborhood | null {
  for (const neighborhood of BUCHAREST_NEIGHBORHOODS) {
    const distance = haversineDistance(lat, lon, neighborhood.center.lat, neighborhood.center.lon);
    if (distance <= neighborhood.radius) {
      return neighborhood;
    }
  }
  return null;
}

// Get weather-appropriate tip for neighborhood
export function getWeatherTip(neighborhood: Neighborhood, weatherCondition: string, temperature: number, language: 'ro' | 'en' = 'ro'): string {
  const tips = language === 'en' ? neighborhood.weatherTipsEn : neighborhood.weatherTips;
  
  let relevantTips: string[] = [];
  
  if (temperature > 25) {
    relevantTips = tips.hot;
  } else if (temperature < 10) {
    relevantTips = tips.cold;
  } else if (weatherCondition.toLowerCase().includes('rain') || weatherCondition.toLowerCase().includes('ploaie')) {
    relevantTips = tips.rainy;
  } else {
    relevantTips = tips.sunny;
  }
  
  // Return random tip from relevant category
  return relevantTips[Math.floor(Math.random() * relevantTips.length)] || 
    (language === 'en' ? 'Enjoy exploring this beautiful area!' : 'Bucură-te explorând această zonă frumoasă!');
}
