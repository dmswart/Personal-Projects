using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DMSLib
{
    public class Rotation
    {
		#region Member Variables
        private double mQ0;
        private double mQX;
        private double mQY;
        private double mQZ;

        private double[,] mMatrix = null;
		#endregion

		#region Constructors

        public Rotation(Rotation A)
        {
            mQ0 = A.Q0;
            mQX = A.QX;
            mQY = A.QY;
            mQZ = A.QZ;
        }

		public Rotation ( )
		{
			mQ0 = 1.0;
			mQX = 0.0;
			mQY = 0.0;
			mQZ = 0.0;
		}

        public Rotation ( double Q0, double QX, double QY, double QZ )
		{
			mQ0 = Q0;
			mQX = QX;
			mQY = QY;
			mQZ = QZ;
            Normalize();
		}

        public Rotation(double Angle, Point3D Axis)
		{
            Axis.Normalize();
            mQ0 = Math.Cos(Angle / 2.0);
            Axis.Scale(Math.Sin(Angle / 2.0));
            mQX = Axis.X;
            mQY = Axis.Y;
            mQZ = Axis.Z;
            Normalize();
		}


		#endregion

		#region Accessors

        public double Q0 { get { return mQ0; } }
        public double QX { get { return mQX; } }
        public double QY { get { return mQY; } }
        public double QZ { get { return mQZ; } }


        public double[,] Matrix
        {
            get
            {
                if (mMatrix == null)
                    mMatrix = new double[3, 3] { {1-2*mQY*mQY-2*mQZ*mQZ, 2*mQX*mQY - 2*mQ0*mQZ, 2*mQ0*mQY + 2*mQX*mQZ},
                                                 {2*mQ0*mQZ + 2*mQX*mQY, 1-2*mQX*mQX-2*mQZ*mQZ, 2*mQY*mQZ - 2*mQ0*mQX},
                                                 {2*mQX*mQZ - 2*mQ0*mQY, 2*mQ0*mQX + 2*mQY*mQZ, 1-2*mQX*mQX-2*mQY*mQY} };
                return mMatrix;
            }
        }

#if false //C code for matrix -> quat
    given: double _mat[9];
	double q0, qx, qy, qz;
	if( 1.0 + _mat[0] + _mat[4] + _mat[8] > 1.0e-7 )
	{
		q0 = sqrt( 1.0 + _mat[0] + _mat[4] + _mat[8]) / 2.0;
		qx = (_mat[7] - _mat[5]) / (q0 * 4.0);
		qy = (_mat[2] - _mat[6]) / (q0 * 4.0);
		qz = (_mat[3] - _mat[1]) / (q0 * 4.0);
	}
	else if( 1.0 + _mat[0] - _mat[4] - _mat[8] > 1.0e-7 )
	{
		qx = sqrt( 1.0 + _mat[0] - _mat[4] - _mat[8] ) / 2.0;
		q0 = (_mat[7] - _mat[5])/ (qx * 4.0);
		qy = (_mat[3] + _mat[1])/ (qx * 4.0);
		qz = (_mat[2] + _mat[6])/ (qx * 4.0);
	}
	else if( 1.0 -_mat[0] + _mat[4] - _mat[8] > 1.0e-7 )
	{
		qy = sqrt(1.0 -_mat[0] + _mat[4] - _mat[8]) / 2.0;
		q0 = (_mat[2]-_mat[6]) / (qy * 4.0);
		qx = (_mat[3]+_mat[1]) / (qy * 4.0);
		qz = (_mat[7]+_mat[5]) / (qy * 4.0);
	}
	else if( 1.0 -_mat[0] - _mat[4] + _mat[8] > 1.0e-7 )
	{
		qz = sqrt(1.0 -_mat[0] - _mat[4] + _mat[8]) / 2.0;
		q0 = (_mat[3]-_mat[1]) / (qz * 4.0);
		qx = (_mat[2]+_mat[6]) / (qz * 4.0);
		qy = (_mat[7]+_mat[5]) / (qz * 4.0);
	}
#endif


        public double Angle
        {
            get { return 2.0 * Math.Acos(mQ0); }
            set
            {
                mQ0 = Math.Cos(value);
                double vectorscale = Math.Sin(value) / Math.Sqrt(mQX * mQX + mQY * mQY + mQZ * mQZ);
                mQX *= vectorscale;
                mQY *= vectorscale;
                mQZ *= vectorscale;
                Normalize();
            }
        }

        public Point3D Axis
        {
            get { return new Point3D( mQX, mQY, mQZ ).Normalized; }
            set
            {
                value.R = Math.Sin(Math.Acos(mQ0));
                mQX = value.X;
                mQY = value.Y;
                mQZ = value.Z;
                Normalize();
            }
        }

        public Rotation Inverse
        {
            get { return new Rotation(mQ0, -mQX, -mQY, -mQZ); }
        }

        #endregion

		
		#region static functions
        public static Rotation Identity
        {
            get { return new Rotation(); }
        }

        static public Rotation operator * (Rotation A, Rotation B)
        {
            return new Rotation( A.Q0 * B.Q0 - A.QX * B.QX - A.QY * B.QY - A.QZ * B.QZ,
                                 A.Q0 * B.QX + A.QX * B.Q0 + A.QY * B.QZ - A.QZ * B.QY,
                                 A.Q0 * B.QY + A.QY * B.Q0 + A.QZ * B.QX - A.QX * B.QZ,
                                 A.Q0 * B.QZ + A.QZ * B.Q0 + A.QX * B.QY - A.QY * B.QX);
        }

        static public Rotation operator -(Rotation A)
        {
            return new Rotation(-A.Q0, A.QX, A.QY, A.QZ);
        }


        #endregion

        #region public functions

        override public String ToString()
        {
            return "(" + Q0.ToString() + "," + QX.ToString() + "," + QY.ToString() + "," + QZ.ToString() + ")";
        }

        public Point3D Rotate(Point3D B)
        {
            return new Point3D(Matrix[0, 0] * B.X + Matrix[0, 1] * B.Y + Matrix[0, 2] * B.Z,
                               Matrix[1, 0] * B.X + Matrix[1, 1] * B.Y + Matrix[1, 2] * B.Z,
                               Matrix[2, 0] * B.X + Matrix[2, 1] * B.Y + Matrix[2, 2] * B.Z);
        }

        public void Invert()
        {
            mQX = -mQX;
            mQY = -mQY;
            mQZ = -mQZ;
            Normalize();
        }

		#endregion

		#region Private Functions


		private void Normalize()
		{
			double magnitude = Math.Sqrt( mQ0*mQ0 + mQX*mQX + mQY*mQY + mQZ*mQZ );
			if( mQ0 < 0 ) 
				magnitude *= -1.0;
			mQ0 /= magnitude;
			mQX /= magnitude;
			mQY /= magnitude;
			mQZ /= magnitude;

            mMatrix = null;
		}
		#endregion
    }
}
