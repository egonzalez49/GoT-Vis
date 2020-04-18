## **CS 4460 - Fantasy Land**

### **Overview**

This is a data visualization exploratory tool about Game of Thrones. When a user
first visits the website, we provide a brief overview about Game of Thrones, so
that even people who have never seen the show can use this to explore the data.

The data is presented in the form of a force-directed network graph where each node
is a character in the show. A link width is determined by the number of interactions
between two characters, and an interaction is defined by:

1. Character A speaks directly after Character B.
2. Character A speaks about Character B.
3. Character C speaks about Character A and Character B.
4. Character A and Character B are mentioned in the same stage direction.
5. Character A and Character B appear in a scene together.

One of our priorities was to make the design interactible. We allow users to search for characters, change the season to view, and cluster the data per house. We also allow users to hover over nodes to view that one character in more depth and click on the character to view additional information.

### **Languages & Frameworks Used**

For this project, we used:

- HTML
- CSS
- JavaScript
- D3.js
- ScrollMagic

### **How to View the Data** 

The website is hosted at https://egonzalez49.github.io/GoT-Vis/.

Alternatively, you can use VSCode, install the *Live Server* plugin, right click
*index.html* file, and click *Open with Live Server* to view the website locally.

### **Sources** 

The data we used was provided by https://github.com/mathbeveridge/gameofthrones and https://github.com/jeffreylancaster/game-of-thrones.