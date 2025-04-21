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
    drawScatterplot();

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

function drawScatterplot() {
    const data = [];

    // Collect all features from all parcel layers
    for (let i = 0; i < currentBatchIndex; i++) {
        const layerId = `parcels-${i}`;
        if (!map.getLayer(layerId)) continue;

        const features = map.queryRenderedFeatures({ layers: [layerId] });

        features.forEach(feature => {
            const props = feature.properties;
            const noiseColor = props.noiseColor;
            const noise = noiseMidpointMapping[noiseColor];

            if (noise !== undefined) {
                const buildingValue = parseFloat(props.BLDG_VAL)/10000000;
                const lotSize = parseFloat(props.LOT_SIZE);
                
                if (!isNaN(buildingValue)) {
                    data.push({
                        noise,
                        buildingValue,
                        lotSize: isNaN(lotSize) ? 0 : lotSize
                    });
                }
            }
        });
    }

    if (!data.length) {
        console.warn("No data available for scatterplot.");
        return;
    }

    // Clear old plot
    d3.select("#scatterplot").selectAll("*").remove();

    const svg = d3.select("#scatterplot"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        margin = { top: 10, right: 20, bottom: 40, left: 60 };

    const x = d3.scaleLinear()
        .domain([40, 75])  // Noise level range
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.buildingValue)]).nice()
        .range([height - margin.bottom, margin.top]);

    const r = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.lotSize)])
        .range([2, 12]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("fill", "#000")
        .text("Noise Level (dB)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("fill", "#000")
        .text("Building Value (in $10000000)");

    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.noise))
        .attr("cy", d => y(d.buildingValue))
        .attr("r", d => r(d.lotSize))
        .attr("fill", "steelblue")
        .attr("opacity", 0.6);

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

<div class="multi-select-tip">
    <p><strong>Tip:</strong> Hold <kbd>Alt</kbd> (Windows) or <kbd>Option</kbd> (Mac) to activate multi-select tool</p>
</div>

<div id="scatterplot-container" style="position: absolute; top: 80px; left: 10px; width: 400px; height: 400px; background: rgba(255,255,255,0.95); border: 1px solid #ccc; border-radius: 8px; overflow: hidden; z-index: 10; padding: 10px;">
  <h4 style="margin: 0 0 10px;">Building Value vs Noise Level</h4>
  <svg id="scatterplot" width="380" height="350"></svg>
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