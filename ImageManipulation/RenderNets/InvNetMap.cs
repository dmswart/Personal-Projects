using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using DMSLib;

namespace RenderNets
{
    public class InvNetMap : Renderer
    {
        Net m_Net;
        RectangleF m_Window;

        public InvNetMap( System.Drawing.Size size, DMSImage source, Color Background, Net net, RectangleF Window )
            : base( size, source, Background )
        {
            m_Window = Window;
            m_Net = net;
        }


        override public Color GetPixel(int x, int y)
        {
            double X = m_Window.X + (double)x / m_Size.Width * m_Window.Width;
            double Y = m_Window.Y + (double)y / m_Size.Height * m_Window.Height;


            Point2D UV = m_Net.InvMap( new Point2D(X, Y) );
            if( UV == null )
                return m_Blank;

            return m_Source.GetPixel(UV);
      
        }

    }
}
