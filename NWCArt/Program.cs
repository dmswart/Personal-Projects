using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace NWCArt
{
    class Program
    {
        static void Main(string[] args)
        {
            String fileName = "nwc_" + System.DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".eps";
            EPSFile file = new EPSFile(fileName);
            NWCArt artwork = new NWCArt(file);

#if false //draw the same thing at different orientations.
            for (int i = 0; i < 5; i++)
            {
                for (int j = 0; j < 5; j++)
                {
                    double x = 25.0 * ((i+1)* (i+2) / 2.0);
                    double y = 25.0 * ((j+1) * (j+2) / 2.0);
                    double width = 25.0 * (i + 1);
                    double height = 25.0 * (j + 1);

                    GridSpace grid = new GridSpace( new Path( new Point2D(x,y),
                                                              //new Point2D(x+width*0.5, y + height * 0.1),
                                                              new Point2D(x + width, y ) ),
                                                    new Path( new Point2D(x, y + height),
                                                              new Point2D(x + width, y + height) ) );

                    artwork.DrawBox("lightgray", "none", grid);
                    artwork.DrawUformInBox("white","black",grid);
                }
            }
#endif
#if true   //odd quadrilateral.

//            GridSpace grid2 = new GridSpace(new Point2D(100, 600),
//                                                        new Point2D(500, 550),
//                                                        new Point2D(250, 720),
//                                                        new Point2D(500, 800));
            GridSpace grid2 = new GridSpace(new Point2D(0, 0),
                                            new Point2D(350, 0),
                                            new Point2D(0, 700),
                                            new Point2D(350, 700));
            artwork.DrawBox("lightgray", "none", grid2);
            artwork.DrawUformInBox("white","black",grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
            grid2 = grid2.Inset(50, InsetType.Top); artwork.DrawUformInBox("none", "black", grid2);
#endif
#if false
            artwork.DrawSun(100, 10);
#endif

            file.Close();

            System.IO.File.Copy(fileName, "latest.eps", true);
            System.IO.File.Move(fileName, ".\\archive\\" + fileName);
        }
    };
}
