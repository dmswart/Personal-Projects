using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class PixelInfo
    {
        Point3D _color;
        private int _U;
        private int _V;
        public int Up, Down, Left, Right;
        private int m_savedResolution = int.MaxValue;

        public PixelInfo(int u, int v, Point3D color)
        {
            _U = u;
            _V = v;
            _color = color;
            Up = Down = Left = Right = 0;
        }

        public int U
        {
            get { return _U; }
        }
        public int V
        {
            get { return _V; }
        }

        public Point3D color
        {
            get { return _color; }
            set { _color = value; }
        }

        public void SetNeighbors(DMSImage Source, int resolution)
        {
            if (resolution >= m_savedResolution)
                return;
            m_savedResolution = resolution;

            if (_V != 0 && (Up == 0 || Up > resolution))
            {
                for (Up = 1; Up < resolution; Up++)
                {
                    if (_V - Up < 0)
                    {
                        Up = 0;
                        break;
                    }
                    if (Source.GetPixel(_U, _V - Up).A != 0)
                        break;
                }
            }

            if (_V != Source.Height - 1 && (Down == 0 || Down > resolution))
            {
                for (Down = 1; Down < resolution; Down++)
                {
                    if (_V + Down >= Source.Height)
                    {
                        Down = 0;
                        break;
                    }
                    if (Source.GetPixel(_U, _V + Down).A != 0)
                        break;
                }
            }

            if (_U != 0 && (Left == 0 || Left > resolution))
            {
                for (Left = 1; Left < resolution; Left++)
                {
                    if (_U - Left < 0)
                    {
                        Left = 0;
                        break;
                    }
                    if (Source.GetPixel(_U - Left, _V).A != 0)
                        break;
                }
            }

            if (_U != Source.Width - 1 && (Right == 0 || Right > resolution))
            {
                for (Right = 1; Right < resolution; Right++)
                {
                    if (_U + Right >= Source.Width)
                    {
                        Right = 0;
                        break;
                    }
                    if (Source.GetPixel(_U + Right, _V).A != 0)
                        break;
                }
            }
        }
    }

    public class Filler : Renderer
    {
        const int MIN_PIXELS = 10000;
        const int START_RESOLUTION = 256;
        const double DELTA_THRESHOLD = 1.0;
        const int MAX_ITERS = 15;

        //members
        Dictionary<int, int> m_pixelindex; //maps (v*height+u) to location in blends[]
        int m_resolution;
        List<PixelInfo> m_pixels;
        Random m_rand;

        private bool bIsBlank(Color c)
        {
            return c.A == 0;
        }

        //constructors;
        public Filler(DMSImage Source)
            : base(new Size(Source.Width, Source.Height), Source, Color.Gray)
        {
            m_pixelindex = new Dictionary<int, int>();
            m_pixels = new List<PixelInfo>();
            m_resolution = START_RESOLUTION;
            m_rand = new Random();
            double delta = 0;
            int iter = 0;

            while (m_pixels.Count < MIN_PIXELS || delta > DELTA_THRESHOLD && iter < MAX_ITERS)
            {
                if (iter == MAX_ITERS || delta < DELTA_THRESHOLD)
                {
                    iter = 0;
                    m_resolution >>= 1;
                    if (m_resolution == 0) break;
                    Console.Write("\n" + m_resolution);

                    //bring on new pixels if necessary
                    for (int u = 0; u < Source.Width; u += m_resolution)
                    {
                        for (int v = 0; v < Source.Height; v += m_resolution)
                        {
                            if (GetPixelHelper(u, v) == null)
                            {
                                PixelInfo newpixel = new PixelInfo(u, v, new Point3D());
                                newpixel.SetNeighbors(m_Source, m_resolution);
                                SetAvgColour(newpixel);

                                m_pixels.Add(newpixel);
                                m_pixelindex.Add(v * Source.Width + u, m_pixels.Count() - 1);
                            }
                        }
                    }
                }
                else
                {
                    iter++;
                }

                Console.Write('.');

                //do the averaging!
                delta = 0.0;
                if (m_pixels.Count() == 0) continue;
                for (int i = 0; i < 10000; i++)
                {
                    int idx = m_rand.Next(m_pixelindex.Count());
                    idx = m_pixelindex.Keys.ToArray()[idx];
                    int u = idx % Source.Width;
                    int v = idx / Source.Width;
                    int pixelidx = m_pixelindex[idx];

                    delta += SetAvgColour(m_pixels[pixelidx]);
                }
            }
            Console.WriteLine();
        }

        private Point3D GetPixelHelper(int x, int y)
        {
            if (x < 0 || x >= m_Source.Width || y < 0 || y >= m_Source.Height)
                return null;

            Color srcColor = m_Source.GetPixel(x, y);
            if (!bIsBlank(srcColor))
                return new Point3D(srcColor.R, srcColor.G, srcColor.B);

            int idx = y * m_Source.Width + x;
            int blendidx;
            if (m_pixelindex.TryGetValue(idx, out blendidx))
                return m_pixels[blendidx].color;

            return null;
        }

        private int Dither(double val)
        {
            double result = val + (m_rand.NextDouble() * 2.0 - 1.0);
            if (result > 255.0)
                return 255;
            if (result < 0.0)
                return 0;
            return (int)result;
        }

        public override Color GetPixel(int x, int y)
        {
            Point3D result = GetPixelHelper(x, y);
            if (result == null)
            {
                int u = x - (x % m_resolution);
                int v = y - (y % m_resolution);

                Point3D A = GetPixelHelper(u, v);
                Point3D B = GetPixelHelper(u, v + m_resolution);
                Point3D C = GetPixelHelper(u + m_resolution, v);
                Point3D D = GetPixelHelper(u + m_resolution, v + m_resolution);

                double U = (double)(x - u) / m_resolution;
                double V = (double)(y - v) / m_resolution;
                result = new Point3D();
                double count = 0.0;
                if (A != null) { result += (1.0 - U) * (1.0 - V) * A; count += (1.0 - U) * (1.0 - V); }
                if (B != null) { result += (1.0 - U) * V * B; count += (1.0 - U) * V; }
                if (C != null) { result += U * (1.0 - V) * C; count += U * (1.0 - V); }
                if (D != null) { result += U * V * D; count += U * V; }

                if (count == 0.0)
                    result = new Point3D(128, 128, 128);
                else
                    result /= count;

            }
            if (result.X < 0.0) result.X = 0.0;
            if (result.Y < 0.0) result.Y = 0.0;
            if (result.Z < 0.0) result.Z = 0.0;
            if (result.X > 255.0) result.X = 255.0;
            if (result.Y > 255.0) result.Y = 255.0;
            if (result.Z > 255.0) result.Z = 255.0;

            // we add a dither
            return Color.FromArgb(Dither(result.X),
                                  Dither(result.Y),
                                  Dither(result.Z));
        }

        private double SetAvgColour(PixelInfo pixel)
        {
            Point3D NewColor = new Point3D();
            Point3D tmp;
            int count = 0;

            pixel.SetNeighbors(m_Source, m_resolution);

            if (pixel.Up != 0)
            {
                tmp = GetPixelHelper(pixel.U, pixel.V - pixel.Up);
                if (tmp != null)
                {
                    NewColor += tmp;
                    count++;
                }
            }
            if (pixel.Down != 0)
            {
                tmp = GetPixelHelper(pixel.U, pixel.V + pixel.Down);
                if (tmp != null)
                {
                    NewColor += tmp;
                    count++;
                }

            }
            if (pixel.Left != 0)
            {
                tmp = GetPixelHelper(pixel.U - pixel.Left, pixel.V);
                if (tmp != null)
                {
                    NewColor += tmp;
                    count++;
                }

            }
            if (pixel.Up != 0)
            {
                tmp = GetPixelHelper(pixel.U + pixel.Right, pixel.V);
                if (tmp != null)
                {
                    NewColor += tmp;
                    count++;
                }

            }


            if (count == 0)
                NewColor = new Point3D(128, 128, 128);
            else
                NewColor /= (double)count;


            double Result = (pixel.color - NewColor).R;
            pixel.color = NewColor;
            return Result;
        }
    }
}
