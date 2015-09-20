using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class OctahedronUnit : Renderer
    {
        // It goes:  A  B  C
        //           D  O  E
        //           F  G  H
        Point3D O, A, B, C, D, E, F, G, H;

        //constructors;
        public OctahedronUnit(Size size, DMSImage Source, Point3D center, Point3D topRight)
            : base(size, Source)
        {

            O = center.Normalized;
            F = Point3D.Cross(center, topRight).Normalized;
            A = Point3D.Cross(F, O);
            H = -A;
            C = -F;
            B = (O + A + C).ScaledTo(2.0 / Math.Sqrt(3.0));
            E = (O + C + H).ScaledTo(2.0 / Math.Sqrt(3.0));
            G = (O + F + H).ScaledTo(2.0 / Math.Sqrt(3.0));
            D = (O + F + A).ScaledTo(2.0 / Math.Sqrt(3.0));
        }

        public override Color GetPixel(int x, int y)
        {
            //convert x,y to -1 to 1
            double remapX = (double)x / (double)Size.Width * 2.0 - 1.0;
            double remapY = -((double)y / (double)Size.Width * 2.0 - 1.0);

            Point3D Upt, Vpt;
            double U, V;

            if (remapX < 0 && remapY < 0 ) Vpt = F;
            else if( remapX < 0 && remapY >= 0 ) Vpt = A;
            else if( remapX >= 0 && remapY < 0 ) Vpt = H;
            else Vpt = C;

            if (Math.Abs(remapX) >= Math.Abs(remapY) ) Upt = (remapX >= 0) ? E : D;
            else Upt = (remapY >= 0) ? B : G;

            U = Math.Abs(remapX);
            V = Math.Abs(remapY);
            if (V > U) { double tmp = U; U = V; V = tmp; }

            Point3D src = O + U * (Upt - O) + V * (Vpt - Upt);

            return m_Source.GetSpherePixel(src);
        }

    }
}

