using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class Equirect2Ortho : Renderer
    {
        public static Rotation NICE_TILT = new Rotation(0.925114, -0.359847, -0.12048, -0.012624);

        private Point2D m_center;
        private int m_radius;
        private Renderer m_renderer = null;

        //constructors;
        public Equirect2Ortho(DMSImage Source, int size) : base(new Size(size, size), Source) 
        {
            m_radius = size/2;
            m_center = new Point2D(m_radius, m_radius);
        }

        //constructors;
        public Equirect2Ortho(Renderer renderer, int size) : base(new Size(size, size) )
        {
            m_renderer = renderer;
            m_radius = size / 2;
            m_center = new Point2D(m_radius, m_radius );
        }

        public override Color GetPixel(int x, int y)
        {
            //if outside circle
            if ((new Point2D(x, y) - m_center).R > m_radius)
            {
                return m_Blank;
            }

            double u = (double)(-x + m_radius) / m_radius;
            double v = (double)(y - m_radius) / m_radius;
            double w = Math.Sqrt(Math.Max(1.0 - u * u - v * v, 0.0));

            Point3D pointOnSphere = NICE_TILT.Rotate(new Point3D(u, v, w));
            if (m_renderer != null)
                return m_renderer.GetSpherePixel(pointOnSphere);
            else if (m_Source != null)
                return m_Source.GetSpherePixel(pointOnSphere);
            else return m_Blank;
        }

    }
}
