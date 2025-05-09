<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    export let active = false;
    
    let audioPlayer;
    let audioPlayed = false;
    
    function playSound() {
        if (audioPlayer && !audioPlayed) {
            audioPlayer.play()
                .then(() => {
                    console.log('Audio played successfully');
                    audioPlayed = true;
                })
                .catch(e => console.log('Audio play failed:', e));
        } else if (audioPlayer && audioPlayed) {
            // Allow replaying the sound
            audioPlayer.currentTime = 0;
            audioPlayer.play()
                .then(() => console.log('Audio replayed successfully'))
                .catch(e => console.log('Audio replay failed:', e));
        }
    }
    
    onMount(() => {
        if (browser && active) {
            // Preload the audio
            if (audioPlayer) {
                audioPlayer.volume = 0.6;
                audioPlayer.preload = "auto";
            }
        }
    });
</script>

{#if (active)}
    <div class="slide">
        <div class="content-container">
            <h1>When the Skies Get Loud</h1>
            <h2>Health and Housing Impacts of Aviation Noise</h2>
            <p class="authors">- Kailey Bridgeman, Andrew Grabowski, Marcos Logrono, Shreya Sharma  -</p>
            
            <!-- Sound button - moved below names -->
            <div class="button-container">
                <button class="sound-button {audioPlayed ? 'played' : ''}" on:click={playSound}>
                    <svg class="sound-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                        {#if !audioPlayed}
                            <!-- Play icon -->
                            <path fill="#B87A45" d="M12,3V12.26C11.5,12.09 11,12 10.5,12C8.01,12 6,14.01 6,16.5C6,18.99 8.01,21 10.5,21C12.81,21 14.7,19.25 14.95,17H15V6H19V3H12Z" />
                        {:else}
                            <!-- Replay icon -->
                            <path fill="#B87A45" d="M17.65,6.35C16.2,4.9 14.21,4 12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18C8.69,18 6,15.31 6,12C6,8.69 8.69,6 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        {/if}
                    </svg>
                    {audioPlayed ? 'Play Again' : 'Click Here to experience living near an airport'}
                </button>
            </div>
        </div>
        
        <div class="scroll-indicator">
            <div class="airplane-container">
                <svg class="airplane" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                    <path fill="#B87A45" d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
                </svg>
                <div class="scroll-text">Scroll Down</div>
            </div>
        </div>
    </div>
    
    <!-- Audio player -->
    <audio 
        bind:this={audioPlayer}
        src="/sounds/aircraft-takeoff.mp3"
    >
        Your browser does not support the audio element.
    </audio>
{/if}

<style>
    @import url("$lib/slide.css");
    
    .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        padding-bottom: 200px;  /* Space for the scroll indicator */
    }
    
    .button-container {
        margin-top: 25px;  /* Space between authors and button */
    }
    
    .sound-button {
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #B87A45;
        border-radius: 25px;
        padding: 8px 16px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        color: #333;
    }
    
    .sound-button:hover {
        background-color: rgba(255, 255, 255, 1);
        box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }
    
    /* Style for the button after it's been clicked */
    .sound-button.played {
        background-color: rgba(184, 122, 69, 0.1);
        border: 1px dashed #B87A45;
    }
    
    .sound-button.played:hover {
        background-color: rgba(184, 122, 69, 0.2);
    }
    
    .sound-icon {
        flex-shrink: 0;
    }
    
    .authors {
        margin-bottom: 0;  /* Remove default margin to control spacing with button */
    }
    
    .scroll-indicator {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: fadeInOut 2s infinite alternate;
        border: none;
        width: auto;
        height: auto;
    }
    
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
    
    :global(.arrow-down) {
        display: none !important;
    }
</style>
