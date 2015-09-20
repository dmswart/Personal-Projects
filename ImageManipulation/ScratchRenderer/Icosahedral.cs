using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Diagnostics;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public abstract class Kaleidoscopic : Renderer
    {
        //constructors
        public Kaleidoscopic() : base(new Size(3000, 1500)) {}
        public Kaleidoscopic(DMSImage source) : base(new Size(3000, 1500), source)
        {
            m_hasSource = true;
        }

        private bool m_hasSource = false;

        public abstract int numNormals(); 
        public abstract Point3D normals(int i);

        /************
         * fundamental domain projected to X=1.0 plane, we have (y,z) corners here
         *   B--A
         *   | /
         *   |/
         *   C
         *************/
        public abstract Point3D domainCorner(int i);

        private Point2D coordsInFundDomain(Point3D p)
        {
            //want baricentric coords (u,v) st. B + u*(A-B) + v*(C-B) = p'
            //where p' is p projected to X=1.0 plane.
            p.Scale(1.0 / p.X);

            Point3D A = domainCorner(0);
            Point3D B = domainCorner(1);
            Point3D C = domainCorner(2);

            Point2D v0 = new Point2D(A.Y - B.Y, A.Z - B.Z);
            Point2D v1 = new Point2D(C.Y - B.Y, C.Z - B.Z);
            Point2D v2 = new Point2D(p.Y - B.Y, p.Z - B.Z);

            double dot00 = Point2D.Dot(v0, v0);
            double dot01 = Point2D.Dot(v0, v1);
            double dot02 = Point2D.Dot(v0, v2);
            double dot11 = Point2D.Dot(v1, v1);
            double dot12 = Point2D.Dot(v1, v2);

            double invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
            return new Point2D( (dot11 * dot02 - dot01 * dot12) * invDenom,
                                (dot00 * dot12 - dot01 * dot02) * invDenom);
        }

        public override Color GetPixel(int x, int y)
        {
            Point3D p = Point3D.FromSphericalCoords(1.0, (double)y / m_Size.Height * DMS.HALFTAU, (double)x / m_Size.Width * DMS.TAU);

            bool black = true;
            for (int i = 0; i < 2; i++)
            {
                for (int j = 0; j < numNormals(); j++)
                {
                    Point3D n = normals(j);
                    double offset = Point3D.Dot(p, n);
                    if (offset < 0.0)
                    {
                        black = !black;
                        p -= 2 * offset * n;
                    }
                }
            }

            if (m_hasSource)
            {
                //return m_Source.GetSpherePixel(p);
                return m_Source.GetPixel(coordsInFundDomain(p));
            }
            else
            {
                return black ? Color.Black : Color.White;
            }

        }

    }

    public class Icosahedral : Kaleidoscopic
    {
        //constructors;
        public Icosahedral() : base() {}
        public Icosahedral(DMSImage source) : base(source) {}

        private Point3D[] m_normals = 
        {
            new Point3D(0.809016994, 0.309016994, -0.5 ),
            new Point3D(0.809016994, -0.309016994, 0.5 ),
            new Point3D(0.5, 0.809016994, -0.309016994 ),
            new Point3D(0.5, -0.809016994, 0.309016994 ),
            new Point3D(0.309016994, 0.5, -0.809016994 ),
            new Point3D(0.309016994, -0.5, 0.809016994 ),
            new Point3D(0, 1, 0 ),
            new Point3D(0, 0, 1 ),
            new Point3D(0.309016994, -0.5, -0.809016994 ),
            new Point3D(0.309016994, 0.5, 0.809016994 ),
            new Point3D(0.5, -0.809016994, -0.309016994 ),
            new Point3D(0.5, 0.809016994, 0.309016994 ),
            new Point3D(0.809016994, -0.309016994, -0.5 ),
            new Point3D(0.809016994, 0.309016994, 0.5 ),
            new Point3D(1, 0, 0 )
        };

        /************
         * fundamental domain projected to X=1.0 plane, we have (y,z) corners here
         *   B--A
         *   | /
         *   |/
         *   C
         *************/
        private Point3D[] m_domainCorners = 
        {
            new Point3D(1, 0, 0.381966011),
            new Point3D(1, 0, 0),
            new Point3D(1, 0.618033989, 0)
        };

        override public int numNormals() { return m_normals.Count(); }
        override public Point3D normals(int i) { return m_normals[i]; }
        override public Point3D domainCorner(int i) { return m_domainCorners[i]; }
    }

    public class Tetrahedral : Kaleidoscopic
    {
        public Tetrahedral() : base() {}
        public Tetrahedral(DMSImage source) : base(source) {}

        private Point3D[] m_normals = 
        { 
            new Point3D(0,0.707106781,-0.707106781),
            new Point3D(0.707106781,-0.707106781,0),
            new Point3D(0.707106781,0,0.707106781),
            new Point3D(0.707106781,0,-0.707106781),
            new Point3D(0.707106781,0.707106781,0),
            new Point3D(0,0.707106781,0.707106781)
        };

        /************
         * fundamental domain projected to X=1.0 plane, we have (y,z) corners here
         *   B-----A
         *   |   /
         *   | /
         *   C
         *************/
        private Point3D[] m_domainCorners = 
        {
            new Point3D(1, 1, -1),
            new Point3D(1, 0, 0),
            new Point3D(1, 1, 1)
        };

        override public int numNormals() { return m_normals.Count(); }
        override public Point3D normals(int i) { return m_normals[i]; }
        override public Point3D domainCorner(int i) { return m_domainCorners[i]; }
    }


    public class Octohedral : Kaleidoscopic
    {
        public Octohedral() : base() { }
        public Octohedral(DMSImage source) : base(source) { }

        private Point3D[] m_normals = 
        { 
            new Point3D(1, 0, 0),
            new Point3D(0, 1, 0),
            new Point3D(0, 0, 1),
            new Point3D(0.7071067812, 0.7071067812, 0),
            new Point3D(0.7071067812, -0.7071067812, 0),
            new Point3D(0.7071067812, 0, 0.7071067812),
            new Point3D(0.7071067812, 0, -0.7071067812),
            new Point3D(0, 0.7071067812, 0.7071067812),
            new Point3D(0, 0.7071067812, -0.7071067812),
        };

        /************
         * fundamental domain projected to X=1.0 plane, we have (y,z) corners here
         *   B-----A
         *   |   /
         *   | /
         *   C
         *************/
        private Point3D[] m_domainCorners = 
        {
            new Point3D(1, 0, 0),
            new Point3D(1, 1, 0),
            new Point3D(1, 1, 1)
        };

        override public int numNormals() { return m_normals.Count(); }
        override public Point3D normals(int i) { return m_normals[i]; }
        override public Point3D domainCorner(int i) { return m_domainCorners[i]; }
    }
}