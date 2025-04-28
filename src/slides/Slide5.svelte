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
        center: [-71.057690,42.301715],
        zoom: 12
    });
*/
</script>

{#if (active)}
    <div class="slide">
        <h1>Dorchester is a neighborhood where about 35% of identify as BIPOC</h1>
        <p>
            Click on a parcel to look at the tooltip with more information about that parcel.
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