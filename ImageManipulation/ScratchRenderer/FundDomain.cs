using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Diagnostics;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class FundDomain : Renderer
    {
        //coords of p range from 0.0 to 1.0;
        Point3D OrthoTo3D(Point2D p)
        {
            double u = p.X * 2.0 - 1.0;
            double v = p.Y * 2.0 - 1.0;
            double w = Math.Sqrt(Math.Max(1.0 - u * u - v * v, 0.0));

            return Equirect2Ortho.NICE_TILT.Rotate(new Point3D(u, v, w));
        }

        //constructor: A, B, and C range from (0,0) to (1,1)
        public FundDomain(List<Point2D> points ) 
            : base(new Size(3000, 1500)) 
        {
            m_pts = new List<Point3D>();
            m_norms = new List<Point3D>();
            foreach( Point2D pt in points )
            {
                m_pts.Add(OrthoTo3D(pt/1100.0));
            }
            for (int i = 0; i < m_pts.Count; i++)
            {
                m_norms.Add(Point3D.Cross( m_pts[i], m_pts[(i+1)%m_pts.Count]) );
            }
        }

        private const double HALF_LINE_THICKNESS = 1.0 / (12.0 * Math.PI);
        private List<Point3D> m_pts;
        private List<Point3D> m_norms;

        public override Color GetPixel(int x, int y)
        {
            Point3D p = Point3D.FromSphericalCoords(1.0, (double)y / m_Size.Height * DMS.HALFTAU, (double)x / m_Size.Width * DMS.TAU);

            List<double> angles = new List<double>();
            foreach (Point3D norm in m_norms)
            {
                angles.Add( Point3D.Angle( norm, Point3D.Origin, p ) - DMS.QUARTERTAU );
            }

            //inside triangle;
            bool positiveAngleFound = false;
            foreach( double angle in angles )
            {
                if( angle > HALF_LINE_THICKNESS ) return Color.Black; //outside triangle
                if( angle > 0.0 ) positiveAngleFound = true;
            }

            if( !positiveAngleFound ) return Color.Black; //inside triangle

            return Color.White;
        }
    };
}