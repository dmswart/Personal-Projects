using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class Palette : DMSImage
    {
        double[] m_sourceTable;
        double m_totalSourcePixels;
        double[] m_targetTable;

        //constructors;
        public Palette(DMSImage SourcePixels, DMSImage Target) : base( new Size(Target.Width, Target.Height) )
        {
            Random rnd = new Random();
            int u, v, i;

            //set up histogram tables.
            m_sourceTable = new double[256];
            m_targetTable = new double[256];
            for (i = 0; i < 256; i++)
            {
                m_sourceTable[i] = 0;
                m_targetTable[i] = 0;
            }

            m_totalSourcePixels = 0.0;
            for (u = 0; u < SourcePixels.Width; u++)
            {
                for (v = 0; v < SourcePixels.Height; v++)
                {
                    Color pixel = SourcePixels.GetPixel(u, v);

                    m_sourceTable[pixel.R] += (double)pixel.A / 255.0;
                    m_totalSourcePixels += (double)pixel.A / 255.0;
                }
            }

            for( u = 0; u < Target.Width; u++ )
            {
                for (v = 0; v < Target.Height; v++)
                {
                    m_targetTable[Target.GetPixel(u, v).R]++;
                }
            }

            //scale source pixels to equal total number of target pixels.
            double factor = (double)Target.Height * Target.Width / m_totalSourcePixels;
            for ( i = 0; i < 256; i++)
                m_sourceTable[i] *= factor;

            //set targetTable such that targetTable[i-1] .. targetTable[i] is the range of pixel indices of value i;
            for (i = 1; i < 256; i++)
                m_targetTable[i] += m_targetTable[i - 1];



            //okay now set each pixel
            for (u = 0; u < Target.Width; u++)
            {
                for (v = 0; v < Target.Height; v++)
                {
                    int pixelValue = Target.GetPixel(u, v).R;
#if false
                    //find out how far we are into the histogram.
                    double index = (pixelValue == 0) ? 0 : m_targetTable[pixelValue - 1];
                    index += rnd.NextDouble() * (m_targetTable[pixelValue] - index);  //this randomization effects a dithering
#else
                    m_targetTable[pixelValue]--;
                    if (m_targetTable[pixelValue] < 0) m_targetTable[pixelValue] = 0;
                    double index = m_targetTable[pixelValue];
#endif

                    //now which value in source has this pixel?
                    double sum=0;
                    for( i=0; i<256; i++ )
                    {
                        if( sum + m_sourceTable[i] >= index )
                            break;
                        sum += m_sourceTable[i];
                    }

                    SetPixel(u,v,Color.FromArgb(i,i,i));
                }
            }
        }
    }
}
