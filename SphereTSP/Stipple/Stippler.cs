using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace Stipple
{
    class Stippler
    {
        //member variables
        private DMSImage m_Source = null;
        private List<Point3D> m_Cities = new List<Point3D>();
        private Random m_rand = new Random(DateTime.Now.Millisecond);
        private double m_GlobalRadius;
        private double m_JitterRadius;
        private double m_YangSearchRadius;
        private int m_progress;
        private List<int> [] m_NeighborList;
        private bool m_CancelPending = false;

        private int m_emptyareacount = 0;
        private int m_totalareacount = 0;
        private double m_SumGreyValues = 0.0;

        public Stippler ( int nPoints ) : this( nPoints, String.Empty ) {}

        public Stippler(int nPoints, String SourceFileName)
        {
            try { m_Source = new DMSImage(SourceFileName); }
            catch { m_Source = null; }

            //add the cities
            for (int i = 0; i < nPoints; i++) AddCity();

            m_NeighborList = new List<int> [nPoints];
            for (int i = 0; i < nPoints; i++)
                m_NeighborList[i] = new List<int>();

            // upper bound calculated by dividing 4pi sr by num cities and getting the radius of a spherical cap with that area
            m_YangSearchRadius = Math.Acos(1.0 - 2.0 / m_Cities.Count());
            
            //based on amount of blank space, and number of cities, st. 60 cities yields a 0.025 jitter radius
            m_JitterRadius = 0.193649167 / Math.Sqrt((double)m_Cities.Count() / (m_totalareacount - m_emptyareacount) * m_totalareacount);
            m_JitterRadius /= m_SumGreyValues / m_Cities.Count();
        }

        public Stippler(String CSVFilename) : this(CSVFilename, String.Empty) {}

        public Stippler(String CSVFilename, String SourceFileName )
        {
            try { m_Source = new DMSImage(SourceFileName); }
            catch { m_Source = null; }

            StreamReader sr = new StreamReader(CSVFilename);
            while (!sr.EndOfStream)
            {
                String linein = sr.ReadLine();
                string[] split = linein.Split(new Char[] { ',' });
                m_Cities.Add(new Point3D(double.Parse(split[0]), double.Parse(split[1]), double.Parse(split[2])));
            }

            m_NeighborList = new List<int>[m_Cities.Count];
            for (int i = 0; i < m_Cities.Count; i++)
                m_NeighborList[i] = new List<int>();

            // upper bound calculated by dividing 4pi sr by num cities and getting the radius of a spherical cap with that area
            m_YangSearchRadius = Math.Acos(1.0 - 2.0 / m_Cities.Count());

        }




        public void DoYinYang()
        {
            //set the cities radii so that they're not touching.
            m_CancelPending = false;
            m_GlobalRadius = 0.0;
            CalculateNeighbors(Math.Acos(1.0 - 2.0 / m_Cities.Count()));  // upper bound calculated by dividing 4pi sr by num cities and getting the radius of a spherical cap with that area
            m_GlobalRadius = MinDist(false);

            for (m_progress = 0; m_progress < 10000 && !m_CancelPending; m_progress++) 
            {
                if (m_progress == 300) m_JitterRadius *= 0.1;
                Yin(m_progress % 2 == 1);
                Yang();
            }
        }

        public List<String> GetProgressStrings()
        {
            List<String> result = new List<String>();
            result.Add(m_progress.ToString());
            result.Add(m_JitterRadius.ToString());
            result.Add(m_GlobalRadius.ToString());
            result.Add(m_YangSearchRadius.ToString());
            return result;
        }

        #region TSProutines

        private double TSPDist( int a, int b)
        {
            if( a < 0 )
                a += m_Cities.Count;
            if( b < 0 )
                b += m_Cities.Count;
            if( a >= m_Cities.Count )
                a -= m_Cities.Count;
            if( b >= m_Cities.Count )
                b -= m_Cities.Count;

            return Math.Acos( Point3D.Dot( m_Cities[a], m_Cities[b]) );
        }

        /*************************
         * randomize.
         **************************/
        private void Randomize()
        {
            for (int i = m_Cities.Count-1; i > 0; i--)
            {
                int j = m_rand.Next(i);
                Point3D tmp = m_Cities[i];
                m_Cities[i] = m_Cities[j];
                m_Cities[j] = tmp;
            }
        }


        
        //go through edge swap combinations, (no loops, edge A mustn't stay as is).
        enum combos { AAp_BBp_CCp,
              AAp_BC_BpCp,
              AB_ApBp_CCp,
              AB_ApC_BpCp,
              ABp_ApC_BCp,
              ABp_ApCp_BC,
              AC_ApBp_BCp,
              AC_ApCp_BBp };

        private void ThreeOpt()
        {
            int a, b, c;
            double AAp, BBp, CCp, BC, BpCp, AB, ApBp, ApC, ABp, BCp, ApCp, AC;

            while (!m_CancelPending)
            {
                a = m_rand.Next(m_Cities.Count);
                
                do 
                {
                    b = m_rand.Next(m_Cities.Count);
                } while ( Math.Abs(a - b) < 2 || Math.Abs(a - b) == m_Cities.Count - 1 );

                do
                {
                    c = m_rand.Next(m_Cities.Count);
                } while (Math.Abs(b - c) < 2 || Math.Abs(a - c) < 2 || Math.Abs(b - c) == m_Cities.Count - 1 || Math.Abs(a - c) == m_Cities.Count - 1);

				if( b < a ) { int tmp = a; a = b; b = tmp; }
				if( c < a ) { int tmp = a; a = c; c = tmp; }
				if( c < b ) { int tmp = b; b = c; c = tmp; }
				
                AAp = TSPDist(a, a + 1);
				BBp = TSPDist(b, b+1);
				AB = TSPDist(a,b);
				ApBp = TSPDist(a+1,b+1);
				ABp = TSPDist(a,b+1);
				CCp = TSPDist(c, c+1);
				BC = TSPDist(b, c);
				BpCp = TSPDist(b+1,c+1);
				ApC = TSPDist(a+1, c);
				BCp = TSPDist(b,c+1);
				ApCp = TSPDist(a+1,c+1);
				AC = TSPDist(a,c);


                double[] dists = new double[8];

                dists[(int)combos.AAp_BBp_CCp] = AAp+BBp+CCp;
                dists[(int)combos.AAp_BC_BpCp] = AAp+BC+BpCp;
                dists[(int)combos.AB_ApBp_CCp] = AB+ApBp+CCp;
                dists[(int)combos.AB_ApC_BpCp] = AB+ApC+BpCp;
                dists[(int)combos.ABp_ApC_BCp] = ABp+ApC+BCp;
                dists[(int)combos.ABp_ApCp_BC] = ABp+ApCp+BC;
                dists[(int)combos.AC_ApBp_BCp] = AC+ApBp+BCp;
                dists[(int)combos.AC_ApCp_BBp] = AC+ApCp+BBp;

                //find best arrangement
                combos best = 0;
                double mindist = dists[0];
                for (int i = 1; i < 8; i++)
                {
                	if (dists[i] < mindist)
                	{
                        mindist = dists[i];
                        best = (combos)i;
                    }
                }

                if (best == combos.AAp_BBp_CCp)
                {
                    continue;
                }

                List<Point3D> reoord = new List<Point3D>();
                //We're always gonna start with Ap..B
                for (int i = a + 1; (i % m_Cities.Count) != (b+1)%m_Cities.Count; i++)
                    reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));

                switch (best)
                {
                    case combos.AAp_BC_BpCp:
                        //C..Bp
                        for (int i = c + m_Cities.Count; (i % m_Cities.Count) != b; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //Cp..A
                        for (int i = c + 1; (i % m_Cities.Count) != (a + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.AB_ApBp_CCp:
                        //A..Cp
                        for (int i = a + m_Cities.Count; (i % m_Cities.Count) != c; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //C..Bp
                        for (int i = c + m_Cities.Count; (i % m_Cities.Count) != b; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.AB_ApC_BpCp:
                        //A..Cp
                        for (int i = a + m_Cities.Count; (i % m_Cities.Count) != c; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //Bp..C
                        for (int i = b + 1; (i % m_Cities.Count) != (c + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.ABp_ApC_BCp:
                        //Cp..A
                        for (int i = c + 1; (i % m_Cities.Count) != (a + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //Bp..C
                        for (int i = b + 1; (i % m_Cities.Count) != (c + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.ABp_ApCp_BC:
                        //C..Bp
                        for (int i = c + m_Cities.Count; (i % m_Cities.Count) != b; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //A..Cp
                        for (int i = a + m_Cities.Count; (i % m_Cities.Count) != c; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.AC_ApBp_BCp:
                        //Cp..A
                        for (int i = c + 1; (i % m_Cities.Count) != (a + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //C..Bp
                        for (int i = c + m_Cities.Count; (i % m_Cities.Count) != b; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                    case combos.AC_ApCp_BBp:
                        //Bp..C
                        for (int i = b + 1; (i % m_Cities.Count) != (c + 1) % m_Cities.Count; i++)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        //A..Cp
                        for (int i = a + m_Cities.Count; (i % m_Cities.Count) != c; i--)
                            reoord.Add(new Point3D(m_Cities[i % m_Cities.Count]));
                        break;
                }

                lock (m_Cities)
                {
                    m_Cities = reoord;
                }
            }
        }


        private void InsertionHeuristic()
        {
            for (int i = 2; i < m_Cities.Count(); i++)
            {
                // find j such that Sum( [j,i] [i,j+1] -[j,j+1] )  is minimized
                Point3D newpt = m_Cities[i];
                int minidx = -1;
                double min = double.MaxValue;

                for (int j = 0; j < i; j++)
                {
                    Point3D A = m_Cities[j];
                    Point3D B = m_Cities[(j+1)%i];

                    double tmp = Math.Acos(Point3D.Dot(A, newpt)) +
                                 Math.Acos(Point3D.Dot(newpt, B)) -
                                 Math.Acos(Point3D.Dot(A, B));
                    if (tmp < min)
                    {
                        min = tmp;
                        minidx = j;
                    }
                }

                //now insert newpt after m_Cities[minidx], shift everything else forward by one
                for( int j=i; j>minidx+1; j-- )
                {
                    m_Cities[j] = m_Cities[j - 1];
                }
                m_Cities[minidx+1] = newpt;
            }
        }


        private void NearestNeighbor()
        {
            NearestNeighbor(Math.PI * 2.0);
        }

        private void NearestNeighbor( double max )
        {
            double tmp = double.MaxValue;
            Point3D tmppt;
            for (int i = 1; i < m_Cities.Count && !m_CancelPending; i++)
            {
                m_progress = i; //let the outside world know what's going on
                double mindist = TSPDist(i, i-1);

                int nearestneighboridx = i;
                for (int j = i + 1; j < m_Cities.Count; j++)
                {
                    tmp = TSPDist(j, i-1);

                    if (tmp < mindist)
                    {
                        mindist = tmp;
                        nearestneighboridx = j;
                    }
                }

                //add new city at location i
                if (mindist < max)
                {
                    tmppt = m_Cities[i];
                    m_Cities[i] = m_Cities[nearestneighboridx];
                    m_Cities[nearestneighboridx] = tmppt;
                    continue;
                }

                //otherwise we have to pivot

                //find neighbors of [i-1] with distance < max
                List<int> neighbors = new List<int>();
                for (int j = 0; j < i - 1; j++)
                {
                    if (TSPDist(j, i - 1) < max)
                        neighbors.Add(j);
                }

                if (neighbors.Count < 1) //what can you do?
                {
                    tmppt = m_Cities[i];
                    m_Cities[i] = m_Cities[nearestneighboridx];
                    m_Cities[nearestneighboridx] = tmppt;
                    continue;
                }

                int pivotneighbor = neighbors[m_rand.Next(neighbors.Count)];
                //we're going to swap pivotneighbor+1..i-1
                lock (m_Cities)
                {
                    for (int j = 0; (pivotneighbor + 1) + j < (i - 1) - j; j++)
                    {
                        tmppt = m_Cities[pivotneighbor + 1 + j];
                        m_Cities[pivotneighbor + 1 + j] = m_Cities[i - 1 - j];
                        m_Cities[i - 1 - j] = tmppt;
                    }
                }
                i--;
            }
        }

        /*************************
         * swap pairs of edges
         **************************/
        private void SwapPairs( bool bUseMaximums )
        {
            Point3D tmppt;
            bool bContinue;
            bContinue = true;
            while (bContinue && !m_CancelPending)
            {
                bContinue = false;

                for (int b = 0; b < m_Cities.Count; b++)
                {
                    for (int a = 0; a < b && !m_CancelPending; a++)
                    {
                        // a < b
                        if (!bUseMaximums && TSPDist(a, a + 1) + TSPDist(b, b + 1) > TSPDist(a, b) + TSPDist(a + 1, b + 1) ||
                             bUseMaximums && Math.Max(TSPDist(a, a + 1), TSPDist(b, b + 1)) > Math.Max(TSPDist(a, b), TSPDist(a + 1, b + 1)))
                        {
                            //we need to swap Ap..B
                            for (int i = 0; (a + 1 + i) < (b - i); i++)
                            {
                                tmppt = m_Cities[a + 1 + i];
                                m_Cities[a + 1 + i] = m_Cities[b - i];
                                m_Cities[b - i] = tmppt;
                            }

                            bContinue = true;
                        }
                    }
                }
            }
        }

        public void TSP()
        {
            Randomize();
//            NearestNeighbor(0.1);
            InsertionHeuristic();
            SwapPairs(false);
            SwapPairs(true);
            SwapPairs(false);
            ThreeOpt();
        }
        #endregion


        public void Halt()
        {
            m_CancelPending = true;
        }

        public List<Point3D> Cities
        {
            get { return m_Cities; }
        }

        public double GetRadius(int Cityidx)
        {
            return GetGreyValue(m_Cities[Cityidx]) * m_GlobalRadius;
        }

        public void WriteCities(String Filename)
        {
            StreamWriter sw = new StreamWriter(Filename);
            foreach (Point3D city in m_Cities)
            {
                sw.WriteLine(city.X.ToString() + ", " +
                              city.Y.ToString() + ", " +
                              city.Z.ToString() + ", " +
                              GetGreyValue(city).ToString());
            }
            sw.Close();
        }


        private bool IsInThirt(Point3D pt)
        {
            Point3D[] thirt = new Point3D[]
                          { new Point3D(-3.662782754263035300e-01, 7.559006998770361200e-01, 5.426364868640331000e-01),
                            new Point3D(-9.408369689587646700e-01, 3.266601753606225300e-01, -9.010509238579085500e-02),
                            new Point3D(2.949031158172585300e-01, -6.086014011689210300e-01, -7.366386405670685100e-01),
                            new Point3D(-7.408675404485654300e-20, 1.131011890285944400e-19, 1.000000000000000000e+00),
                            new Point3D(-7.559006998770361200e-01, -3.662782754263035300e-01, 5.426364868640331000e-01),
                            new Point3D(-3.266601753606225300e-01, -9.408369689587646700e-01, -9.010509238579085500e-02),
                            new Point3D(6.086014011689210300e-01, 2.949031158172585300e-01, -7.366386405670685100e-01),
                            new Point3D(3.662782754263035300e-01, -7.559006998770361200e-01, 5.426364868640331000e-01),
                            new Point3D(9.408369689587646700e-01, -3.266601753606225300e-01, -9.010509238579085500e-02),
                            new Point3D(-2.949031158172585300e-01, 6.086014011689210300e-01, -7.366386405670685100e-01),
                            new Point3D(7.559006998770361200e-01, 3.662782754263035300e-01, 5.426364868640331000e-01),
                            new Point3D(3.266601753606225300e-01, 9.408369689587646700e-01, -9.010509238579085500e-02),
                            new Point3D(-6.086014011689210300e-01, -2.949031158172585300e-01, -7.366386405670685100e-01) };
            for (int i = 0; i < 13; i++)
            {
                if (Math.Acos(Point3D.Dot(thirt[i], pt.Normalized)) < 57.1367031 / 2.0 * Math.PI / 180.0)
                {
                    return true;
                }
            }
            return false;
        }

        private bool IsInCox53(Point3D pt)
        {
            bool result = true;
            Point3D[] planenorms = new Point3D[]
                          { new Point3D(0,0,1),
                            new Point3D(0,1,0),
                            new Point3D(0.309016994,-0.809016994,-0.5),
                            new Point3D(0.309016994,-0.809016994,0.5),
                            new Point3D(0.309016994,0.809016994,-0.5),
                            new Point3D(0.309016994,0.809016994,0.5),
                            new Point3D(0.5,-0.309016994,-0.809016994),
                            new Point3D(0.5,-0.309016994,0.809016994),
                            new Point3D(0.5,0.309016994,-0.809016994),
                            new Point3D(0.5,0.309016994,0.809016994),
                            new Point3D(0.809016994,-0.5,-0.309016994),
                            new Point3D(0.809016994,-0.5,0.309016994),
                            new Point3D(0.809016994,0.5,-0.309016994),
                            new Point3D(0.809016994,0.5,0.309016994),
                            new Point3D(1,0,0) };

            for (int i = 0; i < 15; i++)
            {
                if (Point3D.Dot(planenorms[i], pt.Normalized) < 0.0)
                {
                    result = !result;
                }
            }
            return result;
        }

        private double GetGreyValue(Point3D pt)
        {
            if (m_Source == null) 
            {
#if false
                if( IsInThirt( pt ) )
                    return 0.1; //dark
                else
                    return -1.0; //so light it's not there.
#elif true
                if( IsInCox53( pt ) )
                    return 0.1; //dark
                else
                    return -1.0; //so light it's not there.
#else
                return 1.0;
#endif
            }

            double result;

            lock (m_Source)
            {
                result = m_Source.GetSpherePixel(pt).GetBrightness();
            }

            if (result == 1.0)
                return -1.0;

            return (0.1 + 0.9 * result);
        }

        private void AddCity()
        {
            Point3D city;
            double greyval;

            while(true)
            {
                city = new Point3D( m_rand.NextDouble()-0.5,
                                    m_rand.NextDouble() - 0.5,
                                    m_rand.NextDouble() - 0.5);

                if( city.R > 0.5 ) continue; //go from uniform random cube to uniform random random sphere.

                greyval = GetGreyValue(city);
                m_totalareacount++;
                if( greyval < 0.0 ) //don't add cities to empty spaces
                {
                    m_emptyareacount++;
                    continue;
                }

                if( m_rand.NextDouble() * greyval * greyval > 0.01 )
                    continue;

                break;
            }

            m_SumGreyValues += greyval;

            city.Normalize();
            m_Cities.Add(city);
        }

        private double Dist( Point3D a, Point3D b )
        {
            double result = Math.Acos(Point3D.Dot(a, b));
            result -= m_GlobalRadius * GetGreyValue(a);
            result -= m_GlobalRadius * GetGreyValue(b);
            return result;
        }

        private double MinWeightedDist(Point3D a, Point3D b)
        {
            double greyvalueA = GetGreyValue(a);
            double greyvalueB = GetGreyValue(b);

            double result = Math.Acos(Point3D.Dot(a, b));
            result -= m_GlobalRadius * GetGreyValue(a);
            result -= m_GlobalRadius * GetGreyValue(b);

            return result / Math.Max(greyvalueA, greyvalueB);
        }



        private double MinDist( bool bWeighted )
        {
            double result = double.MaxValue;
            double tmp = double.MaxValue;

            for (int i = 0; i < m_Cities.Count; i++)
            {
                foreach( int j in m_NeighborList[i] )
                {
                    if (bWeighted)
                        tmp = MinWeightedDist(m_Cities[i], m_Cities[j]);
                    else
                        tmp = Dist(m_Cities[i], m_Cities[j]);

                    if (tmp < result) result = tmp;
                }
            }
            return result;
        }

        private bool bCalculateNeighbors(double dist)
        {
            CalculateNeighbors(dist);
            for (int i = 0; i < m_Cities.Count; i++)
            {
                if (m_NeighborList[i].Count == 0)
                    return false;
            }
            return true;
        }

        private void CalculateNeighbors(double dist)
        {
            // we fill the neighbor table with a list of points that are within the bounding box, of the bounding sphere, of points within the given distance on the sphere
            double boundingboxsize = 2 * (dist /*Math.Sin(dist)*/);
            for (int i = 0; i < m_Cities.Count; i++)
            {
                m_NeighborList[i].Clear();
                for (int j = 0; j < i; j++)
                {
                    if (Math.Abs(m_Cities[i].X - m_Cities[j].X) < boundingboxsize &&
                        Math.Abs(m_Cities[i].Y - m_Cities[j].Y) < boundingboxsize &&
                        Math.Abs(m_Cities[i].Z - m_Cities[j].Z) < boundingboxsize)
                    {
                        m_NeighborList[i].Add(j);
                        m_NeighborList[j].Add(i);
                    }
                }
            }
                
        }

        private Point3D JitterPt(Point3D pt)
        {
            double oneminuscosjitterradius = 1.0 - Math.Cos(m_JitterRadius * GetGreyValue(pt));
            //First we get a random point within spherical cap centered at (0,0,1) with a radius of max
            Point3D jitteredpt = Point3D.FromSphericalCoords(1.0,
                                                             Math.Acos(1.0 - m_rand.NextDouble() * oneminuscosjitterradius), 
                                                             m_rand.NextDouble() * 2.0 * Math.PI );


            Rotation ToPt = new Rotation(pt.Theta, pt.Phi, 0);
            return ToPt.Rotate( jitteredpt );
        }

        private void Yin()
        {
            Yin(false);
        }

        private void Yin( bool bRepel )
        {
            CalculateNeighbors(2 * (m_GlobalRadius + m_JitterRadius) );

            for (int i = 0; i < m_Cities.Count; i++)
            {
                Point3D jitter = bRepel ? RepelPt(i) : JitterPt(m_Cities[i]);
                if(GetGreyValue(jitter) < 0.0)
                    continue;

                bool bOverlapped = false;
                foreach( int j in m_NeighborList[i] )
                {
                    Point3D other = m_Cities[j];
                    if (Dist(jitter, other) <= 0.0 )
                    {
                        bOverlapped = true;
                        break;
                    }
                }
                if (!bOverlapped)
                {
                    m_Cities[i] = jitter;
                }
            }
        }

        private Point3D RepelPt( int idx )
        {
            Point3D city = m_Cities[idx];

            Point3D result = null;
            double mindist = double.MaxValue;
            foreach (int j in m_NeighborList[idx])
            {
                double dist = Dist( city, m_Cities[j] );
                if( dist < mindist )
                {
                    result = m_Cities[j];
                    mindist = dist;
                }
            }
            if( result == null )
                return city;

            result = (city - result);
            result.R = m_JitterRadius * m_rand.NextDouble();
            result += city;
            result.Normalize();
            return result;
        }




        private void Yang()
        {
#if true                               
            while( !bCalculateNeighbors( m_YangSearchRadius ) )
            {
                m_YangSearchRadius *= 1.5;
            }
            m_YangSearchRadius *= 0.95;
#else
            CalculateNeighbors( m_YangSearchRadius );
#endif

            m_GlobalRadius += MinDist(true) * 0.4;            
        }


        private List<Point3D> Interpolate(int idx, int pieces, bool bSpline)
        {
            List<Point3D> result = new List<Point3D>();

            if (!bSpline)
            {
                //line segment
                Point3D dir = (m_Cities[(idx + 1) % m_Cities.Count] - m_Cities[idx]) / (double)pieces;
                for (int i = 0; i <= pieces; i++)
                {
                    result.Add(m_Cities[idx] + dir * i);
                }
            }
            else
            {
                //spline
                Point3D p4 = m_Cities[idx];
                Point3D p3 = m_Cities[(idx - 1 + m_Cities.Count) % m_Cities.Count];
                Point3D p2 = m_Cities[(idx - 2 + m_Cities.Count) % m_Cities.Count];
                Point3D p1 = m_Cities[(idx - 3 + m_Cities.Count) % m_Cities.Count];
                double[] a = new double[5];
                double[] b = new double[5];
                Point3D[] A = new Point3D[5];
                A[0] = (-p1 + 3.0 * p2 - 3.0 * p3 + p4) / 6.0;
                A[1] = (3.0 * p1 - 6.0 * p2 + 3.0 * p3) / 6.0;
                A[2] = (-3.0 * p1 + 3.0 * p3) / 6.0;
                A[3] = (p1 + 4 * p2 + p3) / 6.0;
                for (int i = 0; i <= pieces; i++)
                {
                    float t = (float)i / pieces;
                    result.Add((A[2] + t * (A[1] + t * A[0])) * t + A[3]);
                }
            }
            return result;
        }



        public void DrawImage(String filename, bool bSpline, bool bColors, bool bRotate90, double scale )
		{
            Bitmap newimage = new Bitmap(4000, 2000);
            Graphics g = Graphics.FromImage(newimage);
            g.FillRectangle(new SolidBrush(Color.White), new Rectangle(0, 0, newimage.Width, newimage.Height ) );

            Point2D ImageScale = new Point2D(newimage.Width / (2.0 * Math.PI), newimage.Height / Math.PI);
            const int pieces = 10;

            Rotation rot = Rotation.Identity;
            if (bRotate90)
            {
                rot = new Rotation(Math.PI / 2.0, Point3D.YAxis);
                for (int i = 0; i < m_Cities.Count; i++)
                {
                    m_Cities[i] = rot.Rotate(m_Cities[i]);
                }
            }

            for (int i = 0; i < m_Cities.Count; i++)
            {
                List<Point3D> interp = Interpolate(i, pieces, bSpline);
                for (int j = 0; j < pieces; j++)
                {
                    double progress = ((double)i + (double)j / pieces) / m_Cities.Count;
                    Color color = bColors ? Color.FromArgb((int)(progress * 255.0), 0, 128) : Color.Black;


                    Point3D A = interp[j];
                    Point3D B = interp[j + 1];

                    double greyscale = GetGreyValue((-rot).Rotate(A));
                    Point2D AvgSize = new Point2D(1.0 / Math.Sin(A.Phi), 1.0) * scale * ((greyscale - 0.1) / -0.9 + 2.0);

                    Point2D delta = new Point2D( A.Theta - B.Theta, A.Phi - B.Phi );
                    DMSCore.FixAngle(delta.X);
                    
                    g.FillEllipse( new SolidBrush(color),
                                   (float)((A.Theta + Math.PI - AvgSize.X * 0.5) * ImageScale.X),
                                   (float)((A.Phi - AvgSize.Y * 0.5) * ImageScale.Y),
                                   (float)(AvgSize.X * ImageScale.X),
                                   (float)(AvgSize.Y * ImageScale.Y) );

                    double thickness = Math.Sqrt(Math.Cos(delta.Theta) * AvgSize.Y * Math.Cos(delta.Theta) * AvgSize.Y +
                                                 Math.Sin(delta.Theta) * AvgSize.X * Math.Sin(delta.Theta) * AvgSize.X ) *
                                       ImageScale.X;

                    if (Math.Abs(A.Theta - B.Theta) < Math.PI)
                    {
                        g.DrawLine(new Pen(color, (float)thickness),
                                   (float)((A.Theta + Math.PI) * ImageScale.X),
                                   (float)(A.Phi * ImageScale.Y),
                                   (float)((B.Theta + Math.PI) * ImageScale.X),
                                   (float)(B.Phi * ImageScale.Y));
                    }
                    else if (A.Theta > 0.0)
                    {
                        g.DrawLine(new Pen(color, (float)thickness),
                                   (float)((A.Theta - Math.PI) * ImageScale.X),
                                   (float)(A.Phi * ImageScale.Y),
                                   (float)((B.Theta + Math.PI) * ImageScale.X),
                                   (float)(B.Phi * ImageScale.Y));
                        g.DrawLine(new Pen(color, (float)thickness),
                                   (float)((A.Theta + Math.PI) * ImageScale.X),
                                   (float)(A.Phi * ImageScale.Y),
                                   (float)((B.Theta + 3.0 * Math.PI) * ImageScale.X),
                                   (float)(B.Phi * ImageScale.Y));
                    }
                    else
                    {
                        g.DrawLine(new Pen(color, (float)thickness),
                                   (float)((A.Theta + Math.PI) * ImageScale.X),
                                   (float)(A.Phi * ImageScale.Y),
                                   (float)((B.Theta - Math.PI) * ImageScale.X),
                                   (float)(B.Phi * ImageScale.Y)); 
                        g.DrawLine(new Pen(color, (float)thickness),
                                   (float)((A.Theta + 3.0 * Math.PI) * ImageScale.X),
                                   (float)(A.Phi * ImageScale.Y),
                                   (float)((B.Theta + Math.PI) * ImageScale.X),
                                   (float)(B.Phi * ImageScale.Y));
                    }

                }
            }

            newimage.Save(filename);
		}

    } //class 
} //namespace
