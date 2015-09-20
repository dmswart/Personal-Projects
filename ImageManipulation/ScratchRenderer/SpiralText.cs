using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class SpiralText : Renderer
    {
        double m_maxStretched;
        double m_maxUnstretched;
        double m_stretchFactor;

        SizeF m_textStripeSize;
        SizeF m_stretchedSize;

        int m_linesInSource;
        double m_n; //number of times around
        double m_alpha; //tilt angle on equirectangular plot
        double m_x; //vertical distance on equirectangular plot between stripes
        double m_y; //distance travelled along the stripe per turn

		//unstretches a number from 0..90 down to 0..58
        private double unstretch(double alpha) 
        {
			double[] table =
			{ 0.000000000, 0.934342635, 1.868552965, 2.802386412, 3.735598565, 4.667945365, 5.599183298, 6.529069591, 7.457362420, 8.383821133,
			  9.308206486, 10.23028090, 11.14980872, 12.06655658, 12.98021494, 13.89031712, 14.79687454, 15.69965890, 16.59844540, 17.49301319,
			  18.38314600, 19.26863274, 20.14926829, 21.02485428, 21.89440300, 22.75818479, 23.61618778, 24.46823194, 25.31414810, 26.15377956,
			  26.98685084, 27.81161467, 28.62941867, 29.44014348, 30.24369084, 31.03998704, 31.82664706, 32.60502805, 33.37561603, 34.13841869,
			  34.89174371, 35.63467301, 36.36941998, 37.09612500, 37.81133646, 38.51631969, 39.21312481, 39.89989953, 40.57365999, 41.23936806,
			  41.89493602, 42.53642849, 43.17040326, 43.79159693, 44.40047460, 45.00303276, 45.58615414, 46.16328345, 46.72576332, 47.27703939,
			  47.81765609, 48.34287841, 48.86026573, 49.35956928, 49.85218170, 50.32621288, 50.79227801, 51.24248220, 51.67993332, 52.10904614,
			  52.51542326, 52.92180039, 53.30065563, 53.67295283, 54.04064576, 54.37506106, 54.70947636, 55.03825786, 55.32974871, 55.62123956,
			  55.91273041, 56.16912578, 56.41052386, 56.65192193, 56.89332001, 57.10040787, 57.28032629, 57.46024472, 57.64016315, 57.82008157,
			  58.00000000 };

            //deal with positive values only (for now)
            if( alpha == 0.0 ) return 0.0;
            double sign = Math.Sign(alpha);
            alpha = Math.Abs(alpha);
            
			// easy boundary cases
            double maxAlpha = (double)table.Count<double>() - 1.0;
            if (alpha > maxAlpha) return sign * 1.1 * table.Last<double>();
            if (alpha == maxAlpha) return sign * table.Last<double>();
			
			
			int idx = (int)alpha;
			double t = alpha - (double)idx;
			return sign * ((1.0-t) * table[idx] + t * table[idx+1]);
        }

        private double alphaFromAspectRatio(double AR)
        {
            double lo = 0.0;
            double hi = DMS.QUARTERTAU;

            while( (hi-lo) > (0.0001 / 360.0 * DMS.TAU) )
            {
                double mid = (hi + lo) / 2.0;
                double n = 1 / (2 * Math.Tan(mid)) - 1.0;
                double y = DMS.TAU / Math.Cos(mid);
                double w = n * y;
                double h = DMS.TAU * Math.Sin(mid);

                if (AR > w / h)
                    hi = mid;
                else
                    lo = mid;
            }

            return (hi + lo) / 2.0;
        }

        //constructors;
        public SpiralText(DMSImage Source, int lines)
            : base(new Size(4000, 2000),
                    Source, 
                    Color.Gray)
        {
            //some preliminaries
            m_maxStretched = 90.0;
            m_maxUnstretched = unstretch(m_maxStretched);
            m_stretchFactor = m_maxStretched / m_maxUnstretched;

            //deal with the lines
            m_linesInSource = lines;
            m_textStripeSize = new SizeF( (float)m_Source.Width * (float)m_linesInSource, 
                                          (float)m_Source.Height / (float)m_linesInSource );
            m_stretchedSize = new SizeF((float)m_Source.Width * (float)m_linesInSource * (float)m_stretchFactor,
                                        (float)m_Source.Height / (float)m_linesInSource);
            m_alpha = alphaFromAspectRatio(m_stretchedSize.Width / m_stretchedSize.Height);
            m_x = DMS.TAU * Math.Tan(m_alpha);
            m_y = DMS.TAU / Math.Cos(m_alpha);
            m_n = DMS.HALFTAU / m_x - 1.0; 
        }

        public override Color GetPixel(int x, int y)
        {
            double theta = (double)x / m_Size.Width * DMS.TAU; //longitude
            double phi = (double)y / m_Size.Height * DMS.HALFTAU; //angle down from north pole (latitude-ish)
            Point2D pt = new Point2D(theta, phi);
            
            //"unroll" by adding TAU * number of turns to theta, (and then back it off one)
            while( DMS.TAU * pt.Y > m_x * pt.X )
            {
                pt.X += DMS.TAU;
            }
            pt.X -= DMS.TAU;

            //undo our spiral by rotating it clockwise
            pt.Theta -= m_alpha;

            //scale it so that we're referencing the stretched textStrip in it's native resolution
            pt.Scale(m_stretchedSize.Width / (m_n * m_y));

            //unstretch it
            double horiz = pt.X * 2.0 / m_stretchedSize.Width; // 0 ... 2
            horiz -= 1.0;                                      // -1 ... 1
            horiz *= m_maxStretched;                           // -m_maxStretched ... m_maxStretched
            horiz = unstretch(horiz);                          // -m_maxUnstretched ... m_maxUnstretched
            horiz /= m_maxUnstretched;                         // -1 ... 1
			horiz += 1.0;                                      // 0 ... 2
            horiz *= 0.5 * m_textStripeSize.Width;             // 0 ... textwidth
            pt.X = horiz;

            //wind our strip back up so we can reference the right pixel in the source
            while (pt.X >= m_Source.Width)
            {
                pt.X -= m_Source.Width;
                pt.Y += m_textStripeSize.Height;
            }


            if (pt.Y >= m_Source.Height || pt.Y < 0.0 || pt.X < 0.0 )
                return m_Blank;

            return m_Source.GetPixel((int)pt.X, (int)pt.Y);
        }
    }
}
