using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;
using DMSLib;

namespace globemaker
{

    public class Skeleton
    {
        private class TurtleState
        {
            public Point2D pos;  // position on plane
            public Point2D dir;  // direction on plane
            public Rotation rot; // orientation on sphere
            public TurtleState(Point2D p, Point2D d, Rotation r)
            {
                pos = p; dir = d; rot = r;
            }
            public TurtleState(TurtleState ts)
                : this(new Point2D(ts.pos), new Point2D(ts.dir), new Rotation(ts.rot))
            {
            }
        }

        #region member variables
        Segment m_LastCloserSegment = null;
        List<Segment> m_Segments = new List<Segment>();

        #endregion

        #region Constructors
        public Skeleton() {}

        public Skeleton(String Filename) : this(Filename, StreamWriter.Null) {}

        public Skeleton(String Filename, StreamWriter logSW)
        {
            //Read in Skeleton
            StreamReader input = new StreamReader(Filename);
            TurtleState current = new TurtleState(new Point2D(0, 0), new Point2D(1, 0), new Rotation());
            List<TurtleState> turtleStack = new List<TurtleState>();
            Dictionary<String, Rotation> sphereTable = new Dictionary<string,Rotation>();

            while (!input.EndOfStream)
            {
                String LineIn = input.ReadLine();
                char[] charSeparators = { ' ', ',', '=', '\t' };
                String[] tokens = LineIn.Split( charSeparators, StringSplitOptions.RemoveEmptyEntries );

                if( tokens.Length != 2 && 
                    tokens.Length != 3 ||
                    tokens[0].StartsWith("#") )
                {
                    continue;
                } /* if */


                //FIRST TOKEN = command
                String command = (tokens[0]).ToLower();

                //SECOND TOKEN = distance (or label)
                double fDistance = 0.0;
                try
                {
                    fDistance = double.Parse(tokens[1]) * DMS.HALFTAU;
                }
                catch( System.FormatException )
                {
                    // if second token not a number, it could be a label.
                    if( command == "s" || command == "save" )
                    {
                        // save the label and move on.
                        sphereTable[tokens[1]] = current.rot;
                        continue;
                    }
                    else if( sphereTable.ContainsKey(tokens[1]) )
                    {
                        Rotation newRot = sphereTable[tokens[1]];
                        Point3D A = current.rot.Rotate(-Point3D.XAxis);
                        Point3D B = current.rot.Rotate(Point3D.ZAxis);
                        Point3D C = newRot.Rotate(Point3D.ZAxis);


                        // add a rotation from AB to BC
                        double turn = Math.PI - Point3D.DihedralAngle(A, B, C);
                        if (Point3D.Dot(B, Point3D.Cross(A - B, B - C)) < 0)
                        {
                            turn *= -1.0;
                        }
                        current.dir.Theta += turn;
                        current.rot *= new Rotation(Math.Cos(turn / 2.0), 0, 0, Math.Sin(turn / 2.0));

                        if (command == "r" || command == "rotate")
                        {
                            continue;
                        }
                        else if (command == "l" || command == "line" || command == "lineto" ||
                            command == "m" || command == "move" || command == "moveto")
                        {
                            // move or line from B to C
                            fDistance = Point3D.Angle(B, Point3D.Origin, C) - DMS.EPSILON;
                        }
                    }
                }

                //THIRD TOKEN = strength
                double fStrength = 1.0;
                if (tokens.Length == 3)
                {
                    try
                    {
                        fStrength = 1.0 / double.Parse(tokens[2]);
                    }
                    catch (System.FormatException)
                    {
                        continue;
                    }
                }
                       


                if( command == "l" || command == "line" || command == "lineto" )
                {
                    if (fDistance == 0.0)
                        m_Segments.Add(new Segment(current.rot, current.pos, current.pos + current.dir, fStrength, true));
                    else if (fDistance > 0.0)
                        m_Segments.Add(new Segment(current.rot, current.pos, current.pos + current.dir * fDistance, fStrength));
                    else
                        m_Segments.Add(new Segment(current.rot * new Rotation(0, 0, 0, 1), current.pos, current.pos + current.dir * fDistance, fStrength));

                    current.pos += current.dir * fDistance;
                    current.rot *= new Rotation(Math.Cos(fDistance / 2.0), 0, Math.Sin(fDistance / 2.0), 0);
                }
                else if( command == "m" || command == "move" || command == "moveto" )
                {
                    //move
                    current.pos += current.dir * fDistance;
                    current.rot *= new Rotation(Math.Cos(fDistance / 2.0), 0, Math.Sin(fDistance / 2.0), 0);
                }
                else if( command == "o" || command == "moveinplane" )
                {
                    //move in plane *O*nly
                    current.pos += current.dir * fDistance;
                }
                else if( command == "r" || command == "rotate" )
                {
                    //rotate (clockwise)
                    current.dir.Theta += fDistance;
                    current.rot *= new Rotation( Math.Cos(fDistance / 2.0), 0, 0, Math.Sin(fDistance / 2.0) );
                }
                else if( command == "p" && fDistance > 0 || command == "push" )
                {
                    turtleStack.Add(new TurtleState(current));
                }
                else if (command == "p" || command == "pop")
                {
                    current = turtleStack.Last<TurtleState>();
                    turtleStack.Remove(current);
                }
            } /* while */

            input.Close();
        }
        #endregion

        #region public functions
        public RelativePosition NearestSegmentOnSphere(Point3D pos)
        {
	        RelativePosition result = null;

	        foreach( Segment seg in m_Segments )
	        {
                RelativePosition current = new RelativePosition(pos, seg);

		        if( result == null ||
                    current.Distance * current.Segment.Strength + DMS.EPSILON <
				        result.Distance * result.Segment.Strength )
		        {
			        result = current;
		        } /* if */
	        } /* foreach */

            return result;
        } /* NearestSegmentOnSphere */


        public RelativePosition NearestSegmentOnPlane(Point2D pos)
        {
            RelativePosition result = null;

            foreach (Segment seg in m_Segments)
            {
                RelativePosition current = new RelativePosition(pos, seg);
                

		        if( result == null ||
                    current.Distance * current.Segment.Strength + DMS.EPSILON <
				        result.Distance * result.Segment.Strength )
		        {
			        result = current;
		        } /* if */
            }

            return result;
        } /* NearestSegmentOnPlane */

        public bool bNearerSegmentOnSphereExists( Point3D pos, double fCriteria )
        {
            if( m_LastCloserSegment != null &&
                RelativePosition.IsNearerOnSphere( pos, m_LastCloserSegment, fCriteria ) )
            {
                return true;
            }

            foreach( Segment seg in m_Segments )
            {
                if (RelativePosition.IsNearerOnSphere(pos, seg, fCriteria))
                {
                    m_LastCloserSegment = seg;
                    return true;
                }
            }

        	return false;
        } /* bNearerSegmentOnSphereExists */

        public int IndexOf(Segment s)
        {
            return m_Segments.IndexOf(s);
        }

        public Point2D GetMinPt()
        {
            Point2D MinPt = new Point2D(m_Segments[0].A);

            foreach( Segment seg in m_Segments )
            {
                MinPt.X = Math.Min(seg.A.X, MinPt.X);
                MinPt.X = Math.Min(seg.B.X, MinPt.X);
                MinPt.Y = Math.Min(seg.A.Y, MinPt.Y);
                MinPt.Y = Math.Min(seg.B.Y, MinPt.Y);
            }

            return MinPt;
        }

        public Point2D GetMaxPt()
        {
            Point2D MaxPt = new Point2D(m_Segments[0].A);

            foreach (Segment seg in m_Segments)
            {
                MaxPt.X = Math.Max(seg.A.X, MaxPt.X);
                MaxPt.X = Math.Max(seg.B.X, MaxPt.X);
                MaxPt.Y = Math.Max(seg.A.Y, MaxPt.Y);
                MaxPt.Y = Math.Max(seg.B.Y, MaxPt.Y);
            }

            return MaxPt;
        }

        public List<Segment> segments
        {
            get { return m_Segments; }
        }

        #endregion

    }
}
