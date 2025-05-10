<script>
    // export let active = false;
    import {observerStore} from '../lib/panelComponents/Scrolly_slide';

    // export let value;
    let isVisible = false;

    const unsubscribe = observerStore.subscribe(store => {
        isVisible = store.isVisible;
    });

</script>

<div class="slide">
    <h1>Acknowledgements</h1>
    <p>
        Insert Acknowledgement here
    </p>
    <br>
   
</div>

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");

</style>
