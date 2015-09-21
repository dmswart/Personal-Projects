using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;

namespace NWCArt
{
    //binary number: top bottom left right 
    public enum InsetType
    {
        None = 0,     //0000 none
        Right,        //0001 right
        Left,         //0010
        Sides,        //0011
        Bottom,       //0100
        BottomRight,  //0101
        BottomLeft,   //0110
        CupUp,        //0111
        Top,          //1000
        TopRight,     //1001
        TopLeft,      //1010
        CupDown,      //1011
        NotSides,     //1100
        CupRight,     //1101
        CupLeft,      //1110
        AllSides,     //1111

        LeftHalf,
        RightHalf,
        TopHalf,
        BottomHalf,

        TopFixed = 23,    //10111,
        BottomFixed = 27, //11011
        LeftFixed = 29,   //11101
        RightFixed = 30,  //11110

    }

    public class GridSpace
    {
        public Path m_bottomPath; //goes from m_bottomLeft to m_bottomRight
        public Path m_topPath; // goes from m_topLeft to m_topRight
        Point2D bottomLeft { get { return m_bottomPath.getStartPt(); } }
        Point2D bottomRight { get { return m_bottomPath.getEndPt(); } }
        Point2D topLeft { get { return m_topPath.getStartPt(); } }
        Point2D topRight { get { return m_topPath.getEndPt(); } }

        public GridSpace(Point2D bottomLeft, Point2D bottomRight, Point2D topLeft, Point2D topRight) :
            this(new Path(bottomLeft, bottomRight), new Path(topLeft, topRight))
        {
        }

        public GridSpace(Path bottomPath, Path topPath)
        {
            m_bottomPath = bottomPath;
            m_topPath = topPath;
        }

        public static GridSpace fromPath(Path basepath, double height, double width)
        {
            Point2D right = (basepath.getEndPt() - basepath.getStartPt()).Normalized;
            Point2D up = Point2D.FromPolar(1.0, right.Theta + Math.PI/2.0);

            Point2D topcenter = (basepath.getEndPt() + basepath.getStartPt()) / 2.0 + height * up;

            return new GridSpace(basepath,
                                  new Path( topcenter - width / 2.0 * right,
                                            topcenter + width / 2.0 * right)); 
        }

        public Point2D this[double u, double v]
        {
            get
            {
                Point2D bottom = m_bottomPath.getSplinePt(u);
                Point2D top = m_topPath.getSplinePt(u);

                return bottom + v * (top - bottom);
            }
        }

        Path getPath(double U1, double V1, double U2, double V2, int numPts)
        {
            Path newPath = new Path();
            for (int i = 0; i < numPts; i++)
            {
                double t = (double)i / (numPts - 1);
                newPath.AddControlPt( this[U1 + t * (U2 - U1), V1 + t * (V2 - V1)]);
            }
            return newPath;
        }

        /// <summary>
        /// gives a new perspective grid that is inset by a given thickness
        /// </summary>
        /// <param name="thickness">a value to inset from the edge in.</param>
        /// <returns></returns>
        public GridSpace Inset(double thickness, InsetType type)
        {
            Point2D diag1 = topRight - bottomLeft;
            Point2D diag2 = bottomRight - topLeft;

            double minEdge = Math.Min(Math.Min((bottomLeft - bottomRight).R,
                                                 (bottomLeft - topLeft).R),
                                       Math.Min((topRight - bottomRight).R,
                                                 (topRight - topLeft).R));

            double nominallength = (diag1.R + diag2.R) / (2.0 * Math.Sqrt(2));
            double percentage = thickness / nominallength;

            //Test for thickness.
            if (percentage > 0.5 || thickness > minEdge / Math.Sqrt(2) )
            {
                Point2D avgpt = (topLeft + topRight + bottomLeft + bottomRight) / 4.0;
                return new GridSpace(avgpt, avgpt, avgpt, avgpt);
            }

            int typeval = (int)type;

            double right = (typeval & 1) == 1 ? 1.0 - percentage : 1.0;
            double left = (typeval & 2) == 2 ? percentage : 0.0;
            double bottom = (typeval & 4) == 4 ? percentage : 0.0;
            double top = (typeval & 8) == 8 ? 1.0 - percentage : 1.0;

            switch (type)
            {
                case InsetType.BottomFixed: 
                    return new GridSpace(m_bottomPath, getPath(left, top, right, top, 5));
                case InsetType.TopFixed: 
                    return new GridSpace(getPath(left, bottom, right, bottom, 5), m_topPath);
                case InsetType.LeftFixed: 
                    return new GridSpace(getPath(0.0, 0.0, right, bottom, 5), getPath(0.0, 1.0, right, top, 5) );
                case InsetType.RightFixed:
                    return new GridSpace(getPath(left, bottom, 1.0, 0.0, 5), getPath( left, top, 1.0, 1.0, 5) );
                case InsetType.LeftHalf:
                    return new GridSpace(getPath(0.0, 0.0, 0.5, 0.0, 5), getPath(0.0, 1.0, 0.5, 1.0, 5) );
                case InsetType.RightHalf:
                    return new GridSpace(getPath(0.5, 0.0, 1.0, 0.0, 5), getPath(0.5, 1.0, 1.0, 1.0, 5) );
                case InsetType.TopHalf:
                    return new GridSpace(getPath(0.0, 0.5, 1.0, 0.5, 5), getPath(0.0, 1.0, 1.0, 1.0, 5));
                case InsetType.BottomHalf:
                    return new GridSpace(getPath(0.0, 0.0, 1.0, 0.0, 5), getPath(0.0, 0.5, 1.0, 0.5, 5));
                default:
                    return new GridSpace(getPath(left, bottom, right, bottom, 5), getPath(left, top, right, top, 5));
            }
        }
    };
}
