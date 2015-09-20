using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class ConformalDoubler : Renderer
    {
        //constructors;
        public ConformalDoubler(DMSImage Source) : base(new Size(Source.Height, Source.Height), Source)
        {
        }

        public override Color GetPixel(int x, int y)
        {
            Point3D vec = Point3D.FromSphericalCoords(1.0, y * DMS.HALFTAU / Size.Height, x * DMS.HALFTAU / Size.Width);
            Point2D merc = vec.Mercator();
            Point2D twoMerc = merc * 2;
            Point3D twoVec = Point3D.FromMercator(twoMerc);

            return m_Source.GetSpherePixel(twoVec);
        }

    }
}

