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
    }));

    const searchable = true;
    
    // Simple function to zoom to Dorchester by dispatching an event
    function zoomToDorchester() {
        // This event will be captured in the parent component
        dispatch('zoomTo', {
            center: [-71.057690, 42.32715],
            zoom: 13.5
        });
        
        // Optionally select Boston in the dropdown if available
        const boston = municipalities.find(m => 
            m.Name.toLowerCase().includes('boston'));
            
        if (boston) {
            selectedMunicipality = boston;
        }
    }
</script>

<div class="slide">
    <h1>Dorchester is a neighborhood where about 35% of identify as BIPOC</h1>
    <p>
        Click on a parcel within the four colored noise levels to look at the tooltip with more information about that parcel.
    </p>
    <br>
    <button class="zoom-button" on:click={zoomToDorchester}>
        🔍 Zoom to Dorchester
    </button>
</div>

<style>
    @import url("$lib/global.css");
    @import url("$lib/slide.css");
    
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
        margin-top: 10px;
    }
    
    .zoom-button:hover {
        background-color: #D89A65;
        transform: translateY(-2px);
    }
    
    .zoom-button:active {
        transform: translateY(0);
    }
</style>