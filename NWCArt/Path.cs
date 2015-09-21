using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;

namespace NWCArt
{
    public class Path
    {
        enum PathType
        {
            Poly,
            Ovoid,
            Spline
        }

        List<Point2D> m_Points;

        public Path()
        {
            m_Points = new List<Point2D>();
        }

        public Path(Point2D pt1, params Point2D[] pts)
            : this()
        {
            AddControlPt(pt1);

            foreach (Point2D pt in pts)
            {
                AddControlPt(pt);
            }
        }

        public Path(double coord1X, double coord1Y, params double[] coords)
            : this()
        {
            AddControlPt(new Point2D(coord1X, coord1Y));
            for (int i = 0; i < coords.Count<double>() - 1; i += 2)
            {
                AddControlPt(new Point2D(coords[i], coords[i + 1]));
            }
        }

        public Path subPathPoly(double start, double end) { return subPath(start, end, PathType.Poly); }
        public Path subPathOvoid(double start, double end) { return subPath(start, end, PathType.Ovoid); }
        public Path subPathSpline(double start, double end) { return subPath(start, end, PathType.Spline); }
        Path subPath(double start, double end, PathType type)
        {
            Path result = new Path();
            for (int i = 0; i < 20; i++)
            {
                double t = (double)i / 20.0;
                t *= end - start;
                t += start;
                result.AddControlPt( getPt( t, type) );
            }
            return result;
        }

        public void AddControlPt(Point2D pt)
        {
            m_Points.Add(pt);
        }

        public int Count()
        {
            return m_Points.Count<Point2D>();
        }

        public Point2D getStartPt() { return m_Points[0]; }
        public Point2D getEndPt() { return m_Points[Count() - 1]; }
        public Point2D getPolyPt(double t) { return getPt(t, PathType.Poly); }
        public Point2D getOvoidPt(double t) { return getPt(t, PathType.Ovoid); }
        public Point2D getSplinePt(double t) { return getPt(t, PathType.Spline); }

        Point2D getPt(double t, PathType type)
        {
            // Calculate Pathlength
            double pathLength = 0;
            for (int i = 0; i < Count() - 1; i++)
            {
                pathLength += (m_Points[i] - m_Points[i + 1]).R;
            }

            if (type == PathType.Ovoid)
            {
                //special case for ovoid - there's one more segment: the one from beginning to end.
                pathLength += (m_Points[Count() - 1] - m_Points[0]).R;
            }

            if (pathLength == 0.0)
                return m_Points[0];


            //deal with point going off the edge
            if (t < 0)
            {
                Point2D backdir = m_Points[0] - m_Points[1];
                return m_Points[0] + backdir.ScaledTo(pathLength * (0.0 - t)); //pathlength is negative here
            }
            if (t > 1.0 && type != PathType.Ovoid)
            {
                Point2D forwarddir = m_Points[Count() - 1] - m_Points[Count() - 2];
                return m_Points[Count() - 1] + forwarddir.ScaledTo(pathLength * (t - 1.0));
            }

            double lengthToTravel = pathLength *= t;

            int j = 0;
            for (j = 0; j < Count() - 1; j++)
            {
                double thisSegmentLength = (m_Points[j] - m_Points[j + 1]).R;
                if (thisSegmentLength > lengthToTravel)
                {
                    return getPt(j, lengthToTravel / thisSegmentLength, type);
                }
                lengthToTravel -= thisSegmentLength;
            }

            if (type == PathType.Ovoid)
            {
                //deal with the special case where we're in the last segment.
                return getPt(Count() - 1, lengthToTravel / (m_Points[Count() - 1] - m_Points[0]).R, type);
            }

            return m_Points.Last<Point2D>();
        }

        Point2D getPt(int index, double t, PathType type)
        {
            if (type == PathType.Poly)
            {
                return m_Points[index] + t * (m_Points[index + 1] - m_Points[index]);
            }

            Point2D P0, P1, P2, P3;
            if (type == PathType.Ovoid)
            {
                P0 = m_Points[(index - 1 + m_Points.Count()) % m_Points.Count];
                P1 = m_Points[index];
                P2 = m_Points[(index + 1) % m_Points.Count()];
                P3 = m_Points[(index + 2) % m_Points.Count()];
            }
            else // (type == PathType.Spline)
            {
                P0 = (index == 0) ? m_Points[0] + m_Points[0] - m_Points[1] : m_Points[index - 1];
                P1 = m_Points[index];
                P2 = m_Points[index + 1];
                P3 = (index == m_Points.Count() - 2) ? m_Points[index + 1] + m_Points[index + 1] - m_Points[index] : m_Points[index + 2];
            }

            return (0.5 * ((2.0 * P1) +
                   (-P0 + P2) * t +
                   (2 * P0 - 5 * P1 + 4 * P2 - P3) * t * t +
                   (-P0 + 3 * P1 - 3 * P2 + P3) * t * t * t));
        }

        public Path reversed()
        {
            Path result = new Path();
            for (int i = Count() - 1; i >= 0; i--)
                result.AddControlPt(m_Points[i]);
            return result;
        }

        public Point2D this[int i]
        {
            get
            {
                return (i >= Count()) ? Point2D.Origin : m_Points[i];
            }
            set
            {
                if (i <= Count())
                    m_Points[i] = value;
            }
        }
    }
}
