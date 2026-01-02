/**
 * Geographic Constants for Gujarat
 * Used throughout the application for city and taluka management
 */

export const GUJARAT_CITIES = {
  "Ahmedabad (City)": ["Ahmedabad City East", "Ahmedabad City West", "Daskroi", "Sanand", "Bavla", "Dholka", "Viramgam", "Dhandhuka", "Mandal", "Detroj-Rampura"],
  "Surat (City)": ["Surat City", "Chorasi", "Palsana", "Olpad", "Mangrol", "Umarpada", "Bardoli", "Mahuva"],
  "Vadodara (City)": ["Vadodara City", "Vadodara Rural", "Savli", "Waghodia", "Dabhoi", "Padra", "Karjan", "Shinor"],
  "Rajkot (City)": ["Rajkot City", "Rajkot Rural", "Gondal", "Jetpur", "Jasdan", "Lodhika", "Kotda Sangani"],
  "Bhavnagar (City)": ["Bhavnagar City", "Ghogha", "Sihor", "Palitana", "Talaja", "Gariadhar", "Vallabhipur", "Umrala", "Mahuva"],
  "Jamnagar (City)": ["Jamnagar City", "Jamnagar Rural", "Jodiya", "Kalavad", "Lalpur", "Dhrol"],
  "Junagadh (City)": ["Junagadh City", "Vanthali", "Mangrol", "Manavadar", "Visavadar", "Bhesan", "Mendarda"],
  "Gandhinagar (City)": ["Gandhinagar City", "Dehgam", "Kalol", "Mansa"],
  "Anand (City)": ["Anand", "Petlad", "Borsad", "Umreth", "Sojitra", "Tarapur"],
  "Nadiad (City)": ["Nadiad", "Mehmedabad", "Kheda", "Kathlal", "Kapadvanj", "Matar", "Galteshwar"],
  "Mehsana (City)": ["Mehsana", "Kadi", "Visnagar", "Unjha", "Becharaji", "Vadnagar", "Vijapur"],
  "Palanpur (City)": ["Palanpur", "Deesa", "Dhanera", "Tharad", "Kankrej", "Dantiwada", "Amirgadh", "Vadgam"],
  "Bhuj (City)": ["Bhuj", "Anjar", "Mandvi", "Mundra", "Bhachau", "Rapar", "Abdasa", "Nakhatrana", "Lakhpat"],
  "Surendranagar (City)": ["Surendranagar", "Wadhwan", "Dhrangadhra", "Limbdi", "Chotila", "Sayla", "Muli", "Patdi"],
  "Valsad (City)": ["Valsad", "Pardi", "Umbergaon", "Kaprada", "Dharampur"],
  "Navsari (City)": ["Navsari", "Jalalpore", "Gandevi", "Chikhli"],
  "Porbandar (City)": ["Porbandar", "Ranavav", "Kutiyana"],
  "Amreli (City)": ["Amreli", "Babra", "Lathi", "Savarkundla", "Rajula", "Dhari", "Khambha", "Jafrabad"],
  "Dahod (City)": ["Dahod", "Jhalod", "Limkheda", "Devgadh Baria", "Garbada", "Sanjeli"],
  "Godhra (City)": ["Godhra", "Kalol", "Halol", "Shehera", "Morwa Hadaf"],
  "Vyara (City)": ["Vyara", "Songadh", "Nizar", "Uchchhal", "Valod"],
  "Chhota Udaipur (City)": ["Chhota Udaipur", "Jetpur Pavi", "Kavant", "Nasvadi", "Sankheda"],
  "Bharuch (City)": ["Bharuch", "Ankleshwar", "Jambusar", "Jhagadia", "Amod", "Vagra", "Hansot", "Valia"],
  "Ankleshwar (City)": ["Ankleshwar", "Bharuch", "Jhagadia", "Jambusar", "Amod", "Vagra", "Hansot", "Valia"]
};

/**
 * Get all cities
 */
export const getCities = () => Object.keys(GUJARAT_CITIES);

/**
 * Get talukas for a specific city
 */
export const getTalukasForCity = (city) => GUJARAT_CITIES[city] || [];

/**
 * Check if a taluka belongs to a city
 */
export const talukaExistsInCity = (city, taluka) => {
  return GUJARAT_CITIES[city]?.includes(taluka) || false;
};

/**
 * Get all talukas (flattened)
 */
export const getAllTalukas = () => {
  return Object.values(GUJARAT_CITIES).flat();
};

/**
 * Find city that contains a taluka
 */
export const findCityForTaluka = (taluka) => {
  for (const [city, talukas] of Object.entries(GUJARAT_CITIES)) {
    if (talukas.includes(taluka)) {
      return city;
    }
  }
  return null;
};
