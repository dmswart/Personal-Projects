using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;

namespace TSPtoSTL
{
    public class Tour : Surface
    {
        private class MitreInfo
        {
            private bool mbNoMitre;
            private bool mbDegenerateForward;
            private bool mbDegenerateBackward;

            private Point3D mQ;  //center point
            private Point3D mA;  //inside point
            private Point3D mB;  //incoming outside edge
            private Point3D mC;  //outgoing outside edge
            private double ml;   //half line width

            public MitreInfo(Point3D P, Point3D Qin, Point3D R, double HalfLineWidth)
            {
                //Mitre info is stored at the surface.
                mbNoMitre = false;
                mbDegenerateForward = false;
                mbDegenerateBackward = false;
                mQ = Qin.Normalized;
                ml = HalfLineWidth / Qin.R;
                double angle = Point3D.DihedralAngle(P, Qin, R);

                if (angle < Math.PI - 0.1 &&
                    angle > 0.1)
                {
                    mA = ((R - Qin).Normalized + (P - Qin).Normalized) / 2.0 + mQ;
                    mA.Normalize();
                    mA -= mQ;
                    mA.R = ml / Math.Sin(angle / 2.0);

                    mB = Point3D.Cross(Qin, Qin - P);
                    mB.R = l;
                    if (Point3D.Dot(mB, Qin - R) < 0) mB = -mB;

                    mC = Point3D.Cross(Qin, Qin - R);
                    mC.R = ml;
                    if (Point3D.Dot(mC, Qin - P) < 0) mC = -mC;

                    mA += mQ;
                    mB += mQ;
                    mC += mQ;
                    mA.Normalize();
                    mB.Normalize();
                    mC.Normalize();
                }
                else
                {
                    mA = Point3D.Cross(Qin, Qin - R);
                    mA.R = ml;
                    mB = -mA;
                    mbNoMitre = true;

                    mA += mQ;
                    mB += mQ;
                    mA.Normalize();
                    mB.Normalize();
                }

                if ((mA - mB).R > (R.Normalized - mQ).R )
                    mbDegenerateForward = true;
                if ((mA - mB).R > (P.Normalized - mQ).R)
                    mbDegenerateBackward = true;
            }

            public bool bNoMitre { get { return mbNoMitre; } }

            public bool bDegenerateForward { get { return mbDegenerateForward; } }
            public bool bDegenerateBackward { get { return mbDegenerateBackward; } }
            public bool bDegenerateBoth { get { return mbDegenerateBackward && mbDegenerateForward; } }
            public bool bDegenerate { get { return mbDegenerateBackward || mbDegenerateForward; } }

            public Point3D Q { get { return new Point3D(mQ); } }
            public Point3D A { get { return new Point3D(mA); } }
            public Point3D B { get { return new Point3D(mB); } }
            public Point3D C { get { return mbNoMitre ? B : new Point3D(mC); } }
            public double l { get { return ml; } }
        }

        private double mHalfLineWidth;
        private double mHalfLineHeight;
        private double mRadius;
        private List<MitreInfo> mMitres;

        public Tour(string Filename, double Radius, double HalfLineWidth, double HalfLineHeight)
        {
            mRadius = Radius;
            mHalfLineWidth = HalfLineWidth;
            mHalfLineHeight = HalfLineHeight;

            /*
             * Read in Tour 
             */
            List<Point3D> TourPoints = new List<Point3D>();
            StreamReader sr = new StreamReader(Filename);
            while (!sr.EndOfStream)
            {
                string LineIn = sr.ReadLine();
                char[] comma = { ',' };
                string[] StringsIn = LineIn.Split(comma);
                if (StringsIn.Count<string>() < 3) continue;

                TourPoints.Add(new Point3D(double.Parse(StringsIn[0]),
                                            double.Parse(StringsIn[1]),
                                            double.Parse(StringsIn[2])).ScaledTo(mRadius));
            }
            sr.Close();


            //build the mitres:
            mMitres = new List<MitreInfo>();
            int prev = -1;
            int next = 1;
            int current = 0;
            while (current < TourPoints.Count )
            {
                MitreInfo NewMitre = null;
                
                while (NewMitre == null || NewMitre.bDegenerate)
                {
                    if( NewMitre != null )
                    {
                        if( NewMitre.bDegenerateBoth )
                        {
                            //both sides bad, delete this one.
                            NewMitre = null;
                            current = next;
                            next++;
                        }
                        else if( NewMitre.bDegenerateBackward )
                        {
                            mMitres.Remove(mMitres.Last());
                            prev--;
                        }
                        else // NewMitre.bDegenerateForward
                        {
                            next++;
                        }
                    }
                    NewMitre = new MitreInfo(TourPoints[(prev + TourPoints.Count) % TourPoints.Count],
                                              TourPoints[current],
                                              TourPoints[next % TourPoints.Count],
                                              HalfLineWidth);
                }
                mMitres.Add(NewMitre);

                prev = current;
                current = next;
                next++;
            }


            /*
             * add points and faces.
             */
            for (current = 0; current < mMitres.Count; current++)
            {
                next = (current + 1) % mMitres.Count;
                AddMitre(mMitres[current]);
                AddEdge(mMitres[current], mMitres[next]);
            }
        }

        private void AddMitre(MitreInfo Mitre)
        {
            if (Mitre.bNoMitre)
                return;

            int idxbase = mPts.Count;
            double angle = Point3D.DihedralAngle(Mitre.B, Mitre.Q, Mitre.C);
            int count = (int)(angle * 180.0 / Math.PI / 20.0);
            if (count < 1)
                count = 1;
            Point3D newpt;
            for (int i = 0; i <= count; i++)
            {
                newpt = i * (Mitre.B - Mitre.Q) + (count - i) * (Mitre.C - Mitre.Q);
                newpt.R = (Mitre.B - Mitre.Q).R;
                newpt += Mitre.Q;
                newpt.R = mRadius + mHalfLineHeight;
                AddPoint(newpt);
                AddPoint(newpt.ScaledTo(mRadius - mHalfLineHeight));
            }
            newpt = Mitre.A;
            newpt.R = mRadius + mHalfLineHeight;
            AddPoint(newpt);
            AddPoint(newpt.ScaledTo(mRadius - mHalfLineHeight));

            // vertices from B to C is at idxbase+n*2, for N = 0..count
            // vertices from B' to C' is at idxbase+n*2+1 for N=0..count
            // vertex A is at idxbase+2*count+2
            // vertex A' is at idxbase+2*count+3
            Point3D inside = Mitre.Q.ScaledTo(mRadius);
            for (int n = 0; n < count; n++)
            {
                AddFace(idxbase + n * 2, idxbase + (n + 1) * 2, idxbase + count * 2 + 2, inside);  //N,N+1,A
                AddFace(idxbase + n * 2 + 1, idxbase + (n + 1) * 2 + 1, idxbase + count * 2 + 3, inside);  //N',N'+1,A'
                AddFace(idxbase + n * 2, idxbase + (n + 1) * 2, idxbase + n * 2 + 1, inside); //N, N+1, N'
                AddFace(idxbase + (n + 1) * 2, idxbase + n * 2 + 1, idxbase + (n + 1) * 2 + 1, inside); //N+1, N', N' + 1
            }
        }

        private void AddEdge(MitreInfo Start, MitreInfo End)
        {
            //new variables for manipulation and reorganizing, A is the start, B is the end Left and Right really have no meaning other than to distinguish sides
            Point3D SL = Start.A;  //StartLeft
            Point3D SR = Start.C;  //StartRight
            Point3D EL = End.A;    //EndLeft
            Point3D ER = End.B;    //EndRight

            //swap the End if necessary
            if ((SL - EL).R + (SR - ER).R >
                (SL - ER).R + (SR - EL).R)
            {
                EL = End.B;
                ER = End.A;
            }


            //minangle that each step sweeps out ensures that the (sphere height) above the middle of a face doesn't dip below 99% of the height at the face edge.
            double minangle = 2.0 * Math.Acos((mRadius + 0.99 * mHalfLineHeight) / (mRadius + mHalfLineHeight));

            //from this we calculate how many steps this edge will take.
            int count = (int)(Math.Max(Point3D.Angle(SL, Point3D.Origin, EL),
                                       Point3D.Angle(SR, Point3D.Origin, ER)) /
                              minangle +
                              0.5);
            if (count == 0) count = 1;

            //prepare for laying down the points and triangles.
            int idxbase = mPts.Count;



            for (int n = 0; n <= count; n++)
            {
                //add the next 4 pts: NL, N'L, NR, N'R
                Point3D newpt = (count - n) * SL + n * EL;
                newpt.R = mRadius + mHalfLineHeight;
                AddPoint(newpt);
                AddPoint(newpt.ScaledTo(mRadius - mHalfLineHeight));

                newpt = (count - n) * SR + n * ER;
                newpt.R = mRadius + mHalfLineHeight;
                AddPoint(newpt);
                AddPoint(newpt.ScaledTo(mRadius - mHalfLineHeight));
            }

            //pts from SL to EL are idxbase + N*4 for for N = 0..count
            //pts from S'L to E'L are idxbase + N*4+1 for for N = 0..count
            //pts from SR to ER are idxbase + N*4+2 for for N = 0..count
            //pts from S'R to E'R are idxbase + N*4+3 for for N = 0..count
            for (int n = 0; n < count; n++)
            {
                Point3D inside = (mPts[idxbase + n * 4] + mPts[idxbase+n*4+2]).ScaledTo(mRadius); 

                AddFace(idxbase + (n + 1) * 4, idxbase + n * 4 + 1, idxbase + n * 4, inside); //N+1L, N'L, NL,
                AddFace(idxbase + (n + 1) * 4, idxbase + n * 4 + 1, idxbase + (n + 1) * 4 + 1, inside); //N+1L, N'L, N+1'L

                AddFace(idxbase + (n + 1) * 4 + 2, idxbase + n * 4 + 3, idxbase + n * 4 + 2, inside); //N+1R, N'R, NR
                AddFace(idxbase + (n + 1) * 4 + 2, idxbase + n * 4 + 3, idxbase + (n + 1) * 4 + 3, inside); //N+1R, N'R, N+1'R

                AddFace(idxbase + (n + 1) * 4, idxbase + n * 4 + 2, idxbase + n * 4, inside); //N+1L, NR, NL
                AddFace(idxbase + (n + 1) * 4, idxbase + n * 4 + 2, idxbase + (n + 1) * 4 + 2, inside); //N+1L, NR, N+1R

                AddFace(idxbase + (n + 1) * 4 + 1, idxbase + n * 4 + 3, idxbase + n * 4 + 1, inside); //N+1'L, N'R, N'L
                AddFace(idxbase + (n + 1) * 4 + 1, idxbase + n * 4 + 3, idxbase + (n + 1) * 4 + 3, inside); //N+1'L, N'R, N+1'R
            }
        }

        public void AddCenterOfGravity()
        {
            Point3D cov = new Point3D();

            foreach (MitreInfo mi in mMitres)
            {
                cov += mi.Q;
            }
            cov /= mMitres.Count();
            cov.Z = 1.0 - Math.Sqrt(cov.X * cov.X + cov.Y * cov.Y);
            cov.R = mRadius;

            Sphere newsphere = new Sphere(2.0 * Math.Sqrt(mHalfLineHeight * mHalfLineHeight + mHalfLineWidth * mHalfLineWidth), 2, true);
            newsphere.Offset(cov);
            AddSurface(newsphere);
        }
    }
}
