<script>
    // export let active = false;
    import {observerStore} from '../lib/panelComponents/Scrolly_slide';

    export let value;
    let isVisible = false;
    let isVisibleSecond = false;

    observerStore.subscribe(store => {
        isVisible = store.isVisible;
    });

    $: if (value === 2) {
        observerStore.resetVisibility();  // Reset visibility whenever checking this condition
        observerStore.startObservation();
    }

    $: if (isVisible) {
        setTimeout(() => {
            isVisibleSecond = true;
        }, 8000);
    }
</script>


<div class="slide">
    <h1>BIPOC Communities are at Higher Risk of Developing Hypertension</h1>
        <p>
            Hypertension, also known as high blood pressure, is a major risk factor for the development of heart disease. 
            A recent report showed that Black and Latino adult residents in Boston experienced higher prevalence of hypertension 
            when compared with their White counterparts.
        </p>
        <br>

</div>

<!-- <div class="footnotes">
    <ol>
      <li id="fn1">
        https://www.wbur.org/radioboston/2023/11/27/mbta-communites-act-density-transit-oriented-housing
        <a href="#fnref1">↩</a>
      </li>
    </ol>
  </div> -->

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");

</style>