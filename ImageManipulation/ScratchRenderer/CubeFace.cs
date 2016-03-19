using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class CubeFace : Renderer
    {
        public CubeFace(DMSImage source) : base(new Size(1444, 1444), source) {}

        public override Color GetPixel(int x, int y)
        {
            //convert x,y to 0 to 1
            double remapX = (double)x / (double)Size.Width;
            double remapY = (double)y / (double)Size.Width;

            if (remapX + remapY > 1.5 ||
                remapX + remapY < 0.5 ||
                remapX - remapY < -0.5 ||
                remapX - remapY > 0.5)
            {
                return m_Blank;
            }

            Point3D O = new Point3D(2, 1, 0);
            Point3D U = new Point3D(-2, 0, 2);
            Point3D V = new Point3D(-2, 0, -2);
            Point3D src = O + remapX*U + remapY*V;

            return m_Source.GetSpherePixel(src);
        }

    }
}

