/**
 * AirportRoutes.js
 * Defines realistic aircraft routes for landing and takeoff at Boston Logan Airport
 */

// Logan Airport coordinates
export const loganAirport = [-71.0096, 42.3656];

// Delay at airport in milliseconds (3 minutes)
export const airportStayDuration = 180000;

// Flight paths for different scenarios
export const flightRoutes = {
  // Enhanced smooth flight path from Logan Airport to Hull/Pemberton Point
  loganToHullSmooth: {
    arrival: [loganAirport], // Starting at the airport
    
    // Many more points for ultra-smooth animation
    departure: [
      loganAirport,           // Starting at Logan
      [-71.0075, 42.3650],    // Immediate takeoff roll
      [-71.0065, 42.3640],    // Lifting off
      [-71.0055, 42.3630],    // Initial climb
      [-71.0045, 42.3620],    // Continuing climb
      [-71.0035, 42.3610],    // Banking slightly southeast
      [-71.0025, 42.3600],    // Climbing over water
      [-71.0010, 42.3590],    // Establishing climb path
      [-71.0000, 42.3580],    // Steady climb
      [-70.9980, 42.3565],    // Climbing through 500ft
      [-70.9960, 42.3550],    // Accelerating
      [-70.9940, 42.3535],    // Banking more southeast
      [-70.9920, 42.3520],    // Climbing through 1000ft
      [-70.9900, 42.3505],    // Continuing climb
      [-70.9880, 42.3490],    // Setting course
      [-70.9860, 42.3475],    // Stabilizing heading
      [-70.9840, 42.3460],    // Climbing through 1500ft
      [-70.9820, 42.3445],    // Steady climb
      [-70.9800, 42.3430],    // Setting cruise climb
      [-70.9775, 42.3410],    // Banking southeast
      [-70.9750, 42.3390],    // Continuing climb
      [-70.9725, 42.3370],    // Steady southeast course
      [-70.9700, 42.3350],    // Climbing through 2000ft
      [-70.9675, 42.3330],    // Level acceleration
      [-70.9650, 42.3310],    // Setting cruise speed
      [-70.9625, 42.3290],    // Maintaining course
      [-70.9600, 42.3270],    // Climbing through 2500ft
      [-70.9575, 42.3250],    // Steady climb
      [-70.9550, 42.3230],    // Approaching cruise altitude
      [-70.9525, 42.3210],    // Final climb
      [-70.9500, 42.3190],    // Reaching cruise altitude
      [-70.9450, 42.3150],    // Steady cruise
      [-70.9400, 42.3110],    // Maintaining southeast course
      [-70.9350, 42.3070],    // Cruising
      [-70.9300, 42.3030],    // Steady flight
      [-70.9250, 42.2990],    // Continuing toward Hull
      [-70.9200, 42.2950],    // Maintaining altitude
      [-70.9150, 42.2910],    // Starting gradual descent
      [-70.9100, 42.2870],    // Initial descent
      [-70.9050, 42.2830],    // Descending through 2500ft
      [-70.9000, 42.2800],    // Continuing descent
      [-70.8950, 42.2775],    // Descending through 2000ft
      [-70.8900, 42.2750],    // Steady descent
      [-70.8850, 42.2725],    // Approaching Hull
      [-70.8800, 42.2700],    // Descending through 1500ft
      [-70.8750, 42.2675],    // Setting up approach
      [-70.8700, 42.2650],    // Final approach setup
      [-70.8650, 42.2625],    // Descending through 1000ft
      [-70.8600, 42.2600],    // Final approach
      [-70.8550, 42.2575],    // Short final
      [-70.8500, 42.2550],    // Descending through 500ft
      [-70.8450, 42.2525],    // Final descent
      [-70.8400, 42.2500],    // Approaching destination
      [-70.8375, 42.2475],    // Very close
      [-70.8350, 42.2450],    // Almost there
      [-70.8325, 42.2425],    // Final approach fix
      [-70.830, 42.240],      // Touch down
      [-70.827028, 42.238021] // Final destination (Hull)
    ]
  },
  
  // NEW ROUTE: Flight path from Logan to Gloucester/Cape Ann
  loganToGloucester: {
    arrival: [loganAirport], // Starting at the airport
    
    // Updated points for ultra-smooth animation through the Northeast point
    departure: [
      [-71.0096, 42.3656],          // Logan Airport (starting point)
  [-71.0077901, 42.3694517],
  [-71.0059801, 42.3733034],
  [-71.0041702, 42.3771551],
  [-71.0023602, 42.3810068],
  [-71.0005503, 42.3848585],
  [-70.9987404, 42.3887102],
  [-70.9969304, 42.3925619],
  [-70.9951205, 42.3964136],
  [-70.993781, 42.399270],       // Exact Northeast point (target)
  [-70.9919730, 42.4031241],
  [-70.9901651, 42.4069782],
  [-70.9883571, 42.4108323],
  [-70.9865492, 42.4146864],
  [-70.9847412, 42.4185405],
  [-70.9829333, 42.4223946],
  [-70.9811253, 42.4262487],
  [-70.9793174, 42.4301028],
  [-70.9775094, 42.4339569],
  [-70.9757015, 42.4378110],
  [-70.9738935, 42.4416651],
  [-70.9720856, 42.4455192],
  [-70.9702776, 42.4493733],
  [-70.9684697, 42.4532274],
  [-70.9666617, 42.4570815],
  [-70.9648538, 42.4609356],
  [-70.9630458, 42.4647897],
  [-70.9612379, 42.4686438],
  [-70.9594299, 42.4724979],
  [-70.9576220, 42.4763520],
  [-70.9558140, 42.4802061],
  [-70.9540061, 42.4840602],
  [-70.9521981, 42.4879143],
  [-70.9503902, 42.4917684],
  [-70.9485822, 42.4956225],
  [-70.9467743, 42.4994766],
  [-70.9449663, 42.5033307],
  [-70.9431584, 42.5071848],
  [-70.9413504, 42.5110389],
  [-70.9395425, 42.5148930],
  [-70.9377345, 42.5187471],
  [-70.9359266, 42.5226012],
  [-70.9341186, 42.5264553],
  [-70.9323107, 42.5303094],
  [-70.9305027, 42.5341635],
  [-70.9286948, 42.5380176],
  [-70.9268868, 42.5418717],
  [-70.9250789, 42.5457258],
  [-70.9232709, 42.5495799],
  [-70.9214630, 42.5534340],
  [-70.9196550, 42.5572881],
  [-70.9178471, 42.5611422]
    ]
  }
};

// Utility function to calculate the complete route including waiting at airport
export function getCompleteRoute(routeName, waitAtAirport = true, stayAtDestination = false) {
  if (!flightRoutes[routeName]) {
    console.error(`Route '${routeName}' not found`);
    return [];
  }
  
  const { arrival, departure } = flightRoutes[routeName];
  
  // For cases where we want the aircraft to stay at the final destination
  if (stayAtDestination && departure.length === 1) {
    // Just arrival + many copies of the destination point
    const waitingPoints = Array(20).fill(loganAirport);
    return [...arrival, ...waitingPoints];
  }
  
  // If no waiting, just connect arrival and departure
  if (!waitAtAirport) {
    return [...arrival, ...departure.slice(1)]; // Skip first point of departure to avoid duplicate
  }
  
  // With waiting, add multiple copies of the airport point
  const waitingPoints = Array(10).fill(loganAirport);
  
  return [...arrival, ...waitingPoints, ...departure.slice(1)];
}

// Usage example:
// const completeRoute = getCompleteRoute('westArrival');