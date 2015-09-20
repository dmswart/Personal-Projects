using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using DMSLib;

namespace points2skeleton
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Count() < 2)
            {
                Console.WriteLine("Usage points2skeleton.exe input.csv output.skl [-d]\n    where -d signifies points (default is segments)");
                return;
            }

            List<Point3D> Path = new List<Point3D>();
            Stack<int> stack = new Stack<int>();

            StreamReader sr = new StreamReader(args[0]);
            StreamWriter sw = new StreamWriter(args[1]);

            bool bDots = false;
            if (args.Count() == 3 && args[2] == "-d")
                bDots = true;

            //get started if necessary
            if( bDots ) sw.WriteLine("l 0");

            while( !sr.EndOfStream )
            {
                //Read in a line and parse it.
                string LineIn = sr.ReadLine();
                string[] items = LineIn.Split(DMS.Delimiters);
                if (items.Count() > 0 && items[0].ToLower() == "push")
                {
                    sw.WriteLine("p 1");
                    stack.Push(Path.Count);
                    continue;
                }
                else if (items.Count() > 0 && items[0].ToLower() == "pop")
                {
                    sw.WriteLine("p -1");
                    int idx = stack.Pop();
                    Path.RemoveRange(idx, Path.Count - idx);
                    continue;
                }
                else if (items.Count() >= 3)
                {
                    try
                    {
                        Point3D newPoint = new Point3D(double.Parse(items[0]),
                                                       double.Parse(items[1]),
                                                       double.Parse(items[2]));
                        Path.Add(newPoint);
                    }
                    catch
                    {
                        continue;
                    }
                }
                else
                {
                    continue;
                }

                if( Path.Count < 2 ) continue;

                //do the step
                int i = Path.Count - 2;
                

                Point3D A, B, C;
                A = (i == 0) ? Path[i] + (Path[i] - Path[i + 1]) : Path[i - 1];
                B = Path[i];
                C = Path[i + 1];
                A.Normalize();
                B.Normalize();
                C.Normalize();

                //rotate from AB to BC
                double Turn = Math.PI - Point3D.DihedralAngle(A, B, C);
                if (Point3D.Dot(B, Point3D.Cross(A - B, B - C)) < 0)
                    Turn *= -1.0;
                sw.WriteLine("r " + (Turn / Math.PI).ToString());

                //draw line from B to C
                double Line = Point3D.Angle(B, Point3D.Origin, C);
                if (bDots)
                    sw.WriteLine("m " + (Line / Math.PI).ToString() + "\nl 0");
                else
                    sw.WriteLine("l " + (Line / Math.PI).ToString());
            }

            sw.Close();
        }
    }
}
