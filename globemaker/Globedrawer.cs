using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;
using DMSLib;

namespace globemaker
{
    public class Globedrawer : Renderer
    {
        #region member variables
        private Skeleton m_Skeleton;
        private int m_radius;
        private Point2D m_center;
        private Rotation m_sphereRot = new Rotation(0.925114, -0.359847, -0.12048, -0.012624);
        private bool m_bOrthographic;

        #endregion

        public Globedrawer( int size, DMSImage source, Color Background, Skeleton skeleton, bool bOrthographic = true )
            : base(new Size(bOrthographic?size:2*size, size), source, Background)
        {
            m_bOrthographic = bOrthographic;
            m_Skeleton = skeleton;
            m_radius = size/2;
            m_center = new Point2D(m_radius, m_radius);
        }

        public override Color GetPixel(int x, int y)
        {
            Point3D Q;
            if (m_bOrthographic)
            {
                //if outside circle
                if ((new Point2D(x, y) - m_center).R > m_radius)
                {
                    return m_Blank;
                }

                double u = (double)(x - m_radius) / m_radius;
                double v = (double)(y - m_radius) / m_radius;
                double w = Math.Sqrt(Math.Max(1.0 - u * u - v * v, 0.0));

                Q = new Point3D(u, v, w);

                Q = m_sphereRot.Rotate(Q);
            }
            else
            {
                double u = (double)(x) / (double)(m_Size.Width) * DMS.TAU;
                double v = (double)(y) / (double)(m_Size.Height) * DMS.HALFTAU;
                Q = Point3D.FromSphericalCoords(1.0, v, u);
            }


            if( m_Source != null )
            {
                return m_Source.GetPixel( new Point2D( DMS.FixAnglePositive(-Q.Theta) / DMS.TAU,
                                                       Q.Phi / DMS.HALFTAU) );
            }

            RelativePosition RP = m_Skeleton.NearestSegmentOnSphere( Q );
            Segment S = RP.Segment;
            int nIdx = m_Skeleton.IndexOf(S);

            //draw skeleton line
            if( RP.Distance < 0.4 * DMS.TAU/360.0 )
                return Color.Black;

            return Globemaker.colorFromRandomIndex(nIdx);
        }

    }

}
