function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Zoomable treemap</h1></div>
# Zoomable treemap
Click any cell to zoom in, or the top to zoom out.`
)}

function _chart(d3,data,DOM)
{
  // Dynamically set chart dimensions to fit remaining screen space without scrolling.
  const width = window.innerWidth;
  const totalHeaderHeight = Array.from(document.querySelectorAll("div, h1, h2"))
    .reduce((sum, el) => sum + (el.offsetHeight || 0), 0); // Calculate total height of all header elements
  const height = window.innerHeight - totalHeaderHeight - 10; // Fit remaining space and add a small margin

  // This custom tiling function adapts the built-in binary tiling function
  // for the appropriate aspect ratio when the treemap is zoomed-in.
  function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
      child.x0 = x0 + child.x0 / width * (x1 - x0);
      child.x1 = x0 + child.x1 / width * (x1 - x0);
      child.y0 = y0 + child.y0 / height * (y1 - y0);
      child.y1 = y0 + child.y1 / height * (y1 - y0);
    }
  }

  // Compute the layout.
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  const root = d3.treemap().tile(tile)(hierarchy);

  // Create the scales.
  const x = d3.scaleLinear().rangeRound([0, width]);
  const y = d3.scaleLinear().rangeRound([0, height]);

  // Formatting utilities.
  const format = d3.format(",d");
  const name = d => d.ancestors().reverse().map(d => d.data.name).join("/");

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("viewBox", [0.5, -30.5, width, height + 30])
      .attr("width", width)
      .attr("height", height + 30)
      .attr("style", "max-width: 100%; height: auto; overflow: hidden;")
      .style("font", "14px sans-serif");

  // Display the root.
  let group = svg.append("g")
      .call(render, root);

  function render(group, root) {
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g");

    node.filter(d => d === root ? d.parent : d.children)
        .attr("cursor", "pointer")
        .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

    node.append("title")
        .text(d => `${name(d)}\n${format(d.value)}`);

    node.append("rect")
        .attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
        .attr("fill", d => d === root ? "#6fa8dc" : d.children ? "#9fc5e8" : "#cfe2f3")
        .attr("stroke", "#fff");

    node.append("clipPath")
        .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
      .append("use")
        .attr("xlink:href", d => d.leafUid.href);

    node.append("text")
        .attr("clip-path", d => d.clipUid)
        .attr("font-weight", d => d === root ? "bold" : null)
      .selectAll("tspan")
      .data(d => {
        const value = d.value || 0; // Ensure value is defined
        if (value <= 80) return []; // Remove text for values ≤ 80
        return (d === root ? name(d) : d.data.name)
          .split(/(?=[A-Z][^A-Z])/g)
          .concat(format(value)); // Add value to the text
      })
      .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
        .style("font-size", (d, i, nodes) => {
          const value = parseInt(nodes[nodes.length - 1].textContent.replace(/,/g, ""), 10);
          if (value >= 180) return "16px";
          if (value >= 80) return "13px";
          return "0px"; // Hidden text
        })
        .text(d => d);

    group.call(position, root);
  }

  function position(group, root) {
    group.selectAll("g")
        .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
      .select("rect")
        .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
        .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .call(position, d.parent))
        .call(t => group1.transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d));
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d))
        .call(t => group1.transition(t)
          .call(position, d.parent));
  }

  return svg.node();
}

async function _data(){
    return fetch("./files/e65374209781891f37dea1e7a6e1c5e020a3009b8aedf113b4c80942018887a1176ad4945cf14444603ff91d3da371b3b0d72419fa8d2ee0f6e815732475d5de.json")
    	.then(response => {
    	        if (!response.ok) {
    	            throw new Error(`Failed to load data: ${response.statusText}`);
    	        }
    	        return response.json();
    	});
}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data","DOM"], _chart);
  main.variable(observer("data")).define("data", [], _data);
  return main;
}

