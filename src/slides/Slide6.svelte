<script>
    import Select from 'svelte-select';

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
/*
    map.flyTo({
    center: [-70.99195706754855,42.38399852653385],
    zoom: 12
    });
*/

</script>

{#if (active)}
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
    </div>
{/if}

<style>
    @import url("$lib/global.css");
    @import url("$lib/slide.css");
    /*
    :global(.searchbar) {
        z-index: 100;
        font: 18px sans-serif;
        font-family: 'Montserrat', sans-serif;
        visibility: visible;
        background-color: rgba(10, 0, 0, 0.4) !important;
        backdrop-filter: blur(8px) !important;
        border-radius: 10px;
        width: 200px;
        color: #a9987a;
        position: fixed;
        padding: 10px;
    }

    .select-container {
        width: 40%;
    }
        */
</style>