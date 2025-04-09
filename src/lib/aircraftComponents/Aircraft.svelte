<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import { getCompleteRoute, loganAirport } from './AirportRoutes.js';

  export let map;
  export let active = true;
  export let routeName = 'loganToGloucester';
  
  export let startPoint = loganAirport;
  
  // Get the base flight path
  let baseFlightPath = getCompleteRoute(routeName); // Reverse the path for landing
  
  // Function to interpolate points for smoother animation
  function interpolatePoints(path, numPointsBetween = 5) {
    if (!path || path.length < 2) return path;
    
    const interpolatedPath = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      // Add the start point
      interpolatedPath.push(start);
      
      // Add interpolated points
      for (let j = 1; j <= numPointsBetween; j++) {
        const fraction = j / (numPointsBetween + 1);
        const lat = start[1] + (end[1] - start[1]) * fraction;
        const lng = start[0] + (end[0] - start[0]) * fraction;
        interpolatedPath.push([lng, lat]);
      }
    }
    
    // Add the final point
    interpolatedPath.push(path[path.length - 1]);
    
    return interpolatedPath;
  }
  
  // Create a much smoother path with many interpolated points
  let flightPath = interpolatePoints(baseFlightPath, 8);
  
  // Rest of component variables
  let aircraftElement;
  let currentPathIndex = 0;
  let isAtAirport = false;
  let isLanding = true;
  
  // Faster durations for more seamless animation
  const normalFlightDuration = 100; // 200ms between points for lots of tiny steps
  const airportApproachDuration = 0; // Slightly slower when near airport
  const waitAtAirportDuration = 0; // Wait 3 seconds at airport before restarting
  
  // Create tweened values for smooth animation with cubic easing
  const aircraftPosition = tweened(flightPath[0], {
    duration: normalFlightDuration,
    easing: cubicInOut
  });
  
  function isNearAirport(index) {
    if (index >= flightPath.length) return false;
    
    const point = flightPath[index];
    const distance = Math.sqrt(
      Math.pow(point[0] - loganAirport[0], 2) + 
      Math.pow(point[1] - loganAirport[1], 2)
    );
    
    // If very close to airport, consider it "at airport"
    isAtAirport = distance < 0.001;
    
    // Return true if we're approaching or at the airport
    return distance < 0.01;
  }
  
  function calculateBearing(start, end) {
    // Convert to radians
    const startLat = start[1] * Math.PI / 180;
    const startLng = start[0] * Math.PI / 180;
    const endLat = end[1] * Math.PI / 180;
    const endLng = end[0] * Math.PI / 180;
    
    // Calculate bearing
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }
  
  // Smoothly animate between points
  function animateToNextPoint() {
    if (!map || !active) return;
    
    // Exit if we've finished the route
    if (currentPathIndex >= flightPath.length - 1) {
      console.log("Flight completed");
      
      // Add landing class if we've just landed
      if (isLanding && aircraftElement) {
        aircraftElement.classList.add('on-ground');
      }
      
      // Restart after a delay
      setTimeout(() => {
        currentPathIndex = 0;
        isLanding = !isLanding; // Toggle direction
        
        // Either reverse the path or use original path
        flightPath = isLanding ? 
          interpolatePoints(baseFlightPath.reverse(), 8) : 
          interpolatePoints(baseFlightPath, 8);
        
        if (aircraftElement) {
          if (isLanding) {
            aircraftElement.classList.remove('on-ground');
            aircraftElement.classList.add('in-flight');
          } else {
            aircraftElement.classList.add('taking-off');
            setTimeout(() => {
              aircraftElement.classList.remove('taking-off');
              aircraftElement.classList.add('in-flight');
            }, 1000);
          }
        }
        
        // Set first position immediately without animation
        aircraftPosition.set(flightPath[0], { duration: 0 }).then(() => {
          // Then start regular animation
          setTimeout(animateToNextPoint, 500);
        });
      }, waitAtAirportDuration);
      return;
    }
    
    const nextIndex = currentPathIndex + 1;
    const nextPoint = flightPath[nextIndex];
    const currentPoint = flightPath[currentPathIndex];
    
    // Only update bearing if points are far enough apart to matter
    const distance = Math.sqrt(
      Math.pow(nextPoint[0] - currentPoint[0], 2) + 
      Math.pow(nextPoint[1] - currentPoint[1], 2)
    );
    
    // If the distance is significant, update aircraft rotation
    if (distance > 0.0001 && aircraftElement) {
      const bearing = calculateBearing(currentPoint, nextPoint);
      
      // Create smoother transitions for rotation
      aircraftElement.style.transition = `transform 0.4s ease-in-out`;
      aircraftElement.style.transform = `rotate(${bearing}deg)`;
      
      // Update appearance when near airport
      if (isNearAirport(nextIndex)) {
        if (isLanding) {
          aircraftElement.classList.add('landing');
        } else {
          aircraftElement.classList.add('taking-off');
        }
      } else {
        aircraftElement.classList.remove('landing');
        aircraftElement.classList.remove('taking-off');
        aircraftElement.classList.remove('on-ground');
        aircraftElement.classList.add('in-flight');
      }
    }
    
    // Determine appropriate duration for this segment
    const isNearAirportNext = isNearAirport(nextIndex);
    const duration = isNearAirportNext ? airportApproachDuration : normalFlightDuration;
    
    // Animate to next point with duration based on status
    aircraftPosition.set(nextPoint, { duration, easing: cubicInOut }).then(() => {
      currentPathIndex = nextIndex;
      
      // Continue immediately to next point - no pauses for smoother motion
      animateToNextPoint();
    });
  }
  
  onMount(() => {
    console.log("Aircraft component mounted");
    
    if (map) {
      createAircraftElement();
      // Start animation after a short delay
      setTimeout(animateToNextPoint, 500);
    }
    
    return () => {
      // Cleanup when component is destroyed
      if (aircraftElement && aircraftElement.parentNode) {
        aircraftElement.parentNode.removeChild(aircraftElement);
      }
    };
  });
  
  function createAircraftElement() {
    if (!map || !map.getCanvasContainer) return;
    
    // Create a DOM element for the aircraft
    const el = document.createElement('div');
    el.className = 'aircraft-marker in-flight';
    
    // Use SVG image instead of emoji
    el.innerHTML = `<div class="aircraft-icon"><img src="/images/Aircraft_PPT.svg" alt="Aircraft" /></div>`;
    el.style.position = 'absolute';
    el.style.zIndex = '9999';
    
    // Add to map
    map.getCanvasContainer().appendChild(el);
    aircraftElement = el;
    console.log("Aircraft element created with SVG image");
  }
  
  // Update aircraft position on the map
  $: if (map && aircraftElement && $aircraftPosition) {
    const point = map.project($aircraftPosition);
    aircraftElement.style.left = `${point.x - 15}px`;
    aircraftElement.style.top = `${point.y - 15}px`;
  }
</script>
  
<style>
  :global(.aircraft-marker) {
    z-index: 999;
    pointer-events: none;
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.5));
  }
  
  :global(.aircraft-icon) {
    transition: transform 0.8s ease-out, opacity 0.6s ease-in;
  }
  
  :global(.aircraft-icon img) {
    width: 32px;
    height: 32px;
    /* Apply 80 degrees counterclockwise rotation */
    transform: rotate(-80deg);
    /* Keep transform origin at center for proper rotation */
    transform-origin: center center;
  }
  
  :global(.aircraft-marker.on-ground .aircraft-icon) {
    transform: scale(0.8);
    opacity: 0.85;
    filter: brightness(0.9);
  }
  
  :global(.aircraft-marker.landing .aircraft-icon) {
    transform: scale(0.9) translateY(0);
    opacity: 0.95;
    animation: descend 1s ease-in-out forwards;
  }
  
  :global(.aircraft-marker.taking-off .aircraft-icon) {
    transform: scale(0.8);
    opacity: 0.9;
    animation: climb 1s ease-out forwards;
  }
  
  :global(.aircraft-marker.in-flight .aircraft-icon) {
    transform: scale(1.1);
    opacity: 1;
  }
  
  @keyframes climb {
    0% {
      transform: scale(0.8) translateY(0);
    }
    100% {
      transform: scale(1.1) translateY(-8px);
    }
  }
  
  @keyframes descend {
    0% {
      transform: scale(1.1) translateY(-8px);
    }
    100% {
      transform: scale(0.8) translateY(0);
    }
  }
</style>