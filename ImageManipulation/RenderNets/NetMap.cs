using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using DMSLib;

namespace RenderNets
{
    public class NetMap : Renderer
    {
        public enum XfrmMode
        {
            None,
            Stereographic,
            Lagrange,
            Quasiconformal
        }

        private Net m_Net;
        private XfrmMode m_Xfrm = XfrmMode.None;
        static Rotation tweak = new Rotation(Math.PI/2.0, Point3D.XAxis);
        //private static Rotation tweak = new Rotation();

        public NetMap( System.Drawing.Size size, DMSImage source, Color Background, Net net )
            : base( size, source, Background )
        {
            m_Net = net;
        }

        public NetMap(System.Drawing.Size size, DMSImage source, Color Background, Net net, XfrmMode mode) 
            : this(size, source, Background, net )
        {
            m_Xfrm = mode;
        }

        override public Color GetPixel(int x, int y)
        {
            double X = (double)x / Math.Min(m_Size.Height, m_Size.Width);
            double Y = (double)y / Math.Min(m_Size.Height, m_Size.Width);

            Point2D UV = m_Net.Map( new Point2D(X - (int)X, Y - (int)Y ) );
            if( UV == null )
                return m_Blank;

#if false //sierpinski hack
            //get a sense of scale:
            double X2 =  (double)(x + ((x>0)?-1:1)) / Math.Min(m_Size.Height, m_Size.Width);
            Point2D UV2 = m_Net.Map(new Point2D(X2 - (int)X2, Y - (int)Y));
            int nNumHops = -(int)Math.Log( (UV - UV2).R * m_Size.Width, 2.0);

            for( int i=0; i<nNumHops; i++ )
            {
                Point2D A = new Point2D(-1, -1);
                Point2D B = new Point2D(1, -1);
                Point2D C = new Point2D(0, Math.Sqrt(3) - 1.0);

                if ((UV - A).R < (UV - (B + C) / 2).R) //hop away from A
                    UV = A + 2.0 * (UV - A);
                else if ((UV - B).R < (UV - (A + C) / 2).R)
                    UV = B + 2.0 * (UV - B);//hop away from B
                else if ((UV - C).R < (UV - (A + B) / 2).R)
                    UV = C + 2.0 * (UV - C);//hop away from C
                else
                    break;

            }
#endif

            switch( m_Xfrm )
            {
                case XfrmMode.Stereographic:
                    Point3D SpherePoint = UV.InvStereographicToSphere(); //unit disc converted to southern hemisphere.

                    if ((Math.Truncate(X) + Math.Truncate(Y)) % 2 > 0)
                    {
                        SpherePoint.Z *= -1.0;  //puts it into the northern hemisphere.
                        SpherePoint.X *= -1.0;  //makes things not mirrored.
                    }

                    //rotate southern hemisphere to be centered on y-axis in such a way to make the final result pretty.
                    Rotation rot = new Rotation(Math.PI, new Point3D(0, -1.0, 1.0));
                    SpherePoint = rot.Rotate(SpherePoint);



                    return m_Source.GetSpherePixel(tweak.Rotate(SpherePoint));

                case XfrmMode.Lagrange:
                    //UV: unit disc
                    SpherePoint = UV.InvStereographicToSphere();   // convert to southern hemisphere (z<0)

                    //rotate southern hemisphere to be centered on y-axis in such a way to make the final result pretty.
                    rot = new Rotation(Math.PI, new Point3D(0, -1.0, 1.0)); 
                    SpherePoint = rot.Rotate(SpherePoint);

                    //mercator map is centered on y axis:
                    Point2D Merc = SpherePoint.Mercator();  //that unit circle is now (x,y)=(+/-PI/2, +/-inf) and in conformal space.
                    Merc *= 2.0;  //and now it covers (x,y) = (+/-PI, +/-inf)
                    SpherePoint = Point3D.FromMercator(Merc); //now unit circle covers the entire sphere, centered on x axis.

                    return m_Source.GetSpherePixel(tweak.Rotate(SpherePoint));


                case XfrmMode.None:
                    return m_Source.GetPixel((UV + new Point2D(1.0, 1.0)) * 0.5);

                case XfrmMode.Quasiconformal:
                    //calculate the offset
                    double grayvalue = m_Net.Quasiconformality( new Point2D(X - (int)X, Y - (int)Y ) );
                    grayvalue -= 1.0;  //we're going from 1
                    grayvalue /= 3.0;  //... to 3
                    grayvalue *= 255.0;
                    if( grayvalue > 255.0 ||  grayvalue < 0.0 )
                        grayvalue = 255.0;
                    return Color.FromArgb((int)grayvalue, (int)grayvalue, (int)grayvalue);
            }

            //if we're here I don't know what's gone wrong.
            return BlankColor;
        }
    }
}
