using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;

namespace EQtoSTL
{

    class PanoSurface : Surface
    {
        const double SLS_RESOLUTION = 0.2;
        double mWhiteRadius;
        double mBlackRadius;
        DMSImage mPano;


        private double target(Point3D pos)
        {
            double greyscale = mPano.GetSpherePixel( pos ).GetBrightness();
            return mBlackRadius + greyscale * (mWhiteRadius - mBlackRadius);
        }

        private double EvaluateTriangle(Point3D A, Point3D B, Point3D C)
        {
            double result = 0.0;

            if ((A.ScaledTo(mWhiteRadius) - B.ScaledTo(mWhiteRadius)).R < SLS_RESOLUTION)
            {
                //BASE CASE
                Point3D center = (A+B+C) / 3.0;
                result = center.R - target(A + B + C);
                result = -Math.Abs(result);
            }
            else
            {
                //RECURSION STEP
                Point3D AB = (A + B) * 0.5;
                Point3D BC = (B + C) * 0.5;
                Point3D AC = (A + C) * 0.5;

                result += Math.Abs(EvaluateTriangle(A, AB, AC));
                result += Math.Abs(EvaluateTriangle(B, AB, BC));
                result += Math.Abs(EvaluateTriangle(C, BC, AC));
                result += Math.Abs(EvaluateTriangle(AB, AC, BC));
            }


            return result;
        }

        private class DoubleIntPair
        {
            public DoubleIntPair(double _d, int _i) { d = _d; i = _i; }
            public double d { get; set; }
            public int i { get; set; }
        }

        private static void AddDIPairToList(List<DoubleIntPair> dilist, DoubleIntPair dipair)
        {
            if (dilist.Count == 0 ||
                dilist.Last().d < dipair.d)
            {
                dilist.Add(dipair);
                return;
            }
            else if (dilist.First().d > dipair.d)
            {
                dilist.Insert(0, dipair);
                return;
            }

            int hi = dilist.Count() - 1;
            int lo = 0;
            int mid;

            while (hi - 1 > lo)
            {
                mid = (hi + lo) / 2;
                if (dipair.d > dilist[mid].d)
                    lo = mid;
                else
                    hi = mid;

            }
            dilist.Insert(hi, dipair);
        }

        public PanoSurface(double WhiteRadius, double BlackRadius, DMSImage pano, long numfaces)
        {
            mWhiteRadius = WhiteRadius;
            mBlackRadius = BlackRadius;
            mPano = pano;
            
            //create initial surface
            AddSurface(new Sphere(mWhiteRadius, 5, mWhiteRadius < mBlackRadius));

            //tweak each point's radius.
            for (int i = 0; i < NumPoints; i++)
            {
                Point(i).R = target(Point(i));
            }



            //go through and make a new list of faces with evaltriangles
            List<DoubleIntPair> EvalTriangles = new List<DoubleIntPair>();
            for (int i = 0; i < NumFaces; i++)
            {
                Console.Write("Calculating initial faces: " + i + "            \r");
                AddDIPairToList(EvalTriangles,
                                 new DoubleIntPair(EvaluateTriangle(Point(Face(i).I),
                                                                    Point(Face(i).J),
                                                                    Point(Face(i).K)),
                                                                    i));
            }
            Console.WriteLine();


            UniqueFaces HoleFiller = new UniqueFaces();

            int oldcount = 0;
            while (EvalTriangles.Count() + HoleFiller.NumFaces < numfaces &&
                   EvalTriangles.Last().d > 0.0)
            {
                if (EvalTriangles.Count() / 1000 != oldcount)
                {
                    Console.Write("Faces: " + (EvalTriangles.Count() + HoleFiller.NumFaces) + " MaxError: " + EvalTriangles.Last().d + "           \r");
                }
                oldcount = EvalTriangles.Count() / 1000;

                //take out the old one
                int nToSubdivide = EvalTriangles.Last().i;
                EvalTriangles.RemoveAt(EvalTriangles.Count() - 1);
                Triangle ToSubdivide = Face(nToSubdivide);

                //split up into four.
                Point3D I = Point(ToSubdivide.I);
                Point3D J = Point(ToSubdivide.J);
                Point3D K = Point(ToSubdivide.K);

                Point3D IJ = (I + J);
                Point3D IK = (I + K);
                Point3D JK = (J + K);
                IJ.R = target(IJ);
                IK.R = target(IK);
                JK.R = target(JK);
                int IJidx = AddPoint(IJ);
                int IKidx = AddPoint(IK);
                int JKidx = AddPoint(JK);
                int Faceidx = AddFace(ToSubdivide.I, IJidx, IKidx);
                AddFace(ToSubdivide.J, JKidx, IJidx);
                AddFace(ToSubdivide.K, IKidx, JKidx);
                AddFace(IJidx, JKidx, IKidx);

                AddDIPairToList(EvalTriangles, new DoubleIntPair(EvaluateTriangle(I, IJ, IK), Faceidx));
                AddDIPairToList(EvalTriangles, new DoubleIntPair(EvaluateTriangle(J, JK, IJ), Faceidx + 1));
                AddDIPairToList(EvalTriangles, new DoubleIntPair(EvaluateTriangle(K, IK, JK), Faceidx + 2));
                AddDIPairToList(EvalTriangles, new DoubleIntPair(EvaluateTriangle(IJ, JK, IK), Faceidx + 3));

                ToSubdivide.I = -1;   //to mark face for deletion.

                //now some triangles to plug up the hole.
                int Iidx = HoleFiller.AddPoint(I);
                int Jidx = HoleFiller.AddPoint(J);
                int Kidx = HoleFiller.AddPoint(K);
                IJidx = HoleFiller.AddPoint(IJ);
                IKidx = HoleFiller.AddPoint(IK);
                JKidx = HoleFiller.AddPoint(JK);
                HoleFiller.AddFace(Iidx, IKidx, Kidx);
                HoleFiller.AddFace(Iidx, Jidx, IJidx);
                HoleFiller.AddFace(Jidx, Kidx, JKidx);
            }
            Console.WriteLine();

            //remove bogus faces which were left in so as to not upset the face order.
            for (int i = NumFaces - 1; i >= 0; i--)
            {
                if (Face(i).I < 0)
                    RemoveFace(i);
            }

            //Add in the filler
            AddSurface(HoleFiller); //glue
        }
    }
}
