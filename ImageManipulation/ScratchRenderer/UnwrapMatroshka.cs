using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;


namespace ScratchRenderer
{
    public class UnwrapMatroshka : Renderer
    {
        double[] m_startPixels;
        double[] m_endPixels;

        //constructors;
        public UnwrapMatroshka(DMSImage Source) : base( new Size((int)((double)Source.Width * Math.PI / 2.0), Source.Height), Source)
        {
            m_startPixels = new double[Source.Height];
            m_endPixels = new double[Source.Height];

            for (int i = 0; i < Source.Height; i++)
            {
                for (int j = 0; j < Source.Width; j++)
                {
                    if (m_Source.GetPixel(j, i).A > 0)
                    {
                        m_startPixels[i] = j;
                        break;
                    }
                }
                for (int j = Source.Width-1; j >= 0; j--)
                {
                    if (m_Source.GetPixel(j, i).A > 0)
                    {
                        m_endPixels[i] = j;
                        break;
                    }
                }

            }
        }

        public override Color GetPixel(int x, int y)
        {
            //convert x to -1 to 1
            double sourceX = x;
            sourceX /= (double)Size.Width;
            sourceX -= 0.5;
            sourceX *= 2.0;

            //unwrap
            sourceX = Math.Sin(sourceX * (Math.PI / 2.0));

            //convert to source
            sourceX /= 2.0;
            sourceX += 0.5;
            sourceX *= (m_endPixels[y] - m_startPixels[y]);
            sourceX += m_startPixels[y];

            return m_Source.GetPixel((int)sourceX, y);
        }

    }
}

