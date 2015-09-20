using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace conformer
{


    class Program
    {
        private static Random r = new Random();

        static void Main(string[] args)
        {
            if (args.Count<string>() != 2)
            {
                System.Console.Write("Usage: conformer.exe <input image> <output net>\n");
                return;
            }

            Net net = new Net(63);
            ConformShapes shaper = new ConformShapes(net,
                //ConformShapeType.Bitmap2Rectangle, args[0], 1.0);
                //ConformShapeType.Bitmap2Circle, args[0]);
                //ConformShapeType.Diamond2Lens);
                //ConformShapeType.Triangle2Rouleaux);
                //ConformShapeType.Hexagon2Circle);
                //ConformShapeType.Square2Paralellogram);
                //ConformShapeType.Parallelogram2Square);
                //ConformShapeType.Triangle, Math.Sqrt(3.0));
                //ConformShapeType.Square2Circle);
                //ConformShapeType.Square2Rectangle, 2.0);
                ConformShapeType.HalfCross2Circle1);
                //ConformShapeType.Square2Heart);
                //ConformShapeType.Square2Oval);
                //ConformShapeType.HyperbolizeExample);
                //ConformShapeType.XtoCircle);
                //ConformShapeType.Square2Triangle);
            net = shaper.ApplyShape();

            char ch = 's';
            double oldenergy = net.Energy;
            bool bHillClimb = false;
            net.Save();
            while (ch != 'q')
            {
                System.Console.Write( ch.ToString() + "; " + oldenergy.ToString() + "; (" + net.Size.ToString() + "x" + net.Size.ToString() + "); " + net.Count.ToString() + " pts\n");
                for (long i = 0; i < 10000; i++)
                {
                    int col = r.Next(net.Size);
                    int row = r.Next(net.Size);
                    switch (ch)
                    {
                        case 'q': break;
                        case 'h': bHillClimb = !bHillClimb; ch = 's'; break;
                        case 'H': bHillClimb = !bHillClimb; ch = 'j'; break;
                        case 'E': if (net[col, row] != null) net[col, row].Stretch(true); break;
                        case 'e': if (net[col, row] != null) net[col, row].Stretch(false); break;
                        case 'j': if (net[col, row] != null) net[col, row].Jitter(1.0 / 50); break;
                        case 's': if (net[col, row] != null) net[col, row].Step(); break;
                        case 'w': net.Write(args[1], false); ch = 's'; break;
                        case 'd': net.DoubleResolution(); shaper.ApplyShape(); ch = 'w'; break;
                        default: ch = 's'; break;
                    }
                }

                if( bHillClimb )
                {
                    double newenergy = net.Energy;
                    if (newenergy > oldenergy)
                        net.Restore();
                }

                net.Save();
                oldenergy = net.Energy;
                if (System.Console.KeyAvailable) ch = System.Console.ReadKey().KeyChar;
            }

            net.Write(args[1], true);
        }
    }
}
