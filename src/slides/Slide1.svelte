<script>
    export let active = false;
</script>

{#if (active)}
    <div class="slide">
        <h1>When the Skies Get Loud</h1>
        <h2>Health and Housing Impacts of Aviation Noise</h2>
        <p>- Kailey Bridgeman, Andrew Grabowski, Marcos Logrono, Shreya Sharma  -</p>
        
        <div class="scroll-indicator">
            <div class="airplane-container">
                <svg class="airplane" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                    <path fill="#B87A45" d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
                </svg>
                <div class="scroll-text">Scroll Down</div>
            </div>
        </div>
    </div>
{/if}

<style>
    @import url("$lib/slide.css");
    /* Removed the arrow.css import */
    
    .scroll-indicator {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: fadeInOut 2s infinite alternate;
        /* Reset the border properties that might be creating the triangle */
        border: none;
        width: auto;
        height: auto;
    }
    
    /* Ensure this style takes precedence over any imported ones */
    :global(.slide .scroll-indicator) {
        border: none !important;
        width: auto !important;
        height: auto !important;
    }
    
    .airplane-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .airplane {
        transform: rotate(180deg);
        animation: bounce 1.5s infinite ease-in-out;
        margin-bottom: 8px;
    }
    
    .scroll-text {
        font-size: 14px;
        color: #B87A45;
        opacity: 0.9;
        font-weight: 500;
    }
    
    @keyframes bounce {
        0%, 100% {
            transform: rotate(180deg) translateY(0);
        }
        50% {
            transform: rotate(180deg) translateY(10px);
        }
    }
    
    @keyframes fadeInOut {
        0% {
            opacity: 0.5;
        }
        100% {
            opacity: 1;
        }
    }
    
    /* Override any existing arrow styles that might be in global styles */
    :global(.arrow-down) {
        display: none !important;
    }
</style>
