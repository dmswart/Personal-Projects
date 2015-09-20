using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace DMSLib
{

    public enum DMSImageType
    {
        Equirectangular = 0,
        MirrorBall = 1
    }

    public class DMSImage
    {
        #region member variables
        private DMSImageType mSourceType = DMSImageType.Equirectangular;
        private Bitmap m_Bitmap = null;
        private static double m_Progress = 0.0; //from 0..1.0
        #endregion

        #region constructors
        public DMSImage(Size size)
        {
            m_Bitmap = new Bitmap(size.Width, size.Height, System.Drawing.Imaging.PixelFormat.Format32bppRgb);
            m_Progress = 1.0;
        }


        public DMSImage( Renderer renderer ) : this(renderer.Size)
        {
            m_Progress = 0.0;

            for( int y=0; y<Height; y++ )
            for( int x=0; x<Width; x++ )
            {
                m_Progress = ((double)y * Width + x) / (Width * Height);
                m_Bitmap.SetPixel(x, y, renderer.GetPixel( x, y ));
            }

            m_Progress = 1.0;

        }

        public DMSImage(String Filename)
        {
            if (Filename.ToLower().EndsWith("ppm"))
                LoadFromPPM(Filename);
            else
                m_Bitmap = new Bitmap( Filename );
            m_Progress = 1.0;
        }

        public DMSImage( String Filename, bool IsMirrorBall ) : this( Filename )
        {
            mSourceType = IsMirrorBall ? DMSImageType.MirrorBall : DMSImageType.Equirectangular;
        }
        #endregion

        #region Accessors
        public int Width { get {return m_Bitmap.Width; } }
        public int Height { get {return m_Bitmap.Height; } }
        public Bitmap Bitmap { get {return m_Bitmap;} }
        public static double Progress { get { return m_Progress; } }
        #endregion Accessors


        #region Public functions

        /// <summary>
        /// return the color of a pixel
        /// </summary>
        /// <param name="point">the position of the pixel clipped to the square (0,0) - (1,1)</param>
        /// <returns></returns>
        public Color GetPixel( Point2D point )
        {
            if (point.X >= 1) point.X = 0;
            if (point.Y >= 1) point.Y = 0;
            if (point.X < 0) point.X = 0;
            if (point.Y < 0) point.Y = 0;
           return GetPixel( (int)(point.X * m_Bitmap.Width),
                                     (int)(point.Y * m_Bitmap.Height ) );
        }

        public Color GetPixel(int x, int y)
        {
            return m_Bitmap.GetPixel(x, y);
        }

        public void SetPixel(int x, int y, Color color)
        {
            m_Bitmap.SetPixel(x, y, color);
        }

        public Color GetSpherePixel(Point3D point)
        {
            if (mSourceType == DMSImageType.Equirectangular)
            {
                //latitude and longitude are pulled straight from spherical coordinates of the 3d pooint
                double longitude = point.Theta / DMS.TAU;
                double latitude = point.Phi / DMS.HALFTAU; //but really 0 is at the north pole.

                if (longitude < 0.0 ) longitude += 1.0;

                Point2D EquirectangularLocation = new Point2D( longitude, latitude );
                return GetPixel(EquirectangularLocation);
            }
            else
            {
                // we can get the location on a mirror ball image from the spherical coordinates by taking the sin of phi.
                Point2D MirrorBallLocation = Point2D.FromPolar(Math.Sin(point.Phi/2.0), point.Theta);

                //the coordinates are from -1 to 1, we need to convert them to 0 to 1
                MirrorBallLocation += new Point2D(1, 1);
                MirrorBallLocation.Scale(0.5);
                return GetPixel(MirrorBallLocation);
            }
        }

        public void Save(String Filename)
        {
            m_Bitmap.Save(Filename);
        }

        public void Save(String Filename, ImageFormat format )
        {
            m_Bitmap.Save(Filename, format);
        }

        public bool LoadFromPPM(String Filename)
        {
            m_Bitmap = null;
            StreamReader sr;

            try 
            {
                sr = new StreamReader(Filename);
                String LineIn = sr.ReadLine();
                if( LineIn != "P6" ) return false;
                char[] splitchars = { ' ' };
                LineIn = sr.ReadLine();
                m_Bitmap = new Bitmap( int.Parse( LineIn.Split( splitchars, StringSplitOptions.RemoveEmptyEntries )[0] ),
                                       int.Parse( LineIn.Split( splitchars, StringSplitOptions.RemoveEmptyEntries )[1] ),
                                       PixelFormat.Format32bppArgb );
                LineIn = sr.ReadLine(); // read in intensity value and ignore


                BitmapData data = m_Bitmap.LockBits( new Rectangle( 0, 0, Width, Height ), ImageLockMode.WriteOnly, m_Bitmap.PixelFormat );

                for( int y = 0; y<Height && !sr.EndOfStream; y++ )
                {
                    for( int x=0; x<Width && sr.EndOfStream; x++ )                 
                    {
                        m_Bitmap.SetPixel( x, y, Color.FromArgb( sr.Read(), sr.Read(), sr.Read() ) );
                    }
                }

            }
            catch
            {
                return false;
            }

            sr.Close();
            return true;
        }

        public void SaveAsPPM(String Filename, Color blank)
        {
            StreamWriter sw = new StreamWriter(Filename);
            sw.Write("P6\n" + Width.ToString() + " " + Height.ToString() + "\n255\n");
            for (int y = 0; y < Height; y++)
            {
                for (int x = 0; x < Width; x++)
                {
                    sw.Write((char)(GetPixel(x, y).R));
                    sw.Write((char)(GetPixel(x, y).G));
                    sw.Write((char)(GetPixel(x, y).B));
                }
            }
            sw.Close();
        }

        public void Flatten( Color blank )
        {
            BitmapData data = m_Bitmap.LockBits( new Rectangle( 0, 0, Width, Height ),
                                                 ImageLockMode.ReadWrite,
                                                 m_Bitmap.PixelFormat );
            for( int y=0; y<Height; y++ )
            for( int x=0; x<Width; x++ )
            {
                Color original = m_Bitmap.GetPixel(x, y);
                double Alpha = (double)original.A / 255.0;
                m_Bitmap.SetPixel(x, y, Color.FromArgb(255,
                                                        (int)(Alpha * original.R + (1.0 - Alpha) * blank.R),
                                                        (int)(Alpha * original.G + (1.0 - Alpha) * blank.G),
                                                        (int)(Alpha * original.B + (1.0 - Alpha) * blank.B)));
            }
            data.PixelFormat = PixelFormat.Format24bppRgb;
            m_Bitmap.UnlockBits(data);
        }
        #endregion


    }
}
