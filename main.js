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

let cluster = false;

document.querySelector('#clusterBtn').addEventListener('click', clusterClick);

function clusterClick() {
    cluster = !cluster;
    let btn = d3.select('#clusterBtn');
    btn.classed('btn-selected', cluster);
    updateChart();
}

let nodesData;
let charactersInfo;
let cInfoName = '';

let centerScale = d3.scalePoint().padding(-2).range([0.1, width]);

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

        nodesFile.forEach(node => {
            changeBFF(node);
        });

        /* CREATE A D3 LIST OF NODES */
        let nodes = d3.values(nodesData);
        nodes.forEach(node => {
            convertStrength(node);
        });
        
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

        centerScale.domain(seasonHouses[season]);
        //centerScale.domain(nodes.map(function(d) { return d.group; }));

        if (!cluster) {
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
                //.force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(d => {
                    return centerScale(d.group);
                }).strength(0.95))
                .force("collide", d3.forceCollide().radius(d => { return d.strength + 1; }).iterations(2));
            
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
                    return 0.1;
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
                    return 0;
                }
            });
        });

        node.on('mouseout', function() {
            tooltip.style("visibility", "hidden");
            node.style('opacity', 1.0);
            node.style('stroke', 'none');
            link.style('opacity', 0.1);
        });

        node.on('click', function(d) {
            let infoPanel = d3.select('#characterInfo');
            if (cInfoName !== '' && cInfoName === d.id) {
                closeNav(cInfoName);
            } else {
                cInfoName = d.id;
                setInfoPanel(infoPanel, d);
            }
        })

        /* HANDLES GRAPH TICKS TO DETERMINE NODES/LINKS' POSITIONS */
        function ticked() {
            link
                .attr('x1', d => { return d.source.x; })
                .attr('y1', d => { return d.source.y; })
                .attr('x2', d => { return d.target.x; })
                .attr('y2', d => { return d.target.y; });

            node.attr('cx', d => {
                return d.x;
            }).attr('cy', d => {
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
            bff: [],
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
    if (sourceData.bff.length === 0 || +link.weight > sourceData.bff[1]) {
        sourceData.bff[0] = link.target;
        sourceData.bff[1] = +link.weight;
    }
    checkMaxMin(sourceData.strength);
    let targetData = createNode(link.target);
    targetData.neighbors.push(link.source);
    targetData.strength += +link.weight;
    if (targetData.bff.length === 0 || +link.weight > targetData.bff[1]) {
        targetData.bff[0] = link.source;
        targetData.bff[1] = +link.weight;
    }
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

function changeBFF(node) {
    let sourceData = nodesData[node.id];
    let bff = createNode(sourceData.bff[0].toUpperCase());
    sourceData.bff[0] = bff.label;
}

/* ADD MORE INFO ABOUT THE CHARACTER */
function addCharacterInfo(val) {
    if (val.info !== null) return;
    charactersInfo.forEach(o => {
        if (o.hasOwnProperty('id') && o.id === val.id) {
            val.info = o;
            if (val.id === 'MANCE') console.log(val);
        }
    })
}

/* CONVERT STRENGTH VALUE TO NUMBER WITHIN RANGE */
function convertStrength(node) {
    let val = convertNumberToRange(node.strength, strengthMin, strengthMax, inMin, inMax);
    node.strength = val;
}

function setInfoPanel(panel, node) {
    panel.select('.extra').style('display', 'none');
    panel.select('#pName').text(node.label);
    panel.select('#pHouse').text(node.group);
    panel.select('#pLinks').text(node.neighbors.length);
    panel.select('#pBFF').text(node.bff[0]);
    if (node.info !== null && node.info.hasOwnProperty('characterImageThumb')) {
        let info = node.info;
        panel.select('#pImage').attr('src', info.characterImageThumb);
        // panel.select('#pImage').style('visibility', 'visible');
    } else {
        panel.select('#pImage').attr('src', './images/unknown.jpg');
        //panel.select('#pImage').style('visibility', 'hidden');
    }

    if (node.info !== null && node.info.hasOwnProperty('killedBy')) {
        let row = panel.select('.extra-killed-by').style('display', 'flex');
        row.select('.panel-text').text(node.info.killedBy[0]);

    }

    panel.style('width', '250px');
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

/* CLOSE CHARACTER INFO PANEL */
function closeNav() {
    d3.select('.sidenav').style('width', 0);
    cInfoName = '';
}

d3.select('.closebtn').on('click', closeNav);

// CODE FROM https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
function convertNumberToRange (val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

let seasonHouses = {
    s1: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Greyjoy', 'Arryn', 'Tully'],
    s2: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn'],
    s3: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Greyjoy', 'Arryn', 'Tully'],
    s4: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn', 'Tully'],
    s5: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn'],
    s6: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn', 'Tully'],
    s7: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn'],
    s8: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Greyjoy', 'Arryn', 'Tully']
}

export { onSeasonChanged };