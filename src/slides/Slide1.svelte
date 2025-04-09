<script>
    export let active = false;

</script>

{#if (active)}
    <div class="slide">
        <h1>Noisy Landings</h1>
        <h2>A tool for understanding Aviation's impact on the Boston Housing market</h2>
        <p>- Kailey Bridgeman, Andrew Grabowski, Marcos Logrono, Shreya Sharma  -</p>
        <div class="scroll-indicator"></div>
    </div>
{/if}

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");
</style>
