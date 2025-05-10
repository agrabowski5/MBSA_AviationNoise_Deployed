<script>

    import Scrolly from "../panelComponents/Scrolly.svelte";
    import Slide1 from "../../slides/Slide1.svelte";
    import Slide2 from "../../slides/Slide2.svelte";
    import Slide3 from "../../slides/Slide3.svelte";
    import Slide4 from "../../slides/Slide4.svelte";
    import Slide5 from "../../slides/Slide5.svelte";
    import Slide6 from "../../slides/Slide6.svelte";
    import Slide7 from "../../slides/Slide7.svelte";
    import SlideDummy from "../../slides/SlideDummy.svelte";
    import Slide8 from "../../slides/Slide8.svelte";

    import { tick } from "svelte";
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    let ready = false;

    export let value;
    export let resetScroll;

    $: if (value === 0) {
        resetScroll = false;
    }

    export let scrollyComponent;

    onMount(() => {
        if (scrollyComponent) {
            ready = true;
        }
    });


    $: console.log('Current slide index (value):', value);

    // Add this function to handle zoom events
    function handleZoomTo(event) {
        console.log("Zoom event received:", event.detail);
        // Forward the event to the parent component
        dispatch('zoomTo', event.detail);
    }

    const dispatch = createEventDispatcher();

</script>

<div class="main-panel-container">
    <Scrolly bind:this={scrollyComponent} bind:value={value}> <!-- 3. This is what updates value -->
        <Slide1 active={value === 0} bind:value={value}/>
        <SlideDummy active={value === 1} bind:value={value}/>
        <Slide2 active={value === 2} bind:value={value}/>
        <Slide3 active={value === 3} bind:value={value}/>
        <Slide4 active={value === 4} bind:value={value}/>
        <Slide5 
            active={value === 5} 
            bind:value={value} 
            on:zoomTo={handleZoomTo}
        />
        <Slide6 
            active={value === 6} 
            bind:value={value} 
            on:zoomTo={handleZoomTo} 
        />
        <Slide7 active={value === 7} bind:value={value}/>
        <Slide8 active={value === 8} bind:value={value}/>
    </Scrolly>
</div>

<style>
    div {
        z-index: 5;
        text-align: center;
    }

    .main-panel-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 40%;
        height: 100%;
        background-color: transparent;
        padding: 20px;
        color: #FFF5E6;
        font-family: 'Arial', sans-serif;
        overflow: hidden;
    }

    .main-panel-container::-webkit-scrollbar {
        width: 8px;
        background-color: transparent;
    }

    .main-panel-container::-webkit-scrollbar-thumb {
        background-color: #E2904A;
        border-radius: 4px;
    }

    .main-panel-container::-webkit-scrollbar-track {
        background-color: rgba(226, 144, 74, 0.1);
    }

   
    :global(.main-panel-container > div > div) {
        background-color: rgba(44, 29, 14, 0.4);
        backdrop-filter: blur(4px);
        margin: 10px;
        padding: 12px 16px;
        border-radius: 6px;
        position: relative;
        border: 1px solid rgba(226, 144, 74, 0.6);
        box-shadow: 
            0 0 15px rgba(226, 144, 74, 0.1),
            inset 0 0 20px rgba(226, 144, 74, 0.05);
    }

  
    :global(.main-panel-container > div > div)::before,
    :global(.main-panel-container > div > div)::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border: 1px solid rgba(226, 144, 74, 0.8);
    }

    :global(.main-panel-container > div > div)::before {
        top: -1px;
        left: -1px;
        border-right: none;
        border-bottom: none;
        border-radius: 6px 0 0 0;
    }

    :global(.main-panel-container > div > div)::after {
        bottom: -1px;
        right: -1px;
        border-left: none;
        border-top: none;
        border-radius: 0 0 6px 0;
    }

    
    :global(.main-panel-container > div > div):hover {
        background-color: rgba(44, 29, 14, 0.5);
        box-shadow: 
            0 0 20px rgba(226, 144, 74, 0.15),
            inset 0 0 25px rgba(226, 144, 74, 0.08);
        transition: all 0.3s ease;
    }

    /* .step {
		height: 80vh;
		opacity: .3;
		background: plum;
		transition: opacity 300ms ease;
		display: flex;
		justify-content: center;
		place-items: center;
	}
	
	.step.active {
		opacity: 1;
	} */

</style>



