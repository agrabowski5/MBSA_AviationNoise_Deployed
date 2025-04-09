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
    
    // Many points for ultra-smooth animation
    departure: [
      loganAirport,           // Starting at Logan
      [-71.0075, 42.3670],    // Immediate takeoff roll
      [-71.0055, 42.3690],    // Lifting off
      [-71.0035, 42.3710],    // Initial climb
      [-71.0015, 42.3730],    // Continuing climb
      [-70.9995, 42.3750],    // Banking slightly northeast
      [-70.9975, 42.3780],    // Climbing over water
      [-70.9955, 42.3810],    // Establishing climb path
      [-70.9935, 42.3840],    // Steady climb
      [-70.9915, 42.3870],    // Climbing through 500ft
      [-70.9895, 42.3900],    // Accelerating
      [-70.9875, 42.3930],    // Banking more northeast
      [-70.9855, 42.3960],    // Climbing through 1000ft
      [-70.9835, 42.3990],    // Continuing climb
      [-70.9815, 42.4020],    // Setting course
      [-70.9795, 42.4050],    // Stabilizing heading
      [-70.9775, 42.4080],    // Climbing through 1500ft
      [-70.9755, 42.4110],    // Steady climb
      [-70.9735, 42.4140],    // Setting cruise climb
      [-70.9715, 42.4170],    // Banking northeast
      [-70.9695, 42.4200],    // Continuing climb
      [-70.9675, 42.4230],    // Steady northeast course
      [-70.9655, 42.4260],    // Climbing through 2000ft
      [-70.9635, 42.4290],    // Level acceleration
      [-70.9615, 42.4320],    // Setting cruise speed
      [-70.9595, 42.4350],    // Maintaining course
      [-70.9575, 42.4380],    // Climbing through 2500ft
      [-70.9550, 42.4410],    // Steady climb
      [-70.9525, 42.4440],    // Approaching cruise altitude
      [-70.9500, 42.4470],    // Final climb
      [-70.9475, 42.4500],    // Reaching cruise altitude
      [-70.9450, 42.4530],    // Steady cruise
      [-70.9425, 42.4560],    // Maintaining northeast course
      [-70.9400, 42.4590],    // Cruising
      [-70.9375, 42.4620],    // Steady flight
      [-70.9350, 42.4650],    // Continuing northeast
      [-70.9325, 42.4680],    // Maintaining altitude
      [-70.9300, 42.4710],    // Following coastal route
      [-70.9270, 42.4740],    // Flying over coastline
      [-70.9240, 42.4770],    // Steady course
      [-70.9210, 42.4800],    // Maintaining altitude
      [-70.9180, 42.4830],    // Cruising over ocean
      [-70.9150, 42.4860],    // Following shore
      [-70.9120, 42.4890],    // Steady northeast heading
      [-70.9090, 42.4920],    // Continuing on course
      [-70.9060, 42.4950],    // Maintaining cruise altitude
      [-70.9030, 42.4980],    // Beginning to turn more northerly
      [-70.9000, 42.5010],    // Adjusting course
      [-70.8970, 42.5040],    // Flying north-northeast
      [-70.8940, 42.5070],    // Maintaining heading
      [-70.8910, 42.5100],    // Beginning descent
      [-70.8880, 42.5130],    // Initial descent
      [-70.8850, 42.5160],    // Descending through 2500ft
      [-70.8820, 42.5190],    // Continuing descent
      [-70.8790, 42.5220],    // Descending through 2000ft
      [-70.8760, 42.5250],    // Steady descent
      [-70.8730, 42.5280],    // Approaching Cape Ann area
      [-70.8700, 42.5310],    // Descending through 1500ft
      [-70.8670, 42.5340],    // Setting up approach
      [-70.8640, 42.5370],    // Adjusting for final approach
      [-70.8610, 42.5400],    // Descending through 1000ft
      [-70.8580, 42.5430],    // Final approach
      [-70.8550, 42.5460],    // Short final
      [-70.8520, 42.5490],    // Descending through 500ft
      [-70.8490, 42.5520],    // Final descent
      [-70.8460, 42.5550],    // Approaching destination
      [-70.8430, 42.5580],    // Very close
      [-70.8400, 42.5610],    // Almost there
      [-70.8370, 42.5640],    // Final approach fix
      [-70.8340, 42.5670],    // Touch down
      [-70.8310, 42.5700],    // Rolling out
      [-70.8280, 42.5730],    // Slowing down
      [-70.8250, 42.5760],    // Approaching final position
      [-70.8220, 42.5790],    // Taxiing
      [-70.8190, 42.5820],    // Final approach
      [-70.8160, 42.5850],    // Nearly there
      [-70.8130, 42.5880],    // Last segment
      [-70.8100, 42.5910],    // Final approach
      [-70.8070, 42.5940],    // Almost at destination
      [-70.8040, 42.5970],    // Last stretch
      [-70.8010, 42.6000],    // Final segment
      [-70.859136, 42.603925] // Final destination (Gloucester/Cape Ann)
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