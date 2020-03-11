/* SET UP GLOBALS, FORCES, ZOOMING */
let svg = d3.select('#network');
let container = svg.append('g');

let width = +svg.attr('width');
let height = +svg.attr('height');

svg.call(
    d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', function() {
            container.attr('transform', d3.event.transform);
        })
);

let color = d3.scaleOrdinal(d3.schemeCategory10);

let simulation = d3
    .forceSimulation()
    .force('charge', d3.forceManyBody().strength(-1000))
    .force('center', d3.forceCenter(width / 2, height / 2));

let nodesData;

/* LOAD IN CSV DATA */
d3.csv('./data/network/got-s1-edges.csv').then(links => {
    nodesData = {};

    links.forEach(link => {
        createNodes(link);
    });

    /* CREATE A D3 LIST OF NODES */
    let nodes = d3.values(nodesData);

    console.log(nodes);
    console.log(links);

    simulation.nodes(nodes).on('tick', ticked);

    simulation.force(
        'link',
        d3
            .forceLink(links)
            .id(d => {
                return d.id;
            })
            .distance(50)
            .strength(1)
    );

    let link = container
        .append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke-width', d => {
            return Math.sqrt(d.weight / 4);
        });

    let node = container
        .append('g')
        .selectAll('node')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', 5)
        .style('fill', d => {
            return color(d.group);
        })
        .call(
            d3
                .drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
        );

    let label = container
        .append('g')
        .selectAll('label')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'label')
        .text(d => {
            return d.id;
        });

    /* HANDLE NODE HOVER */
    node.on('mouseover', d => {
        node.transition(500).style('opacity', n => {
            if (n === d || d.neighbors.includes(n.id)) {
                return 1;
            } else {
                return 0.2;
            }
        });

        link.transition(500).style('opacity', l => {
            if (d === l.source || d === l.target) {
                return 1;
            } else {
                return 0.2;
            }
        });

        label.transition(500).style('opacity', l => {
            if (l === d || d.neighbors.includes(l.id)) {
                return 1;
            } else {
                return 0.2;
            }
        });
    });

    node.on('mouseout', function() {
        node.transition(500).style('opacity', 1);
        link.transition(500).style('opacity', 0.2);
        label.transition(500).style('opacity', 0.2);
    });

    /* HANDLES GRAPH TICKS TO DETERMINE NODES/LINKS' POSITIONS */
    function ticked() {
        link.attr('x1', d => {
            return d.source.x;
        })
            .attr('y1', d => {
                return d.source.y;
            })
            .attr('x2', d => {
                return d.target.x;
            })
            .attr('y2', d => {
                return d.target.y;
            });

        node.attr('cx', d => {
            return d.x;
        }).attr('cy', d => {
            return d.y;
        });

        label
            .attr('x', function(d) {
                return d.x + 8;
            })
            .attr('y', function(d) {
                return d.y + 3;
            });
    }
});

function createNode(name) {
    return (
        nodesData[name] ||
        (nodesData[name] = { id: name, group: getRandomInt(7), neighbors: [] })
    );
}

function createNodes(link) {
    let sourceData = createNode(link.source);
    sourceData.neighbors.push(link.target);
    let targetData = createNode(link.target);
    targetData.neighbors.push(link.source);
}

/* TEMPORARY GROUPING NUMBER GENERATOR */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/* D3 FORCE NODE DRAGGING */
function dragStarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragEnded(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
