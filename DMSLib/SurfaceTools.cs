using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class SurfaceTools
    {
        public class Edge
        {
            private int _i;
            private int _j;

            public Edge(int i, int j)
            {
                _i = Math.Min(i, j);
                _j = Math.Max(i, j);
            }

            public int I
            {
                get { return _i; }
                set { _i = value; }
            }
            public int J
            {
                get { return _j; }
                set { _j = value; }
            }

            public static bool operator ==(Edge A, Edge B) { return A.I == B.I && A.J == B.J; }
            public static bool operator <(Edge A, Edge B) { return A.I < B.I || A.I == B.I && A.J < B.J; }
            public static bool operator >(Edge A, Edge B) { return A.I > B.I || A.I == B.I && A.J > B.J; }
            public static bool operator >=(Edge A, Edge B) { return !(A.I < B.I); }
            public static bool operator <=(Edge A, Edge B) { return !(A.I > B.I); }
            public static bool operator !=(Edge A, Edge B) { return !(A.I == B.I); }
            public static int Comparison(Edge A, Edge B) { if (A == B) return 0; return (A < B) ? -1 : 1; }
        }

        /// <summary>
        /// Is pt within the cylinder centered on the point Center, and of the given size and direction.
        /// </summary>
        /// <param name="pt"></param>
        /// <param name="dir">assumes dir is normalized</param>
        /// <param name="Length"></param>
        /// <param name="Radius"></param>
        /// <returns></returns>
        static private bool IsInCylinder(Point3D pt, Point3D center, Point3D dir, double Length, double Radius)
        {
            Point3D tmp = pt - center;
            double projected = Math.Abs(Point3D.Dot(tmp, dir));

            return (projected <= Length / 2.0 &&
                    (tmp.R * tmp.R - projected * projected < Radius * Radius));
        }

        static public void PunchHole(ref Surface surf, Point3D center, Point3D direction, double Length, double Radius)
        {
            Surface HoleWall = new Surface();
            List<int> HoleIdxs = new List<int>();
            Point3D dir = direction.Normalized;

            for (int i = 0; i < surf.NumPoints; i++)
            {
                if (!IsInCylinder(surf.Point(i), center, dir, Length, Radius))
                    continue;

                for (int j = surf.NumFaces - 1; j >= 0; j--)
                {
                    if (surf.Face(j).I == i ||
                        surf.Face(j).J == i ||
                        surf.Face(j).K == i)
                    {
                        if (!IsInCylinder(surf.Point(surf.Face(j).I), center, dir, Length, Radius)) HoleIdxs.Add(surf.Face(j).I);
                        if (!IsInCylinder(surf.Point(surf.Face(j).J), center, dir, Length, Radius)) HoleIdxs.Add(surf.Face(j).J);
                        if (!IsInCylinder(surf.Point(surf.Face(j).K), center, dir, Length, Radius)) HoleIdxs.Add(surf.Face(j).K);
                        surf.RemoveFace(j);
                    }
                }


            }

            //make sure points in hole wall are unique
            for (int j = HoleIdxs.Count() - 1; j >= 0; j--)
            {
                Point3D NewPt = surf.Point(HoleIdxs[j]);

                //check that existing points in HoleWall surface don't match
                int k;
                for (k = 0; k < HoleWall.NumPoints; k++)
                {
                    if (NewPt == HoleWall.Point(k))
                        break;
                }

                //add if we haven't found it.
                if (k == HoleWall.NumPoints)
                    HoleWall.AddPoint(NewPt);
            }


            //get the convex hull faces, then either remove them if they're pointing in our direction, or reverse them

            ConvexHull(ref HoleWall);
            for (int i = HoleWall.NumFaces - 1; i >= 0; i--)
            {
                double IR = HoleWall.Point(HoleWall.Face(i).I).R;
                double JR = HoleWall.Point(HoleWall.Face(i).J).R;
                double KR = HoleWall.Point(HoleWall.Face(i).K).R;

                if ( IR > center.R && JR > center.R && KR > center.R ||
                     IR < center.R && JR < center.R && KR < center.R )
                {
                    HoleWall.RemoveFace(i);
                }
                else
                {
                    HoleWall.Face(i).Reverse();
                }
            }

            //add in the new hole wall
            surf.AddSurface(HoleWall);
        }

        static public void ConvexHull(ref Surface surf)
        {
            if (surf.NumPoints < 4)
                return;

            //add the middle point to make a tetrahedron for some numerical stability
            Point3D Middle = new Point3D();
            for (int i = 0; i < surf.NumPoints; i++)
            {
                Middle += surf.Point(i);
            }
            Middle /= surf.NumPoints;
            int mid = surf.AddPoint(Middle);


            //clean out the faces, and add faces of a tetrahedron using the first 3 pts and the middle.
            Point3D inside = (surf.Point(0) + surf.Point(1) + surf.Point(2) + surf.Point(mid)) / 4.0;
            while (surf.NumFaces > 0)
                surf.RemoveFace(0);
            surf.AddFace(0, 1, 2, inside);
            surf.AddFace(0, 1, mid, inside);
            surf.AddFace(0, 2, mid, inside);
            surf.AddFace(1, 2, mid, inside);


            // add in points one at a time, remove and replace faces as necessary
            for (int i = 3; i < surf.NumPoints; i++)
            {
                List<Edge> Edges = new List<Edge>();
                //for the ith point...

                //go through the each existing face, 
                for (int j = surf.NumFaces - 1; j >= 0; j--)
                {
                    //if a triangle is facing our new point, remove the face, add its edges to a list.
                    double tmp = Point3D.Dot(surf.FaceNormal(j), surf.Point(i) - surf.Point(surf.Face(j).I));
                    if (Point3D.Dot(surf.FaceNormal(j), (surf.Point(i) - surf.Point(surf.Face(j).I)).Normalized) > -DMS.EPSILON)
                    {
                        Edges.Add(new Edge(surf.Face(j).I, surf.Face(j).J));
                        Edges.Add(new Edge(surf.Face(j).J, surf.Face(j).K));
                        Edges.Add(new Edge(surf.Face(j).K, surf.Face(j).I));
                        surf.RemoveFace(j);
                    }
                }

                //now add a triangle using any non duplicated edges together with our new point.
                Edges.Sort(Edge.Comparison);
                for (int j = 0; j < Edges.Count(); j++)
                {
                    if (j != Edges.Count() - 1 && Edges[j] == Edges[j + 1])
                    {
                        //this edge is a duplicate, do nothing.
                        j++; //we'll skip the next one which is a duplicate too.
                        continue;
                    }

                    surf.AddFace(Edges[j].I, Edges[j].J, i, inside);
                }
            }
        }
    }
}
