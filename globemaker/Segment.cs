using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;

namespace globemaker
{

    public class RelativePosition
    {

        #region Member variables

	    private double   m_fClosestPt; //distance along segment that the closest point on the segment to the given point is.
	    private double   m_fTheta;     //angle to the given point from m_fClosestPt
	    private double   m_fDistance;  //distance to the given point from m_fClosestPt
        private Segment  m_Segment;    //which segment we're talking about
        #endregion

        #region Constructor
        public RelativePosition( Point3D p, Segment seg ) //point on sphere
        {
            m_Segment = seg;
            Point3D PosOnSphere = m_Segment.Arot.Inverse.Rotate( p );  //we think of our segment starting at z and rotating towards x;
            double fAngle = DMS.FixAnglePositive(Math.Atan2(PosOnSphere.X, PosOnSphere.Z));


		    //test if closest orthoganally
		    if( fAngle < m_Segment.Length )
		    {
			    m_fTheta = PosOnSphere.Y > 0 ? DMS.QUARTERTAU : -DMS.QUARTERTAU;
			    m_fClosestPt = fAngle;
			    m_fDistance = Math.Abs(Math.Asin( PosOnSphere.Y ));
		    } /* if */

		    //angle to A (z-axis) is TWO_PI-fAngle, angle to B (end of rot.) is fAngle-length
		    // test if point on sphere is closer to z axis then to end of rot.
		    else if( (DMS.TAU - fAngle) < (fAngle - m_Segment.Length) ) 
		    {
			    m_fTheta = PosOnSphere.Theta;
			    m_fClosestPt = 0.0;
			    m_fDistance = PosOnSphere.Phi;
		    } /* else if */


		    // otherwise point on sphere is closer to end of rotation then to z axis
		    else 
		    {
			    //rotate posonsphere about y (from x to z) by grSegments[dtCurrent.nIdx].length
                PosOnSphere = new Point3D( 
			        Math.Sin(Math.Atan2(PosOnSphere.X, PosOnSphere.Z)-m_Segment.Length) * Math.Sqrt(1.0-PosOnSphere.Y*PosOnSphere.Y),
			        PosOnSphere.Y,
			        Math.Cos(Math.Atan2(PosOnSphere.X, PosOnSphere.Z)-m_Segment.Length) * Math.Sqrt(1.0-PosOnSphere.Y*PosOnSphere.Y) );


			    //now it's same as before except for fClosestPt
			    m_fTheta = PosOnSphere.Theta;
			    m_fClosestPt = m_Segment.Length;
			    m_fDistance = PosOnSphere.Phi;
		    } /* else if */            
        }

        public RelativePosition( Point2D p, Segment seg ) //point on plane
        {
            m_Segment = seg;
            Point2D BtoPos = p - m_Segment.B;
            Point2D AtoPos = p - m_Segment.A;

            if( Point2D.Dot( BtoPos, m_Segment.AtoBDir ) > 0.0 )
		    {
                m_fTheta = DMS.FixAngle(BtoPos.Theta - m_Segment.AtoBDir.Theta);
			    m_fDistance = BtoPos.R;
			    m_fClosestPt = m_Segment.Length;
		    } /* if */
		    else if( Point2D.Dot( AtoPos, m_Segment.AtoBDir ) < 0.0 )
		    {
                m_fTheta = DMS.FixAngle(AtoPos.Theta - m_Segment.AtoBDir.Theta);
			    m_fDistance = AtoPos.R;
			    m_fClosestPt = 0.0;
		    } /* else if */
		    else
		    {
			    double
                    fAnglePosAB = DMS.FixAngle(AtoPos.Theta - m_Segment.AtoBDir.Theta);

			    m_fDistance =  Math.Sin( fAnglePosAB ) * AtoPos.R;
			    m_fClosestPt = Math.Cos( fAnglePosAB ) * AtoPos.R;
			    m_fTheta = m_fDistance > 0.0 ? DMS.QUARTERTAU : -DMS.QUARTERTAU;
			    m_fDistance = Math.Abs( m_fDistance );
		    } /* else */
        }
        #endregion Constructor

        #region Accessors
        public Point3D PointOnSphere
        {
            get
            {
	            Point3D tmpPos;
                Point3D result;

            	//first find point on sphere if A is at z axis and B is rotated towards x
	            if( m_fClosestPt <= DMS.EPSILON )
                {
                    //if closest point is at A...
                    result = new Point3D( 
		                Math.Sin( m_fDistance ) * Math.Cos( m_fTheta ),
		                Math.Sin( m_fDistance ) * Math.Sin( m_fTheta ),
		                Math.Cos( m_fDistance ) );
                }
                else if (m_fClosestPt >= m_Segment.Length - DMS.EPSILON)
	            {
                    //closest point is at B...
                    tmpPos = new Point3D(
                        Math.Sin( m_fDistance ) * Math.Cos( m_fTheta ),
                        Math.Sin( m_fDistance ) * Math.Sin( m_fTheta ),
		                Math.Cos( m_fDistance ) );

		            //this is as if B is at Z-axis, we still need to rotate around y axis by fClosestPt
                    result = new Point3D( 
    		            Math.Sin(Math.Atan2(tmpPos.X, tmpPos.Z)+m_fClosestPt) * Math.Sqrt(1.0-tmpPos.Y*tmpPos.Y),
	    	            tmpPos.Y,
		                Math.Cos(Math.Atan2(tmpPos.X, tmpPos.Z)+m_fClosestPt) * Math.Sqrt(1.0-tmpPos.Y*tmpPos.Y) );
            	} /* else if */
                else if (Math.Abs(m_fTheta - DMS.QUARTERTAU) < DMS.EPSILON) //right side
	            {
                    result = new Point3D( 
    		            Math.Cos( m_fDistance ) * Math.Sin( m_fClosestPt ),
		                Math.Sin( m_fDistance ),
                        Math.Cos( m_fDistance ) * Math.Cos( m_fClosestPt ) );
	            } /* else if */
	            else //left side
	            {
                    result = new Point3D(
                        Math.Cos( m_fDistance ) * Math.Sin( m_fClosestPt ),
		                -Math.Sin( m_fDistance ),
		                Math.Cos( m_fDistance ) * Math.Cos( m_fClosestPt ) );
	            } /* else */

            	//then apply the A rotation of the segment to the point on the sphere
                return m_Segment.Arot.Rotate( result );
            }
        }

        public Point2D PointOnPlane
        {
            get
            {
                return m_Segment.A + 
                    m_fClosestPt * m_Segment.AtoBDir + 
                    Point2D.FromPolar(m_fDistance, m_Segment.AtoBDir.Theta + m_fTheta);
            }
        }

        public double Distance
        {
            get { return this.m_fDistance; }
        }

        public Segment Segment
        {
            get { return m_Segment; }
        }
        #endregion 

        #region public functions
        public static bool IsNearerOnSphere( Point3D p, Segment seg, double criteria ) 
        {
            Point3D PosOnSphere = seg.Arot.Inverse.Rotate( p );  //we think of our segment starting at z and rotating towards x;
            double fAngle = DMS.FixAnglePositive(Math.Atan2(PosOnSphere.X, PosOnSphere.Z));


		    //test if closest orthoganally
		    if( fAngle < seg.Length )
		    {
                return (Math.Abs(Math.Asin(PosOnSphere.Y)) * seg.Strength < criteria - DMS.EPSILON);
		    } /* if */

		    //angle to A (z-axis) is TWO_PI-fAngle, angle to B (end of rot.) is fAngle-length
		    // test if point on sphere is closer to z axis then to end of rot.
		    else if( (DMS.TAU - fAngle) < (fAngle - seg.Length) ) 
		    {
                return (PosOnSphere.Phi * seg.Strength < criteria - DMS.EPSILON);
		    } /* else if */


		    // otherwise point on sphere is closer to end of rotation then to z axis
		    else 
		    {
			    //rotate posonsphere about y (from x to z) by grSegments[dtCurrent.nIdx].length
                PosOnSphere = new Point3D( 
			        Math.Sin(Math.Atan2(PosOnSphere.X, PosOnSphere.Z)-seg.Length) * Math.Sqrt(1.0-PosOnSphere.Y*PosOnSphere.Y),
			        PosOnSphere.Y,
			        Math.Cos(Math.Atan2(PosOnSphere.X, PosOnSphere.Z)-seg.Length) * Math.Sqrt(1.0-PosOnSphere.Y*PosOnSphere.Y) );

			    //now it's same as before except for fClosestPt
                return (PosOnSphere.Phi * seg.Strength < criteria - DMS.EPSILON);
		    } /* else if */            
        }
        #endregion
    }

    public class Segment
    {
        #region Member variables
        private Point2D m_A;
        private Point2D m_B;
        private Point2D m_AtoBDir;
        private Rotation m_Arot;        //orientation of A
        private double m_Length;
        private double m_Strength;
        #endregion

        #region Constructor
        public Segment( Rotation AonSphere, Point2D AonPlane, Point2D BonPlane, double Strength, bool bZeroLength )
        {
            m_Arot = AonSphere;
            m_A = AonPlane;
            m_B = BonPlane;
            m_Strength = Strength;

            m_AtoBDir = (m_B - m_A).Normalized;
            if (bZeroLength) m_B = m_A;
            m_Length = (m_B - m_A).R;
        }

        public Segment(Rotation AonSphere, Point2D AonPlane, Point2D BonPlane, double Strength )
            : this(AonSphere, AonPlane, BonPlane, Strength, false)
        {
        }

        public Segment(Rotation AonSphere, Point2D AonPlane, Point2D BonPlane)
            : this(AonSphere, AonPlane, BonPlane, 1.0)
        {
        }
        #endregion

        #region Accessors
        public Rotation Arot
        {
            get { return m_Arot; }
        }
        public Point2D A
        {
            get { return m_A; }
        }
        public Point2D B
        {
            get { return m_B; }
        }
        public Point2D AtoBDir
        {
            get { return m_AtoBDir; }
        }
        public double Length
        {
            get { return m_Length; }
        }
        public double Strength
        {
            get { return m_Strength; }
        }
        public bool isPoint
        {
            get { return m_Length == 0.0; }
        }

        #endregion

        public Segment getOpposite()
        {
            if (m_A == m_B)
                return new Segment(Arot * new Rotation(DMS.HALFTAU, Point3D.ZAxis), m_B, m_B - m_AtoBDir, Strength, true);

            Rotation BonSphere = Arot * new Rotation(-m_Length, Point3D.YAxis) * new Rotation(DMS.HALFTAU, Point3D.ZAxis);
            return new Segment(BonSphere, B, A, Strength);
        }
    }

}
