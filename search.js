function handleClick(event){
    var text = document.getElementById("myVal").value.toUpperCase()

    var nodes = d3.selectAll('.node')
    var links = d3.selectAll('.link')
    
    if (text === '') {
        nodes.style('opacity', 1); 
        nodes.style('stroke', 'none');
        links.style('opacity', 0.2);
        return false;
    }

    let found = false;

    // Reset the opacities of everything
    nodes.style('opacity', 0.1); 
    nodes.style('stroke', 'none');
    links.style('opacity', 0);

    nodes.each(function(d, i) {
        var node = d3.select(this);

        // Checks if the name starts with the search text
        if (d.id.indexOf(text) === 0) {
            found = true;

            // Shade in the current node
            node.style('opacity', 1.0);
            console.log("FOUND NODE : " + node);
            node.style('stroke', '#39383d');
        }
    })

    if (!found) {
        displaySnackbar();
        nodes.style('opacity', 1);
        nodes.style('stroke', 'none');
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