using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace NWCArt
{
    public class Path
    {
        List<Point2D> m_Points;

        public Path()
        {
            m_Points = new List<Point2D>();
        }

        public Path( Point2D pt1, params Point2D[] pts ) : this()
        {
            foreach ( Point2D pt in pts)
            {
                AddPt( pt );
            }
        }

        public Path(double coord1X, double coord1Y, params double[] coords) : this()
        {
            AddPt( new Point2D(coord1X, coord1Y) );
            for (int i = 0; i < coords.Count<double>() - 1; i += 2)
            {
                AddPt( new Point2D( coords[i], coords[i+1] ) );
            }
        }

        public void AddPt( Point2D pt ) 
        {
            m_Points.Add( pt );
        }

        public int Count()
        {
            return m_Points.Count<Point2D>();
        }

        public Point2D this[int i]
        {
            get
            {
                return (i >= Count()) ? Point2D.Origin : m_Points[i];
            }
            set
            {
                if (i <= Count())
                    m_Points[i] = value;
            }
        }
    }

    public class EPSFile
    {
        StreamWriter m_sw;
        const int resolution = 20;

        public EPSFile(String filename)
        {
            m_sw = new StreamWriter(filename);
            OutputHeader();
        }

        public void Close() 
        {
            OutputFooter();
            m_sw.Close(); 
        }

        void OutputHeader()
        {
			m_sw.WriteLine( "%!PS-Adobe-3.0 EPSF-3.0" );
			m_sw.WriteLine( "%%Title: example.eps" );
			m_sw.WriteLine( "%%CreationDate: 20110452" );
			m_sw.WriteLine( "%%Pages: 1" );
			m_sw.WriteLine( "%%BoundingBox:    0    0   250   350" );
			m_sw.WriteLine( "%%Document-Fonts: Times-Roman" );
			m_sw.WriteLine( "%%LanguageLevel: 1" );
			m_sw.WriteLine( "%%EndComments" );
			m_sw.WriteLine( "%%BeginProlog" );
			m_sw.WriteLine( "/inch {72 mul} def" );
			m_sw.WriteLine( "%%EndProlog" );
			m_sw.WriteLine( "/Times-Roman findfont" );
			m_sw.WriteLine( "1.00 inch scalefont" );
			m_sw.WriteLine( "setfont" );
			m_sw.WriteLine( "%%Page:      1     1" );
			m_sw.WriteLine( "save\n" );
        }
        void OutputFooter()
        {
			m_sw.WriteLine( "restore showpage" );
			m_sw.WriteLine( "%" );
			m_sw.WriteLine( "% End of page" );
			m_sw.WriteLine( "%" );
			m_sw.WriteLine( "%%Trailer" );
			m_sw.WriteLine( "%%EOF" );
        }

        void StartDrawingObject()
        {
            m_sw.WriteLine("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
            //declare the path
            m_sw.WriteLine("newpath");
        }
        void EndDrawingObject( String fillStr, String outlineStr )
        {
            m_sw.WriteLine("closepath");
            m_sw.WriteLine("gsave");

            // fill
            if (fillStr.ToLower() != "none")
            {
                Color fill = Color.FromName(fillStr);
                m_sw.WriteLine("" + fill.R + " " + fill.G + " " + fill.B + " setrgbcolor");
                m_sw.WriteLine("fill");
            }

            if (outlineStr.ToLower() != "none")
            {
                Color outline = Color.FromName(outlineStr);
                m_sw.WriteLine("grestore");
                m_sw.WriteLine("1 setlinewidth");
                m_sw.WriteLine("" + outline.R + " " + outline.G + " " + outline.B + " setrgbcolor");
                m_sw.WriteLine("stroke");
            }

            m_sw.WriteLine();
        }



        /// <summary>
        /// Draws a circle
        /// </summary>
        /// <param name="center">center of the circle</param>
        /// <param name="radius">it's radius</param>
        /// <param name="fillStr">fill color</param>
        /// <param name="outlineStr">outline color</param>
        public void DrawCircle(Point2D center, double radius, String fillStr, String outlineStr)
        {
            StartDrawingObject();

            m_sw.WriteLine( "" + center.X + " " + center.Y + " " + radius + " 0 360 arc" );

            EndDrawingObject(fillStr, outlineStr);
        }


        /// <summary>
        /// Draws a polygon
        /// </summary>
        /// <param name="vertices">Vertices</param>
        /// <param name="fillStr">Fill color</param>
        /// <param name="outlineStr">Outline color</param>
        public void DrawPoly(String fillStr, String outlineStr, Path pts )
        {
            StartDrawingObject();
            //output path
            for (int i = 0; i < pts.Count(); i++)
			{
				m_sw.Write( "\t" + pts[i].X + " " + pts[i].Y + " " );
				m_sw.WriteLine( i==0 ? "moveto" : "lineto" );
			}
            EndDrawingObject(fillStr, outlineStr);
        }


        /// <summary>
        /// Draws a closed form with N splines
        /// The last point of spline N should be the same as the first point of spline N+1
        /// </summary>
        /// <param name="splines">The control points for the top spline</param>
        /// <param name="bottom">The control points for the top spline</param>
        /// <param name="fillStr">Color to fill the figure</param>
        /// <param name="outlineStr">Color to outline the figure</param>
        public void DrawPaths( String fillStr, String outlineStr, params Path[] splines)
        {
            Path final = new Path();

            foreach (Path spline in splines)
            {
                for (int i = 0; i < spline.Count() - 1; i++)
                {
                    Point2D P0 = (i == 0) ? spline[0] + spline[0] - spline[1] : spline[i - 1];
                    Point2D P1 = spline[i];
                    Point2D P2 = spline[i + 1];
                    Point2D P3 = (i == spline.Count() - 2) ? spline[i + 1] + spline[i + 1] - spline[i] : spline[i + 2];
                    for (int j = 0; j < resolution; j++)
                    {
                        double t = (double)j / resolution;
                        final.AddPt( 0.5 * ((2.0 * P1) +
                                            (-P0 + P2) * t +
                                            (2 * P0 - 5 * P1 + 4 * P2 - P3) * t * t +
                                            (-P0 + 3 * P1 - 3 * P2 + P3) * t * t * t) );
                    }
                }
            }

            DrawPoly(fillStr, outlineStr, final );
        }


        /// <summary>
        /// Draws an ovoid: a closed Catmull-Rom spline.
        /// </summary>
        /// <param name="pts">Control Points</param>
        /// <param name="fillStr">Fill color</param>
        /// <param name="outlineStr">Outline color</param>
        public void DrawOvoid(String fillStr, String outlineStr, Path pts )
        {
            int numPts = pts.Count();

            Path final = new Path();
            for (int i = 0; i < numPts; i++)
            {
                Point2D P0 = pts[(i - 1 + numPts) % numPts];
                Point2D P1 = pts[i];
                Point2D P2 = pts[(i + 1) % numPts];
                Point2D P3 = pts[(i + 2) % numPts];
                for (int j = 0; j < resolution; j++)
                {
                    double t = (double)j / resolution;
                    final.AddPt( 0.5 * ((2.0 * P1) +
                                        (-P0 + P2) * t +
                                        (2 * P0 - 5 * P1 + 4 * P2 - P3) * t * t +
                                        (-P0 + 3 * P1 - 3 * P2 + P3) * t * t * t) );
                }
            }

            DrawPoly(fillStr, outlineStr, final);
        }
        
        //Convenience functions for when you don't want to specify the outline color as none
        public void DrawPaths(String fillStr, params Path[] splines ) { DrawPaths(fillStr, "none", splines); }
        public void DrawPoly(Path pts, String fillStr) {DrawPoly(fillStr, "none", pts);}
        public void DrawCircle(Point2D center, double radius, String fillStr) {DrawCircle(center, radius, fillStr, "none");}
        public void DrawOvoid(String fillStr, Path pts ) {DrawOvoid(fillStr, "none", pts);}

    };

    class Program
    {
        static void Main(string[] args)
        {
            String fileName = "nwc_" + System.DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".eps";
            EPSFile file = new EPSFile(fileName);

            //Black Uform - white uform - red double uform.
            {
                file.DrawPaths( "black",
                                new Path( 150,400,  190,500,  410,500,  450,400 ),
                                new Path( 450,400,  400,475,  200,475,  150,400 ) );

                file.DrawPaths("red",
                               new Path(150, 400, 200, 460, 282, 460, 300, 400),
                               new Path(300, 400, 150, 400) );

                file.DrawPaths("red",
                                new Path(300, 400, 318, 460, 400, 460, 450, 400),
                                new Path(450, 400, 300, 400));
            }

            //eye-ball
            {
                file.DrawPaths( "white", "black",
                                new Path(100,100,  115,115,  175,175,  425,175,  485,115,  500,100),
                                new Path(500,100,  485,85,  425,25,  175,25,  115,85,  100,100) );

                file.DrawOvoid("black", 
                               new Path(165, 40, 165, 160, 435, 160, 435, 40) );
                file.DrawOvoid("white",
                               new Path(190, 65, 190, 160, 410, 160, 410, 65) );
                file.DrawOvoid("black", 
                               new Path(215, 80, 215, 165, 385, 165, 385, 80) );
            }

            //red Uform - white split
            {
                file.DrawPaths( "red", 
                                new Path(150, 500, 200, 700, 400, 700, 450, 500), //top 
                                new Path(450, 501, 350, 511, 250, 511, 150, 501) ); //normal 

                file.DrawPaths( "white",
                                new Path(450, 500, 350, 510, 250, 510, 150, 500),
                                new Path(150, 500, 175, 525, 275, 580, 300, 715 ),
                                new Path(300, 715, 325, 580, 425, 525, 450, 500 ) );
            }

            //Ovoid flatish on the bottom
            {
                file.DrawOvoid( "black",
                                new Path(150, 215, 175, 345, 425, 345, 450, 215) );
                file.DrawOvoid( "white",
                                new Path(175, 235, 200, 330, 400, 330, 425, 235) );
            }

            file.Close();

            System.IO.File.Copy(fileName, "latest.eps", true);
            System.IO.File.Move(fileName, ".\\archive\\" + fileName);
        }
    };
}
