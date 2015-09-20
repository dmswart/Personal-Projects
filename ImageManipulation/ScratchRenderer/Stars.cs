using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;
using System.IO;

namespace ScratchRenderer
{
    public class Stars : DMSImage
    {
        List<Point2D> m_Stars = new List<Point2D>();
        List<double> m_Mags = new List<double>();
        Color background = Color.FromArgb(33, 86, 140);
        Color foreground = Color.White;

        //constructors;
        public Stars(int height, string CSVFilename, double scale ) : base( new Size( height*2, height ) )
        {
            /*********************************************
             * Read in Star Info
             *********************************************/
            StreamReader sr = new StreamReader(CSVFilename);
            while (!sr.EndOfStream)
            {
                string LineIn = sr.ReadLine();
                char[] delimeters = { '\t', ' ', ',' };
                string[] Tokens = LineIn.Split( delimeters );
                if (Tokens.Count() == 3)
                {
                    Point2D newStar;
                    double newMag;
                    try
                    {
                        newStar = new Point2D(double.Parse(Tokens[0]), double.Parse( Tokens[1] ) );
                        newMag = double.Parse( Tokens[2] );
                    }
                    catch { continue; }
                    m_Stars.Add(newStar);
                    m_Mags.Add(newMag);
                }
            }
            sr.Close();


            /************************************************
             * Setup Graphics
             ************************************************/
            Graphics g = Graphics.FromImage(this.Bitmap);
            SolidBrush back = new SolidBrush(background);
            SolidBrush fore = new SolidBrush(foreground);
            g.FillRectangle(back, new Rectangle(0, 0, Width, Height));

            Point2D ImageScale = new Point2D(Width / (2.0 * Math.PI), Height / Math.PI);


            for (int i = 0; i < m_Stars.Count; i++)
            {
                double phi = m_Stars[i].X;
                double theta = 2.0*Math.PI - m_Stars[i].Y;

                Point2D size = new Point2D(1.0 / Math.Sin(phi), 1.0) * scale;


                if (m_Mags[i] < 1.0)
                {
                    DrawStar(g,fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 5,
                              size.Y * ImageScale.Y * 5,
                              8);
                    DrawStar(g, back,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 1.25,
                              size.Y * ImageScale.Y * 1.25,
                              0);
                }
                else if (m_Mags[i] < 2.0)
                {
                    DrawStar(g, fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 4,
                              size.Y * ImageScale.Y * 4,
                              6);
                    DrawStar(g, back,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X,
                              size.Y * ImageScale.Y,
                              0);
                }
                else if (m_Mags[i] < 3.0)
                {
                    DrawStar(g, fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 3.25,
                              size.Y * ImageScale.Y * 3.25,
                              5);
                    DrawStar(g, back,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 0.7,
                              size.Y * ImageScale.Y * 0.7,
                              0);
                }
                else if (m_Mags[i] < 4.0)
                {
                    DrawStar(g, fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 2.5,
                              size.Y * ImageScale.Y * 2.5,
                              6);
                }
/*                else if (m_Mags[i] < 5.0)
                {
                    DrawStar(g,fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 2.25,
                              size.Y * ImageScale.Y * 2.25,
                              5);
                } */
                else
                {
                    DrawStar(g, fore,
                              theta * ImageScale.X,
                              phi * ImageScale.Y,
                              size.X * ImageScale.X * 0.75,
                              size.Y * ImageScale.Y * 0.75,
                              0);
                }


            }

        }

        void DrawStar(Graphics g, Brush brush, double X, double Y, double width, double height, int pts)
        {
            //deal with circle case
            if (pts == 0)
            {
                g.FillEllipse( brush, (float)(X - width * 0.5), (float)(Y - height * 0.5), (float)(width), (float)(height));
                return;
            }


            PointF[] poly = new PointF[pts*2];

            for( int i=0; i<2*pts; i++ )
            {
                double theta = (double)i * (2*Math.PI) / (2.0 * pts);
                double radius = (i%2 == 1) ? 0.5 : 0.25;
                Point2D newpt = Point2D.FromPolar(radius, theta);
                poly[i] = new PointF( (float)(X + newpt.X * width),
                                      (float)(Y + newpt.Y * height) );
            }

            g.FillPolygon(brush, poly);
        }
    }
}
