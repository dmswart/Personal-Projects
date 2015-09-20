using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.Drawing;

namespace ScratchRenderer
{
    public class Texter
    {
        private string m_text;
        private int m_height;
        private int m_width;

        private Bitmap m_result;

        //constructors;
        public Texter(string line, /*int[] weights,*/ int height, int width)
        {
            m_text = line;
            m_height = height;
            if (width <= 0)
                m_width = m_height * line.Length;
            else
                m_width = width;

            m_result = new Bitmap(m_width, m_height + m_height/8);
            Graphics g = Graphics.FromImage(m_result);
            Brush WhiteBrush = new SolidBrush(Color.White);
            g.FillRectangle(WhiteBrush, 0, 0, m_width, m_height);

            int pos = 0;
            for (int i = 0; i < m_text.Length; i++)
            {
                pos += DrawChar(pos, 15 + /*(int)((double)weights[i]/255.0 * 65.0)*/25, m_text[i]);
                pos += m_height / 8;
            }

            g.FillRectangle(WhiteBrush, 0, m_height, m_width, m_height / 8);
        }

        /// <summary>
        /// DrawChar
        /// </summary>
        /// <param name="left">the x-position of the left edge of the character</param>
        /// <param name="weight">how thick to draw the character</param>
        /// <param name="letter">the letter to draw</param>
        /// <returns>the resulting width of the letter</returns>
        private int DrawChar(int left, int weight, char letter)
        {
            Graphics g = Graphics.FromImage(m_result);
            int q = m_height / 4;
            int e = m_height / 8;
            int s = m_height / 16;
            int top = 0;
            int mid = 2 * q;
            int bottom = 4 * q;
            int topLine = top + weight / 2;
            int bottomLine = bottom - weight / 2;
            int leftLine = left + weight / 2;

            Pen pen = new Pen(new SolidBrush(Color.Black), weight );

            switch( letter )
            {
                case 'A':
                    g.DrawLine(pen, new Point(left, bottom), new Point(left + 3 * e, top));
                    g.DrawLine(pen, new Point(left + 3 * e, top), new Point(left + 3 * q, bottom));
                    g.DrawLine(pen, new Point(left + 3*s, mid), new Point(left + 9 * s, mid));
                    return 3*q;
                case 'B':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 2 * q, topLine));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 2 * q, bottomLine));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawArc(pen, left+q, topLine, 2 * q - weight/2, 2 * q - weight/2, -90, 180);
                    g.DrawArc(pen, left + q, mid, 2 * q - weight / 2, 2 * q - weight / 2, -90, 180);
                    return 3 * q - weight/2;
                case 'C':
                    g.DrawArc(pen, leftLine, topLine, 4 * q - weight, 4 * q - weight, 45, 270);
                    return 13 * s;
                case 'D':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + q, topLine));
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + q, bottomLine));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawArc(pen, leftLine-q, topLine, 4 * q - weight, 4 * q - weight, -91, 182);
                    return 3 * q;
                case 'E':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 3 * q, topLine));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 3 * q, bottomLine));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    return 3*q;
                case 'F':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 3 * q, topLine));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    return 5*e;
                case 'G':
                    g.DrawLine(pen, new Point(left + 4 * q, mid), new Point(left + 2 * q, mid));
                    g.DrawArc(pen, leftLine, topLine, 4 * q - weight, 4 * q - weight, 0, 315);
                    return 4 * q;
                case 'H':
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawLine(pen, new Point(left + 7*e - weight / 2, top), new Point(left + 7*e - weight / 2, bottom));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 7*e, mid));
                    return 7 * e;
                case 'I':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left+2*q, topLine) );
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 2 * q, bottomLine));
                    g.DrawLine(pen, new Point(left + q, top), new Point(left + q, bottom));
                    return 2*q;
                case 'J':
                    g.DrawLine(pen, new Point(left + 3 * q, top), new Point(left + 3 * q, 5 * e));
                    g.DrawArc(pen, leftLine, q, 3 * q - weight / 2, 3 * q - weight / 2, 0, 180);
                    return 3 * q + weight/2;
                case 'K':
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawLine(pen, new Point(leftLine, mid), new Point(left + 3 * q, bottom));
                    g.DrawLine(pen, new Point(leftLine, mid), new Point(left + 3 * q, top));
                    return 3 * q;
                case 'L':
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 3 * q, bottomLine));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    return 3 * q;
                case 'M':
                    g.DrawLine(pen, new Point(leftLine, bottom), new Point(leftLine, top));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(left + 2 * q, bottom));
                    g.DrawLine(pen, new Point(left + 2 * q, bottom), new Point(left + 4 * q - weight / 2, top));
                    g.DrawLine(pen, new Point(left + 4 * q - weight / 2, top), new Point(left + 4 * q - weight / 2, bottom));
                    return 4 * q;
                case 'N':
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(left + 3 * q - weight / 2, bottom));
                    g.DrawLine(pen, new Point(left + 3 * q - weight / 2, bottom), new Point(left + 3 * q - weight / 2, top));
                    return 3 * q;
                case 'O':
                    g.DrawArc(pen, leftLine, topLine, 4 * q - weight, 4 * q - weight, 0, 360);
                    return 4 * q;
                case 'P':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 2 * q, topLine));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawArc(pen, left + q, topLine, 2 * q - weight / 2, 2 * q - weight / 2, -90, 180);
                    return 3 * q;
                case 'Q':
                    g.DrawArc(pen, leftLine, topLine, 4 * q - weight, 4 * q - weight, 0, 360);
                    g.DrawLine(pen, new Point(left+2*q, mid), new Point(left + 4 * q, bottom));
                    return 4 * q;
                case 'R':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 2 * q, topLine));
                    g.DrawLine(pen, new Point(left, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, bottom));
                    g.DrawLine(pen, new Point(left + 3 * e, mid), new Point(left + 3 * q, bottom));
                    g.DrawArc(pen, left+q, topLine, 2 * q - weight/2, 2 * q - weight/2, -90, 180);
                    return 3 * q;
                case 'S':
                    g.DrawLine(pen, new Point(left+q, topLine), new Point(left + 3 * q, topLine));
                    g.DrawLine(pen, new Point(left+q, mid), new Point(left + 2 * q, mid));
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 2 * q, bottomLine));
                    g.DrawArc(pen, leftLine, topLine, 2 * q - weight / 2, 2 * q - weight / 2, 90, 180);
                    g.DrawArc(pen, left + q, mid, 2 * q - weight / 2, 2 * q - weight / 2, -90, 180);
                    return 3 * q;
                case 'T':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 3 * q, topLine));
                    g.DrawLine(pen, new Point(left + 3*e, top), new Point(left + 3*e, bottom));
                    return 3 * q;
                case 'U':
                    g.DrawLine(pen, new Point(leftLine, top), new Point(leftLine, 3 * q - weight / 2));
                    g.DrawLine(pen, new Point(left + 3 * q - weight / 2, top), new Point(left + 3 * q - weight / 2, 3 * q - weight / 2));
                    g.DrawArc(pen, leftLine, q+weight/2, 3 * q - weight, 3 * q - weight, 0, 180);
                    return 3 * q;
                case 'W':
                    g.DrawLine(pen, new Point(leftLine, top), new Point(left + q, bottom));
                    g.DrawLine(pen, new Point(left + q, bottom), new Point(left + 2 * q, top));
                    g.DrawLine(pen, new Point(left + 2 * q, top), new Point(left + 3 * q, bottom));
                    g.DrawLine(pen, new Point(left + 3 * q, bottom), new Point(left + 4 * q - weight/2, top));
                    return 4 * q;
                case 'V':
                    g.DrawLine(pen, new Point(left, top), new Point(left + 3 * e, bottom));
                    g.DrawLine(pen, new Point(left + 3 * e, bottom), new Point(left + 3 * q, top));
                    return 3 * q;
                case 'X':
                    g.DrawLine(pen, new Point(left, top), new Point(left + 3 * q, bottom));
                    g.DrawLine(pen, new Point(left + 3 * q, top), new Point(left, bottom));
                    return 3 * q;
                case 'Y':
                    g.DrawLine(pen, new Point(left, top), new Point(left + 3 * e, mid));
                    g.DrawLine(pen, new Point(left + 3 * e, mid), new Point(left + 3 * q, top));
                    g.DrawLine(pen, new Point(left + 3 * e, mid), new Point(left + 3 * e, bottom));
                    return 3 * q;
                case 'Z':
                    g.DrawLine(pen, new Point(left, topLine), new Point(left + 3 * q, topLine));
                    g.DrawLine(pen, new Point(left + 3 * q, top), new Point(left, bottom));
                    g.DrawLine(pen, new Point(left, bottomLine), new Point(left + 3 * q, bottomLine));
                    return 3 * q;
            }
            return e;
        }

        public Bitmap getImage()
        {
            return m_result;
        }
    }
}
