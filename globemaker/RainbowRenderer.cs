using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Drawing.Imaging;
using DMSLib;

namespace globemaker
{
    public class RainbowRenderer : Renderer
    {
        #region member variables
        private DMSImage m_rainbow;
        private RectangleF m_target;
        #endregion

        #region Constructors
        //standard constructor
        public RainbowRenderer( Size size, DMSImage source, Color background, DMSImage rainbow )
            : base( size, source, background ) {
            m_rainbow = rainbow;
        }

        public RainbowRenderer(DMSImage source, Color background, DMSImage rainbow)
        : base( new Size(rainbow.Width, rainbow.Height), source, background)
        {
            m_rainbow = rainbow;
        }
        #endregion

        private void XYFromRGB(byte r, byte g, byte b, out int x, out int y)
        {
            x = (r << 4) + (b & 0xF);
            y = (g << 4) + (b >> 4);

            x *= m_Source.Width;
            x >>= 12;
            y *= m_Source.Height;
            y >>= 12;
        }

        override public Color GetPixel(int x, int y)
        {
            // get color from rainbow image.
            x *= m_rainbow.Width / m_Size.Width;
            y *= m_rainbow.Height / m_Size.Height;
            Color rainbow_color = m_rainbow.GetPixel(x, y);
            if ((rainbow_color.ToArgb() & 0xFFFFFF) == 0x808080) { return m_Blank; }

            XYFromRGB(rainbow_color.R, rainbow_color.G, rainbow_color.B, out x, out y);
            return m_Source.GetPixel(x, y);
        }

        public void fastSave(String filename)
        {
            Rectangle image_rect = new Rectangle(0, 0, m_rainbow.Width, m_rainbow.Height);
            DMSImage output = new DMSImage(image_rect.Size);

            BitmapData output_data = output.Bitmap.LockBits(image_rect, ImageLockMode.WriteOnly, DMSImage.pixel_format);
            BitmapData rainbow_data = m_rainbow.Bitmap.LockBits(image_rect, ImageLockMode.ReadOnly, DMSImage.pixel_format);
            BitmapData source_data = m_Source.Bitmap.LockBits(new Rectangle(0, 0, m_Source.Bitmap.Width, m_Source.Bitmap.Height), ImageLockMode.ReadOnly, DMSImage.pixel_format);

            unsafe
            {
                byte* map = (byte*)rainbow_data.Scan0;
                byte* dest = (byte*)output_data.Scan0;
                for (int i = 0; i < m_rainbow.Height * m_rainbow.Width; i++)
                {
                    byte b = *map++;
                    byte g = *map++;
                    byte r = *map++;
                    map++;

                    if (r == 0x80 && g == 0x80 && b == 0x80)
                    {
                        *dest++ = 0x80;
                        *dest++ = 0x80;
                        *dest++ = 0x80;
                        *dest++ = 0xFF;
                    }
                    else
                    {
                        int x;
                        int y;
                        XYFromRGB(r, g, b, out x, out y);

                        byte* output_color = (byte*)source_data.Scan0 +
                                                    y * source_data.Stride +
                                                    x * 4;
                        *dest++ = *output_color++;
                        *dest++ = *output_color++;
                        *dest++ = *output_color++;
                        *dest++ = *output_color++;
                    }
                }
            }

            output.Bitmap.UnlockBits(output_data);
            m_rainbow.Bitmap.UnlockBits(rainbow_data);
            m_Source.Bitmap.UnlockBits(source_data);

            output.Save(filename);
        }
    }
}
