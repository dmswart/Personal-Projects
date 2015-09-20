using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class Point3D
    {
		#region Member Variables
        private double mX;
        private double mY;
        private double mZ;
		#endregion

		#region Constructors

        public Point3D ( double X, double Y, double Z )
		{
			mX = X;
			mY = Y;
			mZ = Z;	
		}

        public Point3D() : this(0, 0, 0) {}
        public Point3D(Point3D A) : this(A.X, A.Y, A.Z) { }


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
		public double Z 
		{
			get { return mZ; }
			set { mZ = value; }
		}

        /// <summary>
        /// azimuthal, the angle about the z axis starting from the x axis
        /// </summary>
		public double Theta
		{
			get{ return Math.Atan2( Y, X ); }
			set
            {
                double oldR = R;
                double oldPhi = Phi;
                X = oldR * Math.Sin(oldPhi) * Math.Cos(value);
                Y = oldR * Math.Sin(oldPhi) * Math.Sin(value);
                Z = oldR * Math.Cos(oldPhi);
            }
		}

        /// <summary>
        /// inclination/declination, angle down from z+ axis
        /// </summary>
        public double Phi
        {
            get 
            {
                if (R == 0)
                    return 0;
                return Math.Acos(Z / R); 
            }
            set 
            {
                double oldR = R;
                double oldTheta = Theta;
                X = oldR * Math.Sin(value) * Math.Cos(oldTheta);
                Y = oldR * Math.Sin(value) * Math.Sin(oldTheta);
                Z = oldR * Math.Cos(value);
            }
        }

		public double R
		{
			get{ return Math.Sqrt( mX * mX + mY * mY + mZ * mZ ); }
			set
            {
                if (R != 0)
                    Scale( value / R ); 
            }
		}


		public double Magnitude
		{
			get { return R; }
			set { R = value; }
		}

		public Point3D Normalized
		{
			get
			{
                double factor = 1.0;
                if (R != 0)
                {
                    factor /= R;
                }
                return new Point3D(mX * factor, mY * factor, mZ * factor);
            }
		}


        public Point2D Projected
        {
            get
            {
                if (Z == 0.0) return new Point2D(double.MaxValue, double.MaxValue);
                return new Point2D(X / Z, Y / Z);
            }
        }

		#endregion

		
		#region static functions
        public static bool operator ==(Point3D A, Point3D B)
        {
            if ((object)A == null || (object)B == null)
                return ((object)A == null && (object)B == null);

            return A.X == B.X && A.Y == B.Y && A.Z == B.Z;
        }
        public static bool operator !=(Point3D A, Point3D B)
        {
            return !(A == B);
        }

        public static Point3D operator + (Point3D A, Point3D B)
        {
            return new Point3D( A.X + B.X, A.Y + B.Y, A.Z + B.Z );
        }
        public static Point3D operator - (Point3D A, Point3D B)
        {
            return new Point3D( A.X - B.X, A.Y - B.Y, A.Z - B.Z );
        }

        public static Point3D operator -(Point3D A)
        {
            return new Point3D( -A.X, -A.Y, -A.Z );
        }

        public static Point3D operator *(double Scale, Point3D A)
        {
            return new Point3D(Scale * A.X, Scale * A.Y, Scale * A.Z);
        }

        public static Point3D operator *(Point3D A, double Scale)
        {
            return new Point3D(Scale * A.X, Scale * A.Y, Scale * A.Z);
        }

        public static Point3D operator /(Point3D A, double invScale)
        {
            return new Point3D(A.X / invScale, A.Y / invScale, A.Z / invScale);
        }

        public static double Dot(Point3D A, Point3D B) 
		{
			return A.X*B.X + A.Y*B.Y + A.Z*B.Z;
		}
		
		public static Point3D Cross( Point3D A, Point3D B )
		{
			return new Point3D( A.Y*B.Z - A.Z*B.Y,
								A.Z*B.X - A.X*B.Z,
								A.X*B.Y - A.Y*B.X );
		}

        /// <summary>
        /// 
        /// </summary>
        /// <param name="R">distance from origin</param>
        /// <param name="Phi">inclination/declination, angle down from +z axis</param>
        /// <param name="Theta">azimuthal, the angle about the z axis starting from the x axis </param>
        /// <returns></returns>
        public static Point3D FromSphericalCoords(double R, double Phi, double Theta)
        {
            return new Point3D(
                R * Math.Sin(Phi) * Math.Cos(Theta),
                R * Math.Sin(Phi) * Math.Sin(Theta),
                R * Math.Cos(Phi));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="R">distance from z-axis</param>
        /// <param name="Z">distance up from XY Plane (z-coord)</param>
        /// <param name="Theta">the angle about the z axis starting from the x axis </param>
        /// <returns></returns>
        public static Point3D FromCylindricalCoords(double R, double Z, double Theta)
        {
            return new Point3D(
                R * Math.Cos(Theta),
                R * Math.Sin(Theta),
                Z);
        }


        /// <summary>
        /// returns angle of ABC (B is vertex)
        /// </summary>
        /// <param name="A"></param>
        /// <param name="B"></param>
        /// <param name="C"></param>
        /// <returns></returns>
        public static double Angle(Point3D A, Point3D B, Point3D C)
        {
            if ((A - B).R == 0 || (C - B).R == 0)
                return 0.0;

            double dotproduct = Point3D.Dot((A - B).Normalized, (C - B).Normalized);
            if (dotproduct <= -1.0) return DMS.HALFTAU;
            if (dotproduct >= 1.0 ) return 0.0;
            return Math.Acos( dotproduct );

            //return (Math.Acos(Point3D.Dot((A - B).Normalized, (C - B).Normalized)));
        }

        /// <summary>
        /// returns the angle between 
        /// the plane containing points ABO and 
        /// the plane containing points CBO 
        /// where O is the origin
        /// </summary>
        /// <param name="A"></param>
        /// <param name="B"></param>
        /// <param name="C"></param>
        /// <returns></returns>
        public static double DihedralAngle(Point3D A, Point3D B, Point3D C)
        {
            double result = -1.0;
            try
            {
                Point3D normal1 = Point3D.Cross(A - B, B );
                Point3D normal2 = Point3D.Cross(C - B, B);
                result = Point3D.Angle(normal1, Point3D.Origin, normal2);
            }
            catch {}

            return result;
        }

        public static Point3D YAxis { get { return new Point3D(0, 1, 0); } }
        public static Point3D XAxis { get { return new Point3D(1, 0, 0); } }
        public static Point3D ZAxis { get { return new Point3D(0, 0, 1); } }
        public static Point3D Origin { get { return new Point3D(0, 0, 0); } }
        #endregion

        #region public functions

        override public String ToString()
        {
            return "(" + X.ToString() + "," + Y.ToString() + "," + Z.ToString() + ")";
        }

        public void Normalize()
		{
            if (R != 0)
            {
                Scale(1.0 / R);
            }
		}

		public void Scale( double factor )
		{
			mX *= factor;
			mY *= factor;
			mZ *= factor;
		}

        public Point3D ScaledTo(double newLength )
        {
            Point3D result = new Point3D(this);
            result.R = newLength;
            return result;
        }

        /// <summary>
        /// Projects a given point from (0,0,1) through the given point to the X,Y plane
        /// </summary>
        /// <returns></returns>
        public Point2D StereographicToPlane()
        {
            if (Z == 1.0)
                return Point2D.Origin;

            return new Point2D(X / (1 - Z), Y / (1 - Z));
        }

        public Point2D Mercator()
        {
            double Latitude = DMS.QUARTERTAU - Phi ;  //we want  North Pole: phi == 0, lat == +90 (tau/4);  Equator: phi == tau/4, lat == 0
            return new Point2D(Theta, Math.Log((Math.Sin(Latitude) + 1) / Math.Cos(Latitude)));
        }

        /// <summary>
        /// turns a 2D position into a point on the unit sphere.
        /// </summary>
        /// <param name="pos"> position on mercator in radians x is typically = [0..PI], yequator is 0, north is positive</param>
        /// <returns></returns>
        public static Point3D FromMercator(Point2D pos)
        {
            double Latitude = Math.Atan( Math.Sinh(pos.Y));
            return Point3D.FromSphericalCoords(1.0, DMS.QUARTERTAU - Latitude, pos.X); 
        }

		#endregion

    }
}
