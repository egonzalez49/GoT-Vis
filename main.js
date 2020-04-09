/* SET UP GLOBALS, ZOOMING */
let svg = d3.select('#network');
let container = svg.append('g');

let width = +svg.attr('width');
let height = +svg.attr('height');

let widthCenter = width / 2;
let heightCenter = height / 2;

// For converting cumulative node strength to a smaller range 
let strengthMin = Number.MAX_SAFE_INTEGER, strengthMax = Number.MIN_SAFE_INTEGER;
let inMax = 100, inMin = 10;

let zoom;

svg.call(
    zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', function() {
            container.attr('transform', d3.event.transform);
        })
    )
    .call(zoom.transform, d3.zoomIdentity.translate(300, 200).scale(0.4));

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

let season = 's1';

/* SEASON SELECT ONCHANGE */
function onSeasonChanged() {
    let select = d3.select('#seasonSelect').node();
    let seasonSelected = select.options[select.selectedIndex].value;
    if (seasonSelected !== season) {
        season = seasonSelected;
        updateChart();
    }
}

let cluster = true;

document.querySelector('#clusterBtn').addEventListener('click', clusterClick);

function clusterClick() {
    cluster = !cluster;
    let btn = d3.select('#clusterBtn');
    btn.classed('btn-selected', !cluster);
    updateChart();
}

let nodesData;
let charactersInfo;

updateChart();

/* LOAD IN CSV DATA */
function updateChart() {
    Promise.all([
        d3.csv(`./data/network/got-${season}-edges.csv`),
        d3.csv(`./data/network/got-${season}-nodes.csv`),
        d3.json('./data/characters.json')
    ]).then(files => {
        let links = files[0];
        let nodesFile = files[1];
        charactersInfo = files[2].characters;
        console.log(charactersInfo);

        container.selectAll('*').remove();

        /* HOLDS NODE OBJECTS WITH ID, GROUP, NEIGHBORS FIELDS */
        nodesData = {};

        /* CREATE NODE OBJECTS FROM LINKS */
        links.forEach(link => {
            createNodes(link);
        });

        /* ADD HOUSE FROM NODES CSV TO NODE OBJECTS */
        nodesFile.forEach(node => {
            addFields(node);
        });

        /* CREATE A D3 LIST OF NODES */
        let nodes = d3.values(nodesData);
        nodes.forEach(node => {
            convertStrength(node);
        })

        // let groups = d3.nest()
        //     .key((d) => {
        //         return d.group;
        //     })
        //     .map(nodes);

        // Object.keys(groups).forEach(group => {
        //     determineCenter(group, groups);
        // });
        
        let link = container
            .append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-width', d => {
                return Math.sqrt(d.weight);
            });

        let node = container
            .append('g')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', d => {
                return d.strength;
            })
            .style('fill', d => {
                return d.color;
            });

        /* POSITION THE LABEL TOOLTIP */
        node.on('mousemove', () => {
            tooltip
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 25) + "px")
        });

        let centerScale = d3.scalePoint().padding(-1.5).range([0.1, width]);
        centerScale.domain(nodes.map(function(d) { return d.group; }));

        if (cluster) {
            const simulation = d3
                .forceSimulation()
                .nodes(nodes).on('tick', ticked)
                .force(
                    'link',
                    d3
                        .forceLink(links)
                        .id(d => {
                            return d.id;
                        })
                        .distance(350)
                        .strength(0.2)
                )
                .force('charge', d3.forceManyBody().strength(-1000))
                .force('center', d3.forceCenter(widthCenter, heightCenter))
                .force("x", d3.forceX())
                .force("y", d3.forceY())
                .force("collide", d3.forceCollide().radius(d => { return d.strength + 10; }).iterations(2));
        } else {
            const simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(0))
                .force("charge", d3.forceManyBody())
                .force("y", d3.forceY(height / 2).strength(0.1))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(d => {
                    return centerScale(d.group);
                }).strength(0.95))
                .force("collide", d3.forceCollide().radius(d => { return d.strength + 10; }).iterations(2));
            
            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);
        }

        /* HANDLE NODE HOVER */
        node.on('mouseover', d => {
            tooltip.style("visibility", "visible")
                .html(() => {
                    const content = `<strong>Name:</strong> <span>${d.label}</span>`+'<br>'
                                    +`<strong>House:</strong> <span>${d.group}</span>`;
            
                    return content;
                });

            node.style('opacity', n => {
                if (n === d || d.neighbors.includes(n.id)) {
                    return 1.0;
                } else {
                    return 0.2;
                }
            });

            node.style('stroke', n => {
                if (n === d || d.neighbors.includes(n.id)) {
                    return 'black';
                } else {
                    return 'none';
                }
            });

            link.style('opacity', l => {
                if (d === l.source || d === l.target) {
                    return 1.0;
                } else {
                    return 0.2;
                }
            });
        });

        node.on('mouseout', function() {
            tooltip.style("visibility", "hidden");
            node.style('opacity', 1.0);
            node.style('stroke', 'none');
            link.style('opacity', 0.2);
        });

        /* HANDLES GRAPH TICKS TO DETERMINE NODES/LINKS' POSITIONS */
        function ticked() {
            link
                .attr('x1', d => { return d.source.x; })
                .attr('y1', d => { return d.source.y; })
                .attr('x2', d => { return d.target.x; })
                .attr('y2', d => { return d.target.y; });

            // let k = simulation.alpha() * 0.1;

            node.attr('cx', d => {
                // let center = groups[`$${d.group}`].center;
                // return cluster ? d.x + ((center.x - d.x) * k) : d.x;
                return d.x;
            }).attr('cy', d => {
                // let center = groups[`$${d.group}`].center;
                // return cluster ? d.y + ((center.y - d.y) * k) : d.y;
                return d.y;
            });
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
            neighbors: [],
            color: '',
            strength: 0, // cumulative link weights
            info: null
        })
    );
}

/* CREATE TWO NODE OBJECTS FROM A LINK */
function createNodes(link) {
    let sourceData = createNode(link.source);
    sourceData.neighbors.push(link.target);
    sourceData.strength += +link.weight;
    checkMaxMin(sourceData.strength);
    let targetData = createNode(link.target);
    targetData.neighbors.push(link.source);
    targetData.strength += +link.weight;
    checkMaxMin(targetData.strength);
}

/* KEEP TRACK OF MIN/MAx STRENGTHS */
function checkMaxMin(val) {
    if (val > strengthMax) strengthMax = val;
    if (val < strengthMin) strengthMin = val;
}

/* ADD GROUP FIELD TO NODE OBJECT */
function addFields(node) {
    let sourceData = createNode(node.id);
    let nodeColor = determineColor(node);
    sourceData.color = nodeColor;
    sourceData.group = node.house;
    sourceData.label = node.label;
    addCharacterInfo(sourceData);
}

/* ADD MORE INFO ABOUT THE CHARACTER */
function addCharacterInfo(val) {
    if (val.info !== null) return;
    charactersInfo.forEach(o => {
        if (o.characterName.indexOf(val.label) === 0) {
            val.info = o;
        }
    })
    //console.log(val);
}

/* CONVERT STRENGTH VALUE TO NUMBER WITHIN RANGE */
function convertStrength(node) {
    let val = convertNumberToRange(node.strength, strengthMin, strengthMax, inMin, inMax);
    node.strength = val;
}

/* DETERMINE GROUP COLOR */
function determineColor(node) {
    switch(node.house) {
        case "Stark":
            return '#008cc1';
        case "Baratheon":
            return '#875089';
        case "Targaryen":
            return '#ee202d';
        case "Tyrell":
            return '#009c77';
        case "Tully":
            return '#92c83e';
        case "Greyjoy":
            return '#988e8c';
        case "Lannister":
            return '#dba50f';
        case "Arryn":
            return '#993861';
        case "Martell":
            return '#fbad17';
        default:
            return '#c0c6de';
    }
}

/* DETERMINE CLUSTER CENTER */
function determineCenter(group, groups) {
    switch(group) {
        case "$Stark":
            groups[group].center = {x: widthCenter, y: heightCenter - 100};
            break;
        case "$Baratheon":
            groups[group].center = {x: widthCenter - 100, y: heightCenter - 50};
            break;
        case "$Targaryen":
            groups[group].center = {x: widthCenter, y: heightCenter + 100};
            break;
        case "$Tyrell":
            groups[group].center = {x: widthCenter + 100, y: heightCenter - 50};
            break;
        case "$Tully":
            groups[group].center = {x: widthCenter + 100, y: heightCenter + 50};
            break;
        case "$Greyjoy":
            groups[group].center = {x: widthCenter - 100, y: heightCenter + 50};
            break;
        case "$Lannister":
            groups[group].center = {x: widthCenter - 100, y: heightCenter};
            break;
        case "$Arryn":
            groups[group].center = {x: widthCenter + 100, y: heightCenter};
            break;
        default:
            groups[group].center = {x: widthCenter, y: heightCenter};
            break;
    }
}

// CODE FROM https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
function convertNumberToRange (val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

export { onSeasonChanged };