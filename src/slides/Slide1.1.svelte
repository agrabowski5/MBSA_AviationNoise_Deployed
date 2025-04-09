<script>
    export let active = false;
    import {observerStore} from '../lib/panelComponents/Scrolly_slide';

    export let value;
    let isVisible = false;

    const unsubscribe = observerStore.subscribe(store => {
        isVisible = store.isVisible;
    });

    // Reactive statement to monitor changes in value
    $: if (value === 1) {
        console.log(isVisible)
        observerStore.startObservation();
        console.log(isVisible)
    }
</script>

<div class="slide">
    <h1>Aviation Noise is everywhere</h1>
    {#if isVisible}
        <p>
            It's constantly above us and making a ton of racket. 
        </p>
        <br>
        <div class="scroll-indicator"></div>
    {/if}
</div>

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");

</style>
