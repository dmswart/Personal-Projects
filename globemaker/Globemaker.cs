using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using DMSLib;

namespace globemaker
{
    public class Globemaker : Renderer
    {
        #region member variables
        private Skeleton m_Skeleton;
        private RectangleF m_Target;
        #endregion

        #region Constructors
        //standard constructor
        public Globemaker( Size size, DMSImage source, Color Background, Skeleton skeleton )
            : base( size, source, Background )
        {
            m_Skeleton = skeleton;
            m_Target = new RectangleF( (float)(m_Skeleton.GetMinPt().X - Math.PI),
                                       (float)(m_Skeleton.GetMinPt().Y - Math.PI),
                                       (float)(m_Skeleton.GetMaxPt().X - m_Skeleton.GetMinPt().X + DMS.TAU),
                                       (float)(m_Skeleton.GetMaxPt().Y - m_Skeleton.GetMinPt().Y + DMS.TAU) );
        }

        //optionally opt out of a source image (will print blue greens)
        public Globemaker( Size size, Color Background, Skeleton skeleton )
            : base( size, null, Background )
        {
            m_Skeleton = skeleton;
            m_Target = new RectangleF((float)(m_Skeleton.GetMinPt().X - Math.PI),
                                       (float)(m_Skeleton.GetMinPt().Y - Math.PI),
                                       (float)(m_Skeleton.GetMaxPt().X - m_Skeleton.GetMinPt().X + DMS.TAU),
                                       (float)(m_Skeleton.GetMaxPt().Y - m_Skeleton.GetMinPt().Y + DMS.TAU));
        }
        #endregion

        #region Accessors
        private Skeleton Skeleton
        {
            get { return m_Skeleton; }
            set { m_Skeleton = value; }
        }


        public RectangleF Target
        {
            get { return m_Target; }
            set { m_Target = value; }
        }

        #endregion

        #region public function

        public void TrimTargetToSize()
        {
            double sizeratio = (double)m_Size.Width / m_Size.Height;
            double targetratio = m_Target.Width / m_Target.Height;

            if (sizeratio > targetratio)
                m_Target.Height = (float)(m_Target.Width / sizeratio);
            else
                m_Target.Width = (float)(m_Target.Height * sizeratio);
        }

        public void ExpandTargetToSize()
        {
            double sizeratio = (double)m_Size.Width / m_Size.Height;
            double targetratio = m_Target.Width / m_Target.Height;

            if (sizeratio < targetratio)
                m_Target.Height = (float)(m_Target.Width / sizeratio);
            else
                m_Target.Width = (float)(m_Target.Height * sizeratio);
        }

        override public Color GetPixel(int x, int y)
        {
            //convert image coordinates (+y down) to normal coordinates (+y up)
            y = (m_Size.Height - 1) - y;
			Point2D P = new Point2D( (double)m_Target.Location.X + ((double)x / m_Size.Width * m_Target.Width),
                                     (double)m_Target.Location.Y + ((double)y / m_Size.Height * m_Target.Height) );


            //given P, find nearest segment S on plane
            RelativePosition S = m_Skeleton.NearestSegmentOnPlane( P );

			//determine corresponding point Q on sphere.
            Point3D Q = S.PointOnSphere;

			//find if nearest segment on sphere to Q exists.
            if( m_Skeleton.bNearerSegmentOnSphereExists( Q, S.Distance * S.Segment.Strength - m_Skeleton.bleedout ) )
            {
                return m_Blank;
			} /* if */

            if( m_Source != null )
            {
                return m_Source.GetSpherePixel( Q );
            }

            //draw skeleton line
            if (S.Distance < 0.4 * DMS.TAU / 360.0)
                return Color.Black;

            //draw bluish greenish color;
            int nIdx = m_Skeleton.IndexOf(S.Segment);
            return colorFromRandomIndex(nIdx);
        }

        #endregion

        #region static functions

        static public Color colorFromRandomIndex(int idx)
        {
            //draw bluish greenish color;
            return Color.FromArgb( 32 + (idx * 43) % 8 * 8,
                                   32 + (idx * 71) % 11 * 17,
                                   255 - (32 + (idx * 71) % 11 * 17));
            // return Color.FromArgb(32, 32 + nIdx % 255, 32 + nIdx % 255);
        }

        #endregion
    }
}
