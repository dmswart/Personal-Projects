using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class Droste : Renderer
    {
        Point2D m_dstCenter;
        Point2D m_srcCenter;
        double m_innerRadius;
        double m_outerRadius;
        double m_Tightness;
        double m_TwistFactor;

        public Droste(DMSImage Source, Point2D SrcCenter, double SrcInnerRad, double SrcOuterRad,
                       Size DstSize, Point2D DstCenter, double DstTwistFactor,
                       Color Blank) :
            base(DstSize, Source, Blank)
        {
            m_srcCenter = SrcCenter;
            m_dstCenter = DstCenter;
            m_outerRadius = Math.Max(SrcOuterRad, SrcInnerRad);
            m_innerRadius = Math.Min(SrcOuterRad, SrcInnerRad);
            m_Tightness = m_outerRadius / m_innerRadius;
            m_TwistFactor = DstTwistFactor;
        }

        override public Color GetPixel(int x, int y)
        {
            return GetPixelHelper(x,y);
        }

        private Color GetPixelHelper( int x, int y, int step = 0 )
        {
            // if we're at the dest center, return the source center
            Point2D destPt = new Point2D(x, y) - m_dstCenter;
            if( destPt.R < DMS.EPSILON )
                return m_Source.GetPixel((int)m_srcCenter.X, (int)m_srcCenter.Y);

            //calculate source location
            Point2D sourcePt; 
            double timesAround = Math.Log(destPt.R, m_Tightness) - destPt.Theta / (2.0 * Math.PI);
            sourcePt = Point2D.FromPolar(m_innerRadius + (m_outerRadius - m_innerRadius) * delog(fractional(timesAround) + step, m_Tightness),
                                       (destPt.Theta + (2.0 * Math.PI * (Math.Floor(timesAround) - step))) * m_TwistFactor);
            sourcePt += m_srcCenter;

            //calculate our color
            Color result = Color.FromArgb(0, m_Blank);
            if (sourcePt.X >= 0 && sourcePt.Y >= 0 && sourcePt.X < m_Source.Width && sourcePt.Y < m_Source.Height)
                result = m_Source.GetPixel((int)sourcePt.X, (int)sourcePt.Y);

            //a solid color means we can return!
            if( result.A == 0xFF ) return result;

            //if it's transparent, return the next step down.
            Color next = GetPixelHelper(x, y, step - 1);
            if (result.A == 0x00) return next;

            //if it's only a little transparent, blend the next step down in.
            int R = (int)( (double)((result.R * result.A) + (next.R * (255-result.A))) / 255.0 );
            int G = (int)( (double)((result.G * result.A) + (next.G * (255-result.A))) / 255.0 );
            int B = (int)( (double)((result.B * result.A) + (next.B * (255-result.A))) / 255.0 );
            return Color.FromArgb(R, G, B);
        }

        double fractional(double value)
        {
            return value - Math.Floor(value);
        } /* fractional */

        //takes a value from 0-1
        double delog(double value, double bas)
        {
            return (Math.Pow(bas, value) - 1.0) / (bas - 1.0);
        } /* delog */

    }
}
