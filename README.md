# Personal-Projects
Personal Projects

## D3 Pages
my experiments using javascript and heavily relying on D3.

### globemaker_js
Globemaker is the software I use to unwrap spherical imagery onto the plane.
* Details and results can be seen in these papers:
  * [Using Turtles and Skeletons to Display the Viewable Sphere (2009)](https://archive.bridgesmathart.org/2009/bridges2009-39.html#gsc.tab=0)
  * [Orange Peel Optimization (2021)](https://archive.bridgesmathart.org/2021/bridges2021-241.pdf)
  * Arcs on Spheres and Snakes on Planes (pending)
* The original C# code is in the globemaker directory.
* I recommend the latest JavaScript code in the globemaker_js directory. Read the [README](globemaker_js/README.md) there for more details.

### wormsphere
Some initial experiments to create a meandering worm on a sphere which is simultaneously unwrapped onto the plane.  See the [README](wormsphere/README.md) there for more details

### tsp_xfrmer
to use this tool to make TSP Art:

1. Download the d3 pages directory
2. open tsp_xfrmer.html in your browser.
3. Make TSP Art:
   * click 'Choose file' button. Select a 1280x720 image. black silhouette on white works best.
   * set number of points (non-powers of 2 won't work, anything above 2048 might be sllllow)
   * click target to place random cities
   * click stipple to perform Secord's Weighted Voronoi stippling algorithm.
   * click TSP to 'solve' the TSP (not guaranteed to be optimal)
4. Save TSP art as a graphic image. 
   * Click on the 'Appearance' link to get a new set of controls to change the colours
     * there are three colours: a start colour, an in-between colour and an end colour; just type in the name of the colour.
     * The numbers inbetween the colours are the indices of the TSP tour where the colours change.
   * You can use [this 'bookmarklet'](http://nytimes.github.io/svg-crowbar/) to save the image as an svg file.
   * Or just use your computer's print screen capabilities.
5. Animate from one TSP art to another:
   * Do step 3 for your starting image.
   * Click on 'smooth' to turn it into an elipse.
   * Do step 3 for your final image.
   * Click on smooth to turn it into an elipse.
   * Click on the 'Animation' link.
   * Click on the 'Tighten' button, wait for the image to stop changing.
   * Click on the '>>' button to reduce the step size to 1, wait for the image to stop chaning.
   * Click 'stop'.
6. Watch your animation.
   * Click 'Animate' to watch your animation.
   * You can change the speed.
   * If you want to save it, look for a screenscraping program.  
     * On linux I use 'SimpleScreenRecorder'.  
     * On windows I use Icecream's Screen-Recorder
