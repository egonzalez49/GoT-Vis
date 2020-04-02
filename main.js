/* SET UP GLOBALS, ZOOMING */
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

// let simulation = d3
//     .forceSimulation()
//     .force('charge', d3.forceManyBody().strength(-1000))
//     .force('center', d3.forceCenter(width / 2, height / 2));

let color = d3.scaleOrdinal(d3.schemePaired);


let season = 's2';

/* SEASON SELECT ONCHANGE */
function onSeasonChanged() {
    var select = d3.select('#seasonSelect').node();
    let seasonSelected = select.options[select.selectedIndex].value;
    console.log(seasonSelected);
    if (seasonSelected !== season) {
        season = seasonSelected;
        updateChart();
    }
}                                     
              

let nodesData;

updateChart();

/* LOAD IN CSV DATA */
function updateChart() {
    Promise.all([
        d3.csv(`./data/network/got-${season}-edges.csv`),
        d3.csv(`./data/network/got-${season}-nodes.csv`)
    ]).then(files => {
        let simulation = d3
            .forceSimulation()
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2));

        let links = files[0];
        let nodesFile = files[1];

        container.selectAll('*').remove();

        /* HOLDS NODE OBJECTS WITH ID, GROUP, NEIGHBORS FIELDS */
        nodesData = {};

        /* CREATE NODE OBJECTS FROM LINKS */
        links.forEach(link => {
            createNodes(link);
        });

        /* ADD HOUSE FROM NODES CSV TO NODE OBJECTS */
        nodesFile.forEach(node => {
            addHouse(node);
        });

        /* CREATE A D3 LIST OF NODES */
        let nodes = d3.values(nodesData);
        
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
            .selectAll('.node')
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
            .selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(d => {
                return d.id;
            });

        simulation.nodes(nodes).on('tick', ticked);

        simulation.force(
            'link',
            d3
                .forceLink(links)
                .id(d => {
                    return d.id;
                })
                .distance(250)
                .strength(0.4)
        );

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
    });
}

/* CREATES A NEW NODE OBJECT INSIDE NODESDATA OR RETURNS EXISTING */
function createNode(name) {
    return (
        nodesData[name] ||
        (nodesData[name] = {
            id: name,
            group: '',
            neighbors: []
        })
    );
}

/* CREATE TWO NODE OBJECTS FROM A LINK */
function createNodes(link) {
    let sourceData = createNode(link.source);
    sourceData.neighbors.push(link.target);
    let targetData = createNode(link.target);
    targetData.neighbors.push(link.source);
}

/* ADD GROUP FIELD TO NODE OBJECT */
function addHouse(node) {
    let sourceData = createNode(node.id);
    sourceData.group = node.house;
}


/* D3 FORCE NODE DRAGGING */
// function dragStarted(d) {
//     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x;
//     d.fy = d.y;
// }

// function dragged(d) {
//     d.fx = d3.event.x;
//     d.fy = d3.event.y;
// }

// function dragEnded(d) {
//     if (!d3.event.active) simulation.alphaTarget(0);
//     d.fx = null;
//     d.fy = null;
// }
