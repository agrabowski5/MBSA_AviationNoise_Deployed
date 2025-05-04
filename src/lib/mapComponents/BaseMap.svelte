<script>
    import mapboxgl from "mapbox-gl";
    import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
    import { onMount } from "svelte";
    import {calculateBoundingBox} from "$lib/mapComponents/mapUtils.js";
    import AircraftAnimation from "$lib/aircraftComponents/Aircraft.svelte"; // New Import for MBSA
    import {
        computePosition,
        autoPlacement,
        offset,
    } from '@floating-ui/dom';
    import ParcelNoiseLayer from "./ParcelNoiseLayer.svelte";
    

    mapboxgl.accessToken = "pk.eyJ1IjoicmZpb3Jpc3RhIiwiYSI6ImNsdWQwcDd0aDFkengybG85eW00eDJqdzEifQ.smRFd5P2IKrDHr5HGsfrGw";

    // Function to project coordinates to screen space
    function projectPolygonCoordinates(coordinates) {
        if (!map) return "";
        return coordinates
            .map(coord => {
                const point = map.project(coord);
                return `${point.x},${point.y}`;
            })
            .join(" ");
    }

    let showAircraftAnimation = true;
    // Define a flight path - customize this based on your needs
    const flightPath = [
        // Starting from what appears to be Logan Airport
        [-71.0202, 42.3643], // Logan Airport
        [-71.0502, 42.3843], // Point 1
        [-71.0802, 42.4043], // Point 2
        [-71.1102, 42.3943], // Point 3
        [-71.1402, 42.3743], // Point 4
        [-71.1702, 42.3543], // Point 5
        [-71.2002, 42.3443], // Point 6
        [-71.0202, 42.3643]  // Back to Logan
    ];
    // Function to start/stop the aircraft animation
    function toggleAircraftAnimation() {
        showAircraftAnimation = !showAircraftAnimation;
    }

    let map;
    let mapViewChanged = 0;

    export let municipalities = [];
    export let selectedMunicipality = null;
    export let comparisonMode = false;
    export let explorationMode = false;
    export let parcelFiles = [];
    $: selectedTownId = selectedMunicipality?.TOWN_ID;
    $: console.log('Selected Municipality:', selectedMunicipality);
    $: console.log('Selected Town ID:', selectedTownId);

    const mapContainerID = "svg-map-container";

    // Tooltip stuff
    let hoveredIndex = -1;
    let showTooltip = false;
    $: hoveredMunicipality = municipalities[hoveredIndex] ?? {};
    let municipalityTooltip;
    let tooltipPosition = {x: 0, y: 0};

    const overallCenter = [-71.05672511293635, 42.35885643076469]
    const overallZoom = 9

    // Change these coordinates to center on Boston and zoom in closer
    const baseCenter = [-71.0589, 42.3601]; // Boston city center coordinates
    const baseZoom = 12; // More zoomed in

    // Logan Airport coordinates
    const loganAirport = [-71.0096, 42.3656];
    
    // Flight paths emanating from Logan Airport to specified destinations
    const flightDestinations = [
        { name: "Northeast", coordinates: [-70.991781, 42.399270] },
        { name: "Southeast", coordinates: [-70.979651, 42.347272] },
        { name: "Southwest1", coordinates: [-71.022613, 42.329350] },
        { name: "Southwest2", coordinates: [-71.054128, 42.339772] },
        { name: "Northwest", coordinates: [-71.041747, 42.382716] }
    ];
    
    // Function to create an intermediate point at a specified distance ratio
    function createIntermediatePoint(start, end, ratio) {
        return [
            start[0] + (end[0] - start[0]) * ratio,
            start[1] + (end[1] - start[1]) * ratio
        ];
    }
    
    // Function to extend a line beyond its destination
    function extendLine(start, end, factor = 5) {
        // Calculate the direction vector
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        
        // Extend the line by the factor
        return [
            end[0] + dx * factor,
            end[1] + dy * factor
        ];
    }
    
    // Create extended flight paths, starting a bit away from the airport
    const extendedFlightPaths = flightDestinations.map(dest => {
        // Create point 15% of the way from airport to destination
        const startPoint = createIntermediatePoint(loganAirport, dest.coordinates, 0.15);
        // Extend the line beyond the destination
        const extendedPoint = extendLine(loganAirport, dest.coordinates);
        
        return {
            name: dest.name,
            path: [startPoint, dest.coordinates, extendedPoint]
        };
    });
    
    // Always show flight paths (removed toggle)
    let showFlightPaths = true;
    
    // Function to add flight paths to the map
    function addFlightPaths() {
        if (!map) return;
        
        // Remove existing flight path layers
        if (map.getLayer('flight-paths')) {
            map.removeLayer('flight-paths');
        }
        if (map.getSource('flight-paths-source')) {
            map.removeSource('flight-paths-source');
        }
        
        // Create GeoJSON features for flight paths
        const flightPathFeatures = extendedFlightPaths.map(route => ({
            type: 'Feature',
            properties: { name: route.name },
            geometry: {
                type: 'LineString',
                coordinates: route.path
            }
        }));
        
        // Add source for flight paths
        map.addSource('flight-paths-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: flightPathFeatures
            }
        });
        
        // Add dotted line layer
        map.addLayer({
            id: 'flight-paths',
            type: 'line',
            source: 'flight-paths-source',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible' // Always visible
            },
            paint: {
                'line-color': '#ffffff',
                'line-width': 1.5,
                'line-opacity': 0.7,
                'line-dasharray': [2, 2] // Dotted line effect
            }
        });
        
    
        
        map.addLayer({
            id: 'airport-marker',
            type: 'circle',
            source: 'airport-source',
            paint: {
                'circle-radius': 5,
                'circle-color': '#ffffff',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#B87A45'
            }
        });
    }
    
    onMount(async () => {
        map = new mapboxgl.Map({
            container: 'map',
            center: baseCenter,
            zoom: baseZoom,
            style: 'mapbox://styles/mapbox/dark-v11',  // Dark theme
            attributionControl: false,
            interactive: true
        });

        await new Promise(resolve => map.on("load", resolve));
        
        // Add flight paths after map loads
        addFlightPaths();
    })

    $: map?.on("move", evt => mapViewChanged++);

    /**
     * Fits the map bounds with specified padding.
     * @param {Object} bounds - The bounds to fit the map to.
     * @param {(number|Object)} padding - The padding as a number or an object with optional top, bottom, left, and right properties.
     */
    function fitBounds(bounds, padding = { padding: 20 }) {
        map.fitBounds(bounds, padding);
    }

    $: filteredMunicipalities = (selectedMunicipality && !explorationMode) ? municipalities.filter(m => {
        return m.Name == selectedMunicipality.Name
    }) : municipalities;

    function dotInteraction(index, evt) {
        console.log('Event type:', evt.type);
        console.log('Municipality clicked:', municipalities[index]);
        if (evt.type === "click") {
            selectedMunicipality = municipalities[index];
            console.log('Setting selectedMunicipality to:', selectedMunicipality);
            console.log('TOWN_ID:', municipalities[index].TOWN_ID);
        }
        // Handle hover events
        if (evt.type === "mouseenter") {
            hoveredIndex = index;
        } else if (evt.type === "mouseleave") {
            hoveredIndex = -1;
        }
    }

    // Add this method to your component
    export function zoomTo(center, zoom) {
        console.log("Zooming map to:", center, zoom);
        if (map) {
            map.flyTo({
                center: center,
                zoom: zoom,
                duration: 1500, // Animation duration in milliseconds
                essential: true
            });
        } else {
            console.error("Map not initialized yet");
        }
    }

</script>

<div class="map-container">
    <div id="map"></div>
    <svg id={mapContainerID} class="overlay">
        {#key mapViewChanged}
            {#each filteredMunicipalities as municipality, index}
                {#if municipality.Geometries.type === "Polygon"}
                    <polygon
                            id={ `polygon-${index}` }
                            points={
                                municipality.Geometries.coordinates.length ?
                                projectPolygonCoordinates(municipality.Geometries.coordinates[0]) : ""
                            }
                            fill="#3498db"
                            stroke="black"
                            stroke-width="1"
                            opacity={municipality.Name == selectedMunicipality?.Name ? '0.6' : (!explorationMode ? '0.5' : '0.3')}
                            class:municipality
                            on:mouseenter={() => {
                                console.log('Mouse enter:', municipality.Name);
                                dotInteraction(index, {type: 'mouseenter'});
                            }}
                            on:mouseleave={() => {
                                console.log('Mouse leave:', municipality.Name);
                                dotInteraction(index, {type: 'mouseleave'});
                            }}
                            on:click={() => {
                                console.log('Click:', municipality.Name);
                                dotInteraction(index, {type: 'click'});
                            }}
                    >
<!--                        <title> { municipality.Name } </title>-->
                    </polygon>
                {:else if municipality.Geometries.type === 'MultiPolygon'}
                    {#each municipality.Geometries.coordinates as geometry}
                        <polygon
                                id={ `polygon-${index}` }
                                points={
                                    municipality.Geometries.coordinates.length ?
                                    projectPolygonCoordinates(geometry[0]) : ""
                                }
                                fill="#3498db"
                                stroke="black"
                                stroke-width="1"
                                opacity={municipality.Name == selectedMunicipality?.Name ? '0.6' : (!explorationMode ? '0.5' : '0.3')}
                                class:municipality
                                on:mouseenter={() => {
                                    console.log('Mouse enter:', municipality.Name);
                                    dotInteraction(index, {type: 'mouseenter'});
                                }}
                                on:mouseleave={() => {
                                    console.log('Mouse leave:', municipality.Name);
                                    dotInteraction(index, {type: 'mouseleave'});
                                }}
                                on:click={() => {
                                    console.log('Click:', municipality.Name);
                                    dotInteraction(index, {type: 'click'});
                                }}
                        >
<!--                            <title> { municipality.Name } </title>-->
                        </polygon>
                    {/each}
                {/if}
            {/each}
        {/key}
    </svg>
</div>

<!-- Add the aircraft animation component -->
{#if map}
    <AircraftAnimation 
        {map} 
        active={showAircraftAnimation} 
        flightPath={flightPath}
    />
    <ParcelNoiseLayer {map} />
{/if}


<style>
    @import url("$lib/global.css");

    /* Your existing styles */
    
    :global(.aircraft-toggle-btn) {
        margin: 10px;
        padding: 8px 16px;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    }
    
    :global(.aircraft-toggle-btn:hover) {
        background-color: #f0f0f0;
    }

    .map-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    #map {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
        cursor: grab;
    }

    .municipality {
        pointer-events: auto;
        cursor: pointer;
    }

    dl.info {
        z-index: 2;
        display: grid;
        grid-template-columns: auto auto; /* Define two columns */
        grid-auto-rows: auto; /* This will create a new row for each term/description pair */
        gap: 0.5em; /* Adjust the gap between items */
        align-items: start;
        position: fixed; /* Ensure it's positioned in relation to the SVG or a relative container */
        top: 10px;
        left: 10px;
        background-color: rgba(10, 0, 0, 0.4); /* Semi-transparent background */
        backdrop-filter: blur(10px);
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Soft shadow for better readability */
        font-size: 0.9em;
        padding: 1em;
        transition-duration: 500ms;
        transition-property: opacity, visibility;

        font-family: 'Montserrat', sans-serif;
        visibility: visible;
        width: 250px;
        color: #a9987a;

        &[hidden]:not(:hover, :focus-within) {
            opacity: 0;
            visibility: hidden;
        }
    }

    dl.info dt {
        font-weight: bold; /* Makes text bold */
    }
</style>
