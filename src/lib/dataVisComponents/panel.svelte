<script>

    import Scrolly from "../panelComponents/Scrolly.svelte";
    import Slide1 from "../../slides/Slide1.svelte";
    import Slide11 from "../../slides/Slide1.1.svelte";
    import Slide12 from "../../slides/Slide1.2.svelte";
    import Slide2 from "../../slides/Slide2.svelte";

    import { tick } from "svelte";
    import { onMount } from 'svelte';

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



</script>

<div class="main-panel-container">
    <Scrolly bind:this={scrollyComponent} bind:value={value}> <!-- 3. This is what updates value -->
        <!-- {#each ['MARGINAL', 'OR', 'World!'] as text, i}
            <div class="step" class:active={value === i}>
                <p>{text}</p>
            </div>
        {/each} -->
        <Slide1 active={isSlide1Active}/>
        <Slide11 active={value === 1} bind:value={value}/>
        <Slide12 active={value === 2} bind:value={value}/>
        <Slide2 active={isSlide2Active} bind:municipalities={municipalities}
                bind:selectedMunicipality={selectedMunicipality}/>
    </Scrolly>
</div>

<style>
    div {
        z-index: 5;
        text-align: center;
    }

    .main-panel-container {
        overflow-y: auto; /* Allows vertical scrolling */
        overflow-x: hidden; /* Disables horizontal scrolling */
        position: absolute;
        top: 0;
        left: 0;
        width: 40%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        padding: 20px;
        color: #9f9090;
        /*backdrop-filter: blur(8px);*/
    }

    .main-panel-container::-webkit-scrollbar {
        display: none;
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

  