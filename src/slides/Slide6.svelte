<script>
    import Select from 'svelte-select';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let municipalities = [];
    export let selectedMunicipality = {};
    let input = "";

    function handleSelect(e) {
        selectedMunicipality = e.detail.value;
    }

    $: items = municipalities?.map(m => ({
        'value': m,
        'label': m.Name
        // 'selectable': m.Selectable
    }));

    const searchable = true;

    // Simple function to zoom to East Boston by dispatching an event
    function zoomToEastBoston() {
        // This event will be captured in the parent component
        dispatch('zoomTo', {
            center: [-71.05832, 42.37512],
            zoom: 13.5
        });
        
        // Optionally select Boston in the dropdown if available
        const boston = municipalities.find(m => 
            m.Name && m.Name.toLowerCase().includes('boston'));
            
        if (boston) {
            selectedMunicipality = boston;
        }
    }
</script>

<div class="slide">
    <h1>This is East Boston. Let's say you wanted to move to this neighborhood. What is the tradeoff you may have
        to make regarding house prices and the level of aircraft noise you may have to face?</h1>
    
    <div class="steps-container">
        <div class="step">
            <span class="step-number">1</span>
            <p>Hold the Alt key (Windows) or Option key (Mac) to activate the multi-select tool.</p>
        </div>
        
        <div class="step">
            <span class="step-number">2</span>
            <p>Drag your cursor from the center outward to form a rectangle, selecting many parcels.</p>
        </div>
        
        <div class="step">
            <span class="step-number">3</span>
            <p>A pop-up appears showing summary values - building and land values, lot sizes, and noise levels on average.</p>
        </div>
        
        <div class="step">
            <span class="step-number">4</span>
            <p>Examine the graph plotting building value vs noise level (with lot size shown by the circle size).</p>
        </div>
        
        <div class="step">
            <span class="step-number">5</span>
            <p>Look for patterns - is there a correlation between property values and noise levels in this neighborhood?</p>
        </div>
    </div>
    
    <br>
    <button class="zoom-button" on:click={zoomToEastBoston}>
        🔍 Zoom to East Boston
    </button>
</div>

<style>
    @import url("$lib/global.css");
    @import url("$lib/slide.css");
    
    .steps-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 20px;
        max-width: 800px;
    }
    
    .step {
        display: flex;
        align-items: baseline;
        gap: 15px;
    }
    
    .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        background-color: rgba(184, 122, 69, 0.7);
        color: white;
        border-radius: 50%;
        font-weight: bold;
        font-size: 16px;
    }
    
    .step p {
        margin: 0;
        flex: 1;
    }
    
    .zoom-button {
        background-color: #B87A45;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 16px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        margin-top: 20px;
    }
    
    .zoom-button:hover {
        background-color: #D89A65;
        transform: translateY(-2px);
    }
    
    .zoom-button:active {
        transform: translateY(0);
    }
</style>