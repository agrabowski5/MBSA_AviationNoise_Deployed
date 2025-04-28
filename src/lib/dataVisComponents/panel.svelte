<script>

    import Scrolly from "../panelComponents/Scrolly.svelte";
    import Slide1 from "../../slides/Slide1.svelte";
    import Slide2 from "../../slides/Slide2.svelte";
    import Slide3 from "../../slides/Slide3.svelte";
    import Slide4 from "../../slides/Slide4.svelte";
    import Slide5 from "../../slides/Slide5.svelte";
    import Slide6 from "../../slides/Slide6.svelte";
    import Slide7 from "../../slides/Slide7.svelte";

    import { tick } from "svelte";
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    let ready = false;

    export let value;
    export let resetScroll;
    export let municipalities;
    export let selectedMunicipality;
    export let selectedStations;

    $: if (value === 0) {
        resetScroll = false;
    }

    let container;
    // $: console.log({ value });
    let colors = [
        '#05515e',
        '#629681',
        '#a9987a',
        '#9f9090',
        '#abafa7',
        '#dd8155',
        '#f39034',
        '#97340b',
        '#999624',
        '#3e5719',
    ];

    $: firstStation = selectedStations[0];

    export let scrollyComponent;

    onMount(() => {
        if (scrollyComponent) {
            ready = true;
        }
    });

    // Default to true to show Slide2 initially
    let isSlide2Active = 'value === 3';
    let isSlide1Active = 'value === 0';

    // Reactive statement to handle changes in selectedMunicipality
    $: if (ready && selectedMunicipality) {
        console.log("Selected Municipality is set", selectedMunicipality);
        let value_scroll = 3; // Assuming this is the index for Slide21
        // isSlide1Active = true;
        scrollToSlide(value_scroll, () => {
            // This callback is called after the scrolling animation completes
            isSlide2Active = false;
            console.log("Slide2 is now inactive.");
        });
        isSlide1Active = 'value === 0';
    } else {
        console.log("Selected Municipality is not set");
    }

    $: if (ready && firstStation && value == 4) {
        console.log("Selected station is set")
        let value_scroll_station = 4;
        scrollToSlide(value_scroll_station)
    }

   
    let isSlide5Active = 'value === 4';
    let isSlide6Active = 'value === 5';
    let isSlide7Active = 'value === 6';

    // Function to scroll to a particular slide
    function scrollToSlide(slideIndex, callback) {
        console.log("Scrolling to slide called", slideIndex);
        if (scrollyComponent && scrollyComponent.scrollToIndex) {
            scrollyComponent.scrollToIndex(slideIndex);
            if (callback) {
                // Assuming scrollIntoView is not returning a Promise, we simulate callback execution
                // after a set time that you estimate as the scroll duration
                setTimeout(callback, 110); // adjust time based on your scroll duration
            }
        } else {
            console.log('scrollToIndex method is undefined');
            if (callback) {
                callback();
            }
        }
    }

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
        <!-- {#each ['MARGINAL', 'OR', 'World!'] as text, i}
            <div class="step" class:active={value === i}>
                <p>{text}</p>
            </div>
        {/each} -->
        <Slide1 active={value === 0} bind:value={value}/>
        <Slide2 active={value === 1} bind:value={value}/>
        <Slide3 active={value === 2} bind:value={value}/>
        <Slide4 active={isSlide2Active} bind:municipalities={municipalities}
                bind:selectedMunicipality={selectedMunicipality}/>
        <Slide5 
            active={isSlide5Active} 
            bind:value={value} 
            bind:municipalities={municipalities}
            bind:selectedMunicipality={selectedMunicipality}
            on:zoomTo={handleZoomTo}
        />
        <Slide6 
            active={isSlide6Active} 
            bind:municipalities={municipalities}
            bind:selectedMunicipality={selectedMunicipality} 
            on:zoomTo={handleZoomTo} 
        />
        <Slide7 active={isSlide7Active} bind:value={value}/>
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



