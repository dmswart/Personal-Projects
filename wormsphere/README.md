# Wormsphere 
Use this tool to draw a meandering curve on a sphere (and also unwrapped onto the plane).

This code is in an incompleted state.

The energy function used to optimized the curves is based on repulsive curves work described [here](https://www.cs.cmu.edu/~kmcrane/Projects/RepulsiveCurves/index.html)

### Instructions

* To setup
    * download the directories: ```d3_pages``` and ```wormsphere``` from this repository.
* To start
    * open wormsphere.html in a browser (only tested with Chrome)

* Opening or refreshing a new page starts with a random path on the sphere (represented as an equirectangular projection on the left side) and unwrapped on the plane (right)
* Users can click on **Energy Sphere** to optimize the curve on the sphere.  **Energy Plane** to optimize the curve on the plane.  Or just **Energy** to do both (which currently doesn't have much success).
* You can **Increase Points**
* An **Iterations** spinbox tells the program how many steps to take.
* On the right is a textbox which contains a turtle program which draws a path that approximates the one here. (Usable in the globemaker_js project in this repository)

Feel free to message the author (David Swart) dmswart1@gmail.com with questions

