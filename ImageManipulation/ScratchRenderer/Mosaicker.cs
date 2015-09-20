using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class Mosaicker : Renderer
    {
        int m_buffer;
        DMSImage[,] m_Sources;
        Renderer[,] m_Renderers;
        int m_TileHeight;
        int m_TileWidth;
        int m_TilesHigh = 1;
        int m_TilesWide = 1;

        public Mosaicker(int TileWidth, int TileHeight, int nTilesWide, int nTilesHigh, int buffer) :
            base(new Size(nTilesWide * (TileWidth + buffer) + buffer,
                           nTilesHigh * (TileHeight + buffer) + buffer),
                  null,
                  Color.Gray)
        {
            m_Sources = new DMSImage[nTilesWide, nTilesHigh];
            m_Renderers = new Renderer[nTilesWide, nTilesHigh];
            m_buffer = buffer;
            m_TileWidth = TileWidth;
            m_TileHeight = TileHeight;
            m_TilesHigh = nTilesHigh;
            m_TilesWide = nTilesWide;

            for (int i = 0; i < nTilesWide; i++)
            {
                for (int j = 0; j < nTilesHigh; j++)
                {
                    m_Renderers[i, j] = null;
                    m_Sources[i, j] = null;
                }
            }
        }

        public void AddRenderer(Renderer r, int i, int j)
        {
            m_Renderers[i, j] = r;
        }

        public void AddSource(DMSImage s, int i, int j)
        {
            m_Sources[i, j] = s;
        }

        public override Color GetPixel(int x, int y)
        {
            if (x >= m_Size.Width || x < 0 || y >= m_Size.Height || y < 0)
                return m_Blank;

            int X = x / (m_TileWidth + m_buffer); //which tile column
            int Y = y / (m_TileHeight + m_buffer); //which tile row

            if (X >= m_TilesWide || Y >= m_TilesHigh)
                return m_Blank;


            x = x % (m_TileWidth + m_buffer); // which pixel of the image (horiz.)
            y = y % (m_TileHeight + m_buffer);//which pixel of the image (vert);


            if (x < m_buffer || y < m_buffer)
                return m_Blank;

            x -= m_buffer;
            y -= m_buffer;


            if (m_Renderers[X, Y] == null && m_Sources[X, Y] == null)
            {
                return m_Blank;
            }
            if (m_Renderers[X, Y] != null)
                return m_Renderers[X, Y].GetPixel(x, y);
            if (m_Sources[X, Y] != null)
                return m_Sources[X, Y].GetPixel(x, y);

            return m_Blank;
        }
    }
}
