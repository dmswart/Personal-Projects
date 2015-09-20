using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace DMSLib
{
    public class Triangle
    {
        private int _i;
        private int _j;
        private int _k;
        public Triangle(int i, int j, int k)
        {
            _i = i;
            _j = j;
            _k = k;
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
        public int K
        {
            get { return _k; }
            set { _k = value; }
        }


        public void Reverse()
        {
            int tmp = _j;
            _j = _k;
            _k = tmp;
        }

        public void Offset(int n)
        {
            _i += n;
            _j += n;
            _k += n;
        }

        /// <summary>
        /// compares two triangles A and B
        /// </summary>
        /// <param name="A"></param>
        /// <param name="B"></param>
        /// <returns>-1 if A < B, 0 if A = B, 1 if A > B </returns>
        static public int Compare(Triangle A, Triangle B)
        {
            int tmp;
            int AMin = A.I;
            int AMid = A.J;
            int AMax = A.K;
            if (AMin > AMid) { tmp = AMin; AMin = AMid; AMid = tmp; }
            if (AMid > AMax) { tmp = AMid; AMid = AMax; AMax = tmp; }
            if (AMin > AMid) { tmp = AMin; AMin = AMid; AMid = tmp; }

            int BMin = B.I;
            int BMid = B.J;
            int BMax = B.K;
            if (BMin > BMid) { tmp = BMin; BMin = BMid; BMid = tmp; }
            if (BMid > BMax) { tmp = BMid; BMid = BMax; BMax = tmp; }
            if (BMin > BMid) { tmp = BMin; BMin = BMid; BMid = tmp; }

            if (AMin < BMin)
                return -1;
            else if (AMin > BMin)
                return 1;
            else if (AMid < BMid)
                return -1;
            else if (AMid > BMid)
                return 1;
            else if (AMax < BMax)
                return -1;
            else if (AMax > BMax)
                return 1;
            else
                return 0;
        }
    }

    public class Surface
    {
        protected List<Point3D> mPts = new List<Point3D>();
        protected List<Triangle> mFaces = new List<Triangle>();

        #region Points
        public virtual int AddPoint(Point3D pt)
        {
            mPts.Add(pt);
            return mPts.Count - 1;
        }

        public int NumPoints
        {
            get { return mPts.Count(); }
        }

        public Point3D Point(int n)
        {
            if (n >= mPts.Count())
                return null;
            return mPts[n];
        }
        #endregion

        #region Faces

        public Point3D FaceNormal(int i)
        {
            return Point3D.Cross(mPts[mFaces[i].J] - mPts[mFaces[i].I], mPts[mFaces[i].K] - mPts[mFaces[i].J]).Normalized;
        }

        public virtual int AddFace(int i, int j, int k)
        {
            mFaces.Add(new Triangle(i, j, k));
            return mFaces.Count - 1;
        }

        public int AddFace(int i, int j, int k, Point3D center)
        {
            Triangle newTriangle = new Triangle(i, j, k);
            mFaces.Add(newTriangle);
            Fix(mFaces.Count - 1, center);
            return mFaces.Count - 1;
        }

        public int NumFaces
        {
            get { return mFaces.Count(); }
        }

        public Triangle Face(int n)
        {
            if (n >= mFaces.Count())
                return null;
            return mFaces[n];
        }

        public void RemoveFace(int n)
        {
            if (n < mFaces.Count())
                mFaces.RemoveAt(n);
        }
        #endregion

        public void Offset(Point3D offset)
        {
            for( int i=0; i<mPts.Count(); i++ )
            {
                mPts[i] += offset;
            }
        }
        public void AddSurface(Surface s2)
        {
            int nFaces = mFaces.Count;
            int nPoints = mPts.Count;
            mFaces.AddRange(s2.mFaces);
            mPts.AddRange(s2.mPts);
            for (int i = nFaces; i < mFaces.Count; i++)
            {
                mFaces[i].Offset(nPoints);
            }
        }

        private void Fix(int nTriangle, Point3D center)
        {
            Triangle tri = mFaces[nTriangle];
            Point3D vec1 = mPts[tri.I] - mPts[tri.J];
            Point3D vec2 = mPts[tri.K] - mPts[tri.J];
            if (Point3D.Dot(Point3D.Cross(vec1, vec2), mPts[tri.J] - center) > 0)
            {
                tri.Reverse();
            }
        }

        private string OutputTriangle(int nTriangle, double Scale)
        {
            Triangle tri = mFaces[nTriangle];
            Point3D norm = Point3D.Cross(mPts[tri.J] - mPts[tri.I], mPts[tri.K] - mPts[tri.J]).Normalized;
            return "  facet normal " + norm.X.ToString() + " " +
                                       norm.Y.ToString() + " " +
                                       norm.Z.ToString() + "\n" +
                   "    outer loop\n" +
                   "      vertex " + (mPts[tri.I] * Scale).X.ToString() + " " +
                                     (mPts[tri.I] * Scale).Y.ToString() + " " +
                                     (mPts[tri.I] * Scale).Z.ToString() + "\n" +
                   "      vertex " + (mPts[tri.J] * Scale).X.ToString() + " " +
                                     (mPts[tri.J] * Scale).Y.ToString() + " " +
                                     (mPts[tri.J] * Scale).Z.ToString() + "\n" +
                   "      vertex " + (mPts[tri.K] * Scale).X.ToString() + " " +
                                     (mPts[tri.K] * Scale).Y.ToString() + " " +
                                     (mPts[tri.K] * Scale).Z.ToString() + "\n" +
                   "    endloop\n" +
                   "  endfacet\n";
        }

        public void Output(StreamWriter sw, double Scale)
        {
            for (int nFace = 0; nFace < mFaces.Count(); nFace++)
            {
                if (nFace % 1000 == 0)
                    Console.Write("Writing face " + nFace + " of " + mFaces.Count() + "    \r");
                sw.Write(OutputTriangle(nFace, Scale));
            }
            Console.WriteLine("Done                                     ");
        }
    }

    public class Sphere : Surface
    {
        public Sphere(double Radius, int nSubs, bool bOutward)
        {
            AddPoint(Point3D.Origin); //0

            const double phi = 1.618033989;

            //icosahedron vertices
            AddPoint(new Point3D(1, phi, 0));  //1
            AddPoint(new Point3D(-1, phi, 0)); //2
            AddPoint(new Point3D(1, -phi, 0)); //3
            AddPoint(new Point3D(-1, -phi, 0));//4
            AddPoint(new Point3D(0, 1, phi));  //5
            AddPoint(new Point3D(0, -1, phi)); //6
            AddPoint(new Point3D(0, 1, -phi)); //7
            AddPoint(new Point3D(0, -1, -phi));//8
            AddPoint(new Point3D(phi, 0, 1));  //9
            AddPoint(new Point3D(phi, 0, -1)); //10
            AddPoint(new Point3D(-phi, 0, 1)); //11
            AddPoint(new Point3D(-phi, 0, -1));//12
            foreach (Point3D p in mPts)
                p.R = Radius;

            //icosahedron faces
            AddFace(1, 2, 5, Point3D.Origin);
            AddFace(1, 2, 7, Point3D.Origin);
            AddFace(3, 4, 6, Point3D.Origin);
            AddFace(3, 4, 8, Point3D.Origin);
            AddFace(5, 6, 9, Point3D.Origin);
            AddFace(5, 6, 11, Point3D.Origin);
            AddFace(7, 8, 10, Point3D.Origin);
            AddFace(7, 8, 12, Point3D.Origin);
            AddFace(9, 10, 1, Point3D.Origin);
            AddFace(9, 10, 3, Point3D.Origin);
            AddFace(11, 12, 2, Point3D.Origin);
            AddFace(11, 12, 4, Point3D.Origin);
            AddFace(1, 5, 9, Point3D.Origin);
            AddFace(1, 7, 10, Point3D.Origin);
            AddFace(3, 6, 9, Point3D.Origin);
            AddFace(3, 8, 10, Point3D.Origin);
            AddFace(2, 5, 11, Point3D.Origin);
            AddFace(2, 7, 12, Point3D.Origin);
            AddFace(4, 6, 11, Point3D.Origin);
            AddFace(4, 8, 12, Point3D.Origin);


            if (!bOutward)
            {
                foreach (Triangle t in mFaces)
                    t.Reverse();
            }

            for (int i = 0; i < nSubs; i++)
            {
                List<Triangle> NewSphereFaces = new List<Triangle>();
                foreach (Triangle t in mFaces)
                {
                    int ik, jk, ij;

                    ij = AddPoint((mPts[t.I] + mPts[t.J]).ScaledTo(Radius));
                    ik = AddPoint((mPts[t.I] + mPts[t.K]).ScaledTo(Radius));
                    jk = AddPoint((mPts[t.J] + mPts[t.K]).ScaledTo(Radius));

                    NewSphereFaces.Add(new Triangle(t.I, ij, ik));
                    NewSphereFaces.Add(new Triangle(t.J, jk, ij));
                    NewSphereFaces.Add(new Triangle(t.K, ik, jk));
                    NewSphereFaces.Add(new Triangle(ij, jk, ik));
                }
                mFaces = NewSphereFaces;
            }

        }
    }

    public class Torus : Surface
    {
        /// <summary>
        /// create a torus surface
        /// </summary>
        /// <param name="RingR">distance from the center of the tube to the origin</param>
        /// <param name="TubeR">radius of the tube</param>
        /// <param name="subdivisions">controls how fine the polygonal mesh is</param>
        public Torus(double RingR, double TubeR, int subdivisions)
        {
            int numRingSegments = (int)Math.Truncate( Math.PI * RingR / TubeR);
            double RingSegmentAngle = Math.PI * 2.0 / numRingSegments;
            Point3D Offset = new Point3D(RingR, 0, 0); //offset down positive x axis.
            
            //add initial points
            for (double RingTheta = 0; RingTheta <= 2.0 * Math.PI - DMS.EPSILON; RingTheta += RingSegmentAngle)
            {
                for (double TubeTheta = 0; TubeTheta < 2.0 * Math.PI - DMS.EPSILON; TubeTheta += Math.PI / 3.0)
                {
                    //tube cross section on x,z plane around origin
                    Point3D newpt = new Point3D( TubeR * Math.Sin( TubeTheta ), 0, TubeR * Math.Cos( TubeTheta ) );
                    
                    //offset tube down +ve x axis
                    newpt += Offset;

                    //rotate around z axis 
                    newpt.Theta = RingTheta;

                    AddPoint(newpt);
                }
            }

            //add initial faces
            for (int i=0; i<numRingSegments; i++ )
            {
                for( int j=0; j<6; j++ )
                {
                    int IdxIJ = i * 6 + j;
                    int IdxIJp = i * 6 + ((j + 1) % 6);
                    int IdxIpJ = ((i + 1) % numRingSegments) * 6 + j;
                    int IdxIpJp = ((i + 1) % numRingSegments) * 6 + ((j + 1) % 6);
                    AddFace(IdxIJ, IdxIJp, IdxIpJ);
                    AddFace(IdxIpJp, IdxIpJ, IdxIJp);
                }
            }

            //now subdivide
            for (int i = 0; i < subdivisions; i++)
            {
                List<Triangle> NewSphereFaces = new List<Triangle>();
                foreach (Triangle t in mFaces)
                {
                    Point3D newpt;
                    Point3D TubeCenter;

                    //ij
                    newpt = (mPts[t.I] + mPts[t.J]) / 2.0;
                    TubeCenter = Point3D.FromCylindricalCoords(RingR, 0, newpt.Theta);
                    newpt = (newpt - TubeCenter).ScaledTo(TubeR) + TubeCenter;
                    int ij = AddPoint(newpt);

                    //ik
                    newpt = (mPts[t.I] + mPts[t.K]) / 2.0;
                    TubeCenter = Point3D.FromCylindricalCoords(RingR, 0, newpt.Theta);
                    newpt = (newpt - TubeCenter).ScaledTo(TubeR) + TubeCenter;
                    int ik = AddPoint(newpt);

                    //jk
                    newpt = (mPts[t.J] + mPts[t.K]) / 2.0;
                    TubeCenter = Point3D.FromCylindricalCoords(RingR, 0, newpt.Theta);
                    newpt = (newpt - TubeCenter).ScaledTo(TubeR) + TubeCenter;
                    int jk = AddPoint(newpt);


                    NewSphereFaces.Add(new Triangle(t.I, ij, ik));
                    NewSphereFaces.Add(new Triangle(t.J, jk, ij));
                    NewSphereFaces.Add(new Triangle(t.K, ik, jk));
                    NewSphereFaces.Add(new Triangle(ij, jk, ik));
                }
                mFaces = NewSphereFaces;
            }

        }
    }

    public class Cylinder : Surface
    {
        public Cylinder(Point3D Center, Point3D Direction, double Height, double Radius, int nPoints)
        {
            //create cylinder centered at 0, along z axis, with given length and radius.
            for (int i = 0; i < nPoints; i++)
            {
                AddPoint(Point3D.FromCylindricalCoords(Radius, Height / 2.0, Math.PI * 2.0 * ((double)i / nPoints)));
                AddPoint(Point3D.FromCylindricalCoords(Radius, -Height / 2.0, Math.PI * 2.0 * ((double)i / nPoints)));
            }
            AddPoint(new Point3D(0, 0, Height / 2.0));
            AddPoint(new Point3D(0, 0, -Height / 2.0));


            //add faces
            for (int i = 0; i < nPoints; i++)
            {
                int next = (i + 1) % nPoints;
                AddFace(nPoints, i * 2, next * 2, Point3D.Origin);
                AddFace(nPoints + 1, i * 2 + 1, next * 2 + 1, Point3D.Origin);
                AddFace(next * 2, i * 2 + 1, i * 2, Point3D.Origin);
                AddFace(next * 2, i * 2 + 1, next * 2 + 1, Point3D.Origin);
            }

            if (Radius < 0)
            {
                foreach (Triangle tri in mFaces)
                    tri.Reverse();
            }

            //transform points
            if (Direction.R > DMS.EPSILON && Direction.Phi > DMS.EPSILON)
            {
                Rotation rot = new Rotation(Direction.Normalized.Phi,
                                             new Point3D(-Direction.Y, Direction.X, 0));
                for (int i = 0; i < mPts.Count(); i++)
                {
                    mPts[i] = rot.Rotate(mPts[i]);
                }
            }

            //add offset
            for (int i = 0; i < mPts.Count(); i++)
            {
                mPts[i] += Center;
            }
        }
    }

    public class UniqueFaces : Surface
    {
        private kdtree PointsKD = new kdtree();
        public UniqueFaces() : base() { }

        public override int AddPoint( Point3D pt )
        {
            int idx = PointsKD.Find(pt);
            if (idx != -1)
                return idx;

            idx = base.AddPoint(pt);
            PointsKD.Insert(pt, idx);
            return idx;
        }

        public override int AddFace(int i, int j, int k)
        {            
            if( mFaces.Count() == 0 )
                return base.AddFace(i, j, k);

            Triangle newT = new Triangle(i,j,k);

            int lo = 0;
            int hi = mFaces.Count() -1;

            // Initial tests.
            int comp = Triangle.Compare( newT, mFaces[hi] );
            if (comp == 0)
            {
                mFaces.RemoveAt(hi);
                return -1;
            }
            else if (comp == 1) //greater than, add to end
            {
                mFaces.Add(newT);
                return hi + 1;
            }
            comp = Triangle.Compare(newT, mFaces[lo]);
            if (comp == 0)
            {
                mFaces.RemoveAt(lo);
                return -1;
            }
            else if (comp == -1)
            {
                mFaces.Insert(lo, newT);
                return lo;
            }


            while (hi - lo > 1)
            {
                int mid = (hi + lo) / 2;
                comp = Triangle.Compare(newT, mFaces[mid]);
                if (comp == -1)
                    hi = mid;
                else if (comp == 1)
                    lo = mid;
                else
                {
                    mFaces.RemoveAt(mid);
                    return -1;
                }
            }

            //didn't find it, insert it at hi
            mFaces.Insert(hi, newT);
            return hi;
        }
    }
}
