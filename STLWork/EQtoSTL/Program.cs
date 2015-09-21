using System;
using System.Collections.Generic;
using System.Linq;
using System.Drawing;
using System.Text;
using DMSLib;
using System.IO;

namespace EQtoSTL
{
    class Program
    {
        const double BLACK_RADIUS = 40.0;//37.75;
        const double WHITE_RADIUS = 39.0;
        const double SHELL_RADIUS = 37.75;//40.0;

        static void Main(string[] args)
        {
            //check arguments
            if (args.Count() < 2)
            {
                System.Console.WriteLine("Usage: EQtoSTL <pano_in> <stl_out>");
                return;
            }

            //load image
            DMSImage pano = new DMSImage(args[0]);



            /**
             * Build and write out the file
             */
            Surface Final = new PanoSurface(WHITE_RADIUS, BLACK_RADIUS, pano, 350000);
            Final.AddSurface(new Sphere(SHELL_RADIUS, 6, SHELL_RADIUS > WHITE_RADIUS)); //shell
            SurfaceTools.PunchHole( ref Final, Point3D.ZAxis.ScaledTo(WHITE_RADIUS), Point3D.ZAxis, 3.0, 1.5);


            StreamWriter sw = new StreamWriter(args[1]);
            sw.WriteLine("solid eqtostl");

            Final.Output(sw, 1.0);

            sw.WriteLine("endsolid");
            sw.Close();
        }
    }
}
