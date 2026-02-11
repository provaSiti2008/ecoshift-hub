
/**
 * Express Endpoint Simulation
 * This code represents the Node.js backend logic requested.
 */

interface CO2CalculationRequest {
  distanceKm: number;
  passengers: number;
  vehicleType: 'car' | 'van';
}

/**
 * Endpoint: POST /api/calculate-co2
 * Logic for Mission 3 impact tracking.
 */
export const calculateCO2 = (req: CO2CalculationRequest) => {
  const { distanceKm, passengers, vehicleType } = req;
  
  // Average CO2 emissions per km (g/km)
  // Standard car: ~120g/km
  const baseEmissions = vehicleType === 'car' ? 120 : 180;
  
  // Savings logic: (Emissions avoided if everyone took a single car separately)
  // minus (Emissions shared by taking one car together)
  const separateEmissions = (passengers + 1) * distanceKm * baseEmissions;
  const sharedEmissions = distanceKm * baseEmissions;
  
  const totalSavedGrams = separateEmissions - sharedEmissions;
  const totalSavedKg = Math.round((totalSavedGrams / 1000) * 10) / 10;
  
  // Eco-Credits: 1 Credit for every 0.5kg saved
  const ecoCredits = Math.floor(totalSavedKg * 2);

  return {
    savedKg: totalSavedKg,
    credits: ecoCredits,
    formula: "Savings = [(Passengers+1) * Dist * Base] - [Dist * Base]"
  };
};
