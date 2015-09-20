using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;

namespace apollonius
{
    class Program
    {
        class Circle
        {
            private Point2D m_center;
            private double m_radius;
            private List<Circle> m_children;
            private int m_level;

            public Circle(Point2D center, double radius, int level)
            {
                m_center = center;
                m_radius = radius;
                m_level = level;
                m_children = new List<Circle>();
            }

            public void AddChild( Circle child )
            {
                m_children.Add( child );
            }

            public List<Circle> Children { get { return m_children; } }
            public Point2D Center { get { return m_center; } }
            public double Radius { get { return m_radius; } }
            public int Level { get { return m_level; } }

            public Point3D SphCenter
            {
                get
                {
                    Point3D result;
                    if ((m_center - Point2D.Origin).R < DMS.EPSILON)
                        result = new Point3D(0, 0, -1);
                    else
                    {
                        Point2D A = Point2D.FromPolar(m_center.R + m_radius, m_center.Theta);
                        Point2D B = Point2D.FromPolar(m_center.R - m_radius, m_center.Theta);
                        Point3D SphA = A.InvStereographicToSphere();
                        Point3D SphB = B.InvStereographicToSphere();
                        result = (SphA + SphB).Normalized;
                    }

                    return m_radius < 0.0 ? -result : result;
                }
            }

            public double SphRadius
            {
                get
                {
                    Point2D A = Point2D.FromPolar(m_center.R + m_radius, m_center.Theta);
                    Point2D B = Point2D.FromPolar(m_center.R - m_radius, m_center.Theta);
                    Point3D SphA = A.InvStereographicToSphere();
                    Point3D SphB = B.InvStereographicToSphere();

                    if (m_center == Point2D.Origin)
                        return Math.PI - SphA.Phi;

                    return Point3D.Angle(SphA, Point3D.Origin, SphB) / 2.0;
                }
            }
        }

        class Gap
        {
            private Circle m_a;
            private Circle m_b;
            private Circle m_c;



            public Gap(Circle A, Circle B, Circle C)
            {
                m_a = A;
                m_b = B;
                m_c = C;
            }

            private double r1 { get { return m_a.Radius; } }
            private double r2 { get { return m_b.Radius; } }
            private double r3 { get { return m_c.Radius; } }
            public Circle A { get { return m_a; } }
            public Circle B { get { return m_b; } }
            public Circle C { get { return m_c; } }


            public Circle CalculateD()
            {
                double a = r2 + r3; // triangle side length opposite center of A
                double b = r3 + r1; //     "     "     "        "      "    "  B
                double c = r1 + r2; //     "     "     "        "      "    "  C
                double s = r1 + r2 + r3; // used for calculations
                double area = Math.Sqrt(r1 * r2 * r3 * (r1 + r2 + r3)); // triangle area

                double x; // radius of new soddy circle.
                double bary1, bary2, bary3; //barycentric coordinates of soddy center.

                double rad1 = (r1 * r2 * r3) / (r2 * r3 + r3 * r1 + r1 * r2 - 2.0 * area);
                double rad2 = (r1 * r2 * r3) / (r2 * r3 + r3 * r1 + r1 * r2 + 2.0 * area);
                if (rad1 < 0 ||
                    rad2 > 0 && rad2 < rad1)
                {
                    x = rad2;
                    bary1 = a + (area / (s - a));
                    bary2 = b + (area / (s - b));
                    bary3 = c + (area / (s - c));
                }
                else
                {
                    bary1 = a - (area / (s - a));
                    bary2 = b - (area / (s - b));
                    bary3 = c - (area / (s - c));
                    x = rad1;
                }

                Point2D S = (bary1 * m_a.Center + bary2 * m_b.Center + bary3 * m_c.Center) / (bary1 + bary2 + bary3);

                return new Circle( S, x, Math.Max( Math.Max( m_a.Level, m_b.Level ), m_c.Level ) + 1 );

            }
        }

        static void OutputGasket(StreamWriter sw, ref Circle A, ref Circle parent)
        {
            sw.WriteLine("l 0 " + (A.SphRadius/Math.PI).ToString());
            for( int i=0; i<A.Children.Count; i++ )
            {
                Circle child = A.Children[i];
                sw.WriteLine("p 1"); //push
                double angle = Point3D.DihedralAngle(parent.SphCenter, A.SphCenter, child.SphCenter);

                
                if (Point3D.Dot(Point3D.Cross(parent.SphCenter - A.SphCenter, child.SphCenter - A.SphCenter), A.SphCenter) < 0.0)
                    angle = -angle;
                angle += Math.PI;
                sw.WriteLine("r " + (angle / Math.PI).ToString());
                sw.WriteLine("m " + ((A.SphRadius + child.SphRadius) / Math.PI).ToString());
                OutputGasket(sw, ref child, ref A);
                sw.WriteLine("p -1");
            }
        }

        static void Main(string[] args)
        {
            List<Gap> gaps = new List<Gap>();

            Circle first = new Circle(Point2D.Origin, -1.0, 0);
            double secondRadius = 1.0 / (2 / Math.Sqrt(3) + 1); // distance from center of a circle to center of one of three inscribed tangent circles.
            double secondOffset = 1.0 - secondRadius;
            Circle secondA = new Circle(Point2D.FromPolar(secondOffset, (0.0 / 3 * Math.PI)), secondRadius, 1);
            Circle secondB = new Circle(Point2D.FromPolar(secondOffset, (2.0 / 3 * Math.PI)), secondRadius, 1);
            Circle secondC = new Circle(Point2D.FromPolar(secondOffset, (4.0 / 3 * Math.PI)), secondRadius, 1);
            gaps.Add(new Gap(secondA, secondB, secondC));
            gaps.Add(new Gap(first, secondB, secondC));
            gaps.Add(new Gap(secondA, first, secondC));
            gaps.Add(new Gap(secondA, secondB, first));
            first.AddChild(secondA);
            first.AddChild(secondB);
            first.AddChild(secondC);

            while( gaps.Count() != 0 )
            {
                Gap g = gaps.First();
                gaps.Remove(g);

                Circle D = g.CalculateD( );
                if (D.SphRadius > 1.0 / 180 * Math.PI)
                {
                    gaps.Add(new Gap(g.A, g.B, D));
                    gaps.Add(new Gap(g.A, D, g.C));
                    gaps.Add(new Gap(D, g.B, g.C));



#if true //makes symmetric
                    if (D.Level == 2 && (D.Center.R > DMS.EPSILON))
                        first.AddChild(D);
                    else
#endif
                    if (g.A.Level >= g.B.Level && g.A.Level >= g.C.Level)
                    {
                        g.A.AddChild(D);
                    }
                    else if (g.B.Level >= g.C.Level)
                    {
                        g.B.AddChild(D);
                    }
                    else
                    {
                        g.C.AddChild(D);
                    }
                }
            }

            StreamWriter sw = new StreamWriter("gasket.skl");
            OutputGasket(sw, ref first, ref secondA);
            sw.Close();
        }
    }
}
