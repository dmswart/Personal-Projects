using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using DMSLib;

namespace DMSLib
{
    public enum TestPatternType
    {
        CircularGrid,
        RectangularGrid,
        CheckerBoard,
        CircularCheckerBoard,
        EquirectCheckerBoardPlane,
        TransverseMercatorCheckerBoardPlane,
        MercatorCheckerBoardPlane,
        EquirectangularCheckerboard
    }
    public class TestPattern : Renderer
    {
        private Random m_rand;
        private Color m_Fore;
        private double m_parm1;
        private double m_parm2;
        private TestPatternType m_type;
        public TestPattern(Size size, Color Back, Color Fore, TestPatternType type, int parm1, int parm2) : base(size,null,Back)
        {
            m_rand = new Random();
            m_type = type;
            m_parm1 = (double)parm1;
            m_parm2 = (double)parm2;
            m_Fore = Fore;
        }

        public override Color GetPixel(int x, int y)
        {
            switch (m_type)
            {
                case TestPatternType.CircularGrid:
                    //parm1 = #spokes, parm2 = width of line as a percentage of spoke to spoke distance on circumference
                    double Radius = Math.Max(m_Size.Width / 2.0, m_Size.Height / 2.0);
                    Point2D Center = new Point2D(m_Size.Width, m_Size.Height) * 0.5;
                    Point2D dir = new Point2D(x, y) - Center;

                    //get line width
                    double spoketospoke = Radius * 2.0 * Math.PI / m_parm1;
                    double linewidth = spoketospoke * (m_parm2 / 100.0);

                    //find point along closest spoke: 
                    int spoke = (int)(DMS.FixAnglePositive(dir.Theta) / (2.0 * Math.PI) * m_parm1 + 0.5);
                    Point2D PointOnSpoke = Point2D.FromPolar(dir.R, (double)spoke * 2.0 * Math.PI / m_parm1);
                    if ((dir - PointOnSpoke).R < linewidth)
                        return m_Blank;

                    //find ring
                    double TestRadius = Radius;
                    if (Radius < dir.R)
                        return m_Blank;

                    while (TestRadius > dir.R / 2.0)
                    {
                        if (Math.Abs(TestRadius - dir.R) < linewidth)
                            return m_Blank;

                        TestRadius *= (Radius - spoketospoke) / Radius;
                    }

                    return m_Fore;

                case TestPatternType.RectangularGrid:
                    //parm1 = # squares across, parm2 = width of line as a percentage of spoke to spoke distance on circumference
                    double Squarewidth = (double)m_Size.Width / (m_parm1 + m_parm2 / 100.0);
                    linewidth = Squarewidth * (m_parm2 / 100.0);

                    //find closest grid point
                    Point2D Position = new Point2D(x, y);
                    Point2D NearestGridPoint = Position / Squarewidth;
                    NearestGridPoint += new Point2D(0.5, 0.5);
                    NearestGridPoint = new Point2D((int)NearestGridPoint.X, (int)NearestGridPoint.Y);
                    NearestGridPoint *= Squarewidth;
                    if (Math.Abs(NearestGridPoint.X - Position.X + linewidth / 2.0) < linewidth)
                        return m_Blank;
                    if (Math.Abs(NearestGridPoint.Y - Position.Y + linewidth / 2.0) < linewidth)
                        return m_Blank;
                    else
                        return m_Fore;

                case TestPatternType.CheckerBoard:
                    //parm1 = # squares across, parm2 = unused
                    Squarewidth = (double)m_Size.Width / m_parm1;

                    //find closest grid point
                    Position = new Point2D(x, y);

                    if (false) //diamonds
                    {
                        Position.Theta += Math.PI / 4.0;
                        Position += new Point2D(m_Size.Width, m_Size.Height);
                    }

                    NearestGridPoint = Position / Squarewidth;
                    int X = (int)NearestGridPoint.X;
                    int Y = (int)NearestGridPoint.Y;

                    if (X % 2 == 0 && Y % 2 == 0 || X % 2 == 1 && Y % 2 == 1)
                        return m_Blank;
                    else
                        return m_Fore;

                case TestPatternType.TransverseMercatorCheckerBoardPlane:
                    {
                        Point3D dir3D;
                        double val = 0.0;

                        //sky
                        if (y < m_Size.Height / 2)
                            return m_Blank;

                        for (int i = 0; i < 80; i++)
                        {
                            Point2D mercPoint = new Point2D(y, x);
                            mercPoint += new Point2D(m_rand.NextDouble(), m_rand.NextDouble());
                            mercPoint -= new Point2D((double)m_Size.Height / 4.0, (double)m_Size.Width / 2.0);
                            mercPoint = mercPoint / (m_Size.Height / DMS.TAU);

                            dir3D = Point3D.FromMercator(mercPoint);

                            dir3D = new Point3D(dir3D.Z, dir3D.Y, -dir3D.X);
                            dir3D *= 3.0 / dir3D.Z; // extend the point so that z = 3
                            if (dir3D.X < 0.0) dir3D.X = -dir3D.X + 1.0;
                            if (dir3D.Y < 0.0) dir3D.Y = -dir3D.Y + 1.0;

                            if ((int)(dir3D.X) % 2 == (int)(dir3D.Y) % 2)
                                val++;
                        }
                        val *= 255.0 / 80.0;
                        return Color.FromArgb( (int)val, (int)val, (int)val );
                    }

                case TestPatternType.MercatorCheckerBoardPlane:
                    {
                        Point3D dir3D;
                        double val = 0.0;

                        //sky
                        if (y < m_Size.Height / 2)
                            return m_Blank;

                        for (int i = 0; i < 80; i++)
                        {
                            Point2D mercPoint = new Point2D(x, y);
                            mercPoint += new Point2D(m_rand.NextDouble(), m_rand.NextDouble());
                            mercPoint -= new Point2D(0.0, (double)m_Size.Height / 2.0);
                            mercPoint = mercPoint / (m_Size.Width / DMS.TAU);

                            dir3D = Point3D.FromMercator(mercPoint);

                            dir3D *= 3.0 / dir3D.Z; // extend the point so that z = 3
                            if (dir3D.X < 0.0) dir3D.X = -dir3D.X + 1.0;
                            if (dir3D.Y < 0.0) dir3D.Y = -dir3D.Y + 1.0;

                            if ((int)(dir3D.X) % 2 == (int)(dir3D.Y) % 2)
                                val++;
                        }
                        val *= 255.0 / 80.0;
                        return Color.FromArgb((int)val, (int)val, (int)val);
                    }

                case TestPatternType.EquirectCheckerBoardPlane:
                    {
                        Point3D dir3D;
                        double val = 0;

                        if (y < m_Size.Height / 2)
                            return m_Blank;

                        bool bForceFull = (y < m_Size.Height / 2 + 100);

                        for (int i = 0; i < 80; i++)
                        {
                            //leave early if nothing's going on.
                            if (!bForceFull &&
                                i == 10 &&
                                (val == 0 || val == 10))
                            {
                                val *= 8;
                                break;
                            }

                            dir3D = Point3D.FromSphericalCoords(
                                1.0,
                                (((double)y + m_rand.NextDouble() - 0.5) / m_Size.Height) * Math.PI,
                                (((double)x + m_rand.NextDouble() - 0.5) / m_Size.Width) * 2.0 * Math.PI);

                            if (dir3D.Z >= 0.0) { i--; continue; }

                            dir3D *= 3.0 / dir3D.Z; // extend the point so that z = 3
                            if (dir3D.X < 0.0) dir3D.X = -dir3D.X + 1.0;
                            if (dir3D.Y < 0.0) dir3D.Y = -dir3D.Y + 1.0;

                            if ((int)(dir3D.X) % 2 == (int)(dir3D.Y) % 2)
                                val++;
                        }

                        val *= 255.0 / 80.0;
                        return Color.FromArgb((int)val, (int)val, (int)val);
                    }

                case TestPatternType.CircularCheckerBoard:
                    //parm1 = #spokes, parm2 = unused
                    Radius = Math.Max(m_Size.Width / 2.0, m_Size.Height / 2.0);
                    Center = new Point2D(m_Size.Width, m_Size.Height) * 0.5;
                    dir = new Point2D(x, y) - Center;

                    //get line width
                    spoketospoke = Radius * 2.0 * Math.PI / m_parm1;

                    //find point along closest spoke: 
                    spoke = (int)(DMS.FixAnglePositive(dir.Theta) / (2.0 * Math.PI) * m_parm1 + 0.5);

                    //find ring
                    TestRadius = Radius;
                    if (dir.R == 0.0)
                        return m_Blank;

                    int ring;
                    if (dir.R > Radius)
                        ring = 1;
                    else
                    {
                        ring = 0;
                        while (TestRadius >= dir.R)
                        {
                            TestRadius *= (Radius - spoketospoke) / Radius;
                            ring++;
                        }
                    }

                    return (ring % 2 == spoke % 2) ? m_Fore : m_Blank;

                case TestPatternType.EquirectangularCheckerboard:
                    //parm1 = #spokes, parm2 = unused.
                    Point3D SpherePoint = Point3D.FromSphericalCoords( 1.0, 
                                                                      (double)y / (double)Size.Height * Math.PI,
                                                                      (double)y / (double)Size.Height * 2.0 * Math.PI);
                    if (Math.Abs(SpherePoint.X) < DMS.EPSILON && Math.Abs(SpherePoint.Y) < DMS.EPSILON)
                        return m_Fore;

                   
                    //find spoke. (x or longitude).
                    if (m_parm1 % 2 == 1) m_parm1++; //make things look nice.
                    spoke = (int)(x * m_parm1 / Size.Width);

                    //find ring (y on a mercator map).
                    double MercY = SpherePoint.Mercator().Y;
                    Squarewidth = 2.0 * Math.PI / (double)m_parm1;
                    ring = (int)(Math.Abs(MercY) / Squarewidth);
                    if (MercY < 0) ring++; //reverse checker colour when crossing the equator.

                    return (ring % 2 == spoke % 2) ? m_Fore : m_Blank;

                default:
                    return m_Blank;
            } //switch m_
        }
    }
}
