using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class Stereographic2Equirectangular : Renderer
    {
        //constructors;
        public Stereographic2Equirectangular(DMSImage Source, int height) : base(new Size(height*2, height), Source) {}

        public override Color GetPixel(int x, int y)
        {
            Point3D pointOnSphere = Point3D.FromSphericalCoords(1.0, (double)y / Size.Height * Math.PI, (double)x / Size.Width * Math.PI * 2.0);
            Point2D pointOnStereographic = pointOnSphere.StereographicToPlane();

            Point2D imageLocation = pointOnStereographic / 6.0;
            imageLocation += new Point2D(0.5, 0.5);

            return m_Source.GetPixel(imageLocation);
        }

    }
}

