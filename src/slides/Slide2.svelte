<script>
    // export let active = false;
    import {observerStore} from '../lib/panelComponents/Scrolly_slide';

    // export let value;
    let isVisible = false;

    const unsubscribe = observerStore.subscribe(store => {
        isVisible = store.isVisible;
    });

    // Reactive statement to monitor changes in value
    /*
    $: if (value === 1) {
        console.log(isVisible)
        observerStore.startObservation();
        console.log(isVisible)
    }*/

</script>

<div class="slide">
    <h1>Continuous Exposure to Aircraft Noise can lead to Serious Health Risks</h1>
    <p>
        Research has shown that residential areas with substantial noise exposure 
        experience higher cardiovascular hospital admission rates. <br><br>
        The Hypertension and Exposure to Noise near Airports (HYENA) study found a significant 
        increase in blood pressure with increases in nighttime aircraft noise
    </p>
    <br>
   <div class="citation">
    Source: HYENA Study (Jarup et al., 2008), *European Heart Journal*
</div>

</div>

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");
    .citation {
    font-size: 0.75rem;
    color: #666;
    margin-top: 2rem;
    text-align: right;
    font-style: italic;
}


</style>
