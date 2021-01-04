using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    class Program
    {
        static void Main(string[] args)
        {
            String filenameout = args[0];
            DMSImage ImageOut;

            if (args.Count() < 1)
            {
                Console.WriteLine("Usage: scratchrenderer.exe <filein>");
                return;
            }

#if true //load source into ImageIn
            DMSImage ImageIn;
            try
            {
                ImageIn = new DMSImage(args[0]);
            }
            catch
            {
                Console.WriteLine("Invalid arguments");
                return;
            }

            String fileextension = args[0].Substring( args[0].Length - 4 );
            filenameout = args[0].Substring(0,args[0].Length-4);
            filenameout += "_" + fileextension;
#elif false
            int[] weights = { 
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                0xd0, 0xeb, 0xd4, 0xff, 0x8a, 0x69, 0xff, 0x84, 0x9f, 0xaf,
                0xff, 0xd2, 0xf7, 0xfa, 0xf1, 0xf0, 0xff, 0xdd, 0x8e, 0x57,
                0xff, 0x4a, 0x4e, 0x5e, 0x7d, 0xff, 0x8c, 0xa3, 0xff, 0xb2,
                0xb9, 0xd4, 0xd7, 0xff, 0xfa, 0xf7, 0xdc, 0xff, 0xbb, 0x84,
                0x52, 0x3f, 0x3d, 0xff, 0x45, 0x54, 0x55, 0x40, 0x40, 0x40,
                0x40, 0xff, 0x40, 0x40, 0xbe, 0xff, 0xcb, 0xdc, 0xe9, 0xe0,
                0xff, 0xb7, 0xb8, 0x5d, 0xff, 0x3b, 0x2c, 0x25, 0x27, 0x36,
                0xff, 0x40, 0x40, 0x40, 0x40, 0x40, 0xff, 0x40, 0x40, 0x40,
                0x40, 0x40, 0x40, 0x40, 0xff, 0xba, 0xbf, 0xae, 0xff, 0x82,
                0x55, 0x37, 0x27, 0xff, 0x17, 0x17, 0x1c, 0xff, 0x40, 0x40,
                0x40, 0x40, 0x40, 0x40, 0xff, 0x40, 0x40, 0x40, 0xff, 0x40,
                0x40, 0x40, 0x40, 0xab, 0x9a, 0xff, 0x7a, 0x59, 0x40, 0x2a,
                0xff, 0x1a, 0x19, 0x17, 0xff, 0x40, 0x40, 0x40, 0x40, 0x40,
                0x40, 0xff, 0x40, 0x40, 0x40, 0xff, 0x40, 0x40, 0x40, 0x40,
                0x40, 0x7c, 0xFF, 0x4d, 0x3c, 0x2e, 0x20, 0xFF, 0x18, 0x40,
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

            new Texter("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 256, -1).getImage().Save(filenameout);
//            new Texter("     " +
//                       "JOY TO THE WORLD THE LORD IS COME " +
//                       "LET EARTH RECEIVE HER KING " +
//                       "LET EVERY HEART PREPARE HIM ROOM " + 
//                       "AND HEAVEN AND NATURE SING " +
//                       "AND HEAVEN AND NATURE SING " +
//                       "AND HEAVEN AND HEAVEN AND NATURE SING" +
//                       "     ", weights, 256, 37274 ).getImage().Save(filenameout);
            return;
#endif

            //stretch radius: layout nice
            //Mosaicker finalmosaic = new Mosaicker(ImageIn.Width, ImageIn.Height, 4, 3, 20);
            //for (int sym = 1; sym <= 12; sym++) finalmosaic.AddRenderer(new StretchRadius(ImageIn, sym), (sym-1) %4, (sym-1) /4);
            //ImageOut = new DMSImage(new SuperSampler(finalmosaic, 2));

            //ImageOut = new DMSImage(new ComplexMap(new Size(300, 300), ImageIn, Color.Gray));

            // ImageOut = new DMSImage(new Bookball(new Size(9000, 6000), ImageIn, Color.Gray, null/*new DMSImage(args[1]) - overlay image*/ ) );

            //ImageOut = new DMSImage(new Filler(ImageIn)); 

            /*
            ImageOut = new DMSImage(new TestPattern(new Size(400, 200), 
                                                             Color.SkyBlue, 
                                                             Color.Black, 
                                                             TestPatternType.MercatorCheckerBoardPlane, 
                                                             0, 0));
             */

            //ImageOut = new DMSImage(new SpiralText(ImageIn, int.Parse(args[1])));

            // ImageOut = new DMSImage( new ConformalDoubler(ImageIn) );

            //ImageOut = new DMSImage(new Tetrahedral(ImageIn)); // black and white
            //ImageOut = new DMSImage(new Icosahedral()); // black and white
            ImageOut = new DMSImage(new Octohedral(ImageIn)); // black and white

            //ImageOut = new DMSImage( new Equirect2Ortho( new Icosahedral(ImageIn), 3300) );
            // ImageOut = new DMSImage(new Icosahedral(ImageIn));

            // ImageOut = new DMSImage( new Equirect2Ortho(ImageIn,3300) ); 

            //List<Point2D> vertices = new List<Point2D>();
            //vertices.Add(new Point2D(384, 526));
            //vertices.Add(new Point2D(736, 176));
            //vertices.Add(new Point2D(816, 830));
            //ImageOut = new DMSImage(new SuperSampler(new Equirect2Ortho(new FundDomain(vertices), 3300), 3));


            //ImageOut = new DMSImage(new StretchRadius(ImageIn, 2));

            //ImageOut = new DMSImage(
            //               new SuperSampler( 
            //                   new Droste( ImageIn,
            //                               new Point2D(500, 1500),
            //                               1654,
            //                               4000,
            //                               new Size(15000, 15000),
            //                               new Point2D(7500, 7500),
            //                               1.07,
            //                               Color.Black),
            //                   3 ) );

            //ImageOut = new Palette(new DMSImage(args[1]), ImageIn);
            //new Stars(5000, args[0], 0.004).Save("Stars.bmp");

            //ImageOut = new DMSImage(new CubeFace(ImageIn));

#if false //octahedron
            Mosaicker finalmosaic = new Mosaicker(1500, 1500, 3, 2, 60);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, Point3D.ZAxis, Point3D.XAxis), 0, 0);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, -Point3D.ZAxis, Point3D.XAxis), 0, 1);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, Point3D.YAxis, Point3D.XAxis), 1, 0);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, -Point3D.YAxis, Point3D.XAxis), 1, 1);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, Point3D.XAxis, Point3D.YAxis), 2, 0);
            finalmosaic.AddRenderer(new OctahedronUnit(new Size(1500, 1500), ImageIn, -Point3D.XAxis, Point3D.YAxis), 2, 1);
            ImageOut = new DMSImage(finalmosaic);
#endif



            //DMSImage ImageOut = new DMSImage(new Stereographic2Equirectangular(ImageIn, 1500));

            //DMSImage ImageOut = new DMSImage(new UnwrapMatroshka(ImageIn));

#if false //draw net 
            //drawnet
            Net net = new Net(args[0]);
            filenameout = args[0].Substring(0,args[0].Length-4) + ".png";
            DMSImage ImageOut = new DMSImage(new SuperSampler(new DrawNet(net),3)); 
#endif
            ImageOut.Save(filenameout);
        }
    }
}
