# Wormsphere and Globeweaver
These are two tools used to draw a meandering curve on a sphere (and also unwrapped onto the plane). 

### Instructions
* To start
    * open [wormsphere](https://dmswart.github.io/Personal-Projects/globeweaver/wormsphere.html) in a browser (only tested with Chrome)

* Opening or refreshing a new page starts with a random path on the sphere (represented as an equirectangular projection on the left side) and unwrapped on the plane (right)
* clicking on the sphere can move it around. 
* Users can click on **Energy Sphere** to optimize the curve on the sphere.  **Energy Plane** to optimize the curve on the plane.  Or just **Energy** to do both (which currently doesn't have much success).
Note: The energy function used to optimized the curves is based on repulsive curves work described [here](https://www.cs.cmu.edu/~kmcrane/Projects/RepulsiveCurves/index.html)

* You can **Increase Points**
* An **Iterations** spinbox tells the program how many steps to take.
* On the right is a textbox which contains a turtle program which draws a path that approximates the one here. (Usable in the globemaker_js project in this repository)
* You can output the intersections - a description of where each intersection on the sphere is, and the order the path crosses them in.  (This file can be ingested by Globeweaver)
* If you want you can click Scratch, which will go through a specific sequence of operations and 


# Globeweaver 
A tool to explore a planar curve that wraps into a woven curve on a sphere.

### Instructions
* To start
    * open [globeweaver](https://dmswart.github.io/Personal-Projects/globeweaver/globeweaver.html) in a browser (only tested with Chrome)

* you can load a file with intersection descriptions (see above).
* Adjusting positions will apply a force-based manipulation to the intersection positions (it will space them out and make them nice).
* clicking on the sphere can move it around. 
* you can enable or disable viewing the intersection points or viewing the crossing diagram.

Feel free to message the author (David Swart) dmswart1@gmail.com with questions


