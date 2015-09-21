using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;
using DMSLib;

namespace NWCArt
{
    public class EPSFile
    {
        StreamWriter m_sw;
        const int resolution = 150;

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
            m_sw.WriteLine("%!PS-Adobe-3.0 EPSF-3.0");
            m_sw.WriteLine("%%Title: example.eps");
            m_sw.WriteLine("%%CreationDate: 20110452");
            m_sw.WriteLine("%%Pages: 1");
            m_sw.WriteLine("%%BoundingBox:    0    0   250   350");
            m_sw.WriteLine("%%Document-Fonts: Times-Roman");
            m_sw.WriteLine("%%LanguageLevel: 1");
            m_sw.WriteLine("%%EndComments");
            m_sw.WriteLine("%%BeginProlog");
            m_sw.WriteLine("/inch {72 mul} def");
            m_sw.WriteLine("%%EndProlog");
            m_sw.WriteLine("/Times-Roman findfont");
            m_sw.WriteLine("1.00 inch scalefont");
            m_sw.WriteLine("setfont");
            m_sw.WriteLine("%%Page:      1     1");
            m_sw.WriteLine("save\n");
        }
        void OutputFooter()
        {
            m_sw.WriteLine("restore showpage");
            m_sw.WriteLine("%");
            m_sw.WriteLine("% End of page");
            m_sw.WriteLine("%");
            m_sw.WriteLine("%%Trailer");
            m_sw.WriteLine("%%EOF");
        }

        void StartDrawingObject()
        {
            m_sw.WriteLine("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
            //declare the path
            m_sw.WriteLine("newpath");
        }
        void EndDrawingObject(String fillStr, String outlineStr)
        {
            m_sw.WriteLine("closepath");
            m_sw.WriteLine("gsave");

            // fill
            if (fillStr.ToLower() != "none")
            {
                Color fill = Color.FromName(fillStr);
                m_sw.WriteLine("" + fill.R / 255.0 + " " + fill.G / 255.0 + " " + fill.B / 255.0 + " setrgbcolor");
                m_sw.WriteLine("fill");
            }

            if (outlineStr.ToLower() != "none")
            {
                Color outline = Color.FromName(outlineStr);
                m_sw.WriteLine("grestore");
                m_sw.WriteLine("1 setlinewidth");
                m_sw.WriteLine("" + outline.R / 255.0 + " " + outline.G / 255.0 + " " + outline.B / 255.0 + " setrgbcolor");
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

            m_sw.WriteLine("" + center.X + " " + center.Y + " " + radius + " 0 360 arc");

            EndDrawingObject(fillStr, outlineStr);
        }


        /// <summary>
        /// Draws a polygon
        /// </summary>
        /// <param name="vertices">Vertices</param>
        /// <param name="fillStr">Fill color</param>
        /// <param name="outlineStr">Outline color</param>
        public void DrawPoly(String fillStr, String outlineStr, Path pts)
        {
            StartDrawingObject();
            //output path
            for (int i = 0; i < pts.Count(); i++)
            {
                m_sw.Write("\t" + pts[i].X + " " + pts[i].Y + " ");
                m_sw.WriteLine(i == 0 ? "moveto" : "lineto");
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
        public void DrawCatmullRomSplines(String fillStr, String outlineStr, params Path[] splines)
        {
            Path final = new Path();

            foreach (Path spline in splines)
            {
                for (int i = 0; i <= resolution; i++)
                {
                    final.AddControlPt(spline.getSplinePt((double)i / resolution));
                }
            }

            DrawPoly(fillStr, outlineStr, final);
        }


        /// <summary>
        /// Draws an ovoid: a closed Catmull-Rom spline.
        /// </summary>
        /// <param name="pts">Control Points</param>
        /// <param name="fillStr">Fill color</param>
        /// <param name="outlineStr">Outline color</param>
        public void DrawClosedCatmullRomSpline(String fillStr, String outlineStr, Path pts)
        {
            Path final = new Path();

            for (int i = 0; i < resolution; i++)
            {
                final.AddControlPt(pts.getOvoidPt((double)i / resolution));
            }

            DrawPoly(fillStr, outlineStr, final);
        }
    };
}
