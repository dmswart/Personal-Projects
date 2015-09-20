using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;

namespace DMSLib
{
    public class Renderer
    {
        #region member variables
        protected Color m_Blank = Color.Gray;
        protected Size m_Size = new Size(1,1);
        protected DMSImage m_Source = null;
        #endregion

        #region Constructors
        public Renderer ( Size Size )
        {
            m_Size = Size;
        }

        public Renderer(Size Size, DMSImage Source)
            : this(Size)
        {
            m_Source = Source;
        }

        public Renderer(Size Size, DMSImage Source, Color BlankColor)
            : this(Size, Source)
        {
            m_Blank = BlankColor;
        }
        #endregion


        #region Accessors
        public Size Size
        {
            get { return m_Size; }
            set { m_Size = value; }
        }
        public Color BlankColor
        {
            get { return m_Blank; }
            set { m_Blank = value; }
        }

        #endregion 

        #region functions
        public virtual Color GetPixel( int x, int y )
        {
            return BlankColor; 
        }

        public Color GetPixel(Point p)
        {
            return GetPixel(p.X, p.Y);
        }


        public Color GetSpherePixel(Point3D point)
        {
            //look up theta and phi "directly" from X, Y.
            double X = point.Theta / DMS.TAU;
            double Y = point.Phi / DMS.HALFTAU; //but really 0 is at the north pole.

            if (X < 0.0) X += 1.0;

            return GetPixel( (int)(X * m_Size.Width), (int)(Y * m_Size.Height) );
        }
        #endregion

    }
}
