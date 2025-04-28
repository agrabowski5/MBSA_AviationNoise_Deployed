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
</script>

{#if (active)}
    <div class="slide">
        <h1>Neighborhoods with elevated hypertension rates often have high proportions of BIPOC residents</h1>
        <p>
            Located near airports or along main runway approach paths, these neighborhoods are exposed to high 
            levels of aircraft noise, further exacerbating the health vulnerabilities faced by marginalized communities.
        </p>
        <br>
        <img src="/images/demographics_health.jpg" alt="Demographics plot" width="90%" height="auto">
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