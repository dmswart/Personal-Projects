using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace conformer
{
    public enum ConformShapeType
    {
        FixFrame,
        Triangle,
        Square2Circle,
        Square2Heart,
        Bitmap2Circle,
        Bitmap2Rectangle,
        Diamond2Lens,
        Triangle2Rouleaux,
        Hexagon2Triangle,
        Hexagon2Circle,
        Square2Rectangle,
        Square2Oval,
        HalfCross2Circle1,
        HalfCross2Circle2,
        XtoCircle,
        HyperbolizeExample,
        Square2Triangle,
        Square2Parallelogram,
        Parallelogram2Square
    }


    public class ConformShapes
    {
        private Net m_net;
        private ConformShapeType m_type;
        private DMSImage m_mask;
        private bool m_bFirstPass;
        private double m_Ratio;

        #region constructors
        public ConformShapes(Net net)
        {
            m_net = net;
            m_type = ConformShapeType.FixFrame;
            m_mask = null;
            m_bFirstPass = true;
            m_Ratio = 1.0;
        }

        public ConformShapes(Net net, ConformShapeType type)
            : this(net)
        {
            m_type = type;
        }

        public ConformShapes(Net net, ConformShapeType type, double ratio)
            : this(net, type)
        {
            m_Ratio = ratio;
        }

        public ConformShapes(Net net, ConformShapeType type, String filename)
            : this(net, type)
        {
            m_mask = new DMSImage(filename);
        }

        public ConformShapes(Net net, ConformShapeType type, String filename, double ratio)
            : this(net, type)
        {
            m_mask = new DMSImage(filename);
            m_Ratio = ratio;
        }

        #endregion

        public Net ApplyShape()
        {
            //apply the alignment constraints
            switch (m_type)
            {
                case ConformShapeType.FixFrame:             FixFrame();             break;
                case ConformShapeType.Triangle:             Triangle();             break;
                case ConformShapeType.Square2Circle:        Square2Circle();        break;
                case ConformShapeType.Square2Heart:         Square2Heart();         break;
                case ConformShapeType.Bitmap2Circle:        Bitmap2Circle();        break;
                case ConformShapeType.Diamond2Lens:         Diamond2Lens();         break;
                case ConformShapeType.Triangle2Rouleaux:    Triangle2Rouleaux();    break;
                case ConformShapeType.Hexagon2Triangle:     Hexagon2Triangle();     break;
                case ConformShapeType.Bitmap2Rectangle:     Bitmap2Rectangle();     break;
                case ConformShapeType.Square2Rectangle:     Square2Rectangle();     break;
                case ConformShapeType.Square2Oval:          Square2Oval();          break;
                case ConformShapeType.Hexagon2Circle:       Hexagon2Circle();       break;
                case ConformShapeType.HalfCross2Circle1:    HalfCross2Circle1();    break;
                case ConformShapeType.HalfCross2Circle2:    HalfCross2Circle2();    break;
                case ConformShapeType.XtoCircle:            XtoCircle();            break;
                case ConformShapeType.HyperbolizeExample:   HyperbolizeExample();   break;
                case ConformShapeType.Square2Triangle:      Square2Triangle();      break;
                case ConformShapeType.Square2Parallelogram: Square2Parallelogram(); break;
                case ConformShapeType.Parallelogram2Square: Parallelogram2Square(); break;
				default: break;
            }

            m_net.SetNeighbors();
            m_bFirstPass = false;
            m_net.AlignAllPositions();

//            for( int i=0; i<m_net.Size; i++ ) for(int j=0; j<m_net.Size;j++) if(m_net[i,j]!=null) if( m_net[i,j].Position == Point2D.Origin)
//                            m_net[i, j].Position += Point2D.Origin;

            return m_net;
        }


        #region Shaping Routines
        private void FixFrame()
        {
            Point2D BL = m_net[0, 0].Position;
            Point2D BR = m_net[m_net.Size - 1, 0].Position;
            Point2D TL = m_net[0, m_net.Size - 1].Position;
            Point2D TR = m_net[m_net.Size - 1, m_net.Size - 1].Position;

            //fix the edges
            for (int i = 0; i < m_net.Size; i++)
            {
                m_net[i, 0].Alignment = new AlignToSeg(BR, BR);
                m_net[0, i].Alignment = new AlignToSeg(BL, TL);
                m_net[m_net.Size - 1, i].Alignment = new AlignToSeg(BR, TR);
                m_net[i, m_net.Size - 1].Alignment = new AlignToSeg(TL, TR);
            }

            //fix the corners
            m_net[0, 0].Alignment = new AlignFixed(BL);
            m_net[0, m_net.Size - 1].Alignment = new AlignFixed(TL);
            m_net[m_net.Size - 1, 0].Alignment = new AlignFixed(BR);
            m_net[m_net.Size - 1, m_net.Size - 1].Alignment = new AlignFixed(TR);

        }

        //good to go
        private void Triangle()
        {
            Point2D BL = new Point2D(0.0, 0.0);
            Point2D BR = new Point2D(1.0, 0.0);
            Point2D TR = new Point2D(1.0, m_Ratio);
            int full = m_net.Size - 1;

            // erase points not in triangle
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (j > i)
                        m_net[i, j] = null;
                }
            }

            //constrain the sides
            for (int i = 0; i < m_net.Size; i++)
            {
                m_net[i, i].Alignment = new AlignToSeg(BL, TR);
                m_net[i, 0].Alignment = new AlignToSeg(BL, BR);
                m_net[full, i].Alignment = new AlignToSeg(BR, TR);
            }

            //fix the corners
            m_net[0, 0].Alignment = new AlignFixed(BL);
            m_net[full, 0].Alignment = new AlignFixed(BR);
            m_net[full, full].Alignment = new AlignFixed(TR);


            //setup initial position if first time
            if (m_bFirstPass)
            {
                for (int i = 0; i < m_net.Size; i++)
                {
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        if (m_net[i, j] != null)
                        {
                            m_net[i, j].Position /= (double)full;
                            m_net[i, j].Position.Y *= m_Ratio;
                        }
                    }
                }
            }
        }

        //good to go
        private void Square2Circle()
        {
            //center the square on the origin
            int full = m_net.Size - 1;
            int half = m_net.Size/2;

            //constrain verticle and horizontal lines
            Point2D N = new Point2D(0, 1);
            Point2D S = new Point2D(0, -1);
            Point2D E = new Point2D(1, 0);
            Point2D W = new Point2D(-1, 0);
            m_net.AlignEdge(m_net[half, full], m_net[half, 0], new AlignToSeg(N, S));
            m_net.AlignEdge(m_net[full, half], m_net[0, half], new AlignToSeg(E, W));

            //constrain diagonals
            Point2D NE = new Point2D(Math.Sqrt(0.5), Math.Sqrt(0.5));
            Point2D NW = new Point2D(Math.Sqrt(0.5), -Math.Sqrt(0.5));
            Point2D SE = new Point2D(-Math.Sqrt(0.5), Math.Sqrt(0.5));
            Point2D SW = new Point2D(-Math.Sqrt(0.5), -Math.Sqrt(0.5));
            m_net.AlignEdge(m_net[full, full], m_net[0, 0], new AlignToSeg(NE, SW));
            m_net.AlignEdge(m_net[full, 0], m_net[0, full], new AlignToSeg(NW, SE));


            //constrain specific points
            m_net[0, 0].Alignment = new AlignFixed(SW);
            m_net[full, full].Alignment = new AlignFixed(NE);
            m_net[full, 0].Alignment = new AlignFixed(NW);
            m_net[0, full].Alignment = new AlignFixed(SE);
            m_net[0, half].Alignment = new AlignFixed(W);
            m_net[half, 0].Alignment = new AlignFixed(S);
            m_net[full, half].Alignment = new AlignFixed(E);
            m_net[half, full].Alignment = new AlignFixed(N);
            m_net[half, half].Alignment = new AlignFixed(Point2D.Origin);

            //constrain to circle
            AlignToArc circle = new AlignToArc(Point2D.Origin, 1.0);
            m_net.AlignEdge(m_net[0, 0], m_net[full, 0], circle);
            m_net.AlignEdge(m_net[full, 0], m_net[full, full], circle);
            m_net.AlignEdge(m_net[full, full], m_net[0, full], circle);
            m_net.AlignEdge(m_net[0, full], m_net[0, 0], circle);


            //setup initial position if first time
            if (m_bFirstPass)
            {
                for (int i = 0; i < m_net.Size; i++)
                {
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        if (m_net[i, j] != null)
                        {
                            m_net[i, j].Position *= 2.0 / (double)full;
                            m_net[i, j].Position -= new Point2D(1.0, 1.0);
                        }
                    }
                }
            }
        }

        //will do in a pinch
        private void Square2Heart()
        {
            Point2D
                A = new Point2D(-2.0, 0),
                B = new Point2D(-1.0, 0),
                C = new Point2D(0, 0),
                D = new Point2D(1.0, 0),
                E = new Point2D(2.0, 0),
                F = new Point2D(-Math.Sqrt(2.0), -Math.Sqrt(2.0)),
                G = new Point2D(Math.Sqrt(2.0), -Math.Sqrt(2.0)),
                H = new Point2D(0, -2.0 * Math.Sqrt(2));

            Aligner HtoF = new AlignToSeg(H, F);
            Aligner HtoG = new AlignToSeg(H, G);
            Aligner FtoA = new AlignToArc(C, 2.0, A, F);
            Aligner EtoG = new AlignToArc(C, 2.0, G, E);
            Aligner AtoC = new AlignToArc(B, 1.0, C, A);
            Aligner CtoE = new AlignToArc(D, 1.0, E, C);

            AlignCombo Left = new AlignCombo();
            Left.AddAligner(HtoF);
            Left.AddAligner(FtoA);
            Left.AddAligner(AtoC);

            AlignCombo Right = new AlignCombo();
            Right.AddAligner(HtoG);
            Right.AddAligner(EtoG);
            Right.AddAligner(CtoE);


            m_net.AlignEdge(m_net[0, 0], m_net[m_net.Size - 1, m_net.Size - 1], new AlignToSeg(H, C));
            m_net.AlignEdge(m_net[0, 0], m_net[0, m_net.Size - 1], Left);
            m_net.AlignEdge(m_net[0, 0], m_net[m_net.Size - 1, 0], Right);

            int quarter = m_net.Size / 4;
            m_net.AlignEdge(m_net[0, m_net.Size - 1], m_net[quarter, m_net.Size - 1], Left);
            m_net.AlignEdge(m_net[m_net.Size - 1, 0], m_net[m_net.Size - 1, quarter], Right);
            for (int i = quarter; i < m_net.Size; i++)
            {
                double fraction = (double)(i - quarter) / (double)(m_net.Size - 1 - quarter);
                fraction *= Math.PI;
#if false //fix top arc
                m_net[i, m_net.Size - 1].Alignment = new AlignFixed(new Point2D(-1.0 - Math.Cos(fraction), Math.Sin(fraction)));
                m_net[m_net.Size - 1, i].Alignment = new AlignFixed(new Point2D(1.0 + Math.Cos(fraction), Math.Sin(fraction)));
#else //initialize position
                if (m_bFirstPass)
                {
                    m_net[i, m_net.Size - 1].Position = new Point2D(-1.0 - Math.Cos(fraction), Math.Sin(fraction));
                    m_net[m_net.Size - 1, i].Position = new Point2D(1.0 + Math.Cos(fraction), Math.Sin(fraction));
                }
#endif
            }
            //fix points
            m_net[0, 0].Alignment = new AlignFixed(H);
            m_net[m_net.Size - 1, m_net.Size - 1].Alignment = new AlignFixed(C);
        }

        //good to go
        private void Bitmap2Circle()
        {
            Aligner circle = new AlignToArc(Point2D.Origin, 1.0);
            double full = m_net.Size - 1;
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    Point2D pt = new Point2D(i, j) / full;
                    if (m_mask.GetPixel(pt).ToArgb() == Color.Black.ToArgb())
                        m_net[i, j] = null;
                }
            }
            m_net.SetNeighbors();


            //calculate center, and determine which points are edges.
            Point2D center = new Point2D();

            bool[,] isedge = new bool[m_net.Size, m_net.Size];
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    isedge[i, j] = false;

                    if (m_net[i, j] == null)
                        continue;

                    if (m_net[i, j].East == null ||
                        m_net[i, j].West == null ||
                        m_net[i, j].South == null ||
                        m_net[i, j].North == null)
                    {
                        isedge[i, j] = true;
                    }

                    center += m_net[i, j].Position;
                }
            }
            center /= m_net.Count;

            //fix edge points to circle 
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] == null)
                        continue;

                    if (isedge[i, j])
                        m_net[i, j].Alignment = circle;

                    if (m_bFirstPass)
                    {
                        m_net[i, j].Position -= center;
                        m_net[i, j].Position = m_net[i,j].Position / full;
                    }
                }
            }

        }

        //good to go
        private void Bitmap2Rectangle()
        {
            Bitmap2Circle();

            //create new aligner
            Point2D
                TL = new Point2D(-m_Ratio, 1),
                TR = new Point2D(m_Ratio, 1),
                BL = new Point2D(-m_Ratio, -1),
                BR = new Point2D(m_Ratio, -1);
            AlignCombo ToRectangle = new AlignCombo();
            ToRectangle.AddAligner(new AlignToSeg(TR, TL));
            ToRectangle.AddAligner(new AlignToSeg(BL, TL));
            ToRectangle.AddAligner(new AlignToSeg(BL, BR));
            ToRectangle.AddAligner(new AlignToSeg(TR, BR));

            //set alignment
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] == null) continue;
                    if (m_net[i, j].Alignment is AlignToArc)
                    {
                        m_net[i, j].Alignment = ToRectangle;
                    }
                }
            }
        }
        
        //good to go
        private void Diamond2Lens()
        {
            double Sqrt3 = Math.Sqrt(3.0);
            int full = (m_net.Size-1);
            int half = m_net.Size / 2;
            int left = (int)((double)m_net.Size * (Sqrt3 - 1.0) / (2.0 * Sqrt3)) + 1;
            int right = (int)((double)m_net.Size * (Sqrt3 + 1.0) / (2.0 * Sqrt3)) - 1;

            //zero out what we don't need
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] != null)
                    {
                        if ((double)i + (double)j / Sqrt3 < (double)full * 0.5 - DMS.EPSILON ||
                            (double)i + (double)j / Sqrt3 > (double)full * (0.5 + 1.0/Sqrt3) + DMS.EPSILON ||
                            (double)i - (double)j /Sqrt3 > (double)full * 0.5 + DMS.EPSILON ||
                            (double)i - (double)j / Sqrt3 < (double)full * (0.5 - 1.0/Sqrt3) - DMS.EPSILON)
                        {
                            m_net[i, j] = null;
                        }
                    }
                }
            }

            Point2D A = -Point2D.XAxis;
            Point2D B = new Point2D(0, 1.0 / Sqrt3);
            Point2D C = Point2D.XAxis;
            Point2D D = new Point2D(0, -1.0 / Sqrt3);
            Point2D E = Point2D.Origin;

            AlignToArc AlignTop = new AlignToArc(D, 2.0 / Sqrt3, C, A);
            AlignToArc AlignBottom = new AlignToArc(B, 2.0 / Sqrt3, A, C);

            m_net.SetNeighbors();

            //align arcs
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] != null)
                    {
                        if (m_net[i, j].North == null)
                            m_net[i, j].Alignment = AlignTop;
                        else if (m_net[i, j].South == null)
                            m_net[i, j].Alignment = AlignBottom;
                        else
                            m_net[i, j].Alignment = new Aligner(); //generic non-aligner
                    }
                }
            }

            //align horizontal, align vertical axes
            m_net.AlignEdge(m_net[half, 0], m_net[half, full], new AlignToSeg(B, D));
            m_net.AlignEdge(m_net[left, half], m_net[right, half], new AlignToSeg(A, C));

            //align points
            m_net[half, 0].Alignment = new AlignFixed(D);
            m_net[half, full].Alignment = new AlignFixed(B);
            m_net[left, half].Alignment = new AlignFixed(A);
            m_net[right, half].Alignment = new AlignFixed(C);
        }

        //good to go
        private void Triangle2Rouleaux()
        {
            if (m_bFirstPass)
            {
                m_net = new TriangularNet(m_net.Size);
            }

            double Sqrt3 = Math.Sqrt(3.0);
            int full = (m_net.Size - 1);
            int half = m_net.Size / 2;

            //zero out what we don't need
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] != null)
                    {
                        if ( i < j )
                        {
                            m_net[i, j] = null;
                        }
                    }
                }
            }

            Point2D A = new Point2D(0, 1.0 / Math.Sqrt(2.0));
            Point2D B = new Point2D(-Sqrt3 / (2.0 * Math.Sqrt(2.0)), -1.0 / (2.0 * Math.Sqrt(2.0)) );
            Point2D C = new Point2D(Sqrt3 / (2.0 * Math.Sqrt(2.0)), -1.0 / (2.0 * Math.Sqrt(2.0)) );
            double radius = (A - B).R;

            AlignToArc AlignAB = new AlignToArc(C, radius, A, B);
            AlignToArc AlignBC = new AlignToArc(A, radius, B, C);
            AlignToArc AlignAC = new AlignToArc(B, radius, C, A);

            m_net.SetNeighbors();

            //align arcs
            m_net.AlignEdge(m_net[full, full], m_net[full, 0], AlignAC);
            m_net.AlignEdge(m_net[0, 0], m_net[full, full], AlignAB);
            m_net.AlignEdge(m_net[0, 0], m_net[full, 0], AlignBC);

            //align points
            m_net[0, 0].Alignment = new AlignFixed(B);
            m_net[full, full].Alignment = new AlignFixed(A);
            m_net[full, 0].Alignment = new AlignFixed(C);
        }

        //good to go
        private void Hexagon2Circle()
        {
            int full = (m_net.Size - 1);
            int third = m_net.Size / 3;
            int twothirds = m_net.Size * 2 / 3;

            if (m_bFirstPass)
            {
                m_net = new TriangularNet(m_net.Size);
                for (int i = 0; i < m_net.Size; i++)
                {
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        if (m_net[i, j] != null)
                        {
                            m_net[i, j].Position *= 3.0 / m_net.Size;
                            m_net[i, j].Position += new Point2D(-2.0, -1.0);
                        }
                    }
                }
            }


            //zero out what we don't need
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] != null)
                    {
                        if (i < j ||           // remove top half of triangle
                            i < third ||       // clip one corner
                            j > twothirds ||    // clip second corner
                            i > j + twothirds ) // clip third corner
                        {
                            m_net[i, j] = null;
                        }
                    }
                }
            }

            m_net.SetNeighbors();

            //align arcs
            AlignToArc AlignToCircle = new AlignToArc(Point2D.Origin, 1.0);

            m_net.AlignEdge(m_net[twothirds, twothirds], m_net[full, twothirds], AlignToCircle);
            m_net.AlignEdge(m_net[full, twothirds], m_net[full, third], AlignToCircle);
            m_net.AlignEdge(m_net[full, third], m_net[twothirds, 0], AlignToCircle);
            m_net.AlignEdge(m_net[twothirds, 0], m_net[third, 0], AlignToCircle);
            m_net.AlignEdge(m_net[third, 0], m_net[third, third], AlignToCircle);
            m_net.AlignEdge(m_net[third, third], m_net[twothirds, twothirds], AlignToCircle);

            //Align Points
            m_net[full, third].Alignment = new AlignFixed( Point2D.FromPolar(1.0, 0.0 * Math.PI) );
            m_net[full, twothirds].Alignment = new AlignFixed( Point2D.FromPolar(1.0, (1.0/3.0) * Math.PI) );
            m_net[twothirds, twothirds].Alignment = new AlignFixed( Point2D.FromPolar(1.0, (2.0/3.0) * Math.PI) );
            m_net[third, third].Alignment = new AlignFixed( Point2D.FromPolar(1.0, Math.PI) );
            m_net[third, 0].Alignment = new AlignFixed( Point2D.FromPolar(1.0, (4.0/3.0) * Math.PI) );
            m_net[twothirds, 0].Alignment = new AlignFixed( Point2D.FromPolar(1.0, (5.0/3.0) * Math.PI) );
        }

        private void Hexagon2Triangle()
        {
            int full = (m_net.Size - 1);
            int onethird = m_net.Size / 3;
            int twothirds = m_net.Size * 2 / 3;


            Point2D pA = new Point2D(0, 0);
            Point2D pB = new Point2D(1.0, 0);
            Point2D pC = new Point2D(0.5, Math.Sqrt(3.0) / 2.0);
            Point2D pAB = (pA + pB) / 2.0;
            Point2D pBC = (pB + pC) / 2.0;
            Point2D pCA = (pC + pA) / 2.0;

            if (m_bFirstPass)
            {
                m_net = new TriangularNet(m_net.Size);
            }


            //zero out what we don't need
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] != null)
                    {
                        if (i < j ||           // remove top half of triangle
                            i < onethird ||       // clip one corner
                            j > twothirds ||    // clip second corner
                            i > j + twothirds) // clip third corner
                        {
                            m_net[i, j] = null;
                        }
                    }
                }
            }

            m_net.SetNeighbors();

            //align segs
            m_net.AlignEdge(m_net[onethird, 0], m_net[twothirds, 0], new AlignToSeg(pA, pAB));
            m_net.AlignEdge(m_net[twothirds, 0], m_net[full, onethird], new AlignToSeg(pAB, pB));
            m_net.AlignEdge(m_net[full, onethird], m_net[full, twothirds], new AlignToSeg(pB, pBC));
            m_net.AlignEdge(m_net[full, twothirds], m_net[twothirds, twothirds], new AlignToSeg(pBC, pC));
            m_net.AlignEdge(m_net[twothirds, twothirds], m_net[onethird, onethird], new AlignToSeg(pC, pCA));
            m_net.AlignEdge(m_net[onethird,onethird], m_net[onethird, 0], new AlignToSeg(pCA, pA));

            //Align Points
            m_net[onethird, 0].Alignment = new AlignFixed(pA);
            m_net[twothirds, 0].Alignment = new AlignFixed(pAB);
            m_net[full, onethird].Alignment = new AlignFixed(pB);
            m_net[full, twothirds].Alignment = new AlignFixed(pBC);
            m_net[twothirds, twothirds].Alignment = new AlignFixed(pC);
            m_net[onethird, onethird].Alignment = new AlignFixed(pCA);
        }               
 
        // good to go
        private void Square2Rectangle()
        {

            Point2D BL = new Point2D(0.0, 0.0);
            Point2D BR = new Point2D(1.0, 0.0);
            Point2D TR = new Point2D(1.0, m_Ratio);
            Point2D TL = new Point2D(0.0, m_Ratio);
            int full = m_net.Size - 1;

            //create aligner
            AlignCombo rectangle = new AlignCombo();
            rectangle.AddAligner(new AlignToSeg(TL, TR));
            rectangle.AddAligner(new AlignToSeg(BL, BR));
            rectangle.AddAligner(new AlignToSeg(TL, BL));
            rectangle.AddAligner(new AlignToSeg(BR, TR));

            //constrain the sides
            for (int i = 0; i < m_net.Size; i++)
            {
                m_net[i, full].Alignment = rectangle; //top
                m_net[i, 0].Alignment = rectangle; //bottom
                m_net[full, i].Alignment = rectangle; //right
                m_net[0, i].Alignment = rectangle; //left
            }

            //setup initial position if first time
            if (m_bFirstPass)
            {
                for (int i = 0; i < m_net.Size; i++)
                {
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        m_net[i, j].Position /= (double)full;
                        m_net[i, j].Position.Y *= m_Ratio;
                    }
                }
            }
        }

        // good to go
        private void Square2Oval()
        {
            Indicatrix
                TL = m_net[0, m_net.Size - 1],
                BL = m_net[0, 0],
                TR = m_net[m_net.Size - 1, m_net.Size - 1],
                BR = m_net[m_net.Size - 1, 0];
            Point2D
                posTL = new Point2D(-1, 1),
                posTR = new Point2D(1, 1),
                posBL = new Point2D(-1, -1),
                posBR = new Point2D(1, -1),
                center;

            double radius = Math.Sqrt(2);

            //adjust position if first time
            if( m_bFirstPass)
                for (int i = 0; i < m_net.Size; i++)
                    for (int j = 0; j < m_net.Size; j++)
                        m_net[i, j].Position = m_net[i, j].Position - new Point2D(m_net.Size/2, m_net.Size/2);


            AlignCombo perimeter = new AlignCombo();

            center = new Point2D(0, 1); //typically Point2D.Origin;
            radius = (center - posTL).R;
            perimeter.AddAligner(new AlignToArc(center, radius, posTR, posTL));
            center = new Point2D(0, -1); //typically Point2D.Origin;
            radius = (center - posBL).R;
            perimeter.AddAligner(new AlignToArc(center, radius, posBL, posBR));
            perimeter.AddAligner(new AlignToSeg(posTL, posBL));
            perimeter.AddAligner(new AlignToSeg(posTR, posBR));

            m_net.AlignEdge(TL, TR, perimeter);
            m_net.AlignEdge(BL, BR, perimeter);
            m_net.AlignEdge(TL, BL, perimeter);
            m_net.AlignEdge(TR, BR, perimeter);
        }

        // good to go
        private void HalfCross2Circle1()
        {
            int eighth = m_net.Size / 8;
            int quarter = m_net.Size / 4;
            int full = m_net.Size - 1;
            int half = m_net.Size / 2;
            int threequarters = 3 * quarter;
            int threeeighths = 3 * eighth;

            //null out pts
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (j >= half && j <= threequarters)
                    {
                        if (i > threeeighths) m_net[i, j] = null;
                    }
                    else if (i > eighth)
                    {
                        m_net[i, j] = null;
                    }
                }
            }


            //Set src pos.
            Indicatrix
                A = m_net[eighth, full],
                B = m_net[eighth, threequarters],
                C = m_net[threeeighths, threequarters],
                D = m_net[threeeighths, half],
                E = m_net[eighth, half],
                F = m_net[eighth, quarter],
                G = m_net[eighth, 0],
                H = m_net[0, 0],
                I = m_net[0, quarter],
                J = m_net[0, half],
                K = m_net[0, threequarters],
                L = m_net[0, full];

            double sqrt2 = Math.Sqrt(2.0);
            double sqrt3m1 = Math.Sqrt(3.0) - 1.0;
            double twosqrt2 = 2.0 * Math.Sqrt(2.0);
            Point2D
                pos1 = new Point2D(-sqrt2, sqrt2),
                pos2 = new Point2D(sqrt2, sqrt2),
                pos3 = new Point2D(sqrt2, -sqrt2),
                pos4 = new Point2D(-sqrt2, -sqrt2),
                pos5 = new Point2D(-sqrt3m1, sqrt3m1),
                pos6 = new Point2D(sqrt3m1, sqrt3m1),
                pos7 = new Point2D(sqrt3m1, -sqrt3m1),
                pos8 = new Point2D(-sqrt3m1, -sqrt3m1);

            m_net.AlignEdge(A, B, new AlignToArc(new Point2D(2.0, 0.0), twosqrt2, pos5, pos8));
            m_net.AlignEdge(B, C, new AlignToArc(new Point2D(2.0, 0.0), twosqrt2, pos5, pos8));
            m_net.AlignEdge(C, D, new AlignToArc(new Point2D(0.0, -2.0), twosqrt2, pos6, pos5));
            m_net.AlignEdge(D, E, new AlignToArc(new Point2D(-2.0, 0.0), twosqrt2, pos7, pos6));
            m_net.AlignEdge(E, F, new AlignToArc(new Point2D(-2.0, 0.0), twosqrt2, pos7, pos6));
            m_net.AlignEdge(F, G, new AlignToArc(new Point2D(0.0, -2.0), twosqrt2, pos6, pos5));

            m_net.AlignEdge(G, H, new AlignToSeg(pos1, pos5));
            m_net.AlignEdge(H, I, new AlignToArc(Point2D.Origin, 2.0, pos2, pos1));
            m_net.AlignEdge(I, J, new AlignToArc(Point2D.Origin, 2.0, pos3, pos2));
            m_net.AlignEdge(J, K, new AlignToArc(Point2D.Origin, 2.0, pos4, pos3));
            m_net.AlignEdge(K, L, new AlignToArc(Point2D.Origin, 2.0, pos1, pos4));
            m_net.AlignEdge(L, A, new AlignToSeg(pos1, pos5));

            A.Alignment =
            C.Alignment =
            G.Alignment = new AlignFixed(pos5);
            B.Alignment = new AlignFixed(pos8);
            D.Alignment =
            F.Alignment = new AlignFixed(pos6);
            E.Alignment = new AlignFixed(pos7);
            H.Alignment =
            L.Alignment = new AlignFixed(pos1);
            I.Alignment = new AlignFixed(pos2);
            J.Alignment = new AlignFixed(pos3);
            K.Alignment = new AlignFixed(pos4);
        }

        //good to go
        private void HalfCross2Circle2()
        {
            int eighth = m_net.Size / 8;
            int quarter = m_net.Size / 4;
            int full = m_net.Size - 1;
            int half = m_net.Size / 2;
            int threequarters = 3 * quarter;
            int threeeighths = 3 * eighth;

            //null out pts
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if ((i > threequarters || i < quarter) && (j > threequarters || j < quarter))
                    {
                        m_net[i, j] = null;
                    }
                }
            }


            //Set src pos.
            Indicatrix
                A = m_net[quarter, full],
                B = m_net[threequarters, full],
                C = m_net[threequarters, threequarters],
                D = m_net[full, threequarters],
                E = m_net[full, quarter],
                F = m_net[threequarters, quarter],
                G = m_net[threequarters, 0],
                H = m_net[quarter, 0],
                I = m_net[quarter, quarter],
                J = m_net[0, quarter],
                K = m_net[0, threequarters],
                L = m_net[quarter, threequarters];

            double sqrt2 = Math.Sqrt(2.0);
            double sqrt3m1 = Math.Sqrt(3.0) - 1.0;
            double twosqrt2 = 2.0 * Math.Sqrt(2.0);
            Point2D
                pos1 = new Point2D(-sqrt2, sqrt2),
                pos2 = new Point2D(sqrt2, sqrt2),
                pos3 = new Point2D(sqrt2, -sqrt2),
                pos4 = new Point2D(-sqrt2, -sqrt2),
                pos5 = new Point2D(-sqrt3m1, sqrt3m1),
                pos6 = new Point2D(sqrt3m1, sqrt3m1),
                pos7 = new Point2D(sqrt3m1, -sqrt3m1),
                pos8 = new Point2D(-sqrt3m1, -sqrt3m1);

            m_net.AlignEdge(m_net[0, half], m_net[full, half], new AlignToSeg(new Point2D(2, 0), new Point2D(-2, 0)));
            m_net.AlignEdge(m_net[half, 0], m_net[half, full], new AlignToSeg(new Point2D(0, 2), new Point2D(0, -2)));
            m_net.AlignEdge(C, I, new AlignToSeg(new Point2D(2, 2), new Point2D(-2, -2)));
            m_net.AlignEdge(F, L, new AlignToSeg(new Point2D(-2, 2), new Point2D(2, -2)));

            m_net.AlignEdge(A, B, new AlignToArc(Point2D.Origin, 2.0, pos2, pos1));
            m_net.AlignEdge(D, E, new AlignToArc(Point2D.Origin, 2.0, pos3, pos2));
            m_net.AlignEdge(G, H, new AlignToArc(Point2D.Origin, 2.0, pos4, pos3));
            m_net.AlignEdge(J, K, new AlignToArc(Point2D.Origin, 2.0, pos1, pos4));


            m_net.AlignEdge(L, A, new AlignToSeg(pos1, pos5));
            m_net.AlignEdge(B, C, new AlignToSeg(pos2, pos6));
            m_net.AlignEdge(C, D, new AlignToSeg(pos2, pos6));
            m_net.AlignEdge(E, F, new AlignToSeg(pos3, pos7));
            m_net.AlignEdge(F, G, new AlignToSeg(pos3, pos7));
            m_net.AlignEdge(H, I, new AlignToSeg(pos4, pos8));
            m_net.AlignEdge(I, J, new AlignToSeg(pos4, pos8));
            m_net.AlignEdge(K, L, new AlignToSeg(pos1, pos5));


            A.Alignment =
            K.Alignment = new AlignFixed(pos1);
            L.Alignment = new AlignFixed(pos5);
            B.Alignment =
            D.Alignment = new AlignFixed(pos2);
            C.Alignment = new AlignFixed(pos6);
            E.Alignment =
            G.Alignment = new AlignFixed(pos3);
            F.Alignment = new AlignFixed(pos7);
            H.Alignment =
            J.Alignment = new AlignFixed(pos4);
            I.Alignment = new AlignFixed(pos8);
        }

        private void XtoCircle()
        {
            int full = m_net.Size - 1;
            int half = m_net.Size / 2;
            int threequarters = m_net.Size / 4 * 3;
            int quarter = m_net.Size / 4;
            int third = m_net.Size / 3;
            int twothirds = m_net.Size / 3 * 2;
            int sixth = m_net.Size / 6;

            Indicatrix
                A = m_net[0, twothirds],
                B = m_net[third, twothirds],
                C = m_net[half, half],
                D = m_net[twothirds, twothirds],
                E = m_net[full, twothirds],
                F = m_net[twothirds, third],
                G = m_net[full, 0],
                H = m_net[twothirds, 0],
                I = m_net[half, sixth],
                J = m_net[third, 0],
                K = m_net[0, 0],
                L = m_net[third, third];

            AlignToArc TL = new AlignToArc(Point2D.Origin, 1.0, Point2D.YAxis, -Point2D.XAxis);
            AlignToArc BL = new AlignToArc(Point2D.Origin, 1.0, -Point2D.XAxis, -Point2D.YAxis);
            AlignToArc BR = new AlignToArc(Point2D.Origin, 1.0, -Point2D.YAxis, Point2D.XAxis);
            AlignToArc TR = new AlignToArc(Point2D.Origin, 1.0, Point2D.XAxis, Point2D.YAxis);

            m_net.AlignEdge(L, A, TL);
            m_net.AlignEdge(A, B, TL);
            m_net.AlignEdge(B, C, TL);
            m_net.AlignEdge(C, D, TR);
            m_net.AlignEdge(D, E, TR);
            m_net.AlignEdge(E, F, TR);
            m_net.AlignEdge(F, G, BR);
            m_net.AlignEdge(G, H, BR);
            m_net.AlignEdge(H, I, BR);
            m_net.AlignEdge(I, J, BL);
            m_net.AlignEdge(J, K, BL);
            m_net.AlignEdge(K, L, BL);

            m_net.AlignEdge(m_net[0, third], m_net[full, third], new AlignToSeg(-Point2D.XAxis, Point2D.XAxis));
            m_net.AlignEdge(m_net[half, 0], m_net[half, full], new AlignToSeg(-Point2D.YAxis, Point2D.YAxis));

            C.Alignment = new AlignFixed(Point2D.YAxis);
            F.Alignment = new AlignFixed(Point2D.XAxis);
            I.Alignment = new AlignFixed(-Point2D.YAxis);
            L.Alignment = new AlignFixed(-Point2D.XAxis);

            //now delete ones we don't need
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (j > twothirds)
                        m_net[i, j] = null;
                    if (Math.Abs(i + j - half - third) <= sixth)
                        continue;
                    if (i - j <= third && i - j >= 0)
                        continue;
                    m_net[i, j] = null;
                }
            }

            //now scale them for a good start
            if( m_bFirstPass)
                for (int i = 0; i < m_net.Size; i++)
                    for (int j = 0; j < m_net.Size; j++)
                        if (m_net[i, j] != null)
                            m_net[i, j].Position = m_net[i, j].Position * 2.0 / m_net.Size - new Point2D(1.0, 1.0);

        }

        //good to go
        private void HyperbolizeExample()
        {
            double center2center = 4.8;
            int order = 5;
            double newangle = 2.0 * Math.PI / (double)order;
            Point2D C = Point2D.FromPolar(2.35, newangle / 2.0); //36 degrees up
            Point2D E = Point2D.FromPolar(center2center, 0);
            Point2D D = Point2D.FromPolar(center2center, newangle); //72 degrees up
            double arcradius = (D - C).R;
            double arc2center = center2center - arcradius;
            Point2D B = Point2D.FromPolar(arc2center, 0);
            Point2D A = Point2D.FromPolar(arc2center, newangle); //72 degrees up



            int full = m_net.Size - 1;
            m_net.AlignEdge(m_net[0, 0], m_net[0, full], new AlignToSeg(Point2D.Origin, A));
            m_net.AlignEdge(m_net[0, 0], m_net[full, 0], new AlignToSeg(Point2D.Origin, B));
            m_net.AlignEdge(m_net[full, full], m_net[0, full], new AlignToArc(D, (D - C).R, A, C));
            m_net.AlignEdge(m_net[full, full], m_net[full, 0], new AlignToArc(E, (E - C).R, C, B));

            m_net.AlignEdge(m_net[full, full], m_net[0, 0], new AlignToSeg(Point2D.Origin, C));

            m_net[0, 0].Alignment = new AlignFixed(Point2D.Origin);
            m_net[0, full].Alignment = new AlignFixed(A);
            m_net[full, 0].Alignment = new AlignFixed(B);
            m_net[full, full].Alignment = new AlignFixed(C);
        }

        private void Square2Triangle()
        {
            Point2D posA = new Point2D(-1.0, 0);
            Point2D posB = new Point2D(1.0, 0);
            Point2D posC = new Point2D(0, Math.Sqrt(3));

            int half = m_net.Size / 2;
            int full = m_net.Size - 1;

            AlignToSeg AC = new AlignToSeg(posA, posC);
            AlignToSeg OB = new AlignToSeg(Point2D.Origin, posB);
            AlignToSeg AO = new AlignToSeg(posA, Point2D.Origin);
            AlignToSeg BC = new AlignToSeg(posB, posC);
            AlignToSeg CO = new AlignToSeg(posC, Point2D.Origin);

            AlignCombo Left = new AlignCombo();
            Left.AddAligner(AC);
            Left.AddAligner(AO);
            AlignCombo Right = new AlignCombo();
            Right.AddAligner(BC);
            Right.AddAligner(OB);

            //edges
            m_net.AlignEdge(m_net[0, 0], m_net[0, full], Left);
            m_net.AlignEdge(m_net[0, full], m_net[half, full], Left);
            m_net.AlignEdge(m_net[half, 0], m_net[0, 0], Left);

            m_net.AlignEdge(m_net[half, full], m_net[full, full], Right);
            m_net.AlignEdge(m_net[full, full], m_net[full, 0], Right);
            m_net.AlignEdge(m_net[half, 0], m_net[full, 0], Right);

            //centerline
            m_net.AlignEdge(m_net[half, 0], m_net[half, full], CO);

            m_net[half, 0].Alignment = new AlignFixed(Point2D.Origin);
            m_net[half, full].Alignment = new AlignFixed(posC);
            m_net[0, 0].Alignment = new AlignFixed(posA);
            m_net[full, 0].Alignment = new AlignFixed(posB);

            //precondition the points:
            if( m_bFirstPass)
                for (int i = 0; i < m_net.Size; i++)
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        m_net[i, j].Position = m_net[i, j].Position * 2.0 / (double)m_net.Size + new Point2D(-1.0, 0);
                    }
        }

        private void Square2Parallelogram()
        {
            Point2D posA = new Point2D(0, 0);
            Point2D posB = new Point2D(1, 0);
            Point2D posC = new Point2D(1, 1);
            Point2D posD = new Point2D(2, 1);

            int full = m_net.Size - 1;

            AlignToSeg AB = new AlignToSeg(posA, posB);
            AlignToSeg BD = new AlignToSeg(posB, posD);
            AlignToSeg CD = new AlignToSeg(posC, posD);
            AlignToSeg AC = new AlignToSeg(posA, posC);

            //edges
            m_net.AlignEdge(m_net[0, 0], m_net[0, full], AC);
            m_net.AlignEdge(m_net[0, full], m_net[full, full], CD);
            m_net.AlignEdge(m_net[full, full], m_net[full, 0], BD);
            m_net.AlignEdge(m_net[full, 0], m_net[0, 0], AB);

            //vertices
            m_net[0, 0].Alignment = new AlignFixed(posA);
            m_net[0, full].Alignment = new AlignFixed(posC);
            m_net[full, full].Alignment = new AlignFixed(posD);
            m_net[full, 0].Alignment = new AlignFixed(posB);

            //precondition the points:
            if( m_bFirstPass)
                for (int i = 0; i < m_net.Size; i++)
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        m_net[i, j].Position = m_net[i, j].Position * 2.0 / (double)m_net.Size - posD/2.0;
                    }
        }

        private void Parallelogram2Square()
        {
            int full = m_net.Size - 1;
            int half = m_net.Size / 2;

            //remove points outside parallelogram
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (j > half)
                        m_net[i, j] = null;
                    else if (i + j < half)
                        m_net[i, j] = null;
                    else if (i + j > full)
                        m_net[i, j] = null;
                }

            }

            Point2D posA = new Point2D(-1, -1);
            Point2D posB = new Point2D(1, -1);
            Point2D posC = new Point2D(-1, 1);
            Point2D posD = new Point2D(1, 1);
            Indicatrix indA = m_net[half,0];
            Indicatrix indB = m_net[full,0];
            Indicatrix indC = m_net[0,half];
            Indicatrix indD = m_net[half,half];
#if true //free floating
            AlignToSeg AB = new AlignToSeg(posA, posB);
            AlignToSeg BD = new AlignToSeg(posB, posD);
            AlignToSeg CD = new AlignToSeg(posC, posD);
            AlignToSeg AC = new AlignToSeg(posA, posC);
            AlignCombo BAC = new AlignCombo(); BAC.AddAligner(AB); BAC.AddAligner(AC);
            AlignCombo BDC = new AlignCombo(); BDC.AddAligner(BD); BDC.AddAligner(CD);
            AlignCombo ABCD = new AlignCombo(); ABCD.AddAligner(AB); ABCD.AddAligner(BD); ABCD.AddAligner(CD); ABCD.AddAligner(AC);


            //edges
            m_net.AlignEdge(indA, indC, ABCD); //AC
            m_net.AlignEdge(indC, indD, ABCD); //CD
            m_net.AlignEdge(indD, indB, ABCD); //DB
            m_net.AlignEdge(indB, indA, ABCD); //BA

            //vertices
            indA.Alignment = new AlignFixed(posA);
            //indB.Alignment = new AlignFixed(posB);
            //indC.Alignment = new AlignFixed(posC);
            indD.Alignment = new AlignFixed(posD);

            //precondition the points:
            if (m_bFirstPass)
            {
                for (int i = 0; i < m_net.Size; i++)
                {
                    for (int j = 0; j < m_net.Size; j++)
                    {
                        double x = (double)i / half - 1.0; 
                        double y = (double)j / half;
                        x += y;
                        x *= 2.0; x -= 1.0;
                        y *= 2.0; y -= 1.0;
                        if (m_net[i, j] != null)
                            m_net[i, j].Position = new Point2D(x, y);
                    }
                }
            }
#else //fixed
            double perimeter = (double)half * 2.0 * (1.0 + Math.Sqrt(2.0));
            for (int i = 0; i <= half; i++)
            {
                for( int j=0; j<4; j++)
                {
                    double dist = 0.0;
                    Indicatrix element = null;
                    switch( j )
                    {
                        case 0:
                            //A-B, m_net[half,0] .. m_net[full,0]
                            dist = (double)i;
                            element = m_net[half+i,0];
                            break;
                        case 1: 
                            //B-D, m_net[full,0] ..m_net[half,half]
                            dist = (double)half + Math.Sqrt(2.0) * (double)i;
                            element = m_net[full-i,i];
                            break;
                        case 2:
                            //D-C, m_net[half, half] .. m_net[0, half]
                            dist = (double)half * (1.0 + Math.Sqrt(2.0)) + (double)i;
                            element = m_net[half-i, half];
                            break;
                        case 3:
                            //C-A, m_net[0, half] .. m_net[half, 0]
                            dist = (double)half * (2.0 + Math.Sqrt(2.0)) + Math.Sqrt(2.0) * (double)i;
                            element = m_net[i, half-i];
                            break;
                    }

                    //dist should be 0..half*(2+2sqrt2)
                    dist /= (double)half;
                    //dist should be 0..2+2sqrt2
                    dist -= 1.0;
                    //dist should be -1..1+2sqrt2
                    if (dist < 0.0) dist += (2.0 + 2.0 * Math.Sqrt(2.0));
                    //dist should be 0..2+2sqrt2
                    dist /= (2.0 + 2.0 * Math.Sqrt(2.0));
                    //dist should be 0..1
                    dist *= 4.0;
                    //dist should be 0..4

                    int integerpart = (int)dist;
                    double fractionalpart = dist - integerpart;
                    switch (integerpart)
                    {
                        case 0: 
                            element.Alignment = new AlignFixed( posA + (posB-posA) * fractionalpart);
                            break;
                        case 1: 
                            element.Alignment = new AlignFixed( posB + (posD-posB) * fractionalpart);
                            break;
                        case 2: 
                            element.Alignment = new AlignFixed( posD + (posC-posD) * fractionalpart);
                            break;
                        case 3: 
                            element.Alignment = new AlignFixed( posC + (posA-posC) * fractionalpart);
                            break;
                        default:
                            element.Alignment = new AlignFixed(posA);
                            break;
                    }
                }
            }
#endif

        }
        #endregion
    }
}