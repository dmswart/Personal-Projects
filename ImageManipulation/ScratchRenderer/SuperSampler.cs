using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class SuperSampler : Renderer
    {
        private Renderer m_SourceRenderer;
        private int m_Sample;
        private int m_SampleSquared;
        private bool m_random;
        private Random m_Rand;

        public SuperSampler(Renderer SourceRenderer, int samples, bool random=false) :
            base(new Size(SourceRenderer.Size.Width / samples, SourceRenderer.Size.Height / samples))
        {    
            m_SourceRenderer = SourceRenderer;
            m_Sample = samples;
            m_SampleSquared = m_Sample * m_Sample;
            m_random = random;
            m_Rand = new Random();
        }

        public override Color GetPixel(int x, int y)
        {
            double R = 0, G = 0, B = 0;
            int xtweak = 0;
            int ytweak = 0;
            for (int i = 0; i < m_SampleSquared; i++)
            {
                if( m_random )
                {
                    xtweak = m_Rand.Next(m_Sample+1) /*- m_Sample/2*/;
                    ytweak = m_Rand.Next(m_Sample + 1) /*- m_Sample / 2*/;
                }
                else
                {
                    xtweak = i / m_Sample;
                    ytweak = i % m_Sample;
                }

                Color tmp = m_SourceRenderer.GetPixel(x * m_Sample + xtweak, y * m_Sample + ytweak);
                if (tmp.ToArgb() == m_SourceRenderer.BlankColor.ToArgb())
                    return m_SourceRenderer.BlankColor;
                R += tmp.R;
                G += tmp.G;
                B += tmp.B;
            }

            return Color.FromArgb((int)(R / m_SampleSquared),
                                  (int)(G / m_SampleSquared),
                                  (int)(B / m_SampleSquared));
        }
    }

}
