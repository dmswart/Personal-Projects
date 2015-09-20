using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class DrawNet : Renderer
    {
        const int height = 4000;
        const int width = 2 * height;
        const int buffer = 100;
        const int circlerad = 20;
        const int linewidth = 12;

        Bitmap m_bitmap;
        Net m_net;

        private Point Original(int i, int j)
        {
            Point2D result = new Point2D(i, j);

            result /= (double)(m_net.Size);
            result *= (double)(height - 2 * buffer);
            result += new Point2D(buffer, buffer);

            return new Point((int)result.X, (int)result.Y);
        }

        private Point Destination(int i, int j)
        {
            return Destination(m_net[i,j]);
        }

        private Point Destination(Indicatrix A)
        {
            Point2D result = A.Position;

            result += new Point2D(1.0, 1.0);
            result /= 2.0;
            result *= (height - 2 * buffer);
            result += new Point2D(width/2 + buffer, buffer);

            return new Point((int)result.X, (int)result.Y);
        }

        private void ScaleNet( )
        {
            //first lets determine the extents of the net
            Point2D MinExtent = new Point2D(double.MaxValue, double.MaxValue);
            Point2D MaxExtent = new Point2D(double.MinValue, double.MinValue);
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] == null) continue;


                    if (m_net[i, j].Position.X < MinExtent.X)
                        MinExtent.X = m_net[i, j].Position.X;
                    if (m_net[i, j].Position.Y < MinExtent.Y)
                        MinExtent.Y = m_net[i, j].Position.Y;
                    if (m_net[i, j].Position.X > MaxExtent.X)
                        MaxExtent.X = m_net[i, j].Position.X;
                    if (m_net[i, j].Position.Y > MaxExtent.Y)
                        MaxExtent.Y = m_net[i, j].Position.Y;
                }
            }
            double Scale = Math.Max(MaxExtent.X - MinExtent.X, MaxExtent.Y - MinExtent.Y);

            //now adjust positions
            for (int i = 0; i < m_net.Size; i++)
            {
                for (int j = 0; j < m_net.Size; j++)
                {
                    if (m_net[i, j] == null) continue;

                    m_net[i, j].Position = (m_net[i, j].Position - MinExtent) / Scale * 2.0 - new Point2D(1.0, 1.0);
                }
            }
        }

        public DrawNet(Net net) : base( new Size(width, height) )
        {
            m_net = net;
            ScaleNet();

            m_bitmap = new Bitmap( m_Size.Width, m_Size.Height);
            Pen BlackPen = new Pen(Color.Black, linewidth);
            Pen GrayPen = new Pen(Color.FromArgb(100,100,100), linewidth);
            Brush BlackBrush = new SolidBrush(Color.Black);
            Brush WhiteBrush = new SolidBrush(Color.White);
            Graphics g = Graphics.FromImage( m_bitmap );

            g.FillRectangle(WhiteBrush, 0, 0, width, height);
            Point tmp;

            for( int i=0; i<net.Size; i++ )
            {
                for( int j=0; j<net.Size; j++ )
                {
                    if( net[i,j] == null ) continue;
                    Point pos = Original(i, j);

                    //Draw horizontal
                    if( net[i,j].East != null )
                    {
                        tmp = Original(i+1,j);
                        g.DrawLine(GrayPen, pos.X, pos.Y, tmp.X, tmp.Y);
                    }
                    //Draw vertical
                    if(net[i, j].North != null)
                    {
                        tmp = Original(i, j+1);
                        g.DrawLine(GrayPen, pos.X, pos.Y, tmp.X, tmp.Y);
                    }
                    g.FillEllipse(BlackBrush, pos.X - circlerad, pos.Y - circlerad, circlerad * 2, circlerad*2);


                    //Draw horizontal
                    pos = Destination(i, j);
                    if (net[i, j].East != null)
                    {
                        tmp = Destination(net[i, j].East);
                        g.DrawLine(GrayPen, pos.X, pos.Y, tmp.X, tmp.Y);
                    }
                    //Draw vertical
                    if (net[i, j].North != null)
                    {
                        tmp = Destination(net[i, j].North);
                        g.DrawLine(GrayPen, pos.X, pos.Y, tmp.X, tmp.Y);
                    }
                    g.FillEllipse(BlackBrush, pos.X - circlerad, pos.Y - circlerad, circlerad * 2, circlerad * 2);
                }
            }


        }

        override public Color GetPixel(int x, int y)
        {
            return m_bitmap.GetPixel(x, y);
        }
    }
}
