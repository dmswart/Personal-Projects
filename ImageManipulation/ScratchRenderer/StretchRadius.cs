using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    // fans theta around, and scales radius for conformality
    public class StretchRadius : Renderer
    {
        double m_Symmetry;
        public StretchRadius(DMSImage source, double NewSymmetry)
            : base(new Size(source.Width, source.Height), source, Color.Gray)
        {
            m_Symmetry = NewSymmetry;
        }

        private Point2D ConformallyStretchRadius(Point2D pt, double ConstantRadius, double factor)
        {
            //calculate new radius
            double radius = pt.R;

            radius /= ConstantRadius;
            radius = Math.Pow(radius, m_Symmetry / 6.0);
            radius *= ConstantRadius;

            //calculate new theta
            double theta = pt.Theta;
            theta *= m_Symmetry / 6.0;

            //put it back into point2d for our polar2cartesian conversion
            return Point2D.FromPolar(radius, theta);
        }

        public override Color GetPixel(int x, int y)
        {
            double ConstantRadius = Math.Min((double)m_Source.Width / 2.0, (double)m_Source.Height / 2.0);

            //prepare coordinate (centered at origin)
            Point2D coordinate = new Point2D(x, y);
            Point2D offset = new Point2D((double)m_Source.Width / 2.0, (double)m_Source.Height / 2.0);
            coordinate -= offset;
            coordinate.Theta += Math.PI / 2.0;

            //deal with the blend weighting
            double sweep = coordinate.Theta / Math.PI * 8.0 - 7.0;
            double weight = 0.0; //1.0 means use the colour from: coordinate, 0.0 means use coordinateB;
            if (sweep > -DMS.EPSILON && sweep <= 1.0)
            {
                weight = DMS.smooth(sweep);
            }

            //apply the stretch, also calculate the other side to blend to
            coordinate = ConformallyStretchRadius(coordinate, ConstantRadius, m_Symmetry / 6.0);
            Point2D coordinateB = Point2D.FromPolar(coordinate.R, DMS.FixAnglePositive(coordinate.Theta) - 2.0 * Math.PI * m_Symmetry / 6.0);

            //now back to native coordinates
            coordinate.Theta += Math.PI / 6.0;
            coordinateB.Theta += Math.PI / 6.0;
            coordinate += offset;
            coordinateB += offset;


            if (coordinate.X < 0 || coordinate.X >= m_Source.Width || coordinate.Y < 0 || coordinate.Y >= m_Source.Height ||
                coordinateB.X < 0 || coordinateB.X >= m_Source.Width || coordinateB.Y < 0 || coordinateB.Y >= m_Source.Height)
                return m_Blank;

            //apply the weighting.
            Color
                A = m_Source.GetPixel((int)coordinate.X, (int)coordinate.Y),
                B = m_Source.GetPixel((int)coordinateB.X, (int)coordinateB.Y);

            if (A.ToArgb() == m_Blank.ToArgb() || B.ToArgb() == m_Blank.ToArgb())
                return m_Blank;

            return Color.FromArgb(
                (int)((1.0 - weight) * A.R + weight * B.R),
                (int)((1.0 - weight) * A.G + weight * B.G),
                (int)((1.0 - weight) * A.B + weight * B.B));
        }
    }
}
