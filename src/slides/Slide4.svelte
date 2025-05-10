<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    const data = [
        { neighborhood: 'Mattapan', percentBIPOC: 87.4, hypertensionRate: 40 },
        { neighborhood: 'Dorchester', percentBIPOC: 66.50, hypertensionRate: 34.7 },
        { neighborhood: 'East Boston', percentBIPOC: 57.90, hypertensionRate: 25.7 },
        { neighborhood: 'South End', percentBIPOC: 39.3, hypertensionRate: 23 },
    ];

    const margin = { top: 10, right: 10, bottom: 40, left: 65 };
    const width = 380 - margin.left - margin.right;
    const height = data.length * 30;

    let svg;

    onMount(() => {
        const x = d3.scaleLinear()
            .domain([0, 50])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.neighborhood))
            .range([0, height])
            .padding(0.2);

        const color = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.percentBIPOC)])
            .range(["#F7D7B4", "#8C3B00"]);

        const chart = d3.select(svg)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .call(d3.axisLeft(y));

        const bars = chart.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", d => y(d.neighborhood))
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .attr("fill", d => color(d.percentBIPOC));

        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(
                d3.axisBottom(x)
                    .tickValues(d3.range(0, 51, 10))
                    .tickFormat(d => d + "%")
            )
            .append("text")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 5)
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .text("Hypertension Rate");

        // Animate bars when visible
        function animateBars() {
            bars.transition()
                .duration(800)
                .attr("width", d => x(d.hypertensionRate));
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateBars();
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(svg);

        // === Add Color Bar Legend ===
        const legendWidth = 200;
        const legendHeight = 10;

        const defs = d3.select(svg).append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: "#F7D7B4" },
                { offset: "100%", color: "#8C3B00" }
            ])
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        const legendGroup = d3.select(svg)
            .append("g")
            .attr("transform", `translate(${(width + margin.left + 55 + margin.right - legendWidth) / 2}, ${height + margin.top + margin.bottom + 20})`);

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.percentBIPOC)])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => d + "%");

        legendGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);

        legendGroup.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", legendHeight + 30)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "0.65rem")
            .text("Percent BIPOC");
    });
</script>

<div class="slide">
    <h1>Neighborhoods with elevated hypertension rates often have high proportions of BIPOC residents</h1>
    <p>
        Located near airports or along main runway approach paths, these neighborhoods are exposed to high 
        levels of aircraft noise, further exacerbating the health vulnerabilities faced by marginalized communities.
    </p>
    <br>
    <div class="chart-container">
        <svg bind:this={svg} width={width + margin.left + margin.right} height={height + margin.top + margin.bottom + 80}></svg>
    </div>
</div>

<style>
    .slide {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .chart-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    svg {
        max-width: 100%;
        height: auto;
    }
</style>