using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class ComplexMap : Renderer
    {
        public ComplexMap(Size DstSize, DMSImage Source, Color Blank) :
            base(DstSize, Source, Blank)
        {
        }


        override public Color GetPixel(int x, int y)
        {
            Point2D f_Z; //we have to calculate this.
            Point2D Z = new Point2D(x, y); //this is given

            Z -= new Point2D( m_Size.Width/2, m_Size.Height/2 );
            Z *= 8.0 / Math.Max(m_Size.Height, m_Size.Width);

#if true
            //rotate by 60 degres (e^(i*5/6*pi)) = (sqrt3)/2 + (1/2)i
            Z = Z * new Point2D(-Math.Sqrt(3.0)/4, 1.0/4);

            //we have z, we want f(z) = z+1/z
            f_Z = Z;
            f_Z = f_Z + Point2D.Invert(Z);
#else
            f_Z = Z.Pow(2.0);
#endif

            //great but we want to grab this from a visible sphere
            Point3D Source3D = f_Z.InvStereographicToSphere();
            return m_Source.GetSpherePixel(Source3D);
        }

    }
}
