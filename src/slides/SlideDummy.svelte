<script>
    // export let active = false;
    import {observerStore} from '../lib/panelComponents/Scrolly_slide';

    // export let value;
    let isVisible = false;

    const unsubscribe = observerStore.subscribe(store => {
        isVisible = store.isVisible;
    });

    // Color mapping from ParcelNoiseLayer.svelte
    const colorMapping = {
        'Pink': '#7e1060',
        'Red': '#b1004d',
        'Orange': '#f9773f',
        'Yellow': '#fcc478'
    };

    // Reactive statement to monitor changes in value
    /*
    $: if (value === 1) {
        console.log(isVisible)
        observerStore.startObservation();
        console.log(isVisible)
    }*/

</script>

<div class="slide">
    <h1>Imagine having that aircraft noise interrupt you multiple times per day</h1>
    <p>
        Depending on your proximity to flight paths, you may be exposed to Boston Logan's <strong>1000 aircraft operations</strong> daily.
    </p>
    <div class="noise-comparison">
        <h3>What does aircraft noise sound like?</h3>
        <table class="noise-table">
            <thead>
                <tr>
                    <th>Noise Level</th>
                    <th>Decibels</th>
                    <th>Sounds Similar To</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong class="high-noise">High</strong></td>
                    <td>60-70 dB</td>
                    <td>Busy Restaurant</td>
                </tr>
                <tr>
                    <td><strong class="medium-high-noise">Medium-High</strong></td>
                    <td>55-60 dB</td>
                    <td>Moderate rainfall or Office</td>
                </tr>
                <tr>
                    <td><strong class="medium-noise">Medium</strong></td>
                    <td>50-55 dB</td>
                    <td>Refrigerator running</td>
                </tr>
                <tr>
                    <td><strong class="low-medium-noise">Low-Medium</strong></td>
                    <td>45-50 dB</td>
                    <td>Quiet library or soft background music</td>
                </tr>
            </tbody>
        </table>
        <p class="note">Although these noise levels do not seem high, the constant interruption can interrupt resident's rest and concentration. Even moderate noise levels (45+ dB) can disrupt sleep and increase stress when experienced regularly, especially at night.</p>
    </div>
</div>

<style>
    @import url("$lib/slide.css");
    @import url("$lib/arrow.css");
    
    .noise-comparison {
        padding: 1rem;
        border-radius: 5px;
        margin-top: 1rem;
    }
    
    .noise-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
    }
    
    .noise-table th {
        background-color: rgba(214, 64, 69, 0.1);
        text-align: left;
        padding: 0.5rem;
    }
    
    .noise-table td {
        padding: 0.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .noise-table tr:last-child td {
        border-bottom: none;
    }
    
    .note {
        font-style: italic;
        font-size: 0.9rem;
        margin-top: 1rem;
    }
    
    strong {
        color: #d64045;
    }
    
    .high-noise {
        color: #7e1060; /* Pink */
    }
    
    .medium-high-noise {
        color: #b1004d; /* Red */
    }
    
    .medium-noise {
        color: #f9773f; /* Orange */
    }
    
    .low-medium-noise {
        color: #fcc478; /* Yellow */
    }
</style>
