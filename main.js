let svg = d3.select('#network');

let width = +svg.attr('width');
let height = +svg.attr('height');

// outdate code, d3 version 3?
// let force = d3.layout
//   .force()
//   .gravity(0.05)
//   .distance(100)
//   .charge(-100)
//   .size([svgWidth, svgHeight]);

let simulation = d3
    .forceSimulation()
    .force(
        'link',
        d3.forceLink().id(function(d) {
            return d.id;
        })
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2));

let nodesData;

d3.csv('./data/network/got-s1-edges.csv').then(links => {
    nodesData = {};

    links.forEach(link => {
        link.source = createNode(link.Source);
        link.target = createNode(link.Target);
    });

    let nodes = d3.values(nodesData);

    let link = svg
        .selectAll('.link')
        .data(links)
        .enter()
        .append('g')
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => {
            return Math.sqrt(d.Weight);
        });

    let node = svg
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node');

    let circles = node
        .append('circle')
        .attr('r', 5)
        .call(
            d3
                .drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
        );

    let labels = node
        .append('text')
        .text(d => {
            return d.name;
        })
        .attr('x', 6)
        .attr('y', 3);

    simulation.nodes(nodes).on('tick', ticked);

    simulation.force('link').links(links);

    function ticked() {
        link.attr('x1', function(d) {
            return d.source.x;
        })
            .attr('y1', function(d) {
                return d.source.y;
            })
            .attr('x2', function(d) {
                return d.target.x;
            })
            .attr('y2', function(d) {
                return d.target.y;
            });

        node.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });
    }
});

function createNode(name) {
    return nodesData[name] || (nodesData[name] = { name: name });
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
