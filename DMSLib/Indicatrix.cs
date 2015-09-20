using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace DMSLib
{
    public class Net
    {
        #region Member variables
        public Indicatrix[,] m_Net;
        public int m_Size;
        public int m_IndicatrixCount;
        #endregion

        #region constructor
        public Net(int size)
        {
            m_Size = size;
            m_Net = new Indicatrix[size, size];

            InitializeWithDefault();
            SetNeighbors();
        }

        public Net(String Filename)
            : this(1)
        {
            StreamReader sr = new StreamReader(Filename);
            while (!sr.EndOfStream)
            {
                String[] LinesIn = sr.ReadLine().Split(',');
                if (LinesIn.Count<String>() >= 6)
                {
                    int i = int.Parse(LinesIn[0]);
                    int j = int.Parse(LinesIn[1]);
                    double x = double.Parse(LinesIn[2]);
                    double y = double.Parse(LinesIn[3]);
                    double Theta = double.Parse(LinesIn[4]);
                    double Size = double.Parse(LinesIn[5]);

                    this[i, j] = new Indicatrix(new Point2D(x, y), Theta, Size );
                }
            }
            sr.Close();
            SetNeighbors();
        }
        #endregion

        #region Accessors
        public int Size
        {
            get { return m_Size; }
        }

        public int HalfSize
        {
            get { return m_Size / 2; }
        }
        #endregion

        #region Protected functions
        protected virtual void InitializeWithDefault()
        {
            //default values:
            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++)
                {
                    m_Net[i, j] = new Indicatrix(new Point2D(i, j), 0.0, 1.0 );
                }
            }
        }

        protected virtual void GrowNet(int idxneeded)
        {
            if (idxneeded >= Size)
            {
                int oldsize = m_Size;
                Indicatrix[,] tmp = new Indicatrix[idxneeded + 1, idxneeded + 1];
                for (int i = 0; i < oldsize; i++)
                    for (int j = 0; j < oldsize; j++)
                        tmp[i, j] = m_Net[i, j];
                m_Net = tmp;
                m_Size = idxneeded + 1;
            }
        }
        #endregion

        #region public functions
        public virtual void SetNeighbors()
        {
            m_IndicatrixCount = 0;
            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++)
                {
                    if (m_Net[i, j] != null)
                    {
                        m_Net[i, j].SetNeighbors(j < m_Size - 1 ? m_Net[i, j + 1] : null,
                                                j > 0 ? m_Net[i, j - 1] : null,
                                                i < m_Size - 1 ? m_Net[i + 1, j] : null,
                                                i > 0 ? m_Net[i - 1, j] : null);
                        m_IndicatrixCount++;
                    }
                }
            }
        }

        public void AlignAllPositions()
        {
            foreach (Indicatrix ind in m_Net)
            {
                if( ind != null)
                    ind.Position = ind.Align(ind.Position);
            }
        }
        
        public Indicatrix this[int i, int j]
        {
            get
            {
                GrowNet(Math.Max(i, j));
                return m_Net[i, j];
            }
            set
            {
                GrowNet(Math.Max(i, j));
                m_Net[i, j] = value;
            }
        }

        public int Count
        {
            get { return m_IndicatrixCount; }
        }

        public double Energy
        {
            get
            {
                double result = 0;
                for (int i = 0; i < m_Size; i++)
                {
                    for (int j = 0; j < m_Size; j++)
                    {
                        if (m_Net[i, j] != null)
                            result += m_Net[i, j].Energy;
                    }
                }
                return result / m_IndicatrixCount;
            }
        }

        public virtual void DoubleResolution()
        {
            Indicatrix[,] old = m_Net;
            int oldsize = m_Size;
            m_Size = (m_Size - 1) * 2 + 1;
            m_Net = new Indicatrix[m_Size, m_Size];

            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++ )
                {
                    //copy from original grid
                    if (i % 2 == 0 && j % 2 == 0)
                    {
                        m_Net[i,j] = old[i/2,j/2];
                        if( m_Net[i,j] != null)
                        {
                            m_Net[i,j].Size /= 2.0;
                        }
                    }
                    else
                    {
                        //otherwise any points from the original grid in a 3x3 square around this vertex
						int count = 0;
                        m_Net[i, j] = new Indicatrix(Point2D.Origin, 0, 0.0);
                        for( int ii=i-1;ii<=i+1;ii++)
                        {
                            for(int jj=j-1;jj<=j+1;jj++)
							{
								if( ii < 0 || jj < 0 || ii >= m_Size || jj >= m_Size )
									continue;
								if( ii%2==1 || jj%2 == 1)
									continue;
								if( old[ii/2,jj/2] == null )
									continue;
								count++;
								m_Net[i,j].Position += old[ii/2,jj/2].Position; 
								m_Net[i,j].Size += old[ii/2, jj/2].Size;
								m_Net[i,j].Theta += old[ii/2, jj/2].Theta;
							}
						}
						if( count > 0 )
						{
							m_Net[i,j].Position /= count;
							m_Net[i,j].Size /= count;
							DMS.FixAnglePositive(m_Net[i,j].Theta);
							m_Net[i,j].Theta /= count;
						}
						else
						{
							m_Net[i,j].Size = 1.0;
						}
                    }
                }
            }
        }

        public void Restore()
        {
            for (int i = 0; i < m_Size; i++)
                for (int j = 0; j < m_Size; j++)
                    if (m_Net[i, j] != null)
                        m_Net[i, j].Restore();
        }

        public void Save()
        {
            for (int i = 0; i < m_Size; i++)
                for (int j = 0; j < m_Size; j++)
                    if (m_Net[i, j] != null)
                        m_Net[i, j].Save();
        }

        public void Write(String Filename)
        {
            Write(Filename, false);
        }

        public void Write(String Filename, bool bScale)
        {
            //first lets determine the extents of the net
            Point2D MinExtent = new Point2D(double.MaxValue, double.MaxValue);
            Point2D MaxExtent = new Point2D(double.MinValue, double.MinValue);
            foreach (Indicatrix ind in m_Net)
            {
                if (ind == null) continue;
                if (ind.Position.X < MinExtent.X)
                    MinExtent.X = ind.Position.X;
                if (ind.Position.Y < MinExtent.Y)
                    MinExtent.Y = ind.Position.Y;
                if (ind.Position.X > MaxExtent.X)
                    MaxExtent.X = ind.Position.X;
                if (ind.Position.Y > MaxExtent.Y)
                    MaxExtent.Y = ind.Position.Y;
            }
            double Scale = Math.Max(MaxExtent.X - MinExtent.X, MaxExtent.Y - MinExtent.Y);


            StreamWriter sw = new StreamWriter(Filename);
            for (int i = 0; i < m_Size; i++)
            {
                if (i % 2 == 0)
                {
                    for (int j = 0; j < m_Size; j++)
                    {
                        if (m_Net[i, j] != null)
                        {
                            Point2D PosOut;
                            if (bScale)
                                PosOut = (m_Net[i, j].Position - MinExtent) / Scale * 2.0 - new Point2D(1.0, 1.0);
                            else
                                PosOut = m_Net[i, j].Position;
                            sw.Write(i.ToString() + ", " +
                                      j.ToString() + ", " +
                                      PosOut.X.ToString() + ", " +
                                      PosOut.Y.ToString() + ", " +
                                      m_Net[i, j].Theta.ToString() + ", " +
                                      m_Net[i, j].Size.ToString() + "\n");
                        }
                    }
                }
                else
                {
                    for (int j = m_Size - 1; j >= 0; j--)
                    {
                        if (m_Net[i, j] != null)
                        {
                            Point2D PosOut;
                            if (bScale)
                                PosOut = (m_Net[i, j].Position - MinExtent) / Scale * 2.0 - new Point2D(1.0, 1.0);
                            else
                                PosOut = m_Net[i, j].Position; 
                            sw.Write(i.ToString() + ", " +
                                      j.ToString() + ", " +
                                      PosOut.X.ToString() + ", " +
                                      PosOut.Y.ToString() + ", " +
                                      m_Net[i, j].Theta.ToString() + ", " +
                                      m_Net[i, j].Size.ToString() + "\n");
                        }
                    }
                }
            }
            sw.Close();
        }

        //
        public double Quasiconformality(Point2D A)
        {
            if (A.X > 1.0 || A.X < 0.0 || A.Y > 1.0 || A.Y < 0.0)
            {
                return 0.0;
            }

            A *= (Size-1);
            int U = (int)A.X;
            int V = (int)A.Y;
            Point2D fractional = new Point2D(A.X - U, A.Y - V);
            Point2D s = Point2D.Origin;
            Point2D t = Point2D.Origin;

            if (fractional.X + fractional.Y < 1.0) //bottom left triangle
            {
                if (m_Net[U, V] != null && m_Net[U + 1, V] != null && m_Net[U, V + 1] != null)
                {
                    s = (m_Net[U + 1, V].Position - m_Net[U, V].Position);
                    t = (m_Net[U, V + 1].Position - m_Net[U, V].Position);
                }
            }
            else //top right triangle
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V + 1] != null && m_Net[U + 1, V] != null)
                {
                    s = (m_Net[U, V + 1].Position - m_Net[U + 1, V + 1].Position);
                    t = (m_Net[U + 1, V].Position - m_Net[U + 1, V + 1].Position);
                }
            }

            if (fractional.X > fractional.Y) //bottom right triangle
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V] != null && m_Net[U + 1, V] != null)
                {
                    s = (m_Net[U, V].Position - m_Net[U + 1, V].Position);
                    t = (m_Net[U + 1, V + 1].Position - m_Net[U + 1, V].Position);
                }
            }
            else
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V] != null && m_Net[U, V + 1] != null)
                {
                    s = (m_Net[U + 1, V + 1].Position - m_Net[U, V + 1].Position);
                    t = (m_Net[U, V].Position - m_Net[U, V + 1].Position);
                }
            }

            
            //if s and t are basis vectors, calculate eigen vectors
            double B = s.X + t.Y;
            double C = s.X * t.Y - s.Y * t.X;
            double disc = B * B / 4.0 - C;
            if (disc < 0.0) return 0.0;

            double L1 = Math.Abs(B / 2.0 + Math.Sqrt(disc));
            double L2 = Math.Abs(B / 2.0 - Math.Sqrt(disc));
            if (L1 == 0 || L2 == 0) return 0.0;

            if (L1 > L2) 
                return L1 / L2;
            else 
                return L2 / L1;
        }

        //maps the unit square
        public virtual Point2D Map(Point2D A)
        {
            if (A.X > 1.0 || A.X < 0.0 || A.Y > 1.0 || A.Y < 0.0)
            {
                return null;
            }

            A *= (Size - 1);
            int U = (int)A.X;
            int V = (int)A.Y;
            Point2D fractional = new Point2D(A.X - U, A.Y - V);

            if (fractional.X + fractional.Y < 1.0) //bottom left triangle
            {
                if (m_Net[U, V] != null && m_Net[U + 1, V] != null && m_Net[U, V + 1] != null)
                {
                    return m_Net[U, V].Position +
                           (m_Net[U + 1, V].Position - m_Net[U, V].Position) * fractional.X +
                           (m_Net[U, V + 1].Position - m_Net[U, V].Position) * fractional.Y;
                }
            }
            else //top right triangle
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V + 1] != null && m_Net[U + 1, V] != null)
                {
                    return m_Net[U + 1, V + 1].Position +
                           (m_Net[U, V + 1].Position - m_Net[U + 1, V + 1].Position) * (1.0 - fractional.X) +
                           (m_Net[U + 1, V].Position - m_Net[U + 1, V + 1].Position) * (1.0 - fractional.Y);
                }
            }

            if (fractional.X > fractional.Y) //bottom right triangle
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V] != null && m_Net[U + 1, V] != null)
                {
                    return m_Net[U + 1, V].Position +
                           (m_Net[U, V].Position - m_Net[U + 1, V].Position) * (1.0 - fractional.X) +
                           (m_Net[U + 1, V + 1].Position - m_Net[U + 1, V].Position) * fractional.Y;
                }
            }
            else
            {
                if (m_Net[U + 1, V + 1] != null && m_Net[U, V] != null && m_Net[U, V + 1] != null)
                {
                    return m_Net[U, V + 1].Position +
                           (m_Net[U + 1, V + 1].Position - m_Net[U, V + 1].Position) * fractional.X +
                           (m_Net[U, V].Position - m_Net[U, V + 1].Position) * (1.0 - fractional.Y);
                }
            }

            return null;
        }

        public Point2D InvMap(Point2D A)
        {
            Point2D v0, v1, v2;
            double dot00, dot01, dot02, dot11, dot12, invDenom, u, v;
            for( int i=0; i<Size; i++ )
            {
                for (int j = 0; j < Size; j++)
                {
                    Indicatrix ind = m_Net[i, j];
                    if (ind == null)
                        continue;

                    if (ind.East != null && ind.South != null)
                    {
                        v0 = ind.East.Position - ind.Position;
                        v1 = ind.South.Position - ind.Position;
                        v2 = A - ind.Position;

                        dot00 = Point2D.Dot(v0, v0);
                        dot01 = Point2D.Dot(v0, v1);
                        dot02 = Point2D.Dot(v0, v2);
                        dot11 = Point2D.Dot(v1, v1);
                        dot12 = Point2D.Dot(v1, v2);

                        invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
                        u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                        v = (dot00 * dot12 - dot01 * dot02) * invDenom;

                        if (u > -DMS.EPSILON && v > -DMS.EPSILON && u + v < 1.0 + DMS.EPSILON)
                        {
                            return new Point2D((double)i + u, (double)j - v) / (double)Size;
                        }
                    }

                    if (ind.West != null && ind.North != null)
                    {
                        v0 = ind.West.Position - ind.Position;
                        v1 = ind.North.Position - ind.Position;
                        v2 = A - ind.Position;

                        dot00 = Point2D.Dot(v0, v0);
                        dot01 = Point2D.Dot(v0, v1);
                        dot02 = Point2D.Dot(v0, v2);
                        dot11 = Point2D.Dot(v1, v1);
                        dot12 = Point2D.Dot(v1, v2);

                        invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
                        u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                        v = (dot00 * dot12 - dot01 * dot02) * invDenom;

                        if (u > -DMS.EPSILON && v > -DMS.EPSILON && u + v < 1.0 + DMS.EPSILON)
                        {
                            return new Point2D((double)i - u, (double)j + v) / (double)Size;
                        }
                    }
                }
            }

            return null;
        }

        public void AlignEdge(Indicatrix A, Indicatrix B, Aligner Al)
        {
            Point2D 
                APos = null, 
                BPos = null;

            for (int i = 0; i < m_Size; i++ )
            {
                for( int j=0; j<m_Size; j++ )
                {
                    if( m_Net[i,j]==A) APos = new Point2D(i,j);
                    if( m_Net[i,j]==B) BPos = new Point2D(i,j);
                }
            }

            for (int i = 0; i < m_Size; i++ )
            {
                for( int j=0; j<m_Size; j++ )
                {
                    if (m_Net[i,j] == null)
                        continue;
                    Point2D indexpos = new Point2D(i,j);

                    if (indexpos == A.Position || 
                        indexpos == B.Position ||
                        Math.Abs(Point2D.Angle(APos, indexpos, BPos) - Math.PI) < 1.0e-3)
                    {
                        m_Net[i,j].Alignment = Al;
                    }
                }
            }
        }
        #endregion
    }


    #region Alignment
    public class Aligner
    {
        public Aligner()
        {
            //nothing
        }
        public virtual void AlignPt(ref Point2D input)
        {
            //do nothing;
        }

        public double DistanceOut(Point2D input)
        {
            Point2D tmp = new Point2D(input);
            AlignPt(ref tmp);
            return (tmp - input).R;
        }
    }

    public class AlignToArc : Aligner
    {
        private Point2D m_center;
        private double m_Radius;
        private double m_BeginningTheta; 
        private double m_EndTheta;

        public Point2D Center { get { return m_center; } set { m_center = value; } }
        public double Radius { get { return m_Radius; } set { m_Radius = value; } }

        public AlignToArc(Point2D center, double Radius, Point2D StartPt, Point2D EndPt)
        {
            m_center = center;
            m_Radius = Radius;
            m_BeginningTheta = DMS.FixAnglePositive((StartPt - center).Theta);
            m_EndTheta = DMS.FixAnglePositive((EndPt - center).Theta);
            while (m_EndTheta < m_BeginningTheta)
                m_EndTheta += 2.0 * Math.PI;
        }

        public AlignToArc(Point2D center, double Radius)
        {
            m_center = center;
            m_Radius = Radius;
            m_BeginningTheta = -1; // less than lower bound on Theta (i.e., 0)
            m_EndTheta = 7; // greater than upperbound on theta (i.e., 2*PI)
        }

        public override void AlignPt(ref Point2D input)
        {
            // we take our input and subtract center and then project to the desired radius.
            Point2D newpt = (input - m_center).ScaledTo(m_Radius);

            // then we cap the theta to our specified range.
            double newtheta = DMS.FixAnglePositive(newpt.Theta);
            while (newtheta < m_BeginningTheta)
                newtheta += 2.0 * Math.PI;

            if (newtheta > m_EndTheta &&  
                m_BeginningTheta > (newtheta - 2.0 * Math.PI))
            {
                if( newtheta - m_EndTheta > m_BeginningTheta - (newtheta - 2.0 * Math.PI) )
                    newtheta = m_BeginningTheta;
                else
                    newtheta = m_EndTheta;
            }
            newpt.Theta = newtheta;

            //now we add back the center to offset things back to where they should be
            input = newpt + m_center;
        }

    }

    public class AlignToSeg : Aligner
    {
        Point2D m_ptA;
        Point2D m_ptB;
        Point2D m_dir; //precalcs for AlignPt
        double m_dist; //precalcs for AlignPt

        public AlignToSeg(Point2D A, Point2D B)
        {
            m_ptA = A;
            m_ptB = B;
            m_dir = (B - A).Normalized;
            m_dist = (B - A).R;
        }

        public override void AlignPt(ref Point2D input)
        {
            double dot = Point2D.Dot(m_dir, input - m_ptA);
            if (dot < 0)
                input = m_ptA;
            else if (dot > m_dist)
                input = m_ptB;
            else
                input = m_ptA + dot * m_dir;
        }
    }

    public class AlignFixed : Aligner
    {
        Point2D m_ptA;
        public AlignFixed(Point2D A) { m_ptA = A; }
        public override void AlignPt(ref Point2D input) { input = m_ptA; }
    }

    public class AlignCombo : Aligner
    {
        List<Aligner> m_AlignerList;
        public AlignCombo()
        {
            m_AlignerList = new List<Aligner>();
        }

        public void AddAligner(Aligner a)
        {
            m_AlignerList.Add(a);
        }

        public override void AlignPt(ref Point2D input)
        {
            double distance = double.MaxValue;
            if( m_AlignerList.Count == 0 )
                return;

            Aligner alignertouse = m_AlignerList[0];

            foreach (Aligner a in m_AlignerList)
            {
                if (a.DistanceOut(input) < distance)
                {
                    distance = a.DistanceOut(input);
                    alignertouse = a;
                }
            }

            alignertouse.AlignPt(ref input);
        }
    }
    #endregion
    
    
    public class Indicatrix
    {
        protected Point2D m_Position;
        protected double m_Theta;
        protected double m_Size;
        protected Indicatrix m_North;
        protected Indicatrix m_South;
        protected Indicatrix m_East;
        protected Indicatrix m_West;

        protected Point2D m_SavedPosition;
        protected double m_SavedTheta;
        protected double m_SavedSize;

        protected Aligner m_Alignment;

        protected static Random r = new Random();



        public Indicatrix(Point2D pos, double theta, double size)
        {
            m_Position = pos;
            m_Theta = theta;
            m_Size = size;

            Save();

            m_North = m_South = m_East = m_West = null;

            m_Alignment = new Aligner();
        }

        public void SetNeighbors(Indicatrix North, Indicatrix South, Indicatrix East, Indicatrix West)
        {
            m_North = North;
            m_South = South;
            m_East = East;
            m_West = West;
        }

        public Point2D Position
        {
            get { return m_Position; }
            set { m_Position = value; }
        }
        public double Theta
        {
            get { return m_Theta; }
            set { m_Theta = value; }
        }
        public double Size
        {
            get { return m_Size; }
            set { m_Size = value; }
        }


        public Indicatrix North { get { return m_North; } set { m_North = value; }  }
        public Indicatrix South { get { return m_South; } set { m_South = value; } }
        public Indicatrix East { get { return m_East; } set { m_East = value; } }
        public Indicatrix West { get { return m_West; } set { m_West = value; } }
        public Aligner Alignment { get { return m_Alignment; } set { m_Alignment = value; } }

        public virtual double Energy
        {
            get
            {
                double result = 0;
                if (m_East != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta) - m_East.Position).R;
                if (m_North != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta + Math.PI / 2) - m_North.Position).R;
                if (m_West != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta + Math.PI) - m_West.Position).R;
                if (m_South != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta - Math.PI / 2) - m_South.Position).R;

                result /= Size;

                return result*result;
            }
        }

		public Point2D Align( Point2D newpos )
		{
            Point2D tmp = new Point2D(newpos);
            m_Alignment.AlignPt(ref tmp);
            return tmp;
		}

        public void Jitter(double Strength)
        {
			Point2D newpos = m_Position + new Point2D( (r.NextDouble() -  0.5) * Strength, (r.NextDouble() -  0.5) * Strength );
            m_Position = Align(newpos);
            m_Theta += (r.NextDouble() - 0.5) * Strength;
            m_Size += (r.NextDouble() - 0.5) * Strength;
        }

        public virtual void Stretch( bool bAlign)
        {
            Point2D newpos = new Point2D();
            int count = 0;

            if (North != null && South != null) 
            {
                newpos += North.Position; count++;
                newpos += South.Position; count++;
            }
            if (East != null && West != null)
            {
                newpos += East.Position; count++;
                newpos += West.Position; count++;
            }

            if (count > 0)
            {
                newpos /= (double)count;
                m_Position = bAlign ? Align(newpos) : newpos;
                return;
            }

            if (North != null) { newpos += North.Position; count++; }
            if (South != null) { newpos += South.Position; count++; }
            if (East != null) { newpos += East.Position; count++; }
            if (West != null) { newpos += West.Position; count++; }
            if (count > 0)
            {
                newpos /= (double)count;
                m_Position = bAlign ? Align(newpos) : newpos;
                return;
            }
        }

        public virtual void Step()
        {
            int count = 0;

            //Position, theta
            Point2D newpos = new Point2D();
            double deltatheta = 0;
            double newsize = 0;
            if (East != null && West != null)
            {
                newpos += East.Position + West.Position;
                deltatheta += 2.0 * DMS.FixAngle((East.Position - West.Position).Theta - Theta); //theta points east so we compare east-west
                newsize += (West.Position - Position).R + (East.Position - Position).R;
                count += 2;
            }
            else if (East != null)
            {
                newpos += East.Position + Point2D.FromPolar(East.Size, East.Theta + Math.PI);
                deltatheta += DMS.FixAngle((East.Position - m_Position).Theta - Theta);
                newsize += (East.Position - Position).R;
                count++;
            }
            else if (West != null)
            {
                newpos += West.Position + Point2D.FromPolar(West.Size, West.Theta);
                deltatheta += DMS.FixAngle((West.Position - m_Position).Theta - (Theta + Math.PI));
                newsize += (West.Position - Position).R;
                count++;
            }

            if (North != null && South != null)
            {
                newpos += North.Position + South.Position;
                deltatheta += 2.0 * DMS.FixAngle((North.Position - South.Position).Theta - (Theta + Math.PI / 2.0)); //theta + pi/2 points north so we compare north - south
                newsize += (South.Position - Position).R+ (North.Position - Position).R;
                count += 2;
            }
            else if (North != null)
            {
                newpos += North.Position + Point2D.FromPolar(North.Size, North.Theta - Math.PI / 2.0);
                deltatheta += DMS.FixAngle((North.Position - m_Position).Theta - (Theta + Math.PI / 2.0));
                newsize += (North.Position - Position).R;
                count++;
            }
            else if (South != null)
            {
                newpos += South.Position + Point2D.FromPolar(South.Size, South.Theta + Math.PI / 2.0);
                deltatheta += DMS.FixAngle((South.Position - m_Position).Theta - (Theta - Math.PI / 2.0));
                newsize += (South.Position - Position).R;
                count++;
            }

            if (count == 0)
                return;

            newpos /= count;
            deltatheta /= count;
            newsize /= count;


            /////////////////
            // set final values for theta and size and position
            //if (newsize < 1.0e-4) newsize = 1.0e-4;


            m_Theta += deltatheta;
            m_Size = newsize;
			m_Position = Align(newpos);
        }

        public void Save()
        {
            m_SavedPosition = new Point2D(m_Position);
            m_SavedSize = m_Size;
            m_SavedTheta = m_Theta;
        }

        public void Restore()
        {
            m_Position = new Point2D(m_SavedPosition);
            m_Size = m_SavedSize;
            m_Theta = m_SavedTheta;
        }
    }
}
