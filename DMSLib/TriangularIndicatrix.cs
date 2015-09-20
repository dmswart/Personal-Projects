using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace DMSLib
{
    public class TriangularNet : Net
    {
        public TriangularNet(int size)
            : base(1)
        {
            m_Size = size;
            m_Net = new TriangularIndicatrix[size, size];

            InitializeWithDefault();
            SetNeighbors();
        }

        public TriangularNet(String Filename)
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

                    this[i, j] = new TriangularIndicatrix(new Point2D(x, y), Theta, Size);
                }
            }
            sr.Close();
            SetNeighbors();
        }

        #region Protected functions
        protected override void InitializeWithDefault()
        {
            //default values:
            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++)
                {
                    m_Net[i, j] = new TriangularIndicatrix(new Point2D(i, j), 0.0, 1.0);
                }
            }
        }

        protected virtual void GrowNet(int idxneeded)
        {
            if (idxneeded >= Size)
            {
                int oldsize = m_Size;
                Indicatrix[,] tmp = new TriangularIndicatrix[idxneeded + 1, idxneeded + 1];
                for (int i = 0; i < oldsize; i++)
                    for (int j = 0; j < oldsize; j++)
                        tmp[i, j] = m_Net[i, j];
                m_Net = tmp;
                m_Size = idxneeded + 1;
            }
        }
        #endregion

        public override void SetNeighbors()
        {
            m_IndicatrixCount = 0;
            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++)
                {
                    TriangularIndicatrix triInd = m_Net[i,j] as TriangularIndicatrix;
                    if (triInd != null) 
                    {
                        triInd.SetNeighbors(j < m_Size - 1 ? m_Net[i, j + 1] : null,
                                            j > 0 ? m_Net[i, j - 1] : null,
                                            i < m_Size - 1 ? m_Net[i + 1, j] : null,
                                            i > 0 ? m_Net[i - 1, j] : null,
                                            (j < m_Size - 1 && i < m_Size - 1) ? m_Net[i + 1, j + 1] : null,
                                            (j > 0 && i > 0) ? m_Net[i - 1, j - 1] : null);
                        m_IndicatrixCount++;
                    }
                }
            }
        }

        public override void DoubleResolution()
        {
            Indicatrix[,] old = m_Net;
            int oldsize = m_Size;
            m_Size = (m_Size - 1) * 2 + 1;
            m_Net = new Indicatrix[m_Size, m_Size];

            for (int i = 0; i < m_Size; i++)
            {
                for (int j = 0; j < m_Size; j++)
                {
                    //copy from original grid
                    if (i % 2 == 0 && j % 2 == 0)
                    {
                        m_Net[i, j] = old[i / 2, j / 2];
                        if (m_Net[i, j] != null)
                        {
                            m_Net[i, j].Size /= 2.0;
                        }
                    }
                    else
                    {
                        //otherwise any points from the original grid in a 3x3 square around this vertex
                        int count = 0;
                        m_Net[i, j] = new TriangularIndicatrix(Point2D.Origin, 0, 0.0);
                        for (int ii = i - 1; ii <= i + 1; ii++)
                        {
                            for (int jj = j - 1; jj <= j + 1; jj++)
                            {
                                if (ii < 0 || jj < 0 || ii >= m_Size || jj >= m_Size) //off the screen
                                    continue;
                                if (ii % 2 == 1 || jj % 2 == 1) // vertices with odd indices are new / not set yet.
                                    continue;
                                if (ii == i - 1 && jj == j + 1 || ii == i + 1 && jj == j - 1) //in a triangular matrix, these NorthWest / SouthEast diagonal points are too far away
                                    continue;
                                if (old[ii / 2, jj / 2] == null) //old vertices are not there.
                                    continue;
                                count++;
                                m_Net[i, j].Position += old[ii / 2, jj / 2].Position;
                                m_Net[i, j].Size += old[ii / 2, jj / 2].Size;
                                m_Net[i, j].Theta += old[ii / 2, jj / 2].Theta;
                            }
                        }
                        if (count > 0)
                        {
                            m_Net[i, j].Position /= count;
                            m_Net[i, j].Size /= count;
                            DMS.FixAnglePositive(m_Net[i, j].Theta);
                            m_Net[i, j].Theta /= count;
                        }
                        else
                        {
                            m_Net[i, j].Size = 1.0;
                        }
                    }
                }
            }
        }

        /////////////////////////////////////////////////////////////////////////
        //maps a parallelogram made of two equilateral triangles with base 0..1 on x axis

        //            |
        //  _       1 +
        // √3/2 ______|_____ 
        //      \     |     /\
        //       \    |    /  \
        //        \   |   /    \
        //         \  |  /      \
        //          \ | /        \
        //           \|/          \
        //  ----+-----+------+-----+--
        //    -0.5    |     0.5    1
        public override Point2D Map(Point2D A)
        {
            if (A.X > 1.0 || A.X < 0.0 || A.Y > 1.0 || A.Y < 0.0)
            {
                return null;
            }

            A.Y /= Math.Sqrt(3.0) / 2.0;  //stretch parallelogram vertically to get to 1.0
            A.X += A.Y / 2.0;             //shear the parallelogram into the unit square
            return base.Map(A);
        }

    }


    public class TriangularIndicatrix : Indicatrix
    {

        private Indicatrix m_NorthEast;
        private Indicatrix m_SouthWest;

        public TriangularIndicatrix(Point2D pos, double theta, double size) : base(pos, theta, size)
        {
            m_NorthEast = null;
            m_SouthWest = null;
        }

        public void SetNeighbors(Indicatrix North, Indicatrix South, Indicatrix East, Indicatrix West, Indicatrix NorthEast, Indicatrix SouthWest)
        {
            SetNeighbors(North,South,East,West);
            m_NorthEast = NorthEast;
            m_SouthWest = SouthWest;
        }


        public Indicatrix NorthEast { get { return m_NorthEast; } set { m_NorthEast = value; } }
        public Indicatrix SouthWest { get { return m_SouthWest; } set { m_SouthWest = value; } }


        public override double Energy
        {
            get
            {
                double result = 0;
                if (m_East != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta) - m_East.Position).R;
                if (m_North != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta + Math.PI * 2 / 3) - m_North.Position).R;
                if (m_West != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta + Math.PI) - m_West.Position).R;
                if (m_South != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta - Math.PI / 3) - m_South.Position).R;
                if (m_SouthWest != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta - Math.PI * 2 / 3) - m_SouthWest.Position).R;
                if (m_NorthEast != null)
                    result += (m_Position + Point2D.FromPolar(m_Size, m_Theta + Math.PI / 3) - m_NorthEast.Position).R;

                result /= Size;

                return result * result;
            }
        }


        public override void Stretch(bool bAlign)
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
            if (NorthEast != null && SouthWest != null)
            {
                newpos += NorthEast.Position; count++;
                newpos += SouthWest.Position; count++;
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
            if (NorthEast != null) { newpos += NorthEast.Position; count++; }
            if (SouthWest != null) { newpos += SouthWest.Position; count++; }
            if (count > 0)
            {
                newpos /= (double)count;
                m_Position = bAlign ? Align(newpos) : newpos;
                return;
            }
        }

        public override void Step()
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
                deltatheta += 2.0 * DMS.FixAngle((North.Position - South.Position).Theta - (Theta + Math.PI * 2.0 / 3.0)); //theta + 2*pi/3 points north so we compare north - south
                newsize += (South.Position - Position).R + (North.Position - Position).R;
                count += 2;
            }
            else if (North != null)
            {
                newpos += North.Position + Point2D.FromPolar(North.Size, North.Theta - Math.PI / 3.0);
                deltatheta += DMS.FixAngle((North.Position - m_Position).Theta - (Theta + Math.PI * 2.0 / 3.0));
                newsize += (North.Position - Position).R;
                count++;
            }
            else if (South != null)
            {
                newpos += South.Position + Point2D.FromPolar(South.Size, South.Theta + Math.PI * 2.0 / 3.0);
                deltatheta += DMS.FixAngle((South.Position - m_Position).Theta - (Theta - Math.PI));
                newsize += (South.Position - Position).R;
                count++;
            }

            if (NorthEast != null && SouthWest != null)
            {
                newpos += NorthEast.Position + SouthWest.Position;
                deltatheta += 2.0 * DMS.FixAngle((NorthEast.Position - SouthWest.Position).Theta - (Theta + Math.PI / 3.0)); //theta + pi/2 points north so we compare north - south
                newsize += (SouthWest.Position - Position).R + (NorthEast.Position - Position).R;
                count += 2;
            }
            else if (NorthEast != null)
            {
                newpos += NorthEast.Position + Point2D.FromPolar(NorthEast.Size, NorthEast.Theta - Math.PI * 2.0 / 3.0);
                deltatheta += DMS.FixAngle((NorthEast.Position - m_Position).Theta - (Theta + Math.PI / 3.0));
                newsize += (NorthEast.Position - Position).R;
                count++;
            }
            else if (SouthWest != null)
            {
                newpos += SouthWest.Position + Point2D.FromPolar(SouthWest.Size, SouthWest.Theta + Math.PI / 3.0);
                deltatheta += DMS.FixAngle((SouthWest.Position - m_Position).Theta - (Theta - Math.PI * 2.0 / 3.0));
                newsize += (SouthWest.Position - Position).R;
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
    }
}