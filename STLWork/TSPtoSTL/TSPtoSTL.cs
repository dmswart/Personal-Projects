//#define ISSOLID

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;


namespace TSPtoSTL
{
    enum ModelType
    {
        Outside = 0,
        Inside = 1,
        Empty = 2
    };

    class Program
    {
        static void Main(string[] args)
        {
#if false //test code
            StreamWriter testsw = new StreamWriter("D:\\PersonalProjects\\Bridges 2011\\artshow\\sphere.stl");
            testsw.WriteLine("solid sphereshell");
            new Sphere(36.128, 5, true).Output(testsw, 1.0);
            //Torus(5, 1.5, 3).Output(testsw, 1.0);
            testsw.WriteLine("endsolid");
            testsw.Close();
            return;
#endif

            ModelType model = ModelType.Outside;
            if (args.Count() > 1)
            {
                try { model = (ModelType)(Int16.Parse(args[1])); }
                catch { model = ModelType.Outside; }
            }

            double dRadius = 50.0;
            double dHalfLineWidth = 0.5;
            double dHalfLineHeight = 0.4;

            if (model == ModelType.Empty)
            {
                dHalfLineWidth = 0.5;
                dHalfLineHeight = 1.0;
                dRadius = 36.128 + dHalfLineHeight; //inside shell is a little smaller than white plastic ball
            }

            string Filename = args[0];
            if (model == ModelType.Empty)
                Filename += "_empty.stl";
            else if (model == ModelType.Inside)
                Filename += "_glow.stl";
            else if (model == ModelType.Outside)
                Filename += ".stl";

            StreamWriter sw = new StreamWriter(Filename);

            if (model == ModelType.Inside || model == ModelType.Outside)
            {
                sw.WriteLine("solid sphereshell");
                Surface SphereSurface = new Surface();

                if (model == ModelType.Inside)
                {
                    SphereSurface.AddSurface(new Sphere(dRadius + dHalfLineHeight + 1.95, 6, true));
                    SphereSurface.AddSurface(new Sphere(dRadius + dHalfLineHeight - 0.05, 4, false));
                }
                else if (model == ModelType.Outside)
                {
                    SphereSurface.AddSurface(new Sphere(dRadius - dHalfLineHeight - 1.95, 4, true));
                    SphereSurface.AddSurface(new Sphere(dRadius - dHalfLineHeight + 0.05, 6, false));
                }

                Point3D HolePunch = new Point3D(0, -1, 0).ScaledTo(dRadius);
                SurfaceTools.PunchHole(ref SphereSurface, //surf
                                        HolePunch, //center
                                        HolePunch, //direction
                                        10,        //length
                                        1.2);      //radius   
                
                SphereSurface.Output(sw, 1.0);
                sw.WriteLine("endsolid");
            }

            sw.WriteLine("solid tour");

            Tour newTour = new Tour(args[0] + ".csv", dRadius, dHalfLineWidth, dHalfLineHeight);
            Surface TourSurface = new Surface();
            TourSurface.AddSurface(newTour);
            TourSurface.Output(sw, 1.0);

            sw.WriteLine("endsolid");


            sw.Close();
        }
    }
}
