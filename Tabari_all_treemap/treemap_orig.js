function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Zoomable treemap</h1><a href="https://d3js.org/">D3</a> › <a href="/@d3/gallery">Gallery</a></div>

# Tabari's Zoomable treemap

Click any cell to zoom in, or the top to zoom out.

Includes three books' Isnad data of depth three (positions 0 to 2, excluding Tabari) for top 50 direct informant, filtering Isnads of 1 or 2 occurences as well as those with ##### in any positions 1-2.`
)}

function _chart(d3,data,DOM)
{
  // Specify the chart’s dimensions.
  const width = window.innerWidth;//2000;
  const height = window.innerHeight;//1000;

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
      .attr("style", "max-width: 100%; height: auto;")
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
      .data(d => (d === root ? name(d) : d.data.name).split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
      .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
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


function _data(FileAttachment){return(
FileAttachment("flare-2.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["flare-2.json", {url: new URL("./files/Tabari_all_treemap3.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data","DOM"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
