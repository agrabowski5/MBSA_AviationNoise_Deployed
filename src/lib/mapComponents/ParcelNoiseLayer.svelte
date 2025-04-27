<script>
    import { onMount } from "svelte";
    import mapboxgl from "mapbox-gl";

    export let map;
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

    let isLoading = false;
    let loadedTowns = 0;
    let totalTowns = 0;
    let directoryMap = null;
    let currentBatchIndex = 0;
    const BATCH_SIZE = 3; 
    const DELAY_BETWEEN_TOWNS = 0; 
    const DELAY_BETWEEN_BATCHES = 0; 

    let hasSelectedParcels = false;

    // Add these variables to track key press state
    let ctrlKeyPressed = false;
    let isMultiSelectActive = false;

    // Add a state variable to control scatterplot visibility
    let showScatterplot = false;

    async function loadSimplifiedNoiseMap() {
        try {
            console.log('Loading simplified noise map');
            const basePath = getBasePath();
            const response = await fetch(`${basePath}data/parcels/simplified_noise_map.geojson`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Filter out any No_Data features if they exist
                if (data.features) {
                    data.features = data.features.filter(feature => {
                        // Check if this is from a No_Data file (you might need to adjust this condition)
                        const props = feature.properties || {};
                        return !(props.sourceFile && props.sourceFile.startsWith('No_Data'));
                    });
                }
                
                map.addSource('simplified-noise', {
                    type: 'geojson',
                    data: data
                });
                
                // Rest of your function
            } else {
                // Fallback if file doesn't exist
                map.addSource('simplified-noise', {
                    type: 'geojson',
                    data: {
                        "type": "FeatureCollection",
                        "features": []
                    }
                });
                // Rest of your fallback code
            }
            
            map.addLayer({
                id: 'simplified-noise-layer',
                type: 'fill',
                source: 'simplified-noise',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'noiseColor'],
                        'Pink', colorMapping.Pink,
                        'Orange', colorMapping.Orange,
                        'Yellow', colorMapping.Yellow,
                        'Red', colorMapping.Red,
                        'transparent' // Default color
                    ],
                    'fill-opacity': 0.7,
                    'fill-outline-color': '#000000'
                }
            });
            
            // Set cursor to pointer when hovering over parcels
            map.on('mouseenter', 'simplified-noise-layer', () => {
                map.getCanvas().style.cursor = 'pointer';
                const coordinates = e.lngLat;

                // Show tooltip
                d3.select("#tooltip")
                    .style("left", `${e.originalEvent.clientX + 10}px`)
                    .style("top", `${e.originalEvent.clientY + 10}px`)
                    .style("opacity", 1)
                    .html(`<strong>Noise Level:</strong> ${noiseLevel}`);
            });

            map.on('mouseleave', 'simplified-noise-layer', () => {
                map.getCanvas().style.cursor = '';
                d3.select("#tooltip").style("opacity", 0);
            });

            console.log('Simplified noise map initialized');
        } catch (error) {
            console.error('Error loading simplified noise map:', error);
        }
    }

    async function loadTownData(townId, files, layerId) {
        const features = [];
        const basePath = getBasePath();
        
        for (const fileName of files) {
            if (fileName.startsWith('No_Data')) continue;
            
            try {
                const response = await fetch(`${basePath}data/parcels/noise_by_town/${townId}/${fileName}`);
                if (!response.ok) continue;
                
                const data = await response.json();
                const colorName = fileName.replace('.geojson', '');
                
                data.features.forEach(feature => {
                    feature.properties.noiseColor = colorName;
                });
                features.push(...data.features);
                
            } catch (error) {
                console.warn(`Error loading ${fileName} for town ${townId}:`, error);
            }
        }

        if (features.length > 0) {
            try {
                map.addSource(layerId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });

                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: layerId,
                    paint: {
                        'fill-color': [
                            'match',
                            ['get', 'noiseColor'],
                            'Orange', colorMapping.Orange,
                            'Pink', colorMapping.Pink,
                            'Yellow', colorMapping.Yellow,
                            'Red', colorMapping.Red,
                            '#000000'
                        ],
                        'fill-opacity': .7,
                        'fill-outline-color': '#000000'
                    }
                });
                
                // Set cursor to pointer for this layer
                map.on('mouseenter', layerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                });
                
                console.log(`Added layer for town ${townId} with ${features.length} features`);
            } catch (error) {
                console.error(`Error adding layer for town ${townId}:`, error);
            }
        }
    }

    async function loadNextBatch() {
        if (!isLoading && directoryMap) {
            isLoading = true;
            const entries = Object.entries(directoryMap);
            const startIndex = currentBatchIndex;
            const endIndex = Math.min(startIndex + BATCH_SIZE, entries.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const [townId, files] = entries[i];
                const layerId = `parcels-${i}`;
                await loadTownData(townId, files, layerId);
                loadedTowns++;
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TOWNS));
            }

            currentBatchIndex = endIndex;
            isLoading = false;

           
            if (currentBatchIndex < entries.length) {
                setTimeout(() => loadNextBatch(), DELAY_BETWEEN_BATCHES);
            }

            
            if (window.gc) window.gc();
        }
    }

    async function initializeLoading() {
        if (!map.loaded()) return;
        
        console.log('Initializing parcel data loading');
        
        // Clear any existing detail layers
        for (let i = 0; ; i++) {
            const layerId = `parcels-${i}`;
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            } else {
                break;
            }
            if (map.getSource(layerId)) {
                map.removeSource(layerId);
            }
        }

        try {
            const basePath = getBasePath();
            const response = await fetch(`${basePath}data/parcels/noise_by_town/directory_map.json`);
            if (!response.ok) {
                throw new Error('Failed to load directory map');
            }
            directoryMap = await response.json();
            totalTowns = Object.keys(directoryMap).length;
            loadedTowns = 0;
            currentBatchIndex = 0;
            
            // Set up click handler before loading data
            setupParcelClickHandler();
            
            await loadNextBatch();

        } catch (error) {
            console.error('Error initializing parcel data:', error);
            isLoading = false;
        }
    }

    // Modify the SVG overlay setup to initially hide the brush
    const svg = d3.select(map.getCanvasContainer())
        .append("svg")
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .style("width", "100%")
        .style("height", "100%")
        .style("pointer-events", "none"); // Prevents interference with map interactions

    const brush = d3.brush()
        .extent([[0, 0], [map.getCanvas().width, map.getCanvas().height]])
        .on("brush", brushed)
        .on("end", brushEnded);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .style("display", "none"); // Initially hidden

    // Add keyboard event listeners
    function setupKeyboardHandlers() {
        // Listen for Alt key press/release
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') {
                e.preventDefault(); // Prevent browser Alt menu from appearing
                ctrlKeyPressed = true; // Still use same variable, just triggered by Alt now
                activateMultiSelect();
            }
            
            // Add this section to handle Escape key
            if (e.key === 'Escape') {
                // Clear any selected parcels
                if (hasSelectedParcels) {
                    clearSelectedParcels();
                }
                
                // Close any open tooltips
                document.querySelectorAll('.mapboxgl-popup').forEach(popup => {
                    popup.remove();
                });
                
                // Hide the tooltip
                d3.select("#tooltip").style("opacity", 0);
                d3.select("#summary-tooltip").style("opacity", 0);
                
                // Deactivate multi-select if it's active
                if (isMultiSelectActive) {
                    ctrlKeyPressed = false;
                    deactivateMultiSelect();
                }
            }
        });
        
        // Rest of your existing keyboard handlers
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                ctrlKeyPressed = false;
                deactivateMultiSelect();
            }
        });
        
        // Deactivate when window loses focus
        window.addEventListener('blur', () => {
            if (ctrlKeyPressed) {
                ctrlKeyPressed = false;
                deactivateMultiSelect();
            }
        });
    }
    
    // Activate multi-select mode
    function activateMultiSelect() {
        if (isMultiSelectActive) return;
        
        isMultiSelectActive = true;
        brushGroup.style("display", "block");
        brushGroup.style("pointer-events", "all");
        
        // Show visual indicator that multi-select is active
        showMultiSelectIndicator(true);
        
        // Change cursor to crosshair
        map.getCanvas().style.cursor = 'crosshair';
    }
    
    // Deactivate multi-select mode
    function deactivateMultiSelect() {
        if (!isMultiSelectActive) return;
        
        isMultiSelectActive = false;
        brushGroup.style("display", "none");
        brushGroup.style("pointer-events", "none");
        
        // Clear any ongoing brush selection
        d3.brush().move(brushGroup, null);
        
        // Hide indicator
        showMultiSelectIndicator(false);
        
        // Reset cursor
        map.getCanvas().style.cursor = '';
    }
    
    // Visual indicator for multi-select mode
    function showMultiSelectIndicator(show) {
        let indicator = document.getElementById('multi-select-indicator');
        
        if (!indicator && show) {
            // Create indicator if it doesn't exist
            indicator = document.createElement('div');
            indicator.id = 'multi-select-indicator';
            indicator.textContent = 'Multi-Select Mode (Alt)'; // Changed from "Ctrl" to "Alt"
            document.body.appendChild(indicator);
        }
        
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    // Modify the brush handlers to only work when multi-select is active
    function brushed(event) {
        if (!isMultiSelectActive) return;
        
        const selection = event.selection;
        if (!selection) return;
    
        // Convert screen coordinates to map coordinates
        const [x0, y0] = selection[0];
        const [x1, y1] = selection[1];

        const nw = map.unproject([x0, y0]); // Top-left in [lng, lat]
        const se = map.unproject([x1, y1]); // Bottom-right in [lng, lat]

        console.log("Selected area:", nw, se);
    }

    function brushEnded(event) {
        if (!isMultiSelectActive) return;
        
        if (!event.selection) {
            console.log("Brush cleared");
            return;
        }

        // Convert brush pixel coordinates to map coordinates
        const [[x0, y0], [x1, y1]] = event.selection;
        const sw = map.unproject([x0, y0]); // Bottom-left corner
        const ne = map.unproject([x1, y1]); // Top-right corner

        console.log("Brushed Area:", sw, ne);

        // Process the selection
        const bounds = [sw, ne];
        selectParcels(bounds);
        
        // Clear the brush selection after processing
        d3.brush().move(brushGroup, null);
    }

function selectParcels(bounds) {
    // Start with the simplified noise layer
    const queryLayers = ['simplified-noise-layer'];

    // Add dynamically generated parcel layers
    for (let i = 0; i < currentBatchIndex; i++) {
        queryLayers.push(`parcels-${i}`);
    }

    // Filter out layers that do not exist
    const validLayers = queryLayers.filter(layer => map.getLayer(layer));

    // ✅ Debugging: Check layers being queried
    console.log("Available layers before selection:", map.getStyle().layers.map(l => l.id));
    console.log("Querying layers:", validLayers);

    if (validLayers.length === 0) {
        console.warn("No valid layers found for selection.");
        return;
    }

    // Query features in the selected bounding box
    const selectedFeatures = map.queryRenderedFeatures(
        [map.project(bounds[0]), map.project(bounds[1])],
        { layers: validLayers }
    );

    if (selectedFeatures.length === 0) {
        console.log("No parcels selected.");
        return;
    }

    console.log("Selected Parcels:", selectedFeatures);
    highlightSelectedParcels(selectedFeatures);
}

const noiseLevelMapping = {
    "Pink": "60 - 70 dB",
    "Orange": "50 - 55 dB",
    "Yellow": "45 - 50 dB",
    "Red": "55 - 60 dB"
};

const noiseMidpointMapping = {
    "Pink": 65,   // Midpoint for 60 - 70 dB
    "Orange": 52.5, // Midpoint for 50 - 55 dB
    "Yellow": 47.5, // Midpoint for 45 - 50 dB
    "Red": 57.5    // Midpoint for 55 - 60 dB
};

function calculateAverageNoiseLevel(selectedFeatures) {
    let totalNoise = 0;
    let count = 0;

    // Loop through selected parcels and sum their noise levels
    selectedFeatures.forEach(feature => {
        const noiseColor = feature.properties.noiseColor;
        if (noiseColor && noiseMidpointMapping[noiseColor] !== undefined) {
            totalNoise += noiseMidpointMapping[noiseColor];
            count++;
        }
    });

    // Calculate and return the average noise level
    return count > 0 ? totalNoise / count : 0; // Avoid division by zero
}

function calculateSummaryStatistics(selectedFeatures) {
    if (!selectedFeatures.length) {
        d3.select("#summary-tooltip").style("opacity", 0);
        return;
    }

    let totalBuildingValue = 0, totalLandValue = 0, totalValue = 0, totalLotSize = 0;
    let totalNoise = 0;
    let count = 0;

    selectedFeatures.forEach(feature => {
        const props = feature.properties;
        
        const buildingValue = parseFloat(props.BLDG_VAL) || 0;
        const landValue = parseFloat(props.LAND_VAL) || 0;
        const totalParcelValue = parseFloat(props.TOTAL_VAL) || 0;
        const lotSize = parseFloat(props.LOT_SIZE) || 0;
        const noiseColor = props.noiseColor;

        totalBuildingValue += buildingValue;
        totalLandValue += landValue;
        totalValue += totalParcelValue;
        totalLotSize += lotSize;

        // Sum the noise levels using the midpoint value for the noiseColor
        if (noiseColor && noiseMidpointMapping[noiseColor] !== undefined) {
            totalNoise += noiseMidpointMapping[noiseColor];
        }
        
        count++;
    });

    if (count === 0) return;

    const avgBuildingValue = totalBuildingValue / count;
    const avgLandValue = totalLandValue / count;
    const avgTotalValue = totalValue / count;
    const avgLotSize = totalLotSize / count;

    // Calculate the average noise level
    const avgNoiseLevel = totalNoise / count;
    const avgNoiseLabel = avgNoiseLevel > 0 ? `${avgNoiseLevel.toFixed(1)} dB` : 'No Data';

    // Update the summary tooltip with all statistics
    d3.select("#summary-tooltip")
        .style("opacity", 1)
        .html(`
            <strong>Selected Parcels: ${count}</strong><br>
            <strong>Avg Building Value:</strong> $${avgBuildingValue.toLocaleString()}<br>
            <strong>Avg Land Value:</strong> $${avgLandValue.toLocaleString()}<br>
            <strong>Avg Total Value:</strong> $${avgTotalValue.toLocaleString()}<br>
            <strong>Avg Lot Size:</strong> ${avgLotSize.toLocaleString()} sq ft<br>
            <strong>Avg Noise Level:</strong> ${avgNoiseLabel}
        `);
}

function highlightSelectedParcels(selectedFeatures) {
    const selectedGeoJSON = {
        type: "FeatureCollection",
        features: selectedFeatures
    };

    if (map.getSource("selected-parcels")) {
        map.getSource("selected-parcels").setData(selectedGeoJSON);
    } else {
        map.addSource("selected-parcels", {
            type: "geojson",
            data: selectedGeoJSON
        });

        map.addLayer({
            id: "selected-parcels-layer",
            type: "line",
            source: "selected-parcels",
            paint: {
                "line-color": "#ffffff",
                "line-width": 3
            }
        });
    }
    
    // Set flag indicating we have selected parcels
    hasSelectedParcels = selectedFeatures.length > 0;
    
    // Calculate and display summary
    calculateSummaryStatistics(selectedFeatures);
    
    // Only show scatterplot for multi-select operations with enough data points
    if (isMultiSelectActive && selectedFeatures.length > 5) {
        console.log("Multi-select active with", selectedFeatures.length, "parcels - showing scatterplot");
        showScatterplot = true;
        setTimeout(() => {
            drawScatterplot(selectedFeatures);
        }, 10); // Small delay to ensure DOM elements are ready
    } else {
        console.log("Not showing scatterplot:", isMultiSelectActive, selectedFeatures.length);
        showScatterplot = false;
    }
}

function clearSelectedParcels() {
    if (map.getSource("selected-parcels")) {
        // Clear selection by setting empty features array
        map.getSource("selected-parcels").setData({
            type: "FeatureCollection",
            features: []
        });
        
        // Hide the summary tooltip
        d3.select("#summary-tooltip").style("opacity", 0);
        
        // Hide scatterplot
        showScatterplot = false;
        
        // Reset the flag
        hasSelectedParcels = false;
        
        console.log("Selection cleared");
    }
}

function setupParcelClickHandler() {
    // Create a single popup instance to reuse
    let currentPopup = null;

    // Add click handler for both simplified and detailed views
    map.on('click', (e) => {
        // First, remove any existing popup
        if (currentPopup) {
            currentPopup.remove();
            currentPopup = null;
        }
        
        // Query both simplified and detailed layers
        const layers = ['simplified-noise-layer'];
        
        // Add all detail layers that might exist
        for (let i = 0; i < currentBatchIndex; i++) {
            layers.push(`parcels-${i}`);
        }
        
        // Find the features at click point from all layers
        const features = map.queryRenderedFeatures(e.point, {
            layers: layers.filter(layer => map.getLayer(layer))
        });
        
        // First, clear any existing selection if we have one
        if (hasSelectedParcels) {
            clearSelectedParcels();
            
            // If this was just a click to clear selection, and not on a parcel, 
            // then exit early to avoid showing a popup
            if (!features.length) {
                return;
            }
        }
        
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

        const noiseLevel = noiseLevelMapping[props.noiseColor] || "Unknown Noise Level"; // Lookup the label

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
            closeOnClick: true  // Make sure clicking elsewhere closes the popup
        })
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
            
        // Add an event listener to clear the reference when popup is closed
        currentPopup.on('close', () => {
            currentPopup = null;
        });
    });
}

//Trying lasso select tool
const lassoGroup = svg.append("g")
    .attr("id", "lasso-group")
    .style("display", "none");

let lassoPoints = [];
let isDrawingLasso = false;

function enableFreeformLasso() {
    lassoGroup.style("display", "block");
    map.getCanvas().style.cursor = "crosshair";

    // Disable map interactions while drawing
    map.dragPan.disable();
    map.doubleClickZoom.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

    svg.on("mousedown", (event) => {
        isDrawingLasso = true;
        lassoPoints = [];
        lassoGroup.selectAll("*").remove();
    });

    svg.on("mousemove", (event) => {
        if (!isDrawingLasso) return;

        const [x, y] = d3.pointer(event);
        lassoPoints.push([x, y]);

        const path = d3.line()(lassoPoints);
        lassoGroup.selectAll("path").remove();
        lassoGroup.append("path")
            .attr("d", path)
            .attr("fill", "rgba(0, 0, 255, 0.1)")
            .attr("stroke", "blue")
            .attr("stroke-width", 2);
    });

    svg.on("mouseup", () => {
        if (!isDrawingLasso || lassoPoints.length < 3) return;

        isDrawingLasso = false;
        svg.on("mousedown", null);
        svg.on("mousemove", null);
        svg.on("mouseup", null);

        // Close the polygon
        lassoPoints.push(lassoPoints[0]);

        // Convert screen points to map coordinates
        const polygon = turf.polygon([lassoPoints.map(p => {
            const lngLat = map.unproject(p);
            return [lngLat.lng, lngLat.lat];
        })]);

        selectParcelsInPolygon(polygon);
        lassoGroup.style("display", "none");

        // ✅ Re-enable map interactions
        map.dragPan.enable();
        map.doubleClickZoom.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        map.getCanvas().style.cursor = "";
    });
}


function selectParcelsInPolygon(polygon) {
    const queryLayers = ['simplified-noise-layer'];
    for (let i = 0; i < currentBatchIndex; i++) {
        queryLayers.push(`parcels-${i}`);
    }

    const validLayers = queryLayers.filter(layer => map.getLayer(layer));
    const features = map.queryRenderedFeatures({ layers: validLayers });

    const selectedFeatures = features.filter(f => {
        const turfFeature = turf.feature(f.geometry);
        return turf.booleanIntersects(polygon, turfFeature);
    });

    if (selectedFeatures.length > 0) {
        highlightSelectedParcels(selectedFeatures);
    } else {
        console.log("No parcels intersect the drawn lasso.");
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'l' || e.key === 'L') {l
        enableFreeformLasso();
    }
});

function drawScatterplot(features) {
    console.log("Drawing scatterplot with", features.length, "features");
    
    const data = [];
    
    // Extract data from features
    features.forEach(feature => {
        const props = feature.properties;
        const noiseColor = props.noiseColor;
        
        if (noiseColor && noiseMidpointMapping[noiseColor] !== undefined) {
            const noise = noiseMidpointMapping[noiseColor];
            const buildingValue = parseFloat(props.BLDG_VAL)/1000000; // Scale to millions
            const lotSize = parseFloat(props.LOT_SIZE);

            if (!isNaN(buildingValue)) {
                data.push({
                    noise,
                    buildingValue,
                    lotSize: isNaN(lotSize) ? 0 : lotSize,
                    color: noiseColor // Store original color for display
                });
            }
        }
    });

    if (!data.length) {
        console.warn("No data available for scatterplot.");
        showScatterplot = false;
        return;
    }
    
    console.log("Plotting data:", data.length, "points");
    
    // Make sure element exists before clearing it
    const scatterplotElement = document.getElementById("scatterplot");
    if (!scatterplotElement) {
        console.error("Scatterplot SVG element not found");
        return;
    }
    
    // Clear previous plot
    d3.select("#scatterplot").selectAll("*").remove();

    const svg = d3.select("#scatterplot"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        margin = { top: 30, right: 30, bottom: 50, left: 70 };

    // Set visibility explicitly
    showScatterplot = true;
    console.log("Set showScatterplot to", showScatterplot);
    
    // Make scale domains more sensible for your data
    const x = d3.scaleLinear()
        .domain([45, 70]) // Adjusted domain for noise levels (dB)
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.buildingValue) * 1.1]).nice() // Add 10% padding
        .range([height - margin.bottom, margin.top]);

    const r = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.lotSize)])
        .range([3, 12]);

    // Add axes with better labels
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 35) // Increased for better visibility
        .attr("fill", "white") // Changed to white for dark background
        .attr("font-weight", "bold")
        .attr("font-size", "14px") // Increased size
        .text("Noise Level (dB)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45) // Moved further left
        .attr("fill", "white") // Changed to white for dark background
        .attr("font-weight", "bold")
        .attr("font-size", "14px") // Increased size
        .text("Building Value (millions $)");

    // Add circles colored by noise category
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.noise))
        .attr("cy", d => y(d.buildingValue))
        .attr("r", d => r(d.lotSize))
        .attr("fill", d => colorMapping[d.color] || "gray")
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);
        
    // Add trendline
    if (data.length > 5) {
        // Calculate linear regression
        const xValues = data.map(d => d.noise);
        const yValues = data.map(d => d.buildingValue);
        
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
        const sumXX = xValues.reduce((a, b) => a + b * b, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Add the trendline
        const line = d3.line()
            .x(d => x(d))
            .y(d => y(intercept + slope * d));
            
        const xRange = [x.domain()[0], x.domain()[1]]; // Use the actual domain
            
        svg.append("path")
            .datum(xRange)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4")
            .attr("d", line);
            
        // Add correlation coefficient and trend information
        const correlation = calculateCorrelation(xValues, yValues);
        
        // Add a more descriptive correlation text
        let correlationText = `Correlation: ${correlation.toFixed(2)}`;
        if (correlation < -0.5) {
            correlationText += " (Strong Negative)";
        } else if (correlation < -0.3) {
            correlationText += " (Moderate Negative)";
        } else if (correlation < 0) {
            correlationText += " (Weak Negative)";
        } else if (correlation < 0.3) {
            correlationText += " (Weak Positive)";
        } else if (correlation < 0.5) {
            correlationText += " (Moderate Positive)";
        } else {
            correlationText += " (Strong Positive)";
        }
        
        svg.append("text")
            .attr("x", margin.left + 10)
            .attr("y", margin.top)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .text(correlationText);
            
        // Add trend description
        svg.append("text")
            .attr("x", margin.left + 10)
            .attr("y", margin.top + 20)
            .attr("fill", slope < 0 ? "#FF9999" : "#99FF99") // Red for negative, green for positive
            .attr("font-size", "12px")
            .text(`Trend: ${slope < 0 ? "Value decreases" : "Value increases"} with noise`);
    }
    
    // Add legend with better styling
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 120}, ${margin.top + 5})`);
        
    Object.entries(noiseLevelMapping).forEach(([color, level], i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorMapping[color])
            .attr("stroke", "white")
            .attr("stroke-width", 0.5);
            
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .attr("font-size", "11px")
            .attr("fill", "white")
            .text(level);
    });
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(xValues, yValues) {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
    const sumXX = xValues.reduce((a, b) => a + b * b, 0);
    const sumYY = yValues.reduce((a, b) => a + b * b, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

    // Object for legend text descriptions
    const noiseLevelDescriptions = {
        "Pink": "High Noise: 60 - 70 dB",
        "Red": "Medium-High Noise: 55 - 60 dB",
        "Orange": "Medium Noise: 50 - 55 dB",
        "Yellow": "Low-Medium Noise: 45 - 50 dB"
    };

    onMount(() => {
        if (map) {
            if (map.loaded()) {
                initializeLoading();
                setupKeyboardHandlers(); // Add this line
            } else {
                map.on('load', () => {
                    initializeLoading();
                    setupKeyboardHandlers(); // Add this line
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

<div id="tooltip" style="
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    pointer-events: none;
    z-index: 200;
    opacity: 0;
    transition: opacity 0.2s;
"></div>

<!-- Fix the scatterplot container to ensure it's always in the DOM -->
<div id="scatterplot-container" style="
    position: absolute; 
    top: 80px; 
    left: 10px; 
    width: 400px; 
    height: 400px; 
    background: rgba(50, 50, 50, 0.95); 
    color: white; 
    border: 1px solid #555; 
    border-radius: 8px; 
    overflow: hidden; 
    z-index: 10; 
    padding: 10px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    display: {showScatterplot ? 'block' : 'none'};
">
  <h4 style="margin: 0 0 10px; font-size: 16px; border-bottom: 1px solid #777; padding-bottom: 5px;">
    Building Value vs Noise Level Analysis
  </h4>
  <p style="margin: 0 0 10px; font-size: 12px;">
    Selected {#if hasSelectedParcels && map.getSource("selected-parcels")}
      {map.getSource("selected-parcels")._data.features.length}
    {:else}
      0
    {/if} parcels
  </p>
  <svg id="scatterplot" width="380" height="350"></svg>
  <button style="position: absolute; top: 10px; right: 10px; background: transparent; color: white; border: none; font-size: 16px; cursor: pointer;" 
    on:click={() => { showScatterplot = false; }}>×</button>
</div>

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
</style>