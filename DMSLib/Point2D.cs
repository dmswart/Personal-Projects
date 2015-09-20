using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class Point2D
    {
		#region Member Variables
        private double mX;
        private double mY;
		#endregion

		#region Constructors
        public Point2D ( double X, double Y )
		{
			mX = X;
			mY = Y;
		}

        public Point2D(Point2D A) : this(A.X, A.Y) { }
        public Point2D() : this(0, 0) {}


        #endregion

		#region Accessors
		public double X 
		{
			get { return mX; }
			set { mX = value; }
		}
		public double Y 
		{
			get { return mY; }
			set { mY = value; }
		}

        /// <summary>
        /// azimuthal, starting from the x axis
        /// </summary>
		public double Theta
		{
			get{ return Math.Atan2( Y, X ); }
			set
            {
                double r = R;
                X = r * Math.Cos(value);
                Y = r * Math.Sin(value);
            }
		}

		public double R
		{
			get{ return Math.Sqrt( mX * mX + mY * mY ); }
			set
            {
                if( R!= 0 )
                    Scale( value / R ); 
            }
		}


		public double Magnitude
		{
			get { return R; }
			set { R = value; }
		}

		public Point2D Normalized
		{
            get
            {
                double factor = 1.0;
                if (R != 0)
                {
                    factor /= R;
                }
                return new Point2D(mX * factor, mY * factor);
            }
		}

		#endregion

		
		#region static functions
        public static bool operator ==(Point2D A, Point2D B)
        {
            if ((object)A == null || (object)B == null )
                return ( (object)A == null && (object)B == null );
            
            return A.X == B.X && A.Y == B.Y;
        }
        public static bool operator !=(Point2D A, Point2D B)
        {
            return !(A == B);
        }


        static public Point2D operator + (Point2D A, Point2D B)
        {
            return new Point2D( A.X + B.X, A.Y + B.Y );
        }
        static public Point2D operator - (Point2D A, Point2D B)
        {
            return new Point2D( A.X - B.X, A.Y - B.Y );
        }

        static public Point2D operator -(Point2D A)
        {
            return new Point2D( -A.X, -A.Y );
        }

        static public Point2D operator *(Point2D A, double Scale)
        {
            return new Point2D(A.X * Scale, A.Y * Scale);
        }

        static public Point2D operator / (Point2D A, double Scale)
        {
            return new Point2D(A.X / Scale, A.Y / Scale);
        }

        static public Point2D operator *(double Scale, Point2D A)
        {
            return new Point2D(A.X * Scale, A.Y * Scale);
        }

        static public Point2D operator *(Point2D A, Point2D B) // complex multiplication
        {
            return new Point2D(A.X * B.X - A.Y * B.Y, A.X * B.Y + A.Y * B.X);
        }

        static public Point2D Invert(Point2D A)
        {
            if (A.R < DMS.EPSILON)
                return Point2D.Origin;

            double factor = A.X * A.X + A.Y * A.Y;
            return new Point2D(A.X, -A.Y) / factor;
        }

        static public Point2D operator /(Point2D A, Point2D B) // complex division
        {
            return A * Point2D.Invert(B);
        }


		public static double Dot( Point2D A, Point2D B ) 
		{
			return A.X*B.X + A.Y*B.Y;
		}

        public static Point2D FromPolar(double R, double Theta)
        {
            return new Point2D(R * Math.Cos(Theta), R * Math.Sin(Theta));
        }

        static public double Angle(Point2D A, Point2D B, Point2D C)
        {
            if ((A - B).R == 0 || (C - B).R == 0)
                return 0.0;

            double dotproduct = Point2D.Dot((A - B).Normalized, (C - B).Normalized);
            if (dotproduct <= -1.0) return DMS.HALFTAU;
            if (dotproduct >= 1.0) return 0.0;
            return (Math.Acos(dotproduct));
        }

        public static Point2D YAxis = new Point2D(0, 1);
        public static Point2D XAxis = new Point2D(1, 0);
        public static Point2D Origin = new Point2D();        
        #endregion

        #region public functions

        override public String ToString()
        {
            return "(" + X.ToString() + "," + Y.ToString() + ")";
        }

        public Point2D Pow(double d)
        {
            return Point2D.FromPolar(Math.Pow(R,d), Theta * d);
        }


        public void Normalize()
		{
            if( R!=0 )
	    		Scale( 1.0 / R );
		}
		
		public void Scale( double factor )
		{
			mX *= factor;
			mY *= factor;
		}

        public Point2D ScaledTo(double newLength )
        {
            Point2D result = new Point2D(this);
            result.R = newLength;
            return result;
        }

        /// <summary>
        /// Turns plane to sphere, the unit circle into the equator (z=0), the interior of the cirle into the southern hemisphere (z &lt; 0)
        /// </summary>
        /// <returns></returns>
        public Point3D InvStereographicToSphere()
        {
            return new Point3D(2.0 * X, 2.0 * Y, -1 + X * X + Y * Y).Normalized;
        }

        
		#endregion

    }
}
