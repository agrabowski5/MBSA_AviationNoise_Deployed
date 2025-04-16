<script>
    import { onMount } from "svelte";
    import mapboxgl from "mapbox-gl";

    export let map;
    export let selectedTownId = null;
    import * as d3 from "d3";

    // Add this function to manage base path for GitHub Pages deployment
    function getBasePath() {
        // For local development, use empty string
        // For production GitHub Pages, use repository name
        return import.meta.env.BASE_URL || '/';
    }

    const colorMapping = {
        'Pink': '#7e1060',    
        'Orange': '#f9773f',  //neon green
        'Yellow': '#fcc478',  
        'Red': '#b1004d',     
    };

    // Missing noise level mapping definition
    const noiseLevelMapping = {
        'Pink': 'Severe Impact (70+ dB)',
        'Red': 'High Impact (65-70 dB)',
        'Orange': 'Moderate Impact (60-65 dB)',
        'Yellow': 'Slight Impact (55-60 dB)'
    };

    // Missing noise level descriptions
    const noiseLevelDescriptions = {
        'Pink': 'Severe Impact (70+ dB)',
        'Red': 'High Impact (65-70 dB)',
        'Orange': 'Moderate Impact (60-65 dB)',
        'Yellow': 'Slight Impact (55-60 dB)'
    };

    let isLoading = false;
    let loadedTowns = 0;
    let totalTowns = 0;
    let directoryMap = null;
    let currentBatchIndex = 0;
    const BATCH_SIZE = 3; 
    const DELAY_BETWEEN_TOWNS = 0; 
    const DELAY_BETWEEN_BATCHES = 0; 
    
    // Keep track of which towns have been loaded
    let loadedTownIds = new Set();
    let hasSelectedParcels = false;
    let ctrlKeyPressed = false;
    let isMultiSelectActive = false;
    
    // Watch for changes to selectedTownId and load data when it changes
    $: if (selectedTownId && map && map.loaded() && directoryMap && !loadedTownIds.has(selectedTownId)) {
        console.log(`Selected town changed to: ${selectedTownId}, loading parcels...`);
        loadParcelsForTown(selectedTownId);
        zoomToTown(selectedTownId);
    }

    // Update town boundaries layer styling
    async function loadTownBoundaries() {
        console.log("Loading town boundaries");
        
        if (map.getLayer('towns-layer')) {
            console.log("Towns layer already exists");
            return;
        }
        
        try {
            // First try loading pre-generated boundaries
            const basePath = getBasePath();
            const response = await fetch(`${basePath}data/town_boundaries.geojson`);
            
            if (!response.ok) {
                // If pre-generated file doesn't exist, create simple boundaries from directorys
                await createSimpleTownBoundaries();
                return;
            }
            
            const boundariesGeoJSON = await response.json();
            
            // Add the source to the map
            map.addSource('towns-source', {
                type: 'geojson',
                data: boundariesGeoJSON
            });
            
            // Add the layer to the map - style based on whether town has noise data or not
            map.addLayer({
                id: 'towns-layer',
                type: 'fill',
                source: 'towns-source',
                paint: {
                    // Use different colors for towns with and without noise data
                    'fill-color': [
                        'case',
                        ['==', ['get', 'HAS_NOISE_DATA'], false],
                        'rgba(100, 100, 100, 0.1)', // Gray for towns with only No_Data
                        'rgba(0, 100, 255, 0.1)'    // Blue for towns with noise data
                    ],
                    'fill-outline-color': [
                        'case',
                        ['==', ['get', 'HAS_NOISE_DATA'], false],
                        '#555555', // Gray outline for towns without noise data
                        '#0080ff'  // Blue outline for towns with noise data
                    ],
                    'fill-opacity': 0.6
                }
            });
            
            console.log("Town boundaries layer created from pre-generated file");
            
            // Add tooltip for towns with No_Data
            map.on('mouseenter', 'towns-layer', (e) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const hasNoiseData = feature.properties.HAS_NOISE_DATA;
                    
                    if (hasNoiseData === false) {
                        const townId = feature.properties.TOWN_ID;
                        const townName = feature.properties.NAME;
                        
                        // Create a popup
                        const popup = new mapboxgl.Popup({
                            closeButton: false,
                            closeOnClick: false
                        })
                        .setLngLat(e.lngLat)
                        .setHTML(`<div class="no-data-tooltip">${townName}: No noise impact detected</div>`)
                        .addTo(map);
                        
                        // Store the popup on the map object for easy access
                        map.noDataPopup = popup;
                    }
                }
            });
            
            map.on('mouseleave', 'towns-layer', () => {
                if (map.noDataPopup) {
                    map.noDataPopup.remove();
                    map.noDataPopup = null;
                }
            });
            
        } catch (error) {
            console.error("Error loading town boundaries:", error);
            // Fallback to creating simple boundaries
            await createSimpleTownBoundaries();
        }
    }
    
    // Fallback function to create simple town boundaries from parcels - modified to include all towns
    async function createSimpleTownBoundaries() {
        console.log("Creating simple town boundaries from parcel data");
        
        if (!directoryMap) {
            console.error("Directory map not loaded yet");
            return;
        }
        
        const townFeatures = [];
        
        // For each town, load the first parcel file and get its extent
        for (const townId of Object.keys(directoryMap)) {
            const files = directoryMap[townId];
            let hasData = false;
            let fileToUse = null;
            
            // Check if town has non-No_Data files
            for (const file of files) {
                if (!file.startsWith('No_Data')) {
                    hasData = true;
                    fileToUse = file;
                    break;
                }
            }
            
            // If no non-No_Data files, use the first No_Data file (if any)
            if (!hasData && files.length > 0) {
                fileToUse = files[0];
            }
            
            if (!fileToUse) {
                // Create a default boundary for towns with no files
                const defaultBoundary = createDefaultBoundary(townId);
                townFeatures.push(defaultBoundary);
                continue;
            }
            
            try {
                const basePath = getBasePath();
                const response = await fetch(`${basePath}data/parcels/noise_by_town/${townId}/${fileToUse}`);
                
                if (!response.ok) {
                    console.warn(`Failed to fetch sample file for town ${townId}`);
                    // Create a default boundary
                    const defaultBoundary = createDefaultBoundary(townId);
                    townFeatures.push(defaultBoundary);
                    continue;
                }
                
                const geojson = await response.json();
                if (!geojson.features || geojson.features.length === 0) {
                    console.warn(`No features found in sample file for town ${townId}`);
                    // Create a default boundary
                    const defaultBoundary = createDefaultBoundary(townId);
                    townFeatures.push(defaultBoundary);
                    continue;
                }
                
                // Find the bounding box of all features
                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;
                
                for (const feature of geojson.features) {
                    if (!feature.geometry || !feature.geometry.coordinates) continue;
                    
                    if (feature.geometry.type === 'Polygon') {
                        for (const point of feature.geometry.coordinates[0]) {
                            minX = Math.min(minX, point[0]);
                            minY = Math.min(minY, point[1]);
                            maxX = Math.max(maxX, point[0]);
                            maxY = Math.max(maxY, point[1]);
                        }
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        for (const polygon of feature.geometry.coordinates) {
                            for (const point of polygon[0]) {
                                minX = Math.min(minX, point[0]);
                                minY = Math.min(minY, point[1]);
                                maxX = Math.max(maxX, point[0]);
                                maxY = Math.max(maxY, point[1]);
                            }
                        }
                    } else if (feature.geometry.type === 'Point') {
                        const point = feature.geometry.coordinates;
                        minX = Math.min(minX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxX = Math.max(maxX, point[0]);
                        maxY = Math.max(maxY, point[1]);
                    }
                }
                
                // Add some padding (5%)
                const padX = (maxX - minX) * 0.05;
                const padY = (maxY - minY) * 0.05;
                minX -= padX;
                minY -= padY;
                maxX += padX;
                maxY += padY;
                
                // Create a simple rectangle for the town boundary
                const boundary = {
                    type: 'Feature',
                    properties: {
                        TOWN_ID: townId,
                        NAME: `Town ${townId}`,
                        HAS_DATA: hasData
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [minX, minY],
                            [maxX, minY],
                            [maxX, maxY],
                            [minX, maxY],
                            [minX, minY] // Close the loop
                        ]]
                    }
                };
                
                townFeatures.push(boundary);
                
            } catch (error) {
                console.error(`Error creating boundary for town ${townId}:`, error);
                // Create a default boundary in case of error
                const defaultBoundary = createDefaultBoundary(townId);
                townFeatures.push(defaultBoundary);
            }
        }
        
        // Create the GeoJSON collection
        const townBoundaries = {
            type: 'FeatureCollection',
            features: townFeatures
        };
        
        // Add to map
        if (townFeatures.length > 0) {
            map.addSource('towns-source', {
                type: 'geojson',
                data: townBoundaries
            });
            
            map.addLayer({
                id: 'towns-layer',
                type: 'fill',
                source: 'towns-source',
                paint: {
                    // Use different colors for towns with and without data
                    'fill-color': [
                        'case',
                        ['==', ['get', 'HAS_DATA'], false],
                        'rgba(100, 100, 100, 0.1)', // Gray for towns without data
                        'rgba(0, 100, 255, 0.1)'    // Blue for towns with data
                    ],
                    'fill-outline-color': [
                        'case',
                        ['==', ['get', 'HAS_DATA'], false],
                        '#555555', // Gray outline for towns without data
                        '#0080ff'  // Blue outline for towns with data
                    ],
                    'fill-opacity': 0.6
                }
            });
            
            console.log(`Created ${townFeatures.length} simple town boundaries`);
            
            // Add tooltip for towns without data
            map.on('mouseenter', 'towns-layer', (e) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    const hasData = feature.properties.HAS_DATA;
                    
                    if (hasData === false) {
                        const townId = feature.properties.TOWN_ID;
                        const townName = feature.properties.NAME;
                        
                        // Create a popup
                        const popup = new mapboxgl.Popup({
                            closeButton: false,
                            closeOnClick: false
                        })
                        .setLngLat(e.lngLat)
                        .setHTML(`<div class="no-data-tooltip">${townName}: No noise data available</div>`)
                        .addTo(map);
                        
                        // Store the popup on the map object for easy access
                        map.noDataPopup = popup;
                    }
                }
            });
            
            map.on('mouseleave', 'towns-layer', () => {
                if (map.noDataPopup) {
                    map.noDataPopup.remove();
                    map.noDataPopup = null;
                }
            });
        } else {
            console.error("No town boundaries could be created");
        }
    }
    
    // Function to create a default boundary for towns with no data
    function createDefaultBoundary(townId) {
        // Create a small placeholder rectangle near Boston
        // This should be replaced with actual town boundaries if available
        return {
            type: 'Feature',
            properties: {
                TOWN_ID: townId,
                NAME: `Town ${townId}`,
                HAS_DATA: false,
                IS_DEFAULT: true
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-71.05, 42.35],
                    [-71.04, 42.35],
                    [-71.04, 42.36],
                    [-71.05, 42.36],
                    [-71.05, 42.35]
                ]]
            }
        };
    }

    // Update the town click handler
    function setupTownClickHandler() {
        // Add click handler for town boundaries layer
        map.on('click', 'towns-layer', async (e) => {
            if (e.features && e.features.length > 0) {
                const townId = e.features[0].properties.TOWN_ID;
                // Get hasNoiseData property if it exists, otherwise default to true
                const hasNoiseData = e.features[0].properties.HAS_NOISE_DATA !== false;
                
                console.log(`Clicked on town with ID: ${townId}, has noise data: ${hasNoiseData}`);
                
                // Clear any previous loaded towns
                clearLoadedParcels();
                
                // Zoom to the town in any case
                zoomToTown(townId);
                
                // Always load parcels first, regardless of noise status
                if (directoryMap && directoryMap[townId]) {
                    try {
                        console.log(`Starting to load parcels for town: ${townId}`);
                        // Wait for parcels to load completely
                        await loadParcelsForTown(townId);
                        console.log(`Finished loading parcels for town: ${townId}`);
                        
                        // Only show notification after loading parcels
                        if (!hasNoiseData) {
                            showNoNoiseDataNotification(townId, e.features[0].properties.NAME || `Town ${townId}`);
                        }
                    } catch (error) {
                        console.error(`Error in town click handler for ${townId}:`, error);
                    }
                } else {
                    console.log(`No directory data for town: ${townId}`);
                }
            }
        });
        
        // Change cursor to pointer when hovering over towns
        map.on('mouseenter', 'towns-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'towns-layer', () => {
            map.getCanvas().style.cursor = '';
        });
    }
    
    // Function to clear previously loaded parcels
    function clearLoadedParcels() {
        Array.from(loadedTownIds).forEach(townId => {
            const layerId = `parcels-${townId}`;
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getSource(layerId)) {
                map.removeSource(layerId);
            }
        });
        
        loadedTownIds.clear();
    }
    
    // Add console logging to the loadParcelsForTown function for debugging
    async function loadParcelsForTown(townId) {
        console.log(`DEBUGGING: loadParcelsForTown called for ${townId}`);
        
        if (!directoryMap) {
            console.error("Directory map not loaded yet");
            return Promise.reject("Directory map not loaded");
        }
        
        if (loadedTownIds.has(townId)) {
            console.log(`Town ${townId} already loaded`);
            return Promise.resolve();
        }

        console.log(`Loading parcels for town: ${townId}`);
        console.log(`Directory has town? ${directoryMap.hasOwnProperty(townId)}`);
        
        // Check if this town has data in the directory
        if (directoryMap[townId]) {
            const files = directoryMap[townId];
            console.log(`Found ${files.length} files for town ${townId}:`, files);
            const layerId = `parcels-${townId}`;
            
            try {
                await loadTownData(townId, files, layerId);
                loadedTownIds.add(townId);
                console.log(`Successfully loaded parcels for town: ${townId}`);
                return Promise.resolve();
            } catch (error) {
                console.error(`Error loading parcels for town ${townId}:`, error);
                return Promise.reject(error);
            }
        } else {
            console.log(`No parcel data found for town: ${townId}`);
            return Promise.reject("No parcel data found");
        }
    }

    // Fix the loadTownData function
    async function loadTownData(townId, files, layerId) {
        console.log(`DEBUGGING: loadTownData called for ${townId} with layer ${layerId}`);
        console.log(`Files to load:`, files);
        
        // Cleanup existing layers/sources more carefully
        if (map.getLayer(layerId)) {
            console.log(`Removing existing layer ${layerId}`);
            map.removeLayer(layerId);
        }
        
        if (map.getSource(layerId)) {
            console.log(`Removing existing source ${layerId}`);
            map.removeSource(layerId);
        }
        
        // Create an array to hold all the features
        let allFeatures = [];
        
        // Check if all files are No_Data
        const allNoData = files.every(file => file.startsWith('No_Data'));
        console.log(`Town ${townId}: All files are No_Data? ${allNoData}`);
        
        let loadedFileCount = 0;
        // Fetch and process each file for this town
        const basePath = getBasePath();
        console.log(`Using base path: ${basePath}`);
        
        for (const file of files) {
            try {
                const url = `${basePath}data/parcels/noise_by_town/${townId}/${file}`;
                console.log(`Fetching file: ${url}`);
                const response = await fetch(url);
                
                if (!response.ok) {
                    console.error(`Failed to fetch ${file}: Status ${response.status} ${response.statusText}`);
                    throw new Error(`Failed to fetch ${file} for town ${townId}: ${response.status} ${response.statusText}`);
                }
                
                const geojson = await response.json();
                console.log(`Loaded GeoJSON for ${file}, has features: ${geojson.features && geojson.features.length > 0}`);
                
                if (geojson.features && geojson.features.length > 0) {
                    // Add parcels to the features list
                    allFeatures = [...allFeatures, ...geojson.features];
                    console.log(`Added ${geojson.features.length} features from ${file}`);
                    loadedFileCount++;
                }
            } catch (error) {
                console.error(`Error loading file ${file} for town ${townId}:`, error);
            }
        }
        
        console.log(`Loaded ${loadedFileCount} files out of ${files.length} for town ${townId}`);
        
        if (allFeatures.length === 0) {
            console.warn(`No features loaded for town ${townId}`);
            return Promise.reject(`No features loaded for town ${townId}`);
        }
        
        console.log(`Total: Loaded ${allFeatures.length} features for town ${townId}`);
        
        // Create a new source with all features
        const combinedGeoJson = {
            type: "FeatureCollection",
            features: allFeatures
        };
        
        try {
            // Add the source to the map
            console.log(`Adding source ${layerId} with ${allFeatures.length} features`);
            map.addSource(layerId, {
                type: "geojson",
                data: combinedGeoJson
            });
            
            // Add the layer to the map with appropriate styling
            if (allNoData) {
                console.log(`Adding no-noise layer ${layerId}`);
                map.addLayer({
                    id: layerId,
                    type: "fill",
                    source: layerId,
                    paint: {
                        "fill-color": "rgba(150, 150, 150, 0.6)", // Gray for no-noise parcels
                        "fill-opacity": 0.8,
                        "fill-outline-color": "#333333"
                    }
                });
            } else {
                console.log(`Adding noise-colored layer ${layerId}`);
                map.addLayer({
                    id: layerId,
                    type: "fill",
                    source: layerId,
                    paint: {
                        "fill-color": [
                            "match",
                            ["get", "noiseColor"],
                            "Pink", colorMapping.Pink,
                            "Red", colorMapping.Red,
                            "Orange", colorMapping.Orange,
                            "Yellow", colorMapping.Yellow,
                            "rgba(150, 150, 150, 0.6)" // default - gray for no color
                        ],
                        "fill-opacity": 0.8,
                        "fill-outline-color": "#000000"
                    }
                });
            }
            
            console.log(`Successfully added layer ${layerId} to map`);
            return Promise.resolve();
        } catch (error) {
            console.error(`Error adding layer ${layerId}:`, error);
            return Promise.reject(error);
        }
    }
    
    // Update the notification to be less intrusive
    function showNoNoiseDataNotification(townId, townName) {
        // Create a smaller, less disruptive notification
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            className: 'no-noise-data-popup',
            anchor: 'top-right',
            offset: [0, 10]
        })
        .setLngLat(map.getBounds().getNorthEast()) // Position in corner
        .setHTML(`
            <div class="no-data-content">
                <h3>No Noise Impact</h3>
                <p>${townName || `Town ${townId}`} has no significant airport noise impact.</p>
                <p class="no-data-subtext">Parcels shown in gray.</p>
            </div>
        `)
        .addTo(map);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (popup.isOpen()) {
                popup.remove();
            }
        }, 5000);
    }

    // Modified to initialize directory map and set up town boundaries
    async function initializeLoading() {
        if (!map.loaded()) return;
        
        console.log('Initializing parcel directory');
        
        try {
            const basePath = getBasePath();
            const response = await fetch(`${basePath}data/parcels/noise_by_town/directory_map.json`);
            if (!response.ok) {
                throw new Error('Failed to load directory map');
            }
            directoryMap = await response.json();
            console.log('Loaded directory map:', directoryMap);
            totalTowns = Object.keys(directoryMap).length;
            console.log(`Found ${totalTowns} towns in directory map`);
            
            // Load town boundaries first
            await loadTownBoundaries();
            
            // Set up click handlers
            setupTownClickHandler();
            setupParcelClickHandler();
            
            // If a town is already selected, load its data
            if (selectedTownId) {
                loadParcelsForTown(selectedTownId);
                zoomToTown(selectedTownId);
            }
        } catch (error) {
            console.error('Error initializing parcel directory:', error);
        }
    }

    // Implementation of setupParcelClickHandler
    function setupParcelClickHandler() {
        // Create a single popup instance to reuse
        let currentPopup = null;

        // Add click handler for parcel layers
        map.on('click', (e) => {
            // First, remove any existing popup
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }
            
            // Build list of layers to query: all loaded town-specific parcel layers
            const queryLayers = Array.from(loadedTownIds).map(id => `parcels-${id}`);
            
            // Only query layers that exist
            const validLayers = queryLayers.filter(layer => map.getLayer(layer));
            
            // If no valid layers, no need to continue
            if (validLayers.length === 0) {
                return;
            }
            
            // Find the features at click point
            const features = map.queryRenderedFeatures(e.point, {
                layers: validLayers
            });
            
            if (!features.length) {
                return;
            }
            
            // Get the first clicked feature
            const feature = features[0];
            const props = feature.properties;
            
            // Format the properties into HTML
            let html = '<div class="parcel-popup">';
            html += `<h3>Parcel Information</h3>`;
            
            // Check and format common properties
            const address = props.SITE_ADDR || props.SITE_ADDR_L || 'Not available';
            const buildingValue = props.BLDG_VAL ? `$${Number(props.BLDG_VAL).toLocaleString()}` : 'N/A';
            const landValue = props.LAND_VAL ? `$${Number(props.LAND_VAL).toLocaleString()}` : 'N/A';
            const totalValue = props.TOTAL_VAL ? `$${Number(props.TOTAL_VAL).toLocaleString()}` : 'N/A';

            const noiseLevel = noiseLevelMapping[props.noiseColor] || "Unknown Noise Level";

            html += `<p><strong>Address:</strong> ${address}</p>`;
            html += `<p><strong>Building Value:</strong> ${buildingValue}</p>`;
            html += `<p><strong>Land Value:</strong> ${landValue}</p>`;
            html += `<p><strong>Total Value:</strong> ${totalValue}</p>`;
            html += `<p><strong>Noise Level:</strong> ${noiseLevel}</p>`;
            
            // Add more properties if available
            if (props.USE_CODE_SYMB) {
                html += `<p><strong>Property Type:</strong> ${props.USE_CODE_SYMB}</p>`;
            }
            if (props.LOT_SIZE) {
                html += `<p><strong>Lot Size:</strong> ${Number(props.LOT_SIZE).toLocaleString()} sq ft</p>`;
            }
            
            html += '</div>';
            
            // Create new popup
            currentPopup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true
            })
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        });
    }
    
    // Implementation of keyboard handlers
    function setupKeyboardHandlers() {
        // Add keyboard event listeners for Alt/Option key (for multi-select)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') {
                isMultiSelectActive = true;
                updateCursor();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') {
                isMultiSelectActive = false;
                updateCursor();
            }
        });
        
        // Ensure multi-select is disabled when the window loses focus
        window.addEventListener('blur', () => {
            isMultiSelectActive = false;
            updateCursor();
        });
    }
    
    // Function to update cursor based on mode
    function updateCursor() {
        if (isMultiSelectActive) {
            map.getCanvas().style.cursor = 'crosshair';
        } else {
            map.getCanvas().style.cursor = '';
        }
    }

    onMount(() => {
        if (map) {
            if (map.loaded()) {
                initializeLoading();
                setupKeyboardHandlers();
            } else {
                map.on('load', () => {
                    initializeLoading();
                    setupKeyboardHandlers();
                });
            }
        }
    });
</script>

<!-- Add this title element at the top of your component, before any existing HTML -->
<div class="page-title">Aviation Noise's Effect on Housing</div>

<div class="legend">
    <h3>Noise Impact Levels</h3>
    <div class="legend-item">
        <span class="color-box" style="background-color: {colorMapping.Pink};"></span>
        <span class="legend-text">{noiseLevelDescriptions.Pink}</span>
    </div>
    <div class="legend-item">
        <span class="color-box" style="background-color: {colorMapping.Red};"></span>
        <span class="legend-text">{noiseLevelDescriptions.Red}</span>
    </div>
    <div class="legend-item">
        <span class="color-box" style="background-color: {colorMapping.Orange};"></span>
        <span class="legend-text">{noiseLevelDescriptions.Orange}</span>
    </div>
    <div class="legend-item">
        <span class="color-box" style="background-color: {colorMapping.Yellow};"></span>
        <span class="legend-text">{noiseLevelDescriptions.Yellow}</span>
    </div>
</div>

<div id="summary-tooltip" style="
    position: absolute;
    bottom: 55px; /* Move above the multi-select-tip */
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    display: inline-block;
    opacity: 0;
"></div>

<div class="multi-select-tip">
    <p><strong>Tip:</strong> Hold <kbd>Alt</kbd> (Windows) or <kbd>Option</kbd> (Mac) to activate multi-select tool</p>
</div>

<style>
    /* Add this CSS for the title */
    .page-title {
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(50, 50, 50, 0.85);
        color: white;
        padding: 8px 20px;
        border-radius: 5px;
        font-size: 18px;
        font-weight: 600;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        z-index: 100;
        border: 1px solid #555;
        text-align: center;
        pointer-events: none; /* Makes it non-invasive by not blocking map interactions */
        max-width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .loading-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
    }

    :global(.parcel-popup) {
        padding: 12px;
        max-width: 300px;
        font-family: Arial, sans-serif;
        background-color: rgba(25, 25, 25, 0.95) !important; /* Very dark background */
        color: white !important;
    }

    :global(.parcel-popup h3) {
        margin: 0 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #555;
        color: white !important;
    }

    :global(.parcel-popup p) {
        margin: 6px 0;
        font-size: 14px;
        color: #eee !important;
    }
    
    :global(.parcel-popup strong) {
        color: white !important;
        font-weight: bold;
    }

    /* Style the popup elements */
    :global(.mapboxgl-popup-content) {
        background-color: rgba(25, 25, 25, 0.95) !important;
        border-radius: 5px !important;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5) !important;
    }
    
    :global(.mapboxgl-popup-close-button) {
        color: white !important;
        font-size: 18px !important;
        padding: 5px 10px !important;
    }
    
    :global(.mapboxgl-popup-close-button:hover) {
        background-color: rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Fix popup tip color */
    :global(.mapboxgl-popup-tip) {
        border-top-color: rgba(25, 25, 25, 0.95) !important;
        border-bottom-color: rgba(25, 25, 25, 0.95) !important;
    }
    
    :global(.mapboxgl-popup-anchor-top .mapboxgl-popup-tip) {
        border-bottom-color: rgba(25, 25, 25, 0.95) !important;
    }
    
    :global(.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip) {
        border-top-color: rgba(25, 25, 25, 0.95) !important;
    }
    
    :global(.mapboxgl-popup-anchor-left .mapboxgl-popup-tip) {
        border-right-color: rgba(25, 25, 25, 0.95) !important;
    }
    
    :global(.mapboxgl-popup-anchor-right .mapboxgl-popup-tip) {
        border-left-color: rgba(25, 25, 25, 0.95) !important;
    }

    /* Update the legend styling to be darker */
    .legend {
        position: absolute;
        bottom: 25px;
        left: 10px;
        background: rgba(50, 50, 50, 0.95); /* Much darker background */
        color: white; /* White text for contrast */
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); /* Stronger shadow */
        font-size: 14px;
        font-family: Arial, sans-serif;
        border: 1px solid #555;
    }

    .legend h3 {
        color: white;
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
    }

    .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }

    .color-box {
        width: 20px;
        height: 20px;
        margin-right: 10px;
        border: 1px solid #777; /* Lighter border for color boxes */
    }

    .legend-text {
        font-size: 14px;
        color: #eee; /* Slightly off-white for better readability */
    }

    /* Update the multi-select tip styling to be darker */
    .multi-select-tip {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(50, 50, 50, 0.95); /* Much darker background */
        color: white; /* White text for contrast */
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); /* Stronger shadow */
        pointer-events: none;
        z-index: 100;
        border: 1px solid #555;
    }
    
    .multi-select-tip p {
        margin: 0;
        color: #eee; /* Slightly off-white for better readability */
    }
    
    .multi-select-tip strong {
        color: white; /* Pure white for emphasis */
    }
    
    .multi-select-tip kbd {
        background-color: #444; /* Darker kbd background */
        color: #fff;
        border: 1px solid #666;
        border-radius: 3px;
        box-shadow: 0 1px 0px rgba(0, 0, 0, 0.5);
        font-family: monospace;
        padding: 0 4px;
    }

    /* Add this CSS for the no-data tooltip */
    :global(.no-data-tooltip) {
        background: rgba(40, 40, 40, 0.9);
        color: #eee;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 13px;
        font-family: Arial, sans-serif;
    }
    
    :global(.no-data-popup .mapboxgl-popup-content) {
        background-color: rgba(40, 40, 40, 0.95) !important;
        color: white !important;
        padding: 15px !important;
        max-width: 250px !important;
    }
    
    :global(.no-data-content h3) {
        color: #ff9966 !important;
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
    }
    
    :global(.no-data-content p) {
        color: #eee !important;
        margin: 0;
        font-size: 14px;
    }

    /* Add style for no-noise-data popup */
    :global(.no-noise-data-popup .mapboxgl-popup-content) {
        background-color: rgba(230, 230, 230, 0.95) !important; /* Lighter color for no noise */
        color: #333 !important;
        padding: 15px !important;
        max-width: 250px !important;
    }
    
    :global(.no-noise-data-popup .mapboxgl-popup-content h3) {
        color: #088A08 !important; /* Green for positive/no-noise message */
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
    }
    
    :global(.no-noise-data-popup .mapboxgl-popup-content p) {
        color: #333 !important;
        margin: 0;
        font-size: 14px;
    }

    /* Add this to your existing styles */
    :global(.no-data-subtext) {
        font-style: italic;
        font-size: 12px;
        margin-top: 5px !important;
        color: #555 !important;
    }
</style>