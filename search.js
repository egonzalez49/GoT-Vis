function handleClick(event){
    var text = document.getElementById("myVal").value.toUpperCase()
    var nodes = d3.selectAll('.node')
    var links = d3.selectAll('.link')

    let found = false;

    //reset the opacities of everything
    nodes.style('opacity', 0.2); 
    links.style('opacity', 0.2);

    nodes.each(function(d, i) {
        var node = d3.select(this)
        //checks if the name starts with the search text
        if (d.id.indexOf(text) === 0) {
            found = true;

            //shade in the current node
            node.transition(500).style('opacity', 1.0) 
            //shade in the neighboring nodes
            // d3.selectAll(".node").each(function(d0, i) {
            //     var otherNode = d3.select(this)
            //     if (d.neighbors.includes(d0.id)) {
            //         otherNode.transition(500).style('opacity', 1.0)
            //     }
            // })
            //shade in the adjacent lines
            // links.each(function(d1, i) {
            //     var link = d3.select(this)
            //     if (d.id == d1.source.id || d.id == d1.target.id) {
            //         link.transition(500).style('opacity', 1.0)
            //     }
            // })
        }
    })

    if (!found) {
        displaySnackbar();
        nodes.style('opacity', 1);
    }
    
    return false;
}

/*
 * CODE FROM https://www.w3schools.com/howto/howto_js_snackbar.asp
 */
function displaySnackbar() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");
  
    // Add the "show" class to DIV
    x.className = "show";
  
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}