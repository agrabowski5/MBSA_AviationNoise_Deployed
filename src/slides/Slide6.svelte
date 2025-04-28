<script>
    import Select from 'svelte-select';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let active = false;
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
            center: [-70.99832, 42.37512],
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

{#if active}
    <div class="slide">
        <h1>This is East Boston. Let's say you wanted to move to this neighborhood. What is the tradeoff you may have
            to make regarding house prices and the level of aircraft noise you may have to face?</h1>
        <p>
            Hold the Alt key (Windows) or Option key (Mac) to activate the multi-select tool.
            Drag your cursor from the center outward to form a rectangle, selecting many parcels. 
            A pop-up appears showing some summary values - things like building and land value, lot
            sizes and noise levels on average. There is also a graph plotting the building value and 
            noise level (with the lot size encoded in the parcel size). You can also see if there is 
            a correlation between the two.
        </p>
        <br>
        <button class="zoom-button" on:click={zoomToEastBoston}>
            🔍 Zoom to East Boston
        </button>
    </div>
{/if}

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