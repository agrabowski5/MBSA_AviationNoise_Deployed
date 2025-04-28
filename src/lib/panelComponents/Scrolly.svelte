<script>
  /**
     * adapted from Russell Samora
   * This component manages which item is most in view for scroll triggering
   * example:
   * <Scrolly
   * 	bind:value={scrollIndex}
   * >
   * **items here**
   * </Scrolly>
   *
   * optional params with defaults
   * <Scrolly root={null} top={0} bottom={0} increments={100}>
   */
  import { onMount } from "svelte";
  export let root = null;
  export let top = 0;
  export let bottom = 0;
  export let increments = 100;
  export let value = undefined;

  const steps = [];
  const threshold = [];

  let nodes = [];
  let intersectionObservers = [];
  let container;

  $: top, bottom, update();

  const update = () => {
    if (!nodes.length) return;
    nodes.forEach(createObserver);
  };

  export function scrollToIndex(index) {
      // await tick(); // Ensure all updates are processed
      console.log(`Attempting to scroll to index: ${index}`);
      console.log('Available children:', container.children);
      if (container && container.children && container.children[index]) {
          console.log(`Scrolling to:`, container.children[index]);
          container.children[index].scrollIntoView({ behavior: 'smooth' });
      } else {
          console.log('No valid element found for index:', index);
      }
  };

  const mostInView = () => {
    let maxRatio = 0;
    let maxIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i] > maxRatio) {
        maxRatio = steps[i];
        maxIndex = i;
      }
    }

    if (maxRatio > 0) value = maxIndex;
        else value = undefined;
  };

  const createObserver = (node, index) => {
    const handleIntersect = (e) => {
      const ratio = e[0].intersectionRatio;
      if (ratio > 0.5) {
        value = index;
      }
    };

    const options = { 
      root,
      rootMargin: `${top * -1}px 0px ${bottom * -1}px 0px`,
      threshold: 0.5
    };

    if (intersectionObservers[index]) intersectionObservers[index].disconnect();

    const io = new IntersectionObserver(handleIntersect, options);
    io.observe(node);
    intersectionObservers[index] = io;
  };

  onMount(() => {
    for (let i = 0; i < increments + 1; i++) {
      threshold.push(i / increments);
    }
    nodes = container.querySelectorAll(":scope > *");
    update();
  });
</script>

<div bind:this={container}>
  <div class="scroll-container">
    <slot />
  </div>
</div>

<style>
  div {
    position: relative;
    padding-right: 4px;
  }

  .scroll-container {
    height: 100vh;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }

  
  :global(.scroll-container > *) {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  
  :global(*::-webkit-scrollbar) {
    width: 6px;
    background-color: transparent;
  }

  :global(*::-webkit-scrollbar-thumb) {
    background-color: #B87A45;
    border-radius: 3px;
  }

  :global(*::-webkit-scrollbar-track) {
    background-color: rgba(184, 122, 69, 0.1); 
    margin: 4px 0;
  }


  * {
    scrollbar-width: thin;
    scrollbar-color: #B87A45 transparent;
  }
</style>

  