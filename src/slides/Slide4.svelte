<script>
    import Select from 'svelte-select';

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

    // Add this function to get the correct base path
    function getBasePath() {
        return import.meta.env.BASE_URL || '/';
    }

    const searchable = true;
    const basePath = getBasePath();
</script>

<div class="slide">
    <h1>Neighborhoods with elevated hypertension rates often have high proportions of BIPOC residents</h1>
    <p>
        Located near airports or along main runway approach paths, these neighborhoods are exposed to high 
        levels of aircraft noise, further exacerbating the health vulnerabilities faced by marginalized communities.
    </p>
    <br>
    <img src="{basePath}images/demographics_health.jpg" alt="Demographics plot" width="90%" height="auto">
</div>

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